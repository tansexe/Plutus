import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Register from "./Pages/Register/Register";
import Login from "./Pages/login/login";
import Home from "./Pages/home/Home";
import Payment from "./Pages/payment/payment";
import NoMatch from "./Pages/NoMatch/NoMatch";
import Navbar from "./components/Navbar/Navbar";
import ProtectedRoute from "./utils/protectedRoute";
import DashboardLayout from "./Pages/dashboard/DashboardLayout";
import DashboardHome from "./Pages/dashboard/DashboardHome.jsx";
import Profile from "./Pages/dashboard/Profile/Profile.jsx";
import Beneficiary from "./Pages/dashboard/Beneficiary/Beneficiary.jsx";
import CardUpdate from "./Pages/dashboard/Cards/Cards.jsx";

function App() {
  return (
    <>
      <Router>
        {/* <Navbar /> */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="signup" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route
            path="dashboard"
            element={<ProtectedRoute element={DashboardLayout} />}
          >
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<Profile />} />
            <Route path="beneficiary" element={<Beneficiary />} />
            <Route path="cards" element={<CardUpdate />} />
          </Route>
          <Route path="payment" element={<Payment />} />
          <Route path="*" element={<NoMatch />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
