
import React, { useState, useCallback } from 'react';
import PublicView from './components/PublicView';
import AdminDashboard from './components/AdminDashboard';
import PinModal from './components/PinModal';
import { ToastProvider } from './hooks/useToast';
import { LockIcon } from './components/icons/LockIcon';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const handleAdminLoginSuccess = useCallback(() => {
    setIsAdmin(true);
    setShowPinModal(false);
  }, []);
  
  const handleLogout = useCallback(() => {
    setIsAdmin(false);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
        {isAdmin ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <PublicView />
        )}

        {!isAdmin && (
          <footer className="text-center p-4">
            <button
              onClick={() => setShowPinModal(true)}
              className="text-xs text-gray-500 hover:text-brand-blue flex items-center gap-1 mx-auto"
            >
              <LockIcon className="w-3 h-3" />
              Admin
            </button>
          </footer>
        )}

        {showPinModal && (
          <PinModal
            onClose={() => setShowPinModal(false)}
            onSuccess={handleAdminLoginSuccess}
          />
        )}
      </div>
    </ToastProvider>
  );
};

export default App;
