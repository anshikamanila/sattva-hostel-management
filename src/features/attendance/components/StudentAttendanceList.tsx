import { Check, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { StudentSummary } from "../../../types/attendance";

type StudentAttendanceListProps = {
  students: StudentSummary[];
  showFilters?: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function StudentAttendanceList({
  students,
  showFilters = true,
}: StudentAttendanceListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "submitted" | "missing">("all");

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.fullName.toLowerCase().includes(normalizedSearch) ||
        student.roomNumber.includes(normalizedSearch) ||
        student.studentId.toLowerCase().includes(normalizedSearch);
      const matchesFilter =
        filter === "all" ||
        (filter === "submitted" && student.status === "PRESENT") ||
        (filter === "missing" && student.status === "PENDING");
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, students]);

  return (
    <section className="panel-surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#e5e6df] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#6a8178]">
            {filter === "missing" ? "Needs attention" : "Today&apos;s register"}
          </p>
          <h3 className="mt-2 font-display text-[22px] tracking-[-0.04em] text-[#23443b]">
            {filteredStudents.length} students
          </h3>
        </div>
        {showFilters && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99a49d]"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, room or ID"
                className="h-10 w-full rounded-xl border border-[#e0e3db] bg-[#faf9f5] pl-9 pr-3 text-[11px] font-medium text-[#29463d] outline-none transition-colors placeholder:text-[#a3aaa3] focus:border-[#99b9a0] sm:w-[210px]"
                aria-label="Search students"
              />
            </label>
            <div className="flex items-center gap-1 rounded-xl border border-[#e0e3db] bg-[#faf9f5] p-1">
              <SlidersHorizontal size={14} className="ml-2 mr-1 text-[#99a49d]" />
              {(["all", "submitted", "missing"] as const).map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`rounded-lg px-2.5 py-2 text-[10px] font-bold capitalize transition-colors ${
                    filter === option
                      ? "bg-[#dceadd] text-[#285447]"
                      : "text-[#85948c] hover:text-[#285447]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {filteredStudents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e9eae3] bg-[#fbfaf6]">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0aaa3] sm:px-6">
                  Student
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0aaa3]">
                  Room
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0aaa3]">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0aaa3] sm:px-6">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-[#eff0ea] last:border-0 transition-colors hover:bg-[#fcfbf7]"
                >
                  <td className="px-5 py-3.5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6efe4] text-[9px] font-bold text-[#527764]">
                        {initials(student.fullName)}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#2e4a41]">
                          {student.fullName}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#9ba59e]">
                          {student.studentId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[11px] font-semibold text-[#6f8078]">
                    Block {student.block} · {student.roomNumber}
                  </td>
                  <td className="px-4 py-3.5">
                    {student.status === "PRESENT" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f0e3] px-2.5 py-1 text-[10px] font-bold text-[#538061]">
                        <Check size={12} />
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f6e7db] px-2.5 py-1 text-[10px] font-bold text-[#a95f3b]">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-[11px] font-semibold text-[#6f8078] sm:px-6">
                    {student.submittedAt ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex min-h-[230px] flex-col items-center justify-center px-5 py-12 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7eee5] text-[#668d73]">
            <Search size={18} />
          </div>
          <h4 className="mt-4 font-display text-[18px] tracking-[-0.03em] text-[#315449]">
            No students found
          </h4>
          <p className="mt-1 max-w-[250px] text-[11px] leading-relaxed text-[#8d9992]">
            Try a different name, room number, or student ID.
          </p>
        </div>
      )}
    </section>
  );
}