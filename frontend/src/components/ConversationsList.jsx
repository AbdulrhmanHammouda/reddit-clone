import React from "react";

export default function ConversationsList({ conversations, activeId, onSelect }) {
  const styles = {
    container: {
      width: "280px",
      borderRight: "1px solid #222",
      background: "#111",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      padding: "16px",
      borderBottom: "1px solid #222",
      fontWeight: "bold",
      fontSize: "16px",
    },
    list: {
      overflowY: "auto",
      flex: 1,
    },
    item: (isActive) => ({
      padding: "12px 16px",
      cursor: "pointer",
      background: isActive ? "#1e1e1e" : "transparent",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      borderBottom: "1px solid #222",
    }),
    nameRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: "14px",
    },
    name: {
      fontWeight: "bold",
    },
    unreadBadge: {
      background: "#ff4500",
      borderRadius: "12px",
      padding: "2px 8px",
      fontSize: "11px",
    },
    lastMessage: {
      fontSize: "13px",
      color: "#aaa",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Messages</div>
      <div style={styles.list}>
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          return (
            <div
              key={conv.id}
              style={styles.item(isActive)}
              onClick={() => onSelect(conv.id)}
            >
              <div style={styles.nameRow}>
                <span style={styles.name}>{conv.name}</span>
                {conv.unread > 0 && (
                  <span style={styles.unreadBadge}>{conv.unread}</span>
                )}
              </div>
              <div style={styles.lastMessage}>{conv.lastMessage}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
