
import React, { useState, useEffect, useCallback } from 'react';
import { getNextSession } from '../services/apiService';
import { SessionInfo } from '../types';
import MemberSearch from './MemberSearch';
import AddMeForm from './AddMeForm';
import RequestAddForm from './RequestAddForm';

const PublicView: React.FC = () => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'add-me' | 'request-add'>('main');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await getNextSession();
        setSessionInfo(data);
      } catch (err) {
        setError('Could not load session data. Please check your connection and try again.');
        console.error(err);
      }
    };
    fetchSession();
  }, []);

  const renderContent = () => {
    if (view === 'add-me' && sessionInfo) {
      return <AddMeForm sessionDateISO={sessionInfo.sessionDateISO} onBack={() => setView('main')} />;
    }
    if (view === 'request-add') {
      return <RequestAddForm onBack={() => setView('main')} />;
    }
    return (
      <>
        {sessionInfo && <MemberSearch sessionInfo={sessionInfo} />}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-sm">Name not found?</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => setView('add-me')}
            className="w-full text-center py-3 px-4 bg-brand-cyan text-white rounded-lg font-semibold shadow-md hover:bg-opacity-90 transition-all duration-200"
          >
            Add me quickly (10s)
          </button>
          <button
            onClick={() => setView('request-add')}
            className="w-full text-center py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
          >
            Request to be added
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg mt-4 sm:mt-8">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-brand-blue">SwimBuddz Attendance</h1>
        {sessionInfo ? (
          <p className="text-gray-600 mt-2">
            Register for: <span className="font-semibold text-brand-blue-dark">{sessionInfo.displayDate}</span>
          </p>
        ) : (
          <div className="animate-pulse mt-2 h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
        )}
         {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </header>
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default PublicView;
