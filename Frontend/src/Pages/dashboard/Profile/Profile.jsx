import React, { useState, useEffect } from "react";
import "./Profile.css";
import { auth, db } from "../../../utils/firebase.js";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useOutletContext } from "react-router-dom";

const Profile = () => {
  const { profileData, setProfileData } = useOutletContext();
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    isAdmin: "false",
  });
  const [isEditing, setIsEditing] = useState(false); // to toggle

  useEffect(() => {
    // fetch formData with profileData when it changes
    if (profileData) {
      console.log(profileData);
      setFormData({
        username: profileData.Name || "",
        email: profileData.Email || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        isAdmin: profileData.isAdmin || "false",
      });
    }
  }, [profileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user) {
      try {
        await updateDoc(doc(db, "people", user.uid), formData);
        setProfileData(formData);
        alert("Profile updated successfully!");
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    // Reset formData to profileData and exit edit mode
    if (profileData) {
      setFormData({
        username: profileData.Name || "",
        email: profileData.Email || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        isAdmin: profileData.isAdmin || "false",
      });
    }
    setIsEditing(false);
  };

  if (!profileData) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="content">
      <div className="profileHeader">
        <h1>My Profile</h1>
        <p>Manage your personal information and account settings</p>
      </div>
      <div className="profileContent">
        <div className="profileCard">
          {/* Profile Section */}
          <div className="profileInfo">
            <div className="profileAvatar">
              <div className="avatarPlaceholder">
                {profileData.Name ? profileData.Name[0] : "U"}
              </div>
            </div>
            <div className="profileDetails">
              <h2>{profileData.Name || "User"}</h2>
              <p>Email: {profileData.Email || "No email"}</p>
              <p>Phone: {profileData.phone || "No phone"}</p>
              <p>Address: {profileData.address || "No address"}</p>
              <p>
                Account Type:{" "}
                {profileData.isAdmin === "true"
                  ? "Administrator"
                  : "Regular User"}
              </p>
              <p>Account created on: Jan 15, 2025</p>
              {!isEditing && (
                <button
                  className="editButton"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          {/* Edit Profile Section */}
          {isEditing && (
            <form className="profileForm" onSubmit={handleSubmit}>
              <div className="formGroup">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
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
                  placeholder="Enter your email"
                />
              </div>
              <div className="formGroup">
                <label htmlFor="phone">Phone</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="formGroup">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                />
              </div>
              <div className="formGroup">
                <label htmlFor="isAdmin">Account Type</label>
                <select
                  id="isAdmin"
                  name="isAdmin"
                  value={formData.isAdmin}
                  onChange={handleChange}
                >
                  <option value="true">Administrator</option>
                  <option value="false">Regular User</option>
                </select>
              </div>
              <div className="formActions">
                <button
                  type="button"
                  className="cancelButton"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="saveButton">
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
