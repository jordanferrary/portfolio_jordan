import type {PortfolioStore} from '../hooks/use-portfolio'
import {readMedia} from './media-store'
import {contrastRatio} from './theme-palette'
export type StudioIssue={level:'error'|'warning';message:string}
export async function auditStudio(store:PortfolioStore,localRefs:string[]):Promise<StudioIssue[]>{
 const issues:StudioIssue[]=[]
 const error=(message:string)=>issues.push({level:'error',message})
 const warning=(message:string)=>issues.push({level:'warning',message})
 for(const [label,list] of [['Projetos',store.projects],['Páginas',store.customPages],['Categorias',store.categories]] as const){
  const ids=list.map(x=>x.id)
  if(ids.some(id=>!id)||new Set(ids).size!==ids.length)error(label+': IDs vazios ou duplicados.')
 }
 const labels=new Set(store.categories.map(c=>c.label))
 for(const p of store.projects){
  if(!p.title.trim())error('Projeto sem título.')
  if(!labels.has(p.category))warning('Categoria inexistente no projeto: '+p.title)
  if(!p.image.trim())warning('Projeto sem capa: '+p.title)
 }
 for(const p of store.customPages)if(!p.navLabel.trim())warning('Página personalizada sem nome de navegação.')
 for(const page of store.customPages)for(const block of page.blocks){
  if(block.linkedSource&&!store.customPages.some(p=>p.id===block.linkedSource?.pageId&&p.blocks.some(b=>b.id===block.linkedSource?.blockId&&!b.linkedSource)))warning('Origem de componente vinculada ausente em '+page.navLabel+'; usando cópia de segurança.')
 }
 for(const [route,id] of Object.entries(store.nativeLayouts??{}))if(id&&!store.customPages.some(p=>p.id===id))warning('Composição nativa ausente em '+route+'; usando layout original.')
 const palette=store.themePalette
 for(const [label,a,b] of [['Texto/fundo',palette.text,palette.background],['Texto/cards',palette.text,palette.surface],['Texto secundário/fundo',palette.muted,palette.background],['Texto secundário/cards',palette.muted,palette.surface]]){
  if(contrastRatio(a,b)<4.5)warning(label+': contraste inferior a 4,5:1 nas cores-base.')
 }
 for(const ref of new Set(localRefs)){
  try{if(!(await readMedia(ref))?.size)error('Mídia local ausente: '+ref)}
  catch{error('Não foi possível ler a mídia local: '+ref)}
 }
 if(store.projects.some(p=>p.unlisted))warning('Projetos não listados não são privados. Não publique conteúdo confidencial.')
 return issues
}
