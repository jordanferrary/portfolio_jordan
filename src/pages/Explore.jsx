import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { projects } from "../data/projects";
import ProjectCard from "../components/ui/ProjectCard";
import Lightbox from "../components/ui/Lightbox";
import SectionHeading from "../components/ui/SectionHeading";

export default function Explore() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);
  const categories = useMemo(() => ["All", ...new Set(projects.map((p) => p.category))], []);
  const filtered = projects.filter((p) =>
    (filter === "All" || p.category === filter) &&
    `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(search.toLowerCase())
  );
  const cyclePreview = (direction) => {
    const index = filtered.findIndex((p) => p.slug === preview?.slug);
    const next = (index + direction + filtered.length) % filtered.length;
    setPreview(filtered[next]);
  };

  return (
    <div className="page explore-page">
      <div className="page-kicker"><span className="status-dot"/> THE ARCHIVE <span className="kicker-line"/></div>
      <SectionHeading eyebrow="A COLLECTION OF WORLDS" title={<>Explore my <em>portfolio.</em></>} description="A selection of experiments, personal projects and visual explorations."/>
      <div className="gallery-toolbar">
        <div className="filter-scroll"><SlidersHorizontal size={15}/>{categories.map((category) => <button key={category} className={`filter-chip ${filter === category ? "active" : ""}`} onClick={() => setFilter(category)}>{category}</button>)}</div>
        <label className="search-field"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a project..."/>{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={14}/></button>}</label>
      </div>
      <div className="gallery-meta"><span>{filtered.length.toString().padStart(2, "0")} PROJECTS</span><span>SELECT AN IMAGE TO PREVIEW</span></div>
      {filtered.length ? <div className="project-grid">{filtered.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} onPreview={setPreview}/>)}</div> : <div className="empty-state"><span className="eyebrow">NO RESULTS</span><h3>No projects found.</h3><p>Try another keyword or category.</p><button className="button button-secondary" onClick={() => {setSearch("");setFilter("All");}}>Clear filters</button></div>}
      <Lightbox project={preview} onClose={() => setPreview(null)} onNext={() => cyclePreview(1)} onPrevious={() => cyclePreview(-1)}/>
    </div>
  );
}
