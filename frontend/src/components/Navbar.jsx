import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMessageSquare, FiPlusCircle, FiBell } from "react-icons/fi";
import redditLogo from "../assets/reddit-logo.png";

export default function Navbar() {
  const navigate = useNavigate();

  const styles = {
    navbar: {
      height: "56px",
      background: "white",
      borderBottom: "1px solid #e6e6e6",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    left: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    logo: {
      height: "35px",
      cursor: "pointer",
    },
    search: {
      flex: 1,
      maxWidth: "600px",
      padding: "10px",
      marginLeft: "20px",
      background: "#f6f7f8",
      border: "1px solid #ddd",
      borderRadius: "22px",
      outline: "none",
      fontSize: "14px",
    },
    right: {
      display: "flex",
      alignItems: "center",
      gap: "18px",
      fontSize: "22px",
      cursor: "pointer",
    },
    icon: {
      cursor: "pointer",
      color: "#444",
      transition: "0.15s",
    },
  };

  return (
    <div style={styles.navbar}>
      {/* LEFT: LOGO */}
      <div style={styles.left}>
        <Link to="/">
          <img src={redditLogo} alt="Reddit" style={styles.logo} />
        </Link>
      </div>

      {/* MIDDLE: SEARCH */}
      <input type="text" placeholder="Search Reddit" style={styles.search} />

      {/* RIGHT: ICONS */}
      <div style={styles.right}>
        <FiMessageSquare
          style={styles.icon}
          onClick={() => navigate("/chat")}
        />
        <FiPlusCircle style={styles.icon} />
        <FiBell style={styles.icon} />
      </div>
    </div>
  );
}
