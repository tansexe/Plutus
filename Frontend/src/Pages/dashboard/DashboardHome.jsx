/* eslint-disable no-unused-vars */
import React from "react";
import { useOutletContext } from "react-router-dom";

const DashboardHome = () => {
  const context = useOutletContext();
  const transactions = context?.transactions || [];
  const cards = context?.cards || [];

  const cardData = [
    { title: "Total Cards", value: cards.length.toString(), change: "+0%", icon: "💳" },
    { title: "Total Transactions", value: transactions.length.toString(), change: "+0%", icon: "💸" },
    { title: "New Accounts", value: "N/A", change: "+0%", icon: "📈" },
    { title: "Active Sessions", value: "N/A", change: "+0%", icon: "🔄" },
  ];

  const fallbackTransactions = [
    { id: 1, name: "John Doe", amount: "$1,200", date: "2025-03-25", status: "Completed" },
    { id: 2, name: "Sarah Smith", amount: "$890", date: "2025-03-24", status: "Pending" },
  ];

  const displayTransactions = transactions.length > 0 ? transactions : fallbackTransactions;

  if (!context) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboardContent">
      <div className="dashboardHeader">
        <div className="welcomeMessage">
          <h1>Welcome back, John!</h1>
          <p>Here's what's happening with your accounts today.</p>
        </div>
        <div className="userProfile">
          <div className="notifications">🔔</div>
          <div className="profilePic">JD</div>
        </div>
      </div>

      <div className="transactionsSection">
        <div className="sectionHeader">
          <h2>Last Transactions</h2>
          <button className="viewAllBtn">View All</button>
        </div>
        <div className="transactionsTable">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>#{transaction.id}</td>
                  <td>{transaction.name}</td>
                  <td>{transaction.amount}</td>
                  <td>{transaction.date}</td>
                  <td>
                    <span className={`status ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>
                    <button className="actionBtn">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;