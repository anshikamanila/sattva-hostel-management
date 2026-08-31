import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import type { DashboardView } from "../../types/attendance";

type WardenShellProps = {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  children: React.ReactNode;
};

export function WardenShell({
  activeView,
  onViewChange,
  children,
}: WardenShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#19342f]">
      <div className="flex min-h-screen">
        <Sidebar
          activeView={activeView}
          onViewChange={onViewChange}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="min-w-0 flex-1">
          <header className="flex h-[78px] items-center justify-between border-b border-[#d9ddd4] bg-[#f8f6f0]/80 px-5 backdrop-blur-md sm:px-8 lg:px-12">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="rounded-xl p-2 text-[#557069] transition-colors hover:bg-[#e7e9e0] lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={21} />
              </button>
              <div className="hidden items-center gap-2 text-[12px] font-semibold text-[#82918a] sm:flex">
                <span>Workspace</span>
                <span className="text-[#bbc2ba]">/</span>
                <span className="text-[#34574d]">
                  {activeView === "dashboard"
                    ? "Overview"
                    : activeView === "attendance"
                      ? "Attendance"
                      : "Students"}
                </span>
              </div>
              <p className="font-display text-[19px] tracking-[-0.03em] sm:hidden">
                sattva
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                type="button"
                className="rounded-xl p-2.5 text-[#668078] transition-colors hover:bg-[#e7e9e0] hover:text-[#19342f]"
                aria-label="Search"
              >
                <Search size={18} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                className="relative rounded-xl p-2.5 text-[#668078] transition-colors hover:bg-[#e7e9e0] hover:text-[#19342f]"
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={1.8} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#c77c51]" />
              </button>
              <div className="ml-1 hidden h-8 w-px bg-[#d9ddd4] sm:block" />
              <div className="ml-1 flex items-center gap-2.5">
                <div className="hidden text-right sm:block">
                  <p className="text-[12px] font-bold text-[#24423a]">Anita Menon</p>
                  <p className="mt-0.5 text-[10px] text-[#82918a]">Warden account</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c99567] text-[11px] font-bold text-[#243b34]">
                  AM
                </div>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}