import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { AttendanceTrendPoint } from "../../../types/attendance";

type AttendanceStatsProps = {
  trend: AttendanceTrendPoint[];
};

export function AttendanceStats({ trend }: AttendanceStatsProps) {
  const maxValue = Math.max(...trend.map((point) => point.percentage));
  const average = Math.round(
    trend.slice(0, -1).reduce((total, point) => total + point.percentage, 0) /
      (trend.length - 1),
  );

  return (
    <section className="panel-surface p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#6a8178]">
            <TrendingUp size={14} />
            Attendance trend
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="font-display text-[30px] tracking-[-0.06em] text-[#23443b]">
              {average}%
            </h3>
            <span className="text-[11px] font-semibold text-[#6e9a78]">
              +4.2% this week
            </span>
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-[#7b9088] transition-colors hover:bg-[#edf0e8] hover:text-[#23443b]"
          aria-label="View attendance history"
        >
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="mt-6 flex h-[104px] items-end gap-2 sm:gap-3">
        {trend.map((point) => (
          <div key={point.label} className="flex h-full flex-1 flex-col justify-end gap-2">
            <div className="relative flex flex-1 items-end">
              <div
                className={`w-full rounded-t-[5px] transition-all ${
                  point.label === "Today" ? "bg-[#c99567]" : "bg-[#b9d7bc]"
                }`}
                style={{ height: `${Math.max((point.percentage / maxValue) * 88, 12)}%` }}
                title={`${point.label}: ${point.percentage}%`}
              />
            </div>
            <span className="text-center text-[9px] font-semibold text-[#a3aca5]">
              {point.label === "Today" ? "Now" : point.label.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}