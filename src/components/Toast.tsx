import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100">
      <div className="bg-[#2A2A2D] border-2 border-[#5CDBD5] px-4 py-3 shadow-2xl flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#5CDBD5] shrink-0" />
        <span className="font-mono-code text-xs text-[#E4E1E6] font-medium">
          {message}
        </span>
      </div>
    </div>
  );
};
