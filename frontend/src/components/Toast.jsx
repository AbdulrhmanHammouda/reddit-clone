import { useEffect } from "react";

export default function Toast({
  message,
  visible = false,
  variant = "success",
  duration = 3000,
  onHide,
}) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => onHide?.(), duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onHide]);

  if (!visible || !message) return null;

  const bgClass = variant === "error" ? "bg-red-600" : "bg-green-600";

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`${bgClass} text-white rounded-xl px-4 py-2 shadow-lg animate-slide-in`}
      >
        {message}
      </div>
    </div>
  );
}

