import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Lottie from "react-lottie";
import animationData from "../../assets/lottienew.json";
import "./register.css";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, storage } from "../../utils/firebase"; // Import db and storage
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore"; // Firestore functions
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Storage functions
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    dob: "",
    image: null,
  });

  const [rePass, setRePass] = useState("");
  const [error, setError] = useState(false);
  const [errorName, setErrorName] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const toastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setUserData({ ...userData, image: imageSrc });
    setShowCamera(false);
  }, [webcamRef, userData]);

  // Function to convert base64 image to Blob
  const base64ToBlob = (base64) => {
    const byteString = atob(base64.split(",")[1]);
    const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const signup = async () => {
    // Check if all required fields, including image, are filled
    if (
      !userData.name ||
      !userData.email ||
      !userData.password ||
      !rePass ||
      !userData.phone ||
      !userData.image
    ) {
      setError(true);
      setErrorName("Please fill all required fields and capture an image");
      return;
    }

    if (userData.password !== rePass) {
      setError(true);
      setErrorName("Passwords do not match");
      return;
    }

    const loadingToastId = toast.loading(
      "Creating your account...",
      toastOptions
    );

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const user = userCredential.user;
      console.log("User created:", user);

      // Upload image to Firebase Storage
      const imageBlob = base64ToBlob(userData.image);
      const storageRef = ref(storage, `${user.uid}_profile.jpg`);
      await uploadBytes(storageRef, imageBlob);
      const imageUrl = await getDownloadURL(storageRef);
      console.log("Image uploaded, URL:", imageUrl);

      // Store user data in Firestore under "people" collection
      const userDocRef = doc(db, "people", user.uid);
      await setDoc(userDocRef, {
        Name: userData.name,
        Email: userData.email,
        Cards: [],
        Beneficiary: [],
        imageUrl: imageUrl,
      });

      toast.update(loadingToastId, {
        render: "Account created successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      console.log("User data stored in Firestore");
      navigate("/");
    } catch (error) {
      console.log("Error in signup:", error);
      setError(true);
      setErrorName(error.message);

      toast.update(loadingToastId, {
        render: `Error: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  return (
    <div className="signUpPage">
      <div className="animation-container">
        <Lottie
          className="animation"
          options={{
            animationData: animationData,
            loop: true,
            autoplay: true,
          }}
        />
      </div>
      <div className="signUpDivs">
        <div className="signUpForm">
          <div className="formHeading">
            <div className="formMainHeading">👋 Hey there, Banker</div>
            <div className="formSubHeading">
              Signup with us to get started🚀
            </div>
          </div>
          <div className="form">
            <div className="inputSignUp">
              <label htmlFor="formName">Name</label>
              <input
                type="text"
                id="formName"
                value={userData.name}
                placeholder="Full Name"
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
              />
            </div>
            <div className="inputSignUp">
              <label htmlFor="formImage">Capture Image</label>
              {userData.image ? (
                <div className="image-captured">
                  Image captured successfully
                </div>
              ) : (
                <button
                  type="button"
                  className="capture-btn"
                  onClick={() => setShowCamera(!showCamera)}
                >
                  {showCamera ? "Close Camera" : "Open Camera"}
                </button>
              )}
              {showCamera && !userData.image && (
                <div className="webcam-container">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="webcam-video"
                  />
                  <button
                    type="button"
                    className="capture-btn"
                    onClick={captureImage}
                  >
                    Capture Photo
                  </button>
                </div>
              )}
            </div>
            <div className="inputSignUp">
              <label htmlFor="formEmail">Email</label>
              <input
                type="email"
                id="formEmail"
                value={userData.email}
                placeholder="Eg: example@gmail.com"
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
              />
            </div>
            <div className="inputSignUp">
              <label htmlFor="formPass">Enter Password</label>
              <input
                type="password"
                id="formPass"
                value={userData.password}
                placeholder="At least 8 characters"
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
              />
            </div>
            <div className="inputSignUp">
              <label htmlFor="formRePass">Re-enter Password</label>
              <input
                type="password"
                id="formRePass"
                value={rePass}
                placeholder="At least 8 characters"
                onChange={(e) => setRePass(e.target.value)}
              />
            </div>
            <div className="inputSignUp">
              <label htmlFor="formPhone">Phone</label>
              <input
                type="number"
                id="formPhone"
                value={userData.phone}
                placeholder="Eg: 1234567890"
                onChange={(e) =>
                  setUserData({ ...userData, phone: e.target.value })
                }
              />
            </div>
            <div className="inputSignUp" id="date">
              <label htmlFor="formDOB">Birth Date</label>
              <input
                type="date"
                id="formDOB"
                value={userData.dob}
                onChange={(e) =>
                  setUserData({ ...userData, dob: e.target.value })
                }
              />
            </div>
            {error && <div className="error">{errorName}</div>}
            <button className="signUp" onClick={signup}>
              Sign Up
            </button>
            <div className="existing">
              Already have an account? <a href="/login">Sign in</a>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
};

export default Register;
