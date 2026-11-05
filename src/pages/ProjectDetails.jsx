import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Maximize2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { projects } from "../data/projects";

export default function ProjectDetails() {
  const { slug } = useParams();
  const project = projects.find((item) => item.slug === slug);
  const [expandedImage, setExpandedImage] = useState(null);
  if (!project) return <div className="page"><h1>Project not found.</h1><Link to="/portfolio" className="text-link">Back to portfolio <ArrowUpRight size={15}/></Link></div>;

  return (
    <div className="page project-detail-page">
      <Link to="/portfolio" className="back-link"><ArrowLeft size={16}/> Back to portfolio</Link>
      <header className="detail-header">
        <div><span className="eyebrow">PROJECT / {project.year} / {project.category.toUpperCase()}</span><h1>{project.title}<span className="title-period">.</span></h1></div>
        <p>{project.description}</p>
      </header>
      <button className="detail-cover" onClick={() => setExpandedImage(project.cover)} aria-label="Enlarge cover image"><img src={project.cover} alt={project.title}/><span><Maximize2 size={16}/> Expand image</span></button>
      <div className="detail-info-grid">
        <div className="detail-intro"><span className="eyebrow">THE IDEA</span><p>{project.note}</p></div>
        <div className="detail-facts">
          <div><span>MY ROLE</span><strong>{project.role}</strong></div>
          <div><span>TOOLS</span><strong>{project.software.join(" · ")}</strong></div>
          <div><span>PROJECT TYPE</span><strong>{project.dimensions}</strong></div>
          <div><span>STATUS</span><strong>{project.status}</strong></div>
        </div>
      </div>
      <div className="detail-gallery-heading"><span className="eyebrow">VISUAL JOURNAL</span><span className="eyebrow">{project.gallery.length.toString().padStart(2,"0")} IMAGES</span></div>
      <div className="detail-gallery">{project.gallery.map((image, index) => <button key={image} onClick={() => setExpandedImage(image)}><img src={image} alt={`${project.title} — view ${index + 1}`} loading="lazy"/><span><Maximize2 size={15}/></span></button>)}</div>
      {expandedImage && <div className="image-viewer" role="dialog" aria-modal="true" onClick={() => setExpandedImage(null)}><button aria-label="Close image">×</button><img src={expandedImage} alt="Expanded project view"/></div>}
      <footer className="detail-next"><span className="eyebrow">KEEP EXPLORING</span><Link to="/portfolio" className="button button-primary">Discover more projects <ArrowUpRight size={16}/></Link></footer>
    </div>
  );
}
