import React from "react";
import "./home.css";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";

const Home = () => {
  return (
    <div className="home">
      <Navbar />
      <div className="hero-section">
        <div className="hero-content">
          <h1>Explore banking that fits your dreams</h1>
          <div className="hero-buttons">
            <Link to="/payment">
              <button className="hero-btn services-btn">Payment</button>
            </Link>
            <a
              href="https://www.linkedin.com/in/tansexe/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="hero-btn contact-btn">Contact Me</button>
            </a>
          </div>
        </div>
      </div>

      {/* Cards Section */}
      {/* <div className="cards-container">
        <div className="card">
          <h3>Accounts</h3>
          <ul>
            <li>Savings Account</li>
            <li>Current Account</li>
            <li>Salary Account</li>
          </ul>
        </div>

        <div className="card">
          <h3>Loans</h3>
          <ul>
            <li>Home Loan</li>
            <li>Personal Loan</li>
            <li>Vehicle Loan</li>
          </ul>
        </div>

        <div className="card">
          <h3>Insurance</h3>
          <ul>
            <li>Life Insurance</li>
            <li>Health Insurance</li>
            <li>General Insurance</li>
          </ul>
        </div>
      </div> */}
    </div>
  );
};

export default Home;
