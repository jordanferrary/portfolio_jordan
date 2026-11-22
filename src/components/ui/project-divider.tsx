import {Box,Circle,Diamond,PenTool} from 'lucide-react'
import type {Block} from '../../data/projects'

type Props={
 icon?:Block['dividerIcon']
 variant?:Block['dividerStyle']
 /** The Studio preview uses the exact same markup as the public project. */
 preview?:boolean
}

/** Shared divider: changes made in Local Studio are reflected immediately in its preview. */
export function ProjectDivider({icon='diamond',variant='glow',preview=false}:Props){
 const icons={sparkles:Box,star:PenTool,diamond:Diamond,circle:Circle}
 const Icon=icon==='none'?null:(icons[icon as keyof typeof icons]??Diamond)
 const style=variant==='solid'||variant==='dashed'?variant:'glow'
 return <section className={'story-block art-divider art-divider-'+style+(preview?' art-divider-preview':'')} role={preview?'img':'separator'} aria-label={preview?'Prévia da linha divisória':'Section divider'}>
  <span className="art-divider-line"/>
  {Icon&&<span className="art-divider-symbol"><Icon size={17}/></span>}
  <span className="art-divider-line"/>
 </section>
}
