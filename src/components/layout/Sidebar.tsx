import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  Users,
  X,
} from "lucide-react";
import type { DashboardView } from "../../types/attendance";

type SidebarProps = {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  isOpen: boolean;
  onClose: () => void;
};

const navigationItems: {
  label: string;
  view: DashboardView;
  icon: typeof LayoutDashboard;
}[] = [
  { label: "Overview", view: "dashboard", icon: LayoutDashboard },
  { label: "Attendance", view: "attendance", icon: ClipboardCheck },
  { label: "Students", view: "students", icon: Users },
];

export function Sidebar({
  activeView,
  onViewChange,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-[#08231f]/35 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col bg-[#12302c] px-5 pb-5 pt-6 text-[#f8f5ee] transition-transform duration-300 lg:static lg:z-auto lg:w-[274px] lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#d5e4d6] text-[#12302c]">
              <Building2 size={19} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-display text-[22px] leading-none tracking-[-0.04em]">
                sattva
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a6beb1]">
                hostel operations
              </p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 text-[#a6beb1] transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-14">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#72988a]">
            Workspace
          </p>
          <nav className="mt-3 space-y-1" aria-label="Main navigation">
            {navigationItems.map(({ label, view, icon: Icon }) => {
              const isActive = activeView === view;
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => {
                    onViewChange(view);
                    onClose();
                  }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition-all ${
                    isActive
                      ? "bg-[#d5e4d6] text-[#12302c] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                      : "text-[#aec5b9] hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <Icon size={17} strokeWidth={isActive ? 2.3 : 1.9} />
                  <span>{label}</span>
                  {isActive && <ChevronRight className="ml-auto" size={15} />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.045] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#d6e3d6]">
                <span className="h-2 w-2 rounded-full bg-[#9fc6a5] shadow-[0_0_0_4px_rgba(159,198,165,0.12)]" />
                All systems normal
              </div>
              <Check size={14} className="text-[#9fc6a5]" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#86a69a]">
              Attendance records are up to date for today&apos;s session.
            </p>
            <button
              type="button"
              className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#d5e4d6] transition-colors hover:text-white"
              onClick={() => onViewChange("attendance")}
            >
              View attendance
              <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-white/[0.09] px-2 pt-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c99567] text-[12px] font-bold text-[#243b34]">
              AM
            </div>
            <div>
              <p className="text-[12px] font-bold">Anita Menon</p>
              <p className="mt-0.5 text-[10px] text-[#86a69a]">Warden</p>
            </div>
            <button
              type="button"
              className="ml-auto rounded-lg p-2 text-[#86a69a] transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Open profile menu"
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}