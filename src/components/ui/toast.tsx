import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast flex items-center justify-between">
      <span>{message}</span>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }} 
        className="ml-2 hover:opacity-80 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="toast-container">
      {children}
    </div>
  );
};