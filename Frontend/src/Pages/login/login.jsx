import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../utils/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Logged in user:', user);
      navigate('/');
    } catch (error) {
      console.error("Error signing in:", error);
    }
    // try {
    //   const response = await fetch("/api/login", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ email, password }),
    //   });

    //   if (response.ok) {
    //     const data = await response.json();
    //     console.log("Login successful:", data);
    //     navigate("/dashboard");
    //   } else {
    //     setError("Login failed. Please check your credentials.");
    //     console.error("Login failed");
    //   }
    // } catch (error) {
    //   setError("An error occurred. Please try again.");
    //   console.error("Error:", error);
    // } finally {
    //   setLoading(false);
    // }
  };

  const changeEmail = (e) => {
    setEmail(e.target.value);
  };

  const changePassword = (e) => {
    setPassword(e.target.value);
  };

  return (
    <div className="loginPage">
      <div className="loginDivs">
        <div className="loginForm">
          <div className="heading">
            <div className="mainHeading">👋 Welcome to Explore-Banking</div>
            <div className="subHeading">
              Today is a new day. It's your day. You shape it.
              <br />
              Sign in to start exploring our Project.
            </div>
          </div>
          <form onSubmit={handleSubmit} className="formInputs">
            {error && (
              <div
                className="error-message"
                style={{ color: "red", marginBottom: "10px" }}
              >
                {error}
              </div>
            )}
            <div className="input">
              <label htmlFor="inputEmail">Email</label>
              <input
                type="email"
                id="inputEmail"
                placeholder="Example@email.com"
                value={email}
                onChange={changeEmail}
                required
              />
            </div>
            <div className="input">
              <label htmlFor="inputPass">Password</label>
              <input
                type="password"
                id="inputPass"
                placeholder="At least 8 characters"
                value={password}
                onChange={changePassword}
                required
              />
            </div>
            <div className="forgetPass">
              <div></div>
              <div className="forgetPass">Forgot Password?</div>
            </div>
            <div className="signIn">
              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>
          <div className="newAcc">
            Don't you have an account?
            <span className="highlighted">
              {" "}
              <a href="/Signup">Sign Up</a>
            </span>
          </div>
          {/* <div className="copyright">
            © {new Date().getFullYear()} ALL RIGHTS RESERVED
          </div> */}
        </div>
      </div>
      <div className="loginDivs">
        <img
          src="https://ik.imagekit.io/Eattendancehostel23/gif.gif?updatedAt=1742500251404"
          alt="space-img"
        />
      </div>
    </div>
  );
};

export default Login;
