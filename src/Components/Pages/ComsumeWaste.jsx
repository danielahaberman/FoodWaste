// @ts-nocheck
import React, { useEffect, useState } from "react";
import axios from "axios";

function ConsumeWaste() {
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeeklyPurchaseSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await axios.get("http://localhost:5001/purchases/weekly-summary", { params });
      setWeeklySummary(response.data);
    } catch (err) {
      console.error("Error fetching weekly summary:", err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyPurchaseSummary();
  }, []);

  if (loading) return <p style={{ textAlign: "center", fontStyle: "italic" }}>Loading weekly purchase summary...</p>;
  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {weeklySummary.map((week) => (
        <section
          key={week.weekOf}
          style={{
            marginBottom: "2rem",
            backgroundColor: "#f9f9f9",
            padding: "1rem 1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              fontWeight: "700",
              fontSize: "1.25rem",
              marginBottom: "1rem",
              borderBottom: "2px solid #4a90e2",
              paddingBottom: "0.25rem",
              color: "#333",
            }}
          >
            {week.weekOf}
          </h2>
          <ul style={{ listStyleType: "none", paddingLeft: 0, margin: 0 }}>
            {week.purchases.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  marginBottom: "0.5rem",
                  backgroundColor: "#fff",
                  borderRadius: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "background-color 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#e6f0ff")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
              >
                <div style={{ fontWeight: "600", color: "#222" }}>{item.name}</div>
                <div style={{ color: "#666" }}>Amount: {item.quantity}</div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default ConsumeWaste;
