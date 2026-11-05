import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import ProjectDetails from "./pages/ProjectDetails";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: "auto" }), [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Explore />} />
          <Route path="/project/:slug" element={<ProjectDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </>
  );
}
