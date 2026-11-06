import { ArrowRight, Pencil, Sparkles } from 'lucide-react'
import type {AboutContent} from '../../data/studio'
import {AssetImage} from '../ui/asset-image'
import {RichText} from '../ui/rich-text'
export function AboutPage({about,editing,onEdit,onContact}:{about:AboutContent;editing:boolean;onEdit:()=>void;onContact:()=>void}){
 return <main className="simple-page about-page">
  <div className="about-page-header"><span className="eyebrow"><Sparkles size={17}/> {about.eyebrow}</span><h1>{about.titleFirst}<br/><em>{about.titleAccent}</em></h1>{editing&&<button type="button" className="about-page-edit" onClick={onEdit}><Pencil size={17}/>Editar Sobre</button>}</div>
  <div className="about-page-body">
   <div className="about-art-stack">
    <AssetImage src={about.portrait} alt="Artist portrait" className="about-art-primary"/>
    {about.secondaryImage&&<AssetImage src={about.secondaryImage} alt="Additional artwork" className="about-art-secondary"/>}
   </div>
   <section className="about-information"><span className="about-eyebrow">✦ The person behind the art</span><h2 translate="no" className="notranslate">{about.name}</h2><RichText className="about-bio" value={about.bio}/><h3>Creative disciplines</h3><div className="about-skills">{about.specialties.map((skill,index)=><span key={index}>{skill}</span>)}</div><button className="home-cta" onClick={onContact}>Let's collaborate <ArrowRight size={18}/></button></section>
  </div>
 </main>
}
