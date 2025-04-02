/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../utils/firebase.js";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import "./dashboard.css";

const DashboardLayout = () => {
  const [user] = useAuthState(auth);
  const [profileData, setProfileData] = useState(null);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
          if (user) {
            // Fetch user document using currentUser uid
            const userDocRef = doc(db, "people", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Set profile data
              setProfileData(userData);
              // Fetch beneficiaries using the same user data
              const beneficiaryIds = userData.Beneficiary || [];
              if (beneficiaryIds.length > 0) {
                const beneficiariesQuery = query(
                  collection(db, "people"),
                  where("__name__", "in", beneficiaryIds)
                );
                const snapshot = await getDocs(beneficiariesQuery);
                const beneficiariesData = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                setBeneficiaries(beneficiariesData);
              } else {
                setBeneficiaries([]);
              }
            } else {
              setProfileData(null);
              setBeneficiaries([]);
            }
            // Fetch cards
            const cardsQuery = query(collection(db, "cards"), where("userId", "==", user.uid));
            const cardsSnapshot = await getDocs(cardsQuery);
            setCards(cardsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          }
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };
    fetchData();
  }, [user]);

  const context = {
    profileData,
    setProfileData,
    cards,
    setCards,
    transactions,
    beneficiaries,
    setBeneficiaries,
  };

  return (
    <div className="dashboardContainer">
      <div className="dashboardSidebar">
        <div className="sidebarHeader">
          <h2>
            <Link to="/">🏦 Explore-Banking</Link>
          </h2>
        </div>
        <div className="sidebarMenu">
          <div className="menuItem">
            <Link to="/dashboard">📊 Dashboard</Link>
          </div>
          <div className="menuItem">
            <Link to="/dashboard/profile">👤 Profile</Link>
          </div>
          <div className="menuItem">
            <Link to="/payment">💸 Payment</Link>
          </div>
          <div className="menuItem">
            <Link to="/dashboard/ben

eficiary">📝 Beneficiary</Link>
          </div>
          <div className="menuItem">
            <Link to="/dashboard/cards">⚙️ Cards</Link>
          </div>
        </div>
        <div className="sidebarFooter">
          <div className="menuItem">
            <span>❓ Help & Support</span>
          </div>
          <div className="menuItem logout">
            <span>🚪 Logout</span>
          </div>
        </div>
      </div>
      <div className="dashboardContent">
        <Outlet context={context} />
      </div>
    </div>
  );
};

export default DashboardLayout;