import { useEffect } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function Lightbox({ project, onClose, onNext, onPrevious }) {
  useEffect(() => {
    if (!project) return;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNext?.();
      if (event.key === "ArrowLeft") onPrevious?.();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose, onNext, onPrevious]);

  if (!project) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${project.title} preview`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <button className="lightbox-close icon-button" onClick={onClose} aria-label="Close preview"><X/></button>
      <button className="lightbox-arrow prev" onClick={onPrevious} aria-label="Previous project"><ChevronLeft/></button>
      <div className="lightbox-content">
        <img src={project.cover} alt={`${project.title} preview`}/>
        <div className="lightbox-caption">
          <div><span className="eyebrow">{project.category} · {project.year}</span><h2>{project.title}</h2></div>
          <Link to={`/project/${project.slug}`} className="button button-primary" onClick={onClose}>View project <ArrowUpRight size={16}/></Link>
        </div>
      </div>
      <button className="lightbox-arrow next" onClick={onNext} aria-label="Next project"><ChevronRight/></button>
    </div>
  );
}
