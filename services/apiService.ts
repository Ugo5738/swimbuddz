
import { Member, Attendance, NewMemberRequest, SessionInfo, AdminAttendanceData } from '../types';
import { MOCK_WEB_APP_URL } from '../constants';

// --- MOCK DATABASE ---
let members: Member[] = [
    { member_id: 'm_000001', display_name: 'Adewale Adeyemi', email: 'adewale@example.com', phone: '2348012345678', status: 'active', source: 'onboarding_form', created_at: '2023-01-10T10:00:00Z', updated_at: '2023-01-10T10:00:00Z' },
    { member_id: 'm_000002', display_name: 'Bolanle Ojo', email: 'bolanle@example.com', phone: '2348023456789', status: 'active', source: 'onboarding_form', created_at: '2023-01-11T11:00:00Z', updated_at: '2023-01-11T11:00:00Z' },
    { member_id: 'm_000003', display_name: 'Chidi Okoro', email: 'chidi@example.com', phone: '2348034567890', status: 'active', source: 'onboarding_form', created_at: '2023-01-12T12:00:00Z', updated_at: '2023-01-12T12:00:00Z' },
    { member_id: 'm_000004', display_name: 'Damilola Salisu', status: 'inactive', email: 'dami@example.com', source: 'onboarding_form', created_at: '2023-01-13T13:00:00Z', updated_at: '2023-01-13T13:00:00Z' },
    { member_id: 'm_000005', display_name: 'Efemena Akpofure', status: 'provisional', source: 'self_add', created_at: '2023-10-01T09:00:00Z', updated_at: '2023-10-01T09:00:00Z', email: 'efemena.a@example.com' },
];
let attendance: Attendance[] = [];
let newMemberRequests: NewMemberRequest[] = [
    { requested_name: 'Funke Williams', contact: 'funke@example.com', requested_at: new Date().toISOString() },
    { requested_name: 'Gbenga Adebayo', contact: '2348055551234', requested_at: new Date().toISOString() },
];
let memberIdCounter = members.length;

// --- UTILS ---
const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

const computeNextSaturday = (): Date => {    
    const now = new Date();
    const nowLagos = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));

    let nextSaturday = new Date(nowLagos);
    nextSaturday.setDate(nowLagos.getDate() + (6 - nowLagos.getDay() + 7) % 7);
    nextSaturday.setHours(9, 0, 0, 0); // Set to 9 AM

    const isSaturday = nowLagos.getDay() === 6;
    const isBeforeCutoff = nowLagos.getHours() < 17;

    if (isSaturday && isBeforeCutoff) {
        nextSaturday.setDate(nowLagos.getDate());
    }
    
    return nextSaturday;
};

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// --- PUBLIC API ---

export const getNextSession = async (): Promise<SessionInfo> => {
  await simulateDelay(200);
  const sessionDate = computeNextSaturday();
  return {
    sessionDateISO: sessionDate.toISOString().split('T')[0],
    displayDate: sessionDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  };
};

export const searchActiveMembers = async (query: string): Promise<{ members: { member_id: string, display_name: string }[] }> => {
    await simulateDelay(300);
    const normalizedQuery = normalizeName(query);
    const filteredMembers = members
        .filter(m => m.status === 'active' && normalizeName(m.display_name).includes(normalizedQuery))
        .map(({ member_id, display_name }) => ({ member_id, display_name }))
        .slice(0, 50);
    return { members: filteredMembers };
};

export const recordAttendance = async (payload: { member_id: string; sessionDateISO: string }): Promise<{ ok: boolean, alreadyRegistered: boolean }> => {
    await simulateDelay(500);
    const { member_id, sessionDateISO } = payload;
    const existing = attendance.find(a => a.member_id === member_id && a.session_date === sessionDateISO);
    if (existing) {
        return { ok: true, alreadyRegistered: true };
    }
    const member = members.find(m => m.member_id === member_id);
    if (!member) {
      throw new Error("Member not found");
    }
    attendance.push({
        session_date: sessionDateISO,
        member_id,
        display_name_snapshot: member.display_name,
        status: 'in',
        submitted_at: new Date().toISOString()
    });
    return { ok: true, alreadyRegistered: false };
};

