
import React, { useState } from 'react';
import { selfAddAndAttend } from '../services/apiService';
import { useToast } from '../hooks/useToast';
import { FULL_REGISTRATION_FORM_URL } from '../constants';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface AddMeFormProps {
  sessionDateISO: string;
  onBack: () => void;
}

const AddMeForm: React.FC<AddMeFormProps> = ({ sessionDateISO, onBack }) => {
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !contact.trim()) {
      addToast('Please provide your full name and at least one contact method.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const isEmail = contact.includes('@');
    try {
      const { ok } = await selfAddAndAttend({
        full_name: fullName,
        email: isEmail ? contact : undefined,
        phone: !isEmail ? contact : undefined,
        sessionDateISO,
      });

      if (ok) {
        addToast(
          <p>
            You’re checked in ✅. To become a full member, please {' '}
            <a href={FULL_REGISTRATION_FORM_URL} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-white">
              complete this form
            </a>.
          </p>, 
          'success'
        );
        onBack();
      } else {
        throw new Error('Failed to self-add and attend');
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
        Back to search
      </button>
      <h3 className="font-bold text-lg text-brand-blue-dark mb-2">Add Me Quickly</h3>
      <p className="text-sm text-gray-600 mb-4">Just enter your name and one contact method to check in for this Saturday.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your Full Name"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan"
        />
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Email or Phone Number"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 text-white font-bold rounded-lg transition-all duration-200 shadow-lg ${
            isSubmitting ? 'bg-brand-cyan animate-pulse cursor-not-allowed' : 'bg-brand-cyan hover:bg-opacity-90'
          }`}
        >
          {isSubmitting ? 'Adding...' : 'Add Me & Check In'}
        </button>
      </form>
    </div>
  );
};

export default AddMeForm;
