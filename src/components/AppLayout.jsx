import { Outlet } from "react-router-dom";
import { BottomTabBar } from "@/components/rp/BottomTabBar";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <main className="min-h-screen">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}