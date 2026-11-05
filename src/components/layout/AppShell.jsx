import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MusicPlayer from "../ui/MusicPlayer";
import MobileHeader from "./MobileHeader";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="site-shell">
      <MobileHeader onMenu={() => setMobileOpen((v) => !v)} />
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <main className="main-content">
        {children || <Outlet />}
      </main>
      <MusicPlayer />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
    </div>
  );
}
