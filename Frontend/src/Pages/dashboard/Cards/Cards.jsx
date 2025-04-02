import React, { useState } from "react";
import "../Beneficiary/Beneficiary.css";
import { useOutletContext } from "react-router-dom";
import { auth, db ,storage} from "../../../utils/firebase.js";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Select from "react-select"; 
import axios from 'axios'
import { deleteObject, ref } from "firebase/storage";

const Cards = () => {
  const context = useOutletContext();
  const cards = context?.cards || [];
  const setCards = context?.setCards || (() => {});
  const profileData = context?.profileData || {};
  const beneficiaries = context?.beneficiaries || [];
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    cardName: "",
    cardType: "",
    cardNo: "",
    selectedBeneficiaries: [],
  });
  const [editingId, setEditingId] = useState(null);


  const beneficiaryOptions = beneficiaries.map((beneficiary) => ({
    value: beneficiary.id,
    label: beneficiary.Name,
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBeneficiaryChange = (selectedOptions) => {
    setFormData({
      ...formData,
      selectedBeneficiaries: selectedOptions || [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      // finding all the selected beneficiary ID from the form data
        const selectedBeneficiaryIds = formData.selectedBeneficiaries.map((option) => option.value);
        const selectedBeneficiaries = beneficiaries.filter((beneficiary) =>
          selectedBeneficiaryIds.includes(beneficiary.id)
        );

        // finding all the imageUrl from the selected Beneficiary filtered
        const beneficiaryImageUrls = selectedBeneficiaries
          .map((beneficiary) => beneficiary.imageUrl)
          .filter(Boolean);

        const userImageUrl = profileData?.imageUrl || "";
        // imageUrlList will be an array of imageUrls of beneficiary and have a default imageUrl of User
        const imageUrlList = userImageUrl ? [userImageUrl, ...beneficiaryImageUrls] : [...beneficiaryImageUrls];
        const cardData = {
          userId: user.uid,
          cardName: formData.cardName,
          cardType: formData.cardType,
          cardNo: formData.cardNo,
          imageUrlList,
        };
    
        if (editingId) {
          await updateDoc(doc(db, "cards", editingId), cardData);
          setCards(cards.map((card) => (card.id === editingId ? { id: editingId, ...cardData } : card)));
          setEditingId(null);
        } else {
          const docRef = await addDoc(collection(db, "cards"), cardData);
          setCards([...cards, { id: docRef.id, ...cardData }]);
        }
        const response = await axios.post("http://127.0.0.1:6969/encode", {
          cardNo: formData.cardNo,
          imageUrlList,
        });
    
        if (response.data.status === "success") {
          alert("Card saved and images encoded successfully!");
        } else {
          console.error("Encoding failed:", response.data.message);
          alert("Card saved, but image encoding failed: " + response.data.message);
        }
        setFormData({ cardName: "", cardType: "", cardNo: "", selectedBeneficiaries: [] });
    } catch (error) {
      console.log("Error saving card:", error);
    }
  };

  const handleEdit = (id) => {
    const card = cards.find((c) => c.id === id);
    if (card) {
      const selectedBeneficiaries = beneficiaries
        .filter((beneficiary) => card.imageUrlList.includes(beneficiary.imageUrl))
        .map((beneficiary) => ({
          value: beneficiary.id,
          label: beneficiary.Name,
        }));
      setFormData({
        cardName: card.cardName,
        cardType: card.cardType,
        cardNo: card.cardNo,
        selectedBeneficiaries,
      });
      setEditingId(id);
    }
  };

  const handleDelete = async (id, cardNumber) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
  
    try {

      console.log("Deleting card with number:", cardNumber);
      // Delete the card with the id
      await deleteDoc(doc(db, "cards", id));

      try {
        const encodingRef = doc(db, "encoding", cardNumber);
        await deleteDoc(encodingRef);
      } catch (encodingError) {
        console.warn("Encoding reference not found or already deleted:", encodingError);
      }
      
      // 3. Delete the pickle file from Firebase Storage (if exists)
      try {
        const storageRef = ref(storage, `encodings/${cardNumber}.p`);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn("Storage file not found or already deleted:", storageError);
      }

      setCards(cards.filter((c) => c.id !== id));
      
      alert("Card and associated data deleted successfully!");
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete card: " + error.message);
    }
  };

  if (!context) {
    return <div>Loading...</div>;
  }

  return (
    <div className="content">
      <div className="BeneficiaryHeader">
        <h1>Manage Cards</h1>
        <p>Add, edit, or delete cards</p>
      </div>
      <form className="cardForm" onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="cardName">Card Name</label>
          <input
            type="text"
            id="cardName"
            name="cardName"
            value={formData.cardName}
            onChange={handleChange}
            placeholder="Enter card name"
            required
          />
        </div>
        <div className="formGroup">
          <label htmlFor="cardType">Card Type</label>
          <select
            id="cardType"
            name="cardType"
            value={formData.cardType}
            onChange={handleChange}
            required
          >
            <option value="">Select Card Type</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Prepaid Card">Prepaid Card</option>
          </select>
        </div>
        <div className="formGroup">
          <label htmlFor="cardNo">Card Number</label>
          <input
            type="text"
            id="cardNo"
            name="cardNo"
            value={formData.cardNo}
            onChange={handleChange}
            placeholder="Enter card number"
            required
          />
        </div>
        <div className="formGroup">
          <label>Associated Beneficiaries</label>
          <Select
            isMulti
            options={beneficiaryOptions}
            value={formData.selectedBeneficiaries}
            onChange={handleBeneficiaryChange}
            placeholder="Select beneficiaries..."
            className="basic-multi-select"
            classNamePrefix="select"
          />
        </div>
        <button type="submit" className="saveButton">
          {editingId ? "Update Card" : "Add Card"}
        </button>
      </form>
      {cards.length > 0 && (
        <>
          <h2>Card List</h2>
          <ul className="cardList">
            {cards.map((card) => (
              <li key={card.id} className="cardItem">
                <div>
                  <strong>{card.cardName}</strong> - {card.cardType} - {card.cardNo}
                </div>
                <div className="cardImages">
                  {card.imageUrlList.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Associated image ${index + 1}`}
                      width={50}
                      height={50}
                      style={{ marginRight: "10px", borderRadius: "5px" }}
                    />
                  ))}
                </div>
                <div>
                  <button onClick={() => handleEdit(card.id)}>Edit</button>
                  <button onClick={() => handleDelete(card.id, card.cardNo)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Cards;