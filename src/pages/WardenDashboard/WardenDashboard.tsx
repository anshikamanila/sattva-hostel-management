import { ArrowLeft, ArrowRight, Building2, UsersRound } from "lucide-react";
import { AttendanceHero } from "../../features/attendance/components/AttendanceHero";
import { AttendanceStats } from "../../features/attendance/components/AttendanceStats";
import { NeedsAttention } from "../../features/attendance/components/NeedsAttention";
import { OperationalStatus } from "../../features/attendance/components/OperationalStatus";
import { StudentAttendanceList } from "../../features/attendance/components/StudentAttendanceList";
import type {
  DashboardView,
  WardenAttendanceDashboard,
} from "../../types/attendance";

type WardenDashboardProps = {
  activeView: DashboardView;
  dashboard: WardenAttendanceDashboard;
  onViewChange: (view: DashboardView) => void;
};

export function WardenDashboard({
  activeView,
  dashboard,
  onViewChange,
}: WardenDashboardProps) {
  if (activeView === "attendance") {
    return (
      <div className="mx-auto max-w-[1420px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <button
          type="button"
          onClick={() => onViewChange("dashboard")}
          className="mb-7 inline-flex items-center gap-2 text-[11px] font-bold text-[#668078] transition-colors hover:text-[#21483e]"
        >
          <ArrowLeft size={14} />
          Back to overview
        </button>
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6a8178]">
              Attendance register
            </p>
            <h1 className="mt-2 font-display text-[35px] leading-none tracking-[-0.06em] text-[#214238] sm:text-[43px]">
              Today&apos;s attendance
            </h1>
            <p className="mt-3 text-[13px] text-[#7f8e87]">
              {dashboard.session.label} · {dashboard.summary.submitted} submitted of{" "}
              {dashboard.summary.expected} expected
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#dce3d9] bg-[#eef4eb] px-3 py-2.5 text-[11px] font-bold text-[#52755d]">
            <span className="h-2 w-2 rounded-full bg-[#77a57e]" />
            Session open until 22:30
          </div>
        </div>
        <StudentAttendanceList students={dashboard.students} />
      </div>
    );
  }

  if (activeView === "students") {
    return (
      <div className="mx-auto max-w-[1420px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <button
          type="button"
          onClick={() => onViewChange("dashboard")}
          className="mb-7 inline-flex items-center gap-2 text-[11px] font-bold text-[#668078] transition-colors hover:text-[#21483e]"
        >
          <ArrowLeft size={14} />
          Back to overview
        </button>
        <div className="mb-7">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6a8178]">
            <UsersRound size={14} />
            Student directory
          </p>
          <h1 className="mt-2 font-display text-[35px] leading-none tracking-[-0.06em] text-[#214238] sm:text-[43px]">
            Students in the hostel
          </h1>
          <p className="mt-3 text-[13px] text-[#7f8e87]">
            {dashboard.students.length} active residents across Blocks A and B.
          </p>
        </div>
        <StudentAttendanceList students={dashboard.students} showFilters={false} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1420px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6a8178]">
            Monday, 31 August 2026
          </p>
          <h1 className="mt-2 font-display text-[38px] leading-none tracking-[-0.07em] text-[#214238] sm:text-[48px]">
            Good evening, Anita.
          </h1>
          <p className="mt-3 text-[13px] text-[#7f8e87]">
            Here&apos;s what needs your attention tonight.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-xl bg-[#e8eee4] px-3 py-2.5 text-[11px] font-bold text-[#547462]">
          <Building2 size={14} />
          2 blocks · {dashboard.summary.expected} residents
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
        <AttendanceHero
          dashboard={dashboard}
          onViewAttendance={() => onViewChange("attendance")}
        />
        <NeedsAttention
          students={dashboard.missingStudents}
          onViewAll={() => onViewChange("attendance")}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.16fr)_minmax(290px,0.84fr)]">
        <AttendanceStats trend={dashboard.trend} />
        <OperationalStatus />
      </div>

      <section className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#6a8178]">
              Live register
            </p>
            <h2 className="mt-1 font-display text-[22px] tracking-[-0.04em] text-[#23443b]">
              Recent submissions
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onViewChange("attendance")}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#4d7669] transition-colors hover:text-[#214238]"
          >
            View full register
            <ArrowRight size={14} />
          </button>
        </div>
        <StudentAttendanceList
          students={dashboard.submittedStudents.slice(0, 5)}
          showFilters={false}
        />
      </section>
    </div>
  );
}