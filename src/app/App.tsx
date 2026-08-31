import { useState } from "react";
import { WardenDashboard } from "../pages/WardenDashboard/WardenDashboard";
import { WardenShell } from "../components/layout/WardenShell";
import { getWardenDashboard } from "../services/attendance/attendance.service";
import type { DashboardView } from "../types/attendance";

function App() {
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const dashboard = getWardenDashboard();

  return (
    <WardenShell activeView={activeView} onViewChange={setActiveView}>
      <WardenDashboard
        activeView={activeView}
        dashboard={dashboard}
        onViewChange={setActiveView}
      />
    </WardenShell>
  );
}

export default App;