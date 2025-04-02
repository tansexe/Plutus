import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./payment.css";

const Payment = () => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const [challenge, setChallenge] = useState("Waiting for challenge...");
  const [challengeResults, setChallengeResults] = useState([]);
  const [authStatus, setAuthStatus] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://127.0.0.1:6969");

    socketRef.current.on("connect", () => {
      console.log("WebSocket connection established");
    });

    socketRef.current.on("message", (message) => {
      console.log("Response from backend:", message);
      if (message === "authenticated") {
        setAuthStatus("Authenticated");
        stopStreaming();
        setStep(3);
      } else if (message === "Not_authenticated") {
        setAuthStatus("Not Authenticated");
        stopStreaming();
        setStep(3);
      }
    });

    socketRef.current.on("challenge", (data) => {
      console.log("Challenge received:", data.message);
      setChallenge(data.message);
    });

    socketRef.current.on("challenge_result", (data) => {
      setChallengeResults((prev) => [
        ...prev,
        `${data.challenge}: ${data.result}`,
      ]);
    });

    // Cleanup on unmount
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Start streaming when Pay is clickedd
  useEffect(() => {
    if (step === 2) {
      startStreaming();
    }
  }, [step]);

  const startStreaming = async () => {
    setChallengeResults([]);
    setAuthStatus(null);
    await startWebcam();
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      startSendingFrames();
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  // fucntiom for Capture frames and send frames
  const startSendingFrames = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    intervalRef.current = setInterval(() => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL("image/jpeg", 0.5);
      socketRef.current.emit("message", JSON.stringify({ frame, cardNumber }));
    }, 500); // Send every 500ms, matching Home.jsx
  };

  // Functiom for Stop streaming and clean up
  const stopStreaming = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    clearInterval(intervalRef.current);
    socketRef.current.emit("stop_streaming");
  };

  const handlePayment = (e) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className="loginPage">
      <div className="loginDivs">
        {step === 1 && (
          <div className="loginForm">
            <div className="heading">
              <div className="mainHeading">💳 Complete Your Payment</div>
              <div className="subHeading">
                Secure payment processing powered by Explore-Banking
              </div>
            </div>
            <form onSubmit={handlePayment} className="formInputs">
              <div className="input">
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="input">
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  type="text"
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <div className="input">
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input
                    type="text"
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
                <div className="input">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="signIn">
                <button type="submit">Pay Now</button>
              </div>
            </form>
            <div className="newAcc">
              Need help?{" "}
              <span className="highlighted">
                <a href="/support">Contact Support</a>
              </span>
            </div>
          </div>
        )}

        {/* Step 2: This is the Liveness Verification */}
        {step === 2 && (
          <div className="loginForm">
            <div className="heading">
              <div className="mainHeading">🔒 Payment Verification</div>
              <div className="subHeading">
                Please complete the liveness check to proceed with your payment
              </div>
            </div>
            <div className="webcam-container">
              <p style={{ fontSize: "20px", fontWeight: "bold", color: "red" }}>
                {challenge}
              </p>
              <video
                ref={videoRef}
                autoPlay
                style={{ width: "100%", borderRadius: "8px" }}
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{ display: "none" }}
              />
              <div>
                <h3>Challenge Logs</h3>
                {challengeResults.map((result, index) => (
                  <p
                    key={index}
                    style={{
                      color: result.includes("passed") ? "green" : "red",
                    }}
                  >
                    {result}
                  </p>
                ))}
              </div>
              {authStatus && (
                <p
                  style={{
                    fontSize: "18px",
                    color: authStatus === "Authenticated" ? "green" : "red",
                  }}
                >
                  {authStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: This is for the after payment */}
        {step === 3 && (
          <div className="loginForm">
            {authStatus === "Authenticated" ? (
              <div>
                <h2>Payment Successful</h2>
                <p>Your payment of {amount} has been processed successfully.</p>
              </div>
            ) : (
              <div>
                <h2>Authentication Failed</h2>
                <p>Please try again.</p>
                <button onClick={() => setStep(1)}>Back to Payment Form</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="imgDiv">
        <img
          src="https://ik.imagekit.io/Eattendancehostel23/Untitled%20design.gif?updatedAt=1742768351805"
          alt="payment-security"
        />
      </div>
    </div>
  );
};

export default Payment;
