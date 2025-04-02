import React, { useState } from "react";
import "./Beneficiary.css";
import { useOutletContext } from "react-router-dom";
import { auth, db, storage } from "../../../utils/firebase.js";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  arrayRemove,
  collection,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";

const Beneficiary = () => {
  const context = useOutletContext();
  const beneficiaries = context?.beneficiaries || [];
  const setBeneficiaries = context?.setBeneficiaries || (() => {});
  const cards = context?.cards || [];
  const setCards = context?.setCards || (() => {});
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    name: "",
    photo: null,
    email: "",
  });
  const [editingId, setEditingId] = useState(null);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, photo: e.target.files[0] });
  };


  const updateCardsForBeneficiary = async (prevImageUrl, newImageUrl) => {
    try {
        // affected cards who is having the prevImageUrl in their imageUrlList
        const affectedCards = cards.filter((card) =>
          card.imageUrlList.includes(prevImageUrl)
        );
    
        for (const card of affectedCards) {
          // update each card's imageUrlList and call the encode API of each card from affectedCards
          const updatedImageUrlList = card.imageUrlList.map((url) =>
            url === prevImageUrl ? newImageUrl : url
          );
          const cardDocRef = doc(db, "cards", card.id);
          await updateDoc(cardDocRef, { imageUrlList: updatedImageUrlList });
    
          // Update local state
          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === card.id ? { ...c, imageUrlList: updatedImageUrlList } : c
            )
          );
    
          try {
            await axios.post("http://127.0.0.1:6969/encode", {
              cardNo: card.cardNo,
              imageUrlList: updatedImageUrlList,
            });
            console.log(`Encode API called for card ${card.cardNo}`);
          } catch (error) {
            console.error("Error calling /encode API:", error);
          }
        }
      
    } catch (error) {
      console.log("Error updating cards for beneficiary:", error);
    }
  };

  // Function to remove beneficiary image from all affected cards ImageUrlList
  const removeBeneficiaryFromCards = async (imageUrl) => {
    try {
        // Find all cards that have the imageUrl in their imageUrlList
        const affectedCards = cards.filter((card) =>
          card.imageUrlList.includes(imageUrl)
        );
    
        for (const card of affectedCards) {
          // Update each card's imageUrlList by removing the imageUrl
          const updatedImageUrlList = card.imageUrlList.filter(
            (url) => url !== imageUrl
          );
          const cardDocRef = doc(db, "cards", card.id);
          await updateDoc(cardDocRef, { imageUrlList: updatedImageUrlList });
    
          // Update local state
          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === card.id ? { ...c, imageUrlList: updatedImageUrlList } : c
            )
          );
    
          // Call the /encode API
          try {
            await axios.post("http://127.0.0.1:6969/encode", {
              cardNo: card.cardNo,
              imageUrlList: updatedImageUrlList,
            });
            console.log(`Encode API called for card ${card.cardNo}`);
          } catch (error) {
            console.error("Error calling /encode API:", error);
          }
        }
    } catch (error) {
      console.log("Error removing beneficiary from cards:", error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      let photoUrl = "";
      let prevImageUrl = "";
      if (editingId !== null) {
        const currentBeneficiary = beneficiaries.find((b) => b.id === editingId);
        prevImageUrl = currentBeneficiary?.imageUrl || "";
      }

      if (formData.photo instanceof File) {
        const photoRef = ref(storage, `${user.uid}_beneficiary_photo_${Date.now()}.jpg`);
        await uploadBytes(photoRef, formData.photo);
        photoUrl = await getDownloadURL(photoRef);
        console.log("File uploaded successfully");
      } else if (editingId !== null) {
        photoUrl = prevImageUrl; // if there is no photo uploaded then photoUrl will be same as prevImageUrl
      }

      const beneficiaryData = {
        Name: formData.name,
        Email: formData.email,
        imageUrl: photoUrl,
        Cards: [],
        Beneficiary: [],
      };

      if (editingId !== null) {
        // Update existing beneficiary
        const beneficiaryDocRef = doc(db, "people", editingId);
        await updateDoc(beneficiaryDocRef, beneficiaryData);

        // If the image was updated, update the cards
        if (formData.photo instanceof File && prevImageUrl) {
          await updateCardsForBeneficiary(prevImageUrl, photoUrl);
        }

        setBeneficiaries((prev) =>
          prev.map((b) =>
            b.id === editingId ? { ...b, ...beneficiaryData } : b
          )
        );
        setEditingId(null);
      } else {
        // Add new beneficiary
        const beneficiariesRef = collection(db, "people");
        const docRef = await addDoc(beneficiariesRef, beneficiaryData);
        const newBeneficiaryId = docRef.id;

        const userDocRef = doc(db, "people", user.uid);
        await updateDoc(userDocRef, {
          Beneficiary: arrayUnion(newBeneficiaryId),
        });

        setBeneficiaries((prev) => [
          ...prev,
          { id: newBeneficiaryId, ...beneficiaryData },
        ]);
      }

      setFormData({ name: "", photo: null, email: "" });
    } catch (error) {
      console.error("Error adding/updating beneficiary:", error);
    }
  };


  const handleEdit = (id) => {
    const beneficiary = beneficiaries.find((b) => b.id === id);
    if (beneficiary) {
      setFormData({
        name: beneficiary.Name || "",
        email: beneficiary.Email || "",
        photo: null,
      });
      setEditingId(id);
    }
  };


  const handleDelete = async (id) => {
    if (!user) return;

    try {
      const beneficiary = beneficiaries.find((b) => b.id === id);
      if (beneficiary && beneficiary.imageUrl) {

        await removeBeneficiaryFromCards(beneficiary.imageUrl);
      }

      const beneficiaryDocRef = doc(db, "people", id);
      await deleteDoc(beneficiaryDocRef);

      const userDocRef = doc(db, "people", user.uid);
      await updateDoc(userDocRef, {
        Beneficiary: arrayRemove(id),
      });

      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Error deleting beneficiary:", error);
    }
  };

  if (!context) {
    return <div>Loading...</div>;
  }

  return (
    <div className="content">
      <div className="BeneficiaryHeader">
        <h1>Beneficiaries</h1>
        <p>Manage your Beneficiaries</p>
      </div>

      <form className="beneficiaryForm" onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter beneficiary name"
            required
          />
        </div>

        <div className="formGroup">
          <label htmlFor="photo">Photo</label>
          {editingId !== null && (
            <div>
              <img
                src={beneficiaries.find((b) => b.id === editingId)?.imageUrl}
                alt="Current photo"
                width={100}
              />
              <p>Upload a new photo to replace the current one.</p>
            </div>
          )}
          <input
            type="file"
            id="photo"
            name="photo"
            onChange={handleFileChange}
            accept=".jpg,.png,.jpeg"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter beneficiary email"
            required
          />
        </div>

        <button type="submit" className="saveButton">
          {editingId !== null ? "Update Beneficiary" : "Add Beneficiary"}
        </button>
      </form>

      {beneficiaries.length > 0 && (
        <>
          <h2 className="bl">Beneficiary List</h2>
          <ul className="beneficiaryList">
            {beneficiaries.map((beneficiary) => (
              <li key={beneficiary.id} className="beneficiaryItem">
                {beneficiary.imageUrl && (
                  <img
                    src={beneficiary.imageUrl}
                    alt={`${beneficiary.Name}'s photo`}
                    width={50}
                    height={50}
                  />
                )}
                <span>{beneficiary.Name}</span> - {beneficiary.Email}
                <button onClick={() => handleEdit(beneficiary.id)}>Edit</button>
                <button onClick={() => handleDelete(beneficiary.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Beneficiary;