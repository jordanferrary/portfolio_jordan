import { useCallback,useState } from 'react'
import JSZip from 'jszip'
import { initialProjects, starterCategories, type Project, type Category } from '../data/projects'
import { mediaKey,mediaRefs,readMedia,saveMediaBlob } from '../lib/media-store'
const KEY='jordan-portfolio-local-v2'
export type PortfolioStore={projects:Project[];categories:Category[]}
function migrateLegacyImage(src:string):string{
 if(typeof src!=='string')return src
 const match=src.match(/(?:^|\\/)images\\/(void-wanderer|moonlit-cottage|deepwalker|astral-guardian|neon-armor|ancient-ruins)\\.webp(?:\\?.*)?$/)
 return match?import.meta.env.BASE_URL+'images/projects/'+match[1]+'/'+match[1]+'.webp':src
}

function parseStore(raw:unknown):PortfolioStore{
 if(!raw||typeof raw!=='object')throw new Error('Arquivo de dados inválido')
 const obj=raw as {projects?:unknown;categories?:unknown}
 if(!Array.isArray(obj.projects)||!Array.isArray(obj.categories))throw new Error('Formato inválido')
 const categories:Category[]=obj.categories.map((c:unknown)=>{
  if(typeof c==='string'){const known=starterCategories.find(k=>k.label===c);return known??{id:c.toLowerCase().replace(/[^a-z0-9]+/g,'-'),label:c,icon:'grid'}}
  if(!c||typeof c!=='object')throw new Error('Categoria inválida')
  return c as Category
 })
 const items=obj.projects as Project[]
 for(const p of items)if(typeof p.id!=='string'||typeof p.title!=='string'||!Array.isArray(p.blocks))throw new Error('Projeto inválido')
 const projects=items.map(p=>({...p,image:migrateLegacyImage(p.image),blocks:p.blocks.map(b=>({...b,content:b.type==='image'?migrateLegacyImage(b.content):b.content,media:b.media?migrateLegacyImage(b.media):b.media,after:b.after?migrateLegacyImage(b.after):b.after,gallery:b.gallery?.map(migrateLegacyImage)}))}))
 return {projects,categories}
}
function load():PortfolioStore{
 try{const value=localStorage.getItem(KEY);if(value)return parseStore(JSON.parse(value) as unknown)}catch{/* default */}
 return {projects:initialProjects,categories:starterCategories}
}
export function usePortfolio(){
 const [store,setStore]=useState<PortfolioStore>(load)
 const [saveError,setSaveError]=useState('')
 const save=useCallback((next:PortfolioStore)=>{setStore(next);try{localStorage.setItem(KEY,JSON.stringify(next));setSaveError('')}catch{setSaveError('Sem espaço para salvar dados locais; exporte um backup.') }},[])
 const update=(project:Project)=>save({...store,projects:store.projects.some(p=>p.id===project.id)?store.projects.map(p=>p.id===project.id?project:p):[project,...store.projects]})
 const remove=(id:string)=>save({...store,projects:store.projects.filter(p=>p.id!==id)})
 const setCategories=(categories:Category[])=>save({...store,categories})
 const exportData=async()=>{
  const zip=new JSZip()
  zip.file('portfolio.json',JSON.stringify(store,null,2))
  zip.file('LEIA-ME.txt','Backup do Local Studio. Importe este ZIP no editor. Pastas de imagens seguem projects/<id> e filter-icons/. Publicar no GitHub ainda requer integrar um backend seguro.')
  for(const ref of mediaRefs(store.projects,store.categories)){
   const blob=await readMedia(ref)
   if(blob)zip.file('public/images/'+mediaKey(ref),blob)
  }
  const result=await zip.generateAsync({type:'blob'})
  const url=URL.createObjectURL(result)
  const link=document.createElement('a')
  link.href=url;link.download='jordan-portfolio-backup.zip';link.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
 }
 const importData=async(file:File)=>{
  if(file.name.toLowerCase().endsWith('.json')){save(parseStore(JSON.parse(await file.text()) as unknown));return}
  const zip=await JSZip.loadAsync(file)
  const manifest=zip.file('portfolio.json')
  if(!manifest)throw new Error('Arquivo portfolio.json não encontrado.')
  const parsed=parseStore(JSON.parse(await manifest.async('string')) as unknown)
  for(const ref of mediaRefs(parsed.projects,parsed.categories)){
   const item=zip.file('public/images/'+mediaKey(ref))
   if(item)await saveMediaBlob(ref,await item.async('blob'))
  }
  save(parsed)
 }
 return {...store,saveError,update,remove,setCategories,exportData,importData}
}
