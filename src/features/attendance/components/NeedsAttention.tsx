import { ArrowRight, CircleAlert } from "lucide-react";
import type { StudentSummary } from "../../../types/attendance";

type NeedsAttentionProps = {
  students: StudentSummary[];
  onViewAll: () => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function NeedsAttention({ students, onViewAll }: NeedsAttentionProps) {
  return (
    <section className="panel-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#c0774d]">
            <CircleAlert size={14} />
            Needs attention
          </div>
          <h3 className="mt-2 font-display text-[22px] tracking-[-0.04em] text-[#23443b]">
            {students.length} responses are pending
          </h3>
        </div>
        <span className="rounded-full bg-[#f6e7db] px-2.5 py-1 text-[10px] font-bold text-[#a95f3b]">
          Open session
        </span>
      </div>
      <div className="mt-5 divide-y divide-[#e5e6df]">
        {students.slice(0, 3).map((student) => (
          <div key={student.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee8dd] text-[10px] font-bold text-[#806a55]">
              {initials(student.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-[#2f4c43]">
                {student.fullName}
              </p>
              <p className="mt-0.5 text-[11px] text-[#8b9790]">
                Block {student.block} · Room {student.roomNumber}
              </p>
            </div>
            <span className="ml-auto shrink-0 text-[10px] font-semibold text-[#a6aaa1]">
              Not submitted
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="mt-5 flex items-center gap-2 text-[11px] font-bold text-[#49766a] transition-colors hover:text-[#173b34]"
      >
        See all missing responses
        <ArrowRight size={14} />
      </button>
    </section>
  );
}