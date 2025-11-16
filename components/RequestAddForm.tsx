
import React, { useState } from 'react';
import { requestMember } from '../services/apiService';
import { useToast } from '../hooks/useToast';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface RequestAddFormProps {
  onBack: () => void;
}

const RequestAddForm: React.FC<RequestAddFormProps> = ({ onBack }) => {
  const [requestedName, setRequestedName] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedName.trim()) {
      addToast('Please provide your name.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { ok } = await requestMember({
        requested_name: requestedName,
        contact: contact || undefined,
      });

      if (ok) {
        addToast('Request sent. An admin will review it shortly.', 'success');
        onBack();
      } else {
        throw new Error('Failed to send request');
      }
    } catch (error) {
      addToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 p-4 rounded-lg">
       <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-blue mb-4">
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </button>
      <h3 className="font-bold text-lg text-brand-blue-dark mb-2">Request to be Added</h3>
      <p className="text-sm text-gray-600 mb-4">An admin will add you to the list. This does not check you in for today.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={requestedName}
          onChange={(e) => setRequestedName(e.target.value)}
          placeholder="Your Full Name"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan"
        />
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Contact (Email or Phone, optional)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 text-white font-bold rounded-lg transition-all duration-200 shadow-lg ${
            isSubmitting ? 'bg-gray-400 animate-pulse cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'
          }`}
        >
          {isSubmitting ? 'Sending...' : 'Send Request'}
        </button>
      </form>
    </div>
  );
};

export default RequestAddForm;
