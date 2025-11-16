
export type MemberStatus = 'active' | 'inactive' | 'provisional';
export type MemberSource = 'onboarding_form' | 'self_add' | 'admin_approved';

export interface Member {
  member_id: string;
  display_name: string;
  email?: string;
  phone?: string;
  status: MemberStatus;
  source: MemberSource;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface Attendance {
  session_date: string;
  member_id: string;
  display_name_snapshot: string;
  status: 'in';
  submitted_at: string;
  source_ip?: string;
  user_agent?: string;
}

export interface NewMemberRequest {
    requested_name: string;
    contact?: string;
    requested_at: string;
    approved?: boolean;
    approved_at?: string;
    admin_user?: string;
    notes?: string;
}

export interface SessionInfo {
  sessionDateISO: string;
  displayDate: string;
}

export interface AdminAttendanceData {
    active: { member_id: string; display_name: string }[];
    provisional: { member_id: string; display_name: string }[];
    requests: NewMemberRequest[];
    counts: {
        active: number;
        provisional: number;
        total: number;
    }
}