export const selfAddAndAttend = async (payload: { full_name: string; email?: string; phone?: string; sessionDateISO: string }): Promise<{ ok: boolean, member_id: string, status: 'provisional' }> => {
    await simulateDelay(600);
    memberIdCounter++;
    const newMemberId = `m_${String(memberIdCounter).padStart(6, '0')}`;
    const newMember: Member = {
        member_id: newMemberId,
        display_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        status: 'provisional',
        source: 'self_add',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    members.push(newMember);
    await recordAttendance({ member_id: newMemberId, sessionDateISO: payload.sessionDateISO });
    return { ok: true, member_id: newMemberId, status: 'provisional' };
};

export const requestMember = async (payload: { requested_name: string; contact?: string }): Promise<{ ok: true }> => {
    await simulateDelay(400);
    newMemberRequests.push({
        ...payload,
        requested_at: new Date().toISOString()
    });
    return { ok: true };
};

// --- ADMIN API ---

export const getAdminAttendance = async (sessionDateISO: string): Promise<AdminAttendanceData> => {
    await simulateDelay(500);
    const sessionAttendance = attendance.filter(a => a.session_date === sessionDateISO);
    const attendees = new Map(sessionAttendance.map(a => [a.member_id, a]));

    const active = [];
    const provisional = [];

    for (const member of members) {
        if (attendees.has(member.member_id)) {
            if (member.status === 'active') {
                active.push({ member_id: member.member_id, display_name: member.display_name });
            } else if (member.status === 'provisional') {
                provisional.push({ member_id: member.member_id, display_name: member.display_name });
            }
        }
    }
    
    return {
        active,
        provisional,
        requests: newMemberRequests.filter(r => !r.approved),
        counts: {
            active: active.length,
            provisional: provisional.length,
            total: active.length + provisional.length
        }
    };
};

export const getPastSessionDates = async (): Promise<string[]> => {
    const dates: string[] = [];
    let currentDate = computeNextSaturday();
    for (let i = 0; i < 8; i++) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() - 7);
    }
    return dates;
}

export const approveRequest = async (payload: { requested_name: string, contact?: string }): Promise<{ ok: true }> => {
    await simulateDelay(400);
    const request = newMemberRequests.find(r => r.requested_name === payload.requested_name && !r.approved);
    if (request) {
        request.approved = true;
        request.approved_at = new Date().toISOString();
        request.admin_user = 'mock_admin';
        
        memberIdCounter++;
        const newMemberId = `m_${String(memberIdCounter).padStart(6, '0')}`;
        const isEmail = payload.contact?.includes('@');
        members.push({
            member_id: newMemberId,
            display_name: payload.requested_name,
            email: isEmail ? payload.contact : undefined,
            phone: !isEmail ? payload.contact : undefined,
            status: 'provisional',
            source: 'admin_approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }
    return { ok: true };
}

export const mergeMembers = async (payload: { from_member_id: string; to_member_id: string }): Promise<{ ok: true }> => {
    await simulateDelay(700);
    // Move attendance
    attendance.forEach(att => {
        if (att.member_id === payload.from_member_id) {
            att.member_id = payload.to_member_id;
        }
    });
    // Delete old member
    members = members.filter(m => m.member_id !== payload.from_member_id);
    return { ok: true };
}

export const reconcileMembers = async (): Promise<{ ok: boolean; promotedCount: number }> => {
    await simulateDelay(1000);
    // Simulate a "Form responses" tab where a user has filled the full form
    const formResponses = [
        { 'Full Name': 'Efemena Akpofure', 'Email': 'efemena.akpofure@completed.com', 'Phone': '2348098765432' }
    ];

    let promotedCount = 0;
    const provisionalMembers = members.filter(m => m.status === 'provisional');
    
    for (const provisional of provisionalMembers) {
        const matchingResponse = formResponses.find(res => 
            normalizeName(res['Full Name']) === normalizeName(provisional.display_name) ||
            res['Email']?.toLowerCase() === provisional.email?.toLowerCase()
        );

        if (matchingResponse) {
            provisional.status = 'active';
            provisional.source = 'onboarding_form';
            provisional.email = matchingResponse['Email'];
            provisional.phone = matchingResponse['Phone'];
            provisional.updated_at = new Date().toISOString();
            promotedCount++;
        }
    }
    return { ok: true, promotedCount };
};

export const exportSessionCSV = (sessionDateISO: string): Promise<void> => {
    return new Promise((resolve) => {
        const sessionAttendance = attendance.filter(a => a.session_date === sessionDateISO);
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "display_name,member_id,submitted_at\r\n";
        sessionAttendance.forEach(row => {
            csvContent += `${row.display_name_snapshot},${row.member_id},${row.submitted_at}\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `swimbuddz_attendance_${sessionDateISO}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve();
    });
};

// A very simple QR code generator returning a data URL
export const getQrCodeDataUrl = async (): Promise<string> => {
    // This is a placeholder. In a real app, you would use a library like 'qrcode'.
    // For this mock, we'll use a public QR code generation API.
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(MOCK_WEB_APP_URL)}`;
    return Promise.resolve(qrApiUrl);
};
