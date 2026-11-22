import { ArrowRight, Pencil } from 'lucide-react'
import type {AboutContent} from '../../data/studio'
import {AssetImage} from '../ui/asset-image'
import {RichText} from '../ui/rich-text'
import {HeadingSymbol} from '../ui/heading-symbol'
import type {HeadingSymbolStyle} from '../../lib/heading-symbol'
import {cleanHeadingText} from '../../lib/heading-symbol'
export function AboutPage({about,editing,onEdit,onContact,headingSymbol}:{about:AboutContent;editing:boolean;onEdit:()=>void;onContact:()=>void;headingSymbol?:HeadingSymbolStyle}){
 return <main className="simple-page about-page">
  <div className="about-page-body">
   <header className="about-page-header">
    {cleanHeadingText(about.eyebrow)&&<span className="eyebrow"><HeadingSymbol symbol={headingSymbol}/> {cleanHeadingText(about.eyebrow)}</span>}
    <h1>{about.titleFirst}{about.titleAccent&&<><br/><em>{about.titleAccent}</em></>}</h1>
    {editing&&<button type="button" className="about-page-edit" onClick={onEdit}><Pencil size={17}/>Editar Sobre</button>}
   </header>
   <div className="about-art-stack">
    <AssetImage src={about.portrait} alt="Artist portrait" className="about-art-primary" loading="eager" fetchPriority="high"/>
   </div>
   <section className="about-information">
    <div className="about-identity">
     <h2 translate="no" className="notranslate">{about.name}</h2>
     {about.secondaryImage&&<AssetImage src={about.secondaryImage} alt="Additional artwork" className="about-art-secondary"/>}
    </div>
    <RichText className="about-bio" value={about.bio}/>
    {about.specialties.length>0&&<div className="about-disciplines"><h3>Creative disciplines</h3><div className="about-skills">{about.specialties.map((skill,index)=><span key={index}>{skill}</span>)}</div></div>}
    <button className="home-cta" onClick={onContact}>Let's collaborate <ArrowRight size={18}/></button>
   </section>
  </div>
 </main>
}
