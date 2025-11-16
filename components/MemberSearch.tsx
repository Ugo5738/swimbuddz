
import React, { useState, useEffect, useCallback } from 'react';
import { searchActiveMembers, recordAttendance } from '../services/apiService';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../hooks/useToast';
import { SessionInfo, Member } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface MemberSearchResult extends Pick<Member, 'member_id' | 'display_name'> {}

const MemberSearch: React.FC<{ sessionInfo: SessionInfo }> = ({ sessionInfo }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedInMemberId, setCheckedInMemberId] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { addToast } = useToast();

  useEffect(() => {
    if (debouncedQuery.length > 1) {
      const fetchMembers = async () => {
        setIsLoading(true);
        try {
          const data = await searchActiveMembers(debouncedQuery);
          setResults(data.members);
        } catch (error) {
          addToast('Failed to search members. Please try again.', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      fetchMembers();
    } else {
      setResults([]);
    }
  }, [debouncedQuery, addToast]);

  const handleSelectMember = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setQuery(member.display_name);
    setResults([]);
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);
    try {
      const { ok, alreadyRegistered } = await recordAttendance({
        member_id: selectedMember.member_id,
        sessionDateISO: sessionInfo.sessionDateISO,
      });
      if (ok) {
        if(alreadyRegistered) {
          addToast(`${selectedMember.display_name}, you're already registered!`, 'info');
        } else {
          addToast(`See you on Saturday, ${selectedMember.display_name}!`, 'success');
        }
        setCheckedInMemberId(selectedMember.member_id);
        setSelectedMember(null);
        setQuery('');
      } else {
        throw new Error('Failed to record attendance');
      }
    } catch (error) {
      addToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMember, sessionInfo.sessionDateISO, addToast]);

  const isCheckedIn = selectedMember?.member_id === checkedInMemberId;

  return (
    <div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedMember(null);
            setCheckedInMemberId(null);
          }}
          placeholder="Type your name to check in..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition"
        />
        {isLoading && <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-blue"></div></div>}
      </div>

      {results.length > 0 && (
        <ul className="border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto bg-white shadow-md">
          {results.map((member) => (
            <li
              key={member.member_id}
              onClick={() => handleSelectMember(member)}
              className="px-4 py-2 hover:bg-brand-light cursor-pointer transition"
            >
              {member.display_name}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedMember || isSubmitting || isCheckedIn}
        className={`w-full mt-4 py-3 px-4 text-white font-bold rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
          !selectedMember || isCheckedIn
            ? 'bg-gray-400 cursor-not-allowed'
            : isSubmitting
            ? 'bg-brand-blue-dark animate-pulse'
            : 'bg-brand-blue hover:bg-brand-blue-dark'
        }`}
      >
        {isSubmitting ? 'Checking in...' : isCheckedIn ? (
          <>
            <CheckCircleIcon className="w-5 h-5" />
            You're In!
          </>
        ) : "I'm in for Saturday"}
      </button>
    </div>
  );
};

export default MemberSearch;
