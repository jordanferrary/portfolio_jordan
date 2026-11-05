import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { featuredProjects } from "../data/projects";

export default function Home() {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const project = featuredProjects[active];

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % featuredProjects.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const move = (direction) => setActive((current) => (current + direction + featuredProjects.length) % featuredProjects.length);

  return (
    <div className="page home-page">
      <div className="home-topline"><span><span className="status-dot"/> INDEPENDENT 3D ARTIST</span><span className="eyebrow">PORTFOLIO / 2026</span></div>
      <section className="hero-grid">
        <div className="hero-art-wrap">
          <button className="hero-art" onClick={() => navigate(`/project/${project.slug}`)} aria-label={`Open ${project.title} project`}>
            <img key={project.cover} src={project.cover} alt={`${project.title} featured artwork`}/>
            <span className="hero-art-vignette"/>
            <span className="hero-art-label"><span className="eyebrow">SELECTED WORK / 0{active + 1}</span><strong>{project.title}</strong><span>{project.category}</span></span>
            <span className="hero-open"><ArrowUpRight size={20}/></span>
          </button>
          <div className="hero-controls">
            <span className="hero-counter">0{active + 1} <i/> 0{featuredProjects.length}</span>
            <div className="hero-control-buttons">
              <button className="icon-button" onClick={() => move(-1)} aria-label="Previous featured work"><ChevronLeft size={18}/></button>
              <button className="icon-button" onClick={() => move(1)} aria-label="Next featured work"><ChevronRight size={18}/></button>
            </div>
          </div>
        </div>
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={13}/> THE ARTIST BEHIND THE WORLDS</span>
          <h1>Curiosity<br/>shapes <em>everything.</em></h1>
          <p>I build characters, creatures and visual worlds — exploring form, atmosphere and the little details that make an idea feel alive.</p>
          <div className="hero-actions">
            <Link to="/portfolio" className="button button-primary">Explore my portfolio <ArrowUpRight size={17}/></Link>
            <Link to="/about" className="quiet-link">A little about me <ArrowDownRight size={16}/></Link>
          </div>
          <div className="hero-note"><span className="note-line"/><span>THINK IN WORLDS. CREATE IN 3D.</span></div>
        </div>
      </section>
      <section className="home-bottom">
        <div className="home-bottom-copy"><span className="eyebrow">A WORLD IN PROGRESS</span><p>Every project is a new opportunity to learn, experiment and push an idea a little further.</p></div>
        <div className="home-index"><span>SCROLL TO EXPLORE</span><span className="index-line"/></div>
      </section>
    </div>
  );
}
