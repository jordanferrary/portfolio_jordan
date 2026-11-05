import { ArrowUpRight, Asterisk, Box, Layers3, WandSparkles } from "lucide-react";
import { Link } from "react-router-dom";

const disciplines = [
  { icon: Box, title: "3D Modeling", text: "Building forms with intention — from stylized props and characters to organic sculpts." },
  { icon: Layers3, title: "Visual Development", text: "Exploring composition, materials and lighting to give every piece its own visual language." },
  { icon: WandSparkles, title: "World Building", text: "Connecting shapes, atmosphere and small details into places that feel worth exploring." }
];

export default function About() {
  return (
    <div className="page about-page">
      <div className="page-kicker"><span className="status-dot"/> BEHIND THE WORK <span className="kicker-line"/></div>
      <section className="about-hero">
        <div className="about-heading"><span className="eyebrow">A LITTLE CONTEXT</span><h1>Not just making<br/>things. <em>Making</em><br/><em>them mean</em><span className="title-period">.</span></h1></div>
        <div className="about-lead"><Asterisk className="about-asterisk" size={34}/><p>I'm Jordan Ferrary, a 3D artist driven by curiosity, visual storytelling and the challenge of turning ideas into tangible worlds.</p><p>I enjoy moving between the technical and the artistic — understanding how something works, then finding a way to make it feel special.</p></div>
      </section>
      <section className="about-statement">
        <span className="eyebrow">THE WAY I SEE IT</span>
        <p>Good work lives somewhere between <em>intention</em> and <em>experimentation.</em> I care about the craft, but I never want to stop asking “what if?”</p>
        <span className="statement-mark">JF<span>✳</span></span>
      </section>
      <section className="discipline-section">
        <div className="discipline-heading"><span className="eyebrow">WHAT I BRING TO THE TABLE</span><h2>Curiosity, with<br/><em>a practical side.</em></h2></div>
        <div className="discipline-list">{disciplines.map(({icon: Icon, title, text}, index) => <article className="discipline-item" key={title}><span className="discipline-number">0{index+1}</span><span className="discipline-icon"><Icon size={21}/></span><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight className="discipline-arrow" size={19}/></article>)}</div>
      </section>
      <section className="about-contact"><div><span className="eyebrow">HAVE AN IDEA IN MIND?</span><h2>Let's make<br/><em>something matter.</em></h2></div><a href="https://discord.com" target="_blank" rel="noreferrer" className="button button-primary">Get in touch <ArrowUpRight size={16}/></a></section>
      <div className="about-footer"><span>CURIOUS BY NATURE. CREATIVE BY CHOICE.</span><Link to="/portfolio">See selected work <ArrowUpRight size={14}/></Link></div>
    </div>
  );
}
