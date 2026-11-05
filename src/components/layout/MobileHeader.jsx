import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function MobileHeader({ onMenu }) {
  return (
    <header className="mobile-header">
      <Link to="/" className="brand-mark">JF<span>.</span></Link>
      <button className="icon-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
    </header>
  );
}
