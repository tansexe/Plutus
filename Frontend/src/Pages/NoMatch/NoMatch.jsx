import React from "react";
import { Link } from "react-router-dom";

const NoMatch = () => {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you are looking for doesn't exist.</p>
      <p>It might have been moved or deleted.</p>
      <Link
        to="/"
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "rgb(13 153 147)",
          color: "white",
          textDecoration: "none",
          borderRadius: "5px",
        }}
      >
        Go to Homepage
      </Link>
    </div>
  );
};

export default NoMatch;
