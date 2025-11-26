'use client';

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

type AlertType = 'error' | 'success' | 'info';

interface AlertProps {
  type: AlertType;
  title: string;
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
}

export default function Alert({ type, title, message, onClose, dismissible = true }: AlertProps) {
  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertCircle className="text-red-600" size={20} />,
      title: 'text-red-900',
      text: 'text-red-800',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <CheckCircle className="text-green-600" size={20} />,
      title: 'text-green-900',
      text: 'text-green-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Info className="text-blue-600" size={20} />,
      title: 'text-blue-900',
      text: 'text-blue-800',
    },
  };

  const style = styles[type];

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4 flex gap-3`}>
      <div className="flex-shrink-0">{style.icon}</div>
      <div className="flex-1">
        <h3 className={`font-semibold ${style.title}`}>{title}</h3>
        <p className={`text-sm mt-1 ${style.text}`}>{message}</p>
      </div>
      {dismissible && onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          ✕
        </button>
      )}
    </div>
  );
}
