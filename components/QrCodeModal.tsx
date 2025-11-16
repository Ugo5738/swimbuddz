
import React from 'react';
import { MOCK_WEB_APP_URL } from '../constants';

interface QrCodeModalProps {
  qrCodeUrl: string;
  onClose: () => void;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ qrCodeUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-brand-blue-dark mb-4">Scan to Register</h2>
        <img src={qrCodeUrl} alt="Web App QR Code" className="mx-auto" />
        <p className="text-xs text-gray-500 mt-2 break-all">{MOCK_WEB_APP_URL}</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">
          Close
        </button>
      </div>
    </div>
  );
};

export default QrCodeModal;
