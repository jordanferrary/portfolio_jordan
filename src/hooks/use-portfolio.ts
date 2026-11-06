import { useCallback,useState } from 'react'
import JSZip from 'jszip'
import { initialProjects, starterCategories, type Project, type Category } from '../data/projects'
import {defaultHome,defaultMusicTracks,defaultTestimonials,type HomeContent,type Testimonial,type MusicTrack,type SocialLink,defaultSocialLinks} from '../data/studio'
import { mediaKey,mediaRefs,readMedia,saveMediaBlob,isLocalMedia,listMediaAssets,saveCatalogItems,type LibraryAsset } from '../lib/media-store'
const KEY='jordan-portfolio-local-v2'
export interface PortfolioStore {projects:Project[];categories:Category[];home:HomeContent;testimonials:Testimonial[];musicTracks:MusicTrack[];socialLinks:SocialLink[];showLikeCounts:boolean}
function migrateLegacyImage(src:string):string{
 const match=src.match(new RegExp('(?:^|/)images/(void-wanderer|moonlit-cottage|deepwalker|astral-guardian|neon-armor|ancient-ruins)[.]webp(?:[?].*)?$'))
 return match?import.meta.env.BASE_URL+'images/projects/'+match[1]+'/'+match[1]+'.webp':src
}
function parseStore(raw:unknown):PortfolioStore{
 if(!raw||typeof raw!=='object')throw new Error('Arquivo de dados inválido')
 const obj=raw as Partial<PortfolioStore>
 if(!Array.isArray(obj.projects)||!Array.isArray(obj.categories))throw new Error('Formato inválido')
 const categories:Category[]=obj.categories.map((c:Category|string)=>{
  if(typeof c==='string'){const known=starterCategories.find(k=>k.label===c);return known??{id:c.toLowerCase().replace(/[^a-z0-9]+/g,'-'),label:c,icon:'grid'}}
  if(!c||typeof c!=='object'||typeof c.label!=='string')throw new Error('Categoria inválida')
  return c
 })
 for(const p of obj.projects)if(typeof p.id!=='string'||typeof p.title!=='string'||!Array.isArray(p.blocks))throw new Error('Projeto inválido')
 const projects=obj.projects.map(p=>({...p,image:migrateLegacyImage(p.image),blocks:p.blocks.map(b=>({...b,content:b.type==='image'?migrateLegacyImage(b.content):b.content,media:b.media?migrateLegacyImage(b.media):b.media,after:b.after?migrateLegacyImage(b.after):b.after,gallery:b.gallery?.map(migrateLegacyImage)})),processSteps:Array.isArray(p.processSteps)?p.processSteps:[]}))
 const home={...defaultHome,...(obj.home??{})}
 const testimonials=Array.isArray(obj.testimonials)?obj.testimonials.filter(t=>typeof t.id==='string'&&typeof t.quote==='string'):[...defaultTestimonials]
 const musicTracks=Array.isArray(obj.musicTracks)?obj.musicTracks.filter(t=>typeof t.id==='string'&&typeof t.src==='string'):[...defaultMusicTracks]
 const socialLinks=Array.isArray(obj.socialLinks)?obj.socialLinks.filter(s=>typeof s.id==='string'&&typeof s.label==='string'&&typeof s.url==='string'&&typeof s.icon==='string'):defaultSocialLinks
 return {projects,categories,home,testimonials,musicTracks,socialLinks,showLikeCounts:typeof obj.showLikeCounts==='boolean'?obj.showLikeCounts:false}
}
function load():PortfolioStore{
 try{const value=localStorage.getItem(KEY);if(value)return parseStore(JSON.parse(value) as unknown)}catch{/* keep defaults */}
 return {projects:initialProjects,categories:starterCategories,home:defaultHome,testimonials:defaultTestimonials,musicTracks:defaultMusicTracks,socialLinks:defaultSocialLinks,showLikeCounts:false}
}
function refsFor(store:PortfolioStore):string[]{
 const refs=new Set(mediaRefs(store.projects,store.categories))
 if(isLocalMedia(store.home.avatar))refs.add(store.home.avatar)
 if(isLocalMedia(store.home.background))refs.add(store.home.background)
 for(const t of store.musicTracks){if(isLocalMedia(t.src))refs.add(t.src);if(t.cover&&isLocalMedia(t.cover))refs.add(t.cover)}
 for(const s of store.socialLinks)if(s.iconImage&&isLocalMedia(s.iconImage))refs.add(s.iconImage)
 return [...refs]
}
export function usePortfolio(){
 const [store,setStore]=useState<PortfolioStore>(load)
 const [saveError,setSaveError]=useState('')
 const save=useCallback((next:PortfolioStore)=>{setStore(next);try{localStorage.setItem(KEY,JSON.stringify(next));setSaveError('')}catch{setSaveError('Sem espaço para salvar dados locais; exporte um backup.')}},[])
 const update=(project:Project)=>save({...store,projects:store.projects.some(p=>p.id===project.id)?store.projects.map(p=>p.id===project.id?project:p):[project,...store.projects]})
 const remove=(id:string)=>save({...store,projects:store.projects.filter(p=>p.id!==id)})
 const setCategories=(categories:Category[])=>save({...store,categories})
 const setHome=(home:HomeContent)=>save({...store,home})
 const setTestimonials=(testimonials:Testimonial[])=>save({...store,testimonials})
 const setMusicTracks=(musicTracks:MusicTrack[])=>save({...store,musicTracks})
 const setSocialLinks=(socialLinks:SocialLink[])=>save({...store,socialLinks})
 const setShowLikeCounts=(showLikeCounts:boolean)=>save({...store,showLikeCounts})
 const exportData=async()=>{
  const zip=new JSZip()
  zip.file('portfolio.json',JSON.stringify(store,null,2))
  zip.file('LEIA-ME.txt','Backup do Studio: projetos, depoimentos, configuracoes da Home, trilhas e biblioteca de midias sem duplicacao. Importar restaura neste navegador; nao publica no GitHub.')
  const catalog=await listMediaAssets()
  zip.file('media-library.json',JSON.stringify(catalog,null,2))
  const allRefs=new Set([...refsFor(store),...catalog.filter(a=>isLocalMedia(a.ref)).map(a=>a.ref)])
  for(const ref of allRefs){
   const blob=await readMedia(ref)
   if(blob)zip.file('public/assets/'+mediaKey(ref),blob)
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
  if(!manifest)throw new Error('portfolio.json não encontrado.')
  const parsed=parseStore(JSON.parse(await manifest.async('string')) as unknown)
  const catalogFile=zip.file('media-library.json')
  const catalog:LibraryAsset[]=catalogFile?JSON.parse(await catalogFile.async('string')) as LibraryAsset[]:[]
  const allRefs=new Set([...refsFor(parsed),...catalog.filter(a=>isLocalMedia(a.ref)).map(a=>a.ref)])
  for(const ref of allRefs){
   const item=zip.file('public/assets/'+mediaKey(ref))??zip.file('public/images/'+mediaKey(ref))
   if(item)await saveMediaBlob(ref,await item.async('blob'))
  }
  if(Array.isArray(catalog)&&catalog.length)await saveCatalogItems(catalog)
  save(parsed)
 }
 return {...store,saveError,update,remove,setCategories,setHome,setTestimonials,setMusicTracks,setSocialLinks,setShowLikeCounts,exportData,importData}
}
