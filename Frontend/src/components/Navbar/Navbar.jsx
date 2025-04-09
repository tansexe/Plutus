import React from "react";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../utils/firebase.js";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";

const Navbar = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        {/* Uncomment if you want to use the logo */}
        {/* <img
          src="https://upload.wikimedia.org/wikipedia/commons/4/45/Lightning_icon.svg"
          alt="Bank Logo"
          className="logo-icon"
        /> */}
        <span>
          <Link to="/">🏦 Explore-Banking</Link>
        </span>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <a
          href="https://github.com/tansexe/Plutus/tree/main"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <li>
          <Link to="/payment">Payments</Link>
        </li>
        <li>
          <a
            href="https://www.linkedin.com/in/tansexe/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact
          </a>
        </li>
      </ul>
      <div className="auth-button">
        {user ? (
          <>
            <Link to="/dashboard" className="navbar-links">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="signup-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/signup" className="signup-btn">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
