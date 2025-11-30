import React, { useEffect } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

interface ToastNotificationProps {
  show: boolean;
  onClose: () => void;
  message: string;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ show, onClose, message }) => {
  // Auto hide after 3000ms
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(t);
  }, [show, onClose]);

  return (
    <ToastContainer
      className="position-fixed top-50 start-50 translate-middle p-3"
      style={{ zIndex: 1055 }} // ensures it appears above modals
    >
      <Toast
        show={show}
        onClose={onClose}
        bg="dark"
        className="text-white shadow"
        animation
      >
        <Toast.Body>✔ {message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default ToastNotification;
