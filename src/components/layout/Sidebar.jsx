import { NavLink } from "react-router-dom";
import { AudioLines, Box, CircleUserRound, Compass, Github, Instagram, MessageCircle, Palette } from "lucide-react";

const socials = [
  { label: "Discord", href: "https://discord.com", icon: MessageCircle },
  { label: "Reddit", href: "https://reddit.com", icon: CircleUserRound },
  { label: "ArtStation", href: "https://www.artstation.com", icon: Palette },
  { label: "Behance", href: "https://www.behance.net", icon: Box },
  { label: "Patreon", href: "https://www.patreon.com", icon: AudioLines }
];

export default function Sidebar({ mobileOpen, onNavigate }) {
  return (
    <>
      <div className={`sidebar-backdrop ${mobileOpen ? "visible" : ""}`} onClick={onNavigate} />
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <NavLink to="/" className="brand-lockup" onClick={onNavigate}>
          <span className="brand-symbol">JF<span>✳</span></span>
          <span className="brand-name">JORDAN FERRARY<small>3D ARTIST & WORLD BUILDER</small></span>
        </NavLink>
        <div className="sidebar-rule" />
        <span className="eyebrow sidebar-label">NAVIGATION</span>
        <nav className="main-nav">
          <NavLink to="/" end onClick={onNavigate}><span className="nav-icon"><Compass size={17}/></span>Home</NavLink>
          <NavLink to="/portfolio" onClick={onNavigate}><span className="nav-icon"><Box size={17}/></span>Explore portfolio</NavLink>
          <NavLink to="/about" onClick={onNavigate}><span className="nav-icon"><CircleUserRound size={17}/></span>About</NavLink>
        </nav>
        <div className="sidebar-bottom">
          <span className="eyebrow">FIND ME ELSEWHERE</span>
          <div className="social-list">
            {socials.map(({ label, href, icon: Icon }) => (
              <a href={href} target="_blank" rel="noreferrer" key={label} aria-label={label} title={label}>
                <Icon size={17}/><span>{label}</span>
              </a>
            ))}
          </div>
          <div className="sidebar-footer"><span className="status-dot"/> Available for selected projects</div>
          <small className="copyright">© {new Date().getFullYear()} JORDAN FERRARY</small>
        </div>
      </aside>
    </>
  );
}
