import React from "react";

export default function MessageBubble({ fromMe, text }) {
  const styles = {
    row: {
      display: "flex",
      justifyContent: fromMe ? "flex-end" : "flex-start",
    },
    bubble: {
      maxWidth: "60%",
      padding: "8px 12px",
      borderRadius: "18px",
      fontSize: "14px",
      lineHeight: "1.4",
      background: fromMe ? "#0079d3" : "#2a2a2a",
      color: "#fff",
    },
  };

  return (
    <div style={styles.row}>
      <div style={styles.bubble}>{text}</div>
    </div>
  );
}
