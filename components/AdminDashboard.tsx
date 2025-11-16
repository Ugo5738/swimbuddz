
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminAttendance, reconcileMembers, approveRequest, mergeMembers, getPastSessionDates, exportSessionCSV, getQrCodeDataUrl } from '../services/apiService';
import { AdminAttendanceData, NewMemberRequest, Member } from '../types';
import { useToast } from '../hooks/useToast';
import { MOCK_WEB_APP_URL } from '../constants';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { UsersIcon } from './icons/UsersIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import QrCodeModal from './QrCodeModal';

type AdminTab = 'Active' | 'Provisional' | 'Requests';

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [data, setData] = useState<AdminAttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('Active');
  const [isReconciling, setIsReconciling] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeFrom, setMergeFrom] = useState('');
  const [mergeTo, setMergeTo] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const { addToast } = useToast();

  const fetchData = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const attendanceData = await getAdminAttendance(date);
      setData(attendanceData);
    } catch (error) {
      addToast('Failed to load admin data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const init = async () => {
      const dates = await getPastSessionDates();
      setSessionDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        fetchData(dates[0]);
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [fetchData]);

  useEffect(() => {
    if (selectedDate) {
      fetchData(selectedDate);
    }
  }, [selectedDate, fetchData]);

  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      const result = await reconcileMembers();
      addToast(`Reconciliation complete. ${result.promotedCount} members promoted.`, 'success');
      fetchData(selectedDate); // Refresh data
    } catch (error) {
      addToast('Reconciliation failed.', 'error');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleApprove = async (request: NewMemberRequest) => {
      try {
          await approveRequest({ requested_name: request.requested_name, contact: request.contact });
          addToast(`${request.requested_name} approved as provisional member.`, 'success');
          fetchData(selectedDate);
      } catch(e) {
          addToast('Failed to approve request.', 'error');
      }
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeFrom || !mergeTo) {
        addToast('Please select both members to merge.', 'error');
        return;
    }
    setIsMerging(true);
    try {
        await mergeMembers({ from_member_id: mergeFrom, to_member_id: mergeTo });
        addToast('Members merged successfully.', 'success');
        setMergeFrom('');
        setMergeTo('');
        fetchData(selectedDate);
    } catch(e) {
        addToast('Failed to merge members.', 'error');
    } finally {
        setIsMerging(false);
    }
  }

  const handleExport = async () => {
    try {
      await exportSessionCSV(selectedDate);
      addToast('CSV export started.', 'success');
    } catch (e) {
      addToast('Failed to export CSV.', 'error');
    }
  };

  const handleShowQr = async () => {
    const url = await getQrCodeDataUrl();
    setQrCodeUrl(url);
    setShowQr(true);
  }

  const copyWhatsAppRollCall = () => {
    const displayDate = new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const text = `SwimBuddz roll call for Sat, ${displayDate}: ${data?.counts.total || 0} confirmed. Tap to register: ${MOCK_WEB_APP_URL}`;
    navigator.clipboard.writeText(text).then(() => {
      addToast('WhatsApp message copied!', 'success');
    });
  };
  
  const provisionalMembers = useMemo(() => data?.provisional || [], [data]);
  const activeMembers = useMemo(() => data?.active || [], [data]);
  const allMembersForMerge = useMemo(() => [...activeMembers, ...provisionalMembers].sort((a, b) => a.display_name.localeCompare(b.display_name)), [activeMembers, provisionalMembers]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-blue">Admin Dashboard</h1>
        <div>
          <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 border rounded-md">
            {sessionDates.map(date => <option key={date} value={date}>{new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</option>)}
          </select>
          <button onClick={onLogout} className="ml-4 text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </header>

      {isLoading ? <p>Loading...</p> : data ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm font-medium">Total Confirmed</h2>
                <p className="text-3xl font-bold text-brand-blue-dark">{data.counts.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm font-medium">Active Members</h2>
                <p className="text-3xl font-bold text-green-600">{data.counts.active}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm font-medium">Provisional Members</h2>
                <p className="text-3xl font-bold text-yellow-600">{data.counts.provisional}</p>
            </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-bold mb-3">Session Tools</h2>
            <div className="flex flex-wrap gap-2">
                <button onClick={copyWhatsAppRollCall} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"><ClipboardIcon className="w-4 h-4" /> Copy WhatsApp Roll-Call</button>
                <button onClick={handleReconcile} disabled={isReconciling} className="flex items-center gap-2 bg-brand-cyan text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition disabled:bg-gray-400">
                  <RefreshCwIcon className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} /> {isReconciling ? 'Reconciling...' : 'Run Reconcile Now'}
                </button>
                 <button onClick={handleExport} className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"><DownloadIcon className="w-4 h-4" /> Export CSV</button>
                <button onClick={handleShowQr} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition">Show QR</button>
            </div>
        </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {(['Active', 'Provisional', 'Requests'] as AdminTab[]).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? 'border-brand-blue text-brand-blue-dark' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    {tab} ({tab === 'Active' ? data.active.length : tab === 'Provisional' ? data.provisional.length : data.requests.length})
                  </button>
                ))}
              </nav>
            </div>
            <div className="mt-4">
              {activeTab === 'Active' && <MemberList members={data.active} />}
              {activeTab === 'Provisional' && <MemberList members={data.provisional} />}
              {activeTab === 'Requests' && <RequestList requests={data.requests} onApprove={handleApprove} />}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow mt-6">
            <h2 className="text-lg font-bold mb-3">Merge Provisional Member</h2>
            <form onSubmit={handleMerge} className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="mergeFrom" className="block text-sm font-medium text-gray-700">From (Provisional)</label>
                    <select id="mergeFrom" value={mergeFrom} onChange={e => setMergeFrom(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md">
                       <option value="">Select provisional member</option>
                       {provisionalMembers.map(m => <option key={m.member_id} value={m.member_id}>{m.display_name}</option>)}
                    </select>
                </div>
                 <div className="flex-1 min-w-[200px]">
                    <label htmlFor="mergeTo" className="block text-sm font-medium text-gray-700">To (Active)</label>
                    <select id="mergeTo" value={mergeTo} onChange={e => setMergeTo(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md">
                        <option value="">Select active member</option>
                        {allMembersForMerge.map(m => <option key={m.member_id} value={m.member_id}>{m.display_name}</option>)}
                    </select>
                </div>
                <button type="submit" disabled={isMerging} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition disabled:bg-gray-400">
                    <UsersIcon className="w-4 h-4" /> {isMerging ? 'Merging...' : 'Merge'}
                </button>
            </form>
          </div>
        </>
      ) : <p>No data available.</p>}
      {showQr && qrCodeUrl && <QrCodeModal qrCodeUrl={qrCodeUrl} onClose={() => setShowQr(false)} />}
    </div>
  );
};

const MemberList: React.FC<{ members: { member_id: string, display_name: string }[] }> = ({ members }) => (
  <ul className="divide-y divide-gray-200">
    {members.sort((a,b) => a.display_name.localeCompare(b.display_name)).map(member => (
      <li key={member.member_id} className="py-2">{member.display_name}</li>
    ))}
  </ul>
);

const RequestList: React.FC<{ requests: NewMemberRequest[], onApprove: (request: NewMemberRequest) => void }> = ({ requests, onApprove }) => (
    <ul className="divide-y divide-gray-200">
    {requests.map(req => (
      <li key={req.requested_name + req.requested_at} className="py-2 flex justify-between items-center">
        <div>
            <p className="font-medium">{req.requested_name}</p>
            <p className="text-sm text-gray-500">{req.contact}</p>
        </div>
        <button onClick={() => onApprove(req)} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm hover:bg-green-200 transition">
          <UserPlusIcon className="w-4 h-4"/> Approve
        </button>
      </li>
    ))}
  </ul>
);

export default AdminDashboard;
