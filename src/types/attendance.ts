export type AttendanceStatus = "PRESENT" | "PENDING";

export type DashboardView = "dashboard" | "attendance" | "students";

export type StudentSummary = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  block: "A" | "B";
  roomNumber: string;
  isActive: boolean;
  status: AttendanceStatus;
  submittedAt?: string;
};

export type AttendanceActivity = {
  id: string;
  studentName: string;
  roomNumber: string;
  block: "A" | "B";
  action: "Submitted attendance";
  time: string;
};

export type AttendanceTrendPoint = {
  label: string;
  percentage: number;
  submitted: number;
};

export type WardenAttendanceDashboard = {
  session: {
    id: string;
    date: string;
    label: string;
    status: "OPEN" | "CLOSED";
  };
  summary: {
    expected: number;
    submitted: number;
    missing: number;
    completionPercentage: number;
  };
  students: StudentSummary[];
  missingStudents: StudentSummary[];
  submittedStudents: StudentSummary[];
  recentActivity: AttendanceActivity[];
  trend: AttendanceTrendPoint[];
};