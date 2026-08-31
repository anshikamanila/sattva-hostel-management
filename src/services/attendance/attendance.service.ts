import { mockStudents } from "../../data/mockAttendance";
import type {
  AttendanceActivity,
  AttendanceTrendPoint,
  WardenAttendanceDashboard,
} from "../../types/attendance";

const recentActivity: AttendanceActivity[] = [
  {
    id: "activity-001",
    studentName: "Aarohi Menon",
    roomNumber: "204",
    block: "A",
    action: "Submitted attendance",
    time: "21:42",
  },
  {
    id: "activity-002",
    studentName: "Diya Nair",
    roomNumber: "205",
    block: "A",
    action: "Submitted attendance",
    time: "21:38",
  },
  {
    id: "activity-003",
    studentName: "Ishita Rao",
    roomNumber: "206",
    block: "A",
    action: "Submitted attendance",
    time: "21:35",
  },
];

const trend: AttendanceTrendPoint[] = [
  { label: "25 Aug", percentage: 88, submitted: 105 },
  { label: "26 Aug", percentage: 91, submitted: 109 },
  { label: "27 Aug", percentage: 93, submitted: 112 },
  { label: "28 Aug", percentage: 89, submitted: 107 },
  { label: "29 Aug", percentage: 95, submitted: 114 },
  { label: "30 Aug", percentage: 94, submitted: 113 },
  { label: "Today", percentage: 75, submitted: 9 },
];

export function getWardenDashboard(): WardenAttendanceDashboard {
  const activeStudents = mockStudents.filter((student) => student.isActive);
  const submittedStudents = activeStudents.filter(
    (student) => student.status === "PRESENT",
  );
  const missingStudents = activeStudents.filter(
    (student) => student.status === "PENDING",
  );
  const expected = activeStudents.length;
  const submitted = submittedStudents.length;

  return {
    session: {
      id: "session-2026-08-31",
      date: "2026-08-31",
      label: "Monday, 31 August 2026",
      status: "OPEN",
    },
    summary: {
      expected,
      submitted,
      missing: missingStudents.length,
      completionPercentage: expected === 0 ? 0 : Math.round((submitted / expected) * 100),
    },
    students: activeStudents,
    missingStudents,
    submittedStudents,
    recentActivity,
    trend,
  };
}