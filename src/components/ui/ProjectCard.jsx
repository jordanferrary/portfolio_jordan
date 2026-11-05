import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProjectCard({ project, index = 0, onPreview }) {
  return (
    <article className={`project-card card-${index % 3}`}>
      <button className="project-image-button" onClick={() => onPreview(project)} aria-label={`Preview ${project.title}`}>
        <img src={project.cover} alt={`${project.title} artwork`} loading="lazy"/>
        <span className="image-overlay"><span>Quick view <ArrowUpRight size={16}/></span></span>
      </button>
      <div className="project-card-info">
        <div><span className="project-category">{project.category}</span><h3>{project.title}</h3></div>
        <Link className="text-link" to={`/project/${project.slug}`}>View project <ArrowUpRight size={15}/></Link>
      </div>
    </article>
  );
}
