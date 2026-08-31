import { ArrowUpRight, CalendarDays, CircleCheck } from "lucide-react";
import type { WardenAttendanceDashboard } from "../../../types/attendance";

type AttendanceHeroProps = {
  dashboard: WardenAttendanceDashboard;
  onViewAttendance: () => void;
};

export function AttendanceHero({
  dashboard,
  onViewAttendance,
}: AttendanceHeroProps) {
  const { summary, session } = dashboard;

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[#173b34] p-6 text-[#f5f4eb] shadow-[0_18px_45px_rgba(28,61,52,0.12)] sm:p-8 lg:p-9">
      <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full border border-[#b9d6bd]/10" />
      <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full border border-[#b9d6bd]/10" />
      <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#abc7b2]">
            <CircleCheck size={14} />
            Today&apos;s attendance
          </div>
          <h2 className="mt-5 max-w-[500px] font-display text-[28px] leading-[1.08] tracking-[-0.04em] text-[#fbfaf3] sm:text-[34px]">
            {summary.submitted} of {summary.expected} students have checked in.
          </h2>
          <p className="mt-3 max-w-[430px] text-[13px] leading-relaxed text-[#a9c0b5]">
            Attendance is open for the evening session. You&apos;re nearly
            there — just a few responses need your attention.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start lg:items-end">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#abc7b2]">
            <CalendarDays size={14} />
            {session.label}
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-[52px] leading-none tracking-[-0.07em] text-[#f7f4e9]">
              {summary.completionPercentage}%
            </span>
            <span className="text-[12px] text-[#9eb8aa]">complete</span>
          </div>
        </div>
      </div>
      <div className="relative mt-9">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#a9c0b5]">
          <span>Submitted</span>
          <span>{summary.missing} still missing</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#48665c]">
          <div
            className="h-full rounded-full bg-[#c5ddc5] transition-all duration-700"
            style={{ width: `${summary.completionPercentage}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onViewAttendance}
        className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-[#d5e4d6] px-4 py-3 text-[12px] font-bold text-[#173b34] transition-all hover:bg-white hover:shadow-lg"
      >
        Review attendance
        <ArrowUpRight size={15} />
      </button>
    </section>
  );
}