import { useCallback,useState } from 'react'
import { DEFAULT_THEME,normalizeThemePalette,type ThemePalette } from '../lib/theme-palette'
import { isKnownDemoTestimonial } from '../lib/testimonial-safety'
import { normalizeFraming } from '../lib/image-framing'
import type {ResponsiveImageMap} from '../lib/image-variants'
import {normalizeCustomPages,type CustomPage} from '../data/custom-pages'
import publishedPackage from '../data/published-portfolio.json'
import { initialProjects, starterCategories, type Project, type Category } from '../data/projects'
import { normalizeBundledImage } from '../lib/default-assets'
import {defaultHome,defaultMusicTracks,defaultTestimonials,type HomeContent,type Testimonial,type MusicTrack,type SocialLink,defaultSocialLinks,type AboutContent,defaultAbout,type ContactSettings,defaultContact,defaultGalleryBackground,normalizeContactTags} from '../data/studio'
import { mediaKey,mediaRefs,readMedia,saveMediaBlob,isLocalMedia,listMediaAssets,saveCatalogItems,type LibraryAsset } from '../lib/media-store'
const KEY='jordan-portfolio-local-v2'
const PENDING_KEY='jordan-portfolio-publish-pending-v1'
const bundled=publishedPackage as {schema:number;revision:string;store:unknown}
export const currentPublishedRevision=bundled.revision||'initial'
export interface PortfolioStore {customPages:CustomPage[];imageVariants:ResponsiveImageMap;themePalette:ThemePalette;siteFavicon:string;seoTitle:string;seoDescription:string;projects:Project[];categories:Category[];home:HomeContent;testimonials:Testimonial[];musicTracks:MusicTrack[];socialLinks:SocialLink[];showLikeCounts:boolean;about:AboutContent;contact:ContactSettings;galleryBackground:string;siteLogo:string;siteLogoHover:string;siteLogoSize:number;siteLogoHoverScale:number}
export function clampBrandScale(value:unknown,fallback:number,min:number,max:number):number{
 const number=typeof value==='number'?value:Number(value)
 return Number.isFinite(number)?Math.max(min,Math.min(max,Math.round(number))):fallback
}
function englishCategory(label:string):string{
 return label.toLowerCase()==='enviroment'?'Environments':label
}
function parseStore(raw:unknown):PortfolioStore{
 if(!raw||typeof raw!=='object')throw new Error('Arquivo de dados inválido')
 const obj=raw as Partial<PortfolioStore>
 const customPages=normalizeCustomPages(obj.customPages)
 const imageVariants:ResponsiveImageMap=obj.imageVariants&&typeof obj.imageVariants==='object'&&!Array.isArray(obj.imageVariants)?obj.imageVariants:{}
 if(!Array.isArray(obj.projects)||!Array.isArray(obj.categories))throw new Error('Formato inválido')
 const categories:Category[]=obj.categories.map((c:Category|string)=>{
  if(typeof c==='string'){const known=starterCategories.find(k=>k.label===c);return known??{id:c.toLowerCase().replace(/[^a-z0-9]+/g,'-'),label:englishCategory(c),icon:'grid'}}
  if(!c||typeof c!=='object'||typeof c.label!=='string')throw new Error('Categoria inválida')
  return {...c,label:englishCategory(c.label)}
 })
 for(const p of obj.projects)if(typeof p.id!=='string'||typeof p.title!=='string'||!Array.isArray(p.blocks))throw new Error('Projeto inválido')
 const projects=obj.projects.map(p=>({...p,category:englishCategory(p.category),image:normalizeBundledImage(p.image),coverFocus:normalizeFraming(p.coverFocus),heroFocus:normalizeFraming(p.heroFocus),blocks:p.blocks.map(b=>({...b,content:b.type==='image'?normalizeBundledImage(b.content):b.content,media:b.media?normalizeBundledImage(b.media):b.media,after:b.after?normalizeBundledImage(b.after):b.after,gallery:b.gallery?.map(normalizeBundledImage),galleryEntries:b.galleryEntries?.map(item=>({...item,image:normalizeBundledImage(item.image)})),slides:b.slides?.map(item=>({...item,image:normalizeBundledImage(item.image)}))})),processSteps:Array.isArray(p.processSteps)?p.processSteps.map(step=>({...step,image:normalizeBundledImage(step.image)})):[]}))
 const home={...defaultHome,...(obj.home??{}),avatar:normalizeBundledImage(obj.home?.avatar??defaultHome.avatar),background:normalizeBundledImage(obj.home?.background??defaultHome.background)}
 const galleryBackground=normalizeBundledImage(obj.galleryBackground??obj.home?.background??defaultGalleryBackground)
 const themePalette=normalizeThemePalette(obj.themePalette)
 const siteLogo=typeof obj.siteLogo==='string'?normalizeBundledImage(obj.siteLogo):''
 const siteFavicon=typeof obj.siteFavicon==='string'?normalizeBundledImage(obj.siteFavicon):''
 const seoTitle=typeof obj.seoTitle==='string'&&obj.seoTitle.trim()?obj.seoTitle:'Jordan Ferrary — Creative Portfolio'
 const seoDescription=typeof obj.seoDescription==='string'&&obj.seoDescription.trim()?obj.seoDescription:'Jordan Ferrary — 3D artist, illustrator and motion designer. Discover characters, environments and creative projects.'
 const siteLogoHover=typeof obj.siteLogoHover==='string'?normalizeBundledImage(obj.siteLogoHover):''
 const siteLogoSize=clampBrandScale(obj.siteLogoSize,100,65,180)
 const siteLogoHoverScale=clampBrandScale(obj.siteLogoHoverScale,110,100,170)
 const legacyBio=obj.about?.bio
 const about={...defaultAbout,...(obj.about??{}),bio:legacyBio&&/Lorem ipsum|Curabitur vehicula|Praesent et finibus/i.test(legacyBio)?defaultAbout.bio:legacyBio??defaultAbout.bio,portrait:normalizeBundledImage(obj.about?.portrait??defaultAbout.portrait),secondaryImage:normalizeBundledImage(obj.about?.secondaryImage??defaultAbout.secondaryImage)}
 const contact:ContactSettings={
  titleFirst:typeof obj.contact?.titleFirst==='string'?obj.contact.titleFirst:defaultContact.titleFirst,
  titleAccent:typeof obj.contact?.titleAccent==='string'?obj.contact.titleAccent:defaultContact.titleAccent,
  introduction:(obj.contact?.introduction?.startsWith('Conte sua ideia')||obj.contact?.introduction==='Share your idea, creative goals, and what you need from a 3D artist. Let’s explore how we can bring your project to life.')
   ?defaultContact.introduction:typeof obj.contact?.introduction==='string'?obj.contact.introduction:defaultContact.introduction,
  greeting:(obj.contact?.greeting?.startsWith('Olá!')||obj.contact?.greeting==='Tell me about your project and share any references you have in mind.')
   ?defaultContact.greeting:typeof obj.contact?.greeting==='string'?obj.contact.greeting:defaultContact.greeting,
  footerTags:normalizeContactTags(obj.contact?.footerTags)
 }
 const testimonials=Array.isArray(obj.testimonials)?obj.testimonials.filter(t=>typeof t.id==='string'&&typeof t.quote==='string'&&!isKnownDemoTestimonial(t)):[...defaultTestimonials]
 const musicTracks=Array.isArray(obj.musicTracks)?obj.musicTracks.filter(t=>typeof t.id==='string'&&typeof t.src==='string').map(t=>({...t,cover:t.cover?normalizeBundledImage(t.cover):t.cover})):[...defaultMusicTracks]
 const socialLinks=Array.isArray(obj.socialLinks)?obj.socialLinks.filter(s=>typeof s.id==='string'&&typeof s.label==='string'&&typeof s.url==='string'&&typeof s.icon==='string'):defaultSocialLinks
 return {customPages,imageVariants,themePalette,projects,categories,home,testimonials,musicTracks,socialLinks,showLikeCounts:typeof obj.showLikeCounts==='boolean'?obj.showLikeCounts:false,about,contact,galleryBackground,siteLogo,siteLogoHover,siteLogoSize,siteLogoHoverScale,siteFavicon,seoTitle,seoDescription}
}
function publishedStore():PortfolioStore{
 if(bundled.schema===1&&bundled.store){
  try{return parseStore(bundled.store)}catch{/* preserve original defaults when a malformed content file is committed */}
 }
 return {customPages:[],imageVariants:{},themePalette:{...DEFAULT_THEME},projects:initialProjects,categories:starterCategories,home:defaultHome,testimonials:defaultTestimonials,musicTracks:defaultMusicTracks,socialLinks:defaultSocialLinks,showLikeCounts:false,about:defaultAbout,contact:defaultContact,galleryBackground:defaultGalleryBackground,siteLogo:'',siteLogoHover:'',siteLogoSize:100,siteLogoHoverScale:110,siteFavicon:'',seoTitle:'Jordan Ferrary — Creative Portfolio',seoDescription:'Jordan Ferrary — 3D artist, illustrator and motion designer. Discover characters, environments and creative projects.'}
}
function load():PortfolioStore{
 try{
  const snapshot=localStorage.getItem(KEY)
  const pending=JSON.parse(localStorage.getItem(PENDING_KEY)??'null') as {revision?:string;snapshot?:string|null}|null
  // Once the new deployment includes our own commit, release the old browser draft.
  // Never discard changes made after the publish button was pressed.
  if(pending?.revision===currentPublishedRevision&&pending.snapshot===snapshot){
   localStorage.removeItem(KEY)
   localStorage.removeItem(PENDING_KEY)
  }
  const value=localStorage.getItem(KEY)
  if(value)return parseStore(JSON.parse(value) as unknown)
 }catch{/* keep published or stock defaults */}
 return publishedStore()
}
function refsFor(store:PortfolioStore):string[]{
 const refs=new Set(mediaRefs(store.projects,store.categories))
 for(const project of store.projects)for(const block of project.blocks){
  for(const item of block.galleryEntries??[])if(isLocalMedia(item.image))refs.add(item.image)
  for(const slide of block.slides??[])if(isLocalMedia(slide.image))refs.add(slide.image)
 }

 for(const page of store.customPages){
  if(isLocalMedia(page.heroImage))refs.add(page.heroImage)
  for(const block of page.blocks){
   if(block.type==='image'&&isLocalMedia(block.content))refs.add(block.content)
   if(block.media&&isLocalMedia(block.media))refs.add(block.media)
   if(block.after&&isLocalMedia(block.after))refs.add(block.after)
   for(const src of block.gallery??[])if(isLocalMedia(src))refs.add(src)
   for(const slide of block.slideItems??[])if(isLocalMedia(slide.image))refs.add(slide.image)
  }
 }
 if(isLocalMedia(store.home.avatar))refs.add(store.home.avatar)
 if(isLocalMedia(store.home.background))refs.add(store.home.background)
 if(isLocalMedia(store.galleryBackground))refs.add(store.galleryBackground)
 if(isLocalMedia(store.siteLogo))refs.add(store.siteLogo)
 if(isLocalMedia(store.siteLogoHover))refs.add(store.siteLogoHover)
 if(isLocalMedia(store.siteFavicon))refs.add(store.siteFavicon)
 if(isLocalMedia(store.about.portrait))refs.add(store.about.portrait)
 if(isLocalMedia(store.about.secondaryImage))refs.add(store.about.secondaryImage)
 for(const t of store.musicTracks){if(isLocalMedia(t.src))refs.add(t.src);if(t.cover&&isLocalMedia(t.cover))refs.add(t.cover)}
 for(const s of store.socialLinks)if(s.iconImage&&isLocalMedia(s.iconImage))refs.add(s.iconImage)
 return [...refs]
}
export function usePortfolio(editing=false){
 const [store,setStore]=useState<PortfolioStore>(load)
 // Public visitors always see the deployed GitHub content, even if this browser
 // previously used Local Studio. Local drafts only become visible while editing.
 const [deployedStore]=useState<PortfolioStore>(publishedStore)
 const [saveError,setSaveError]=useState('')
 const save=useCallback((next:PortfolioStore)=>{setStore(next);try{localStorage.setItem(KEY,JSON.stringify(next));setSaveError('')}catch{setSaveError('Sem espaço para salvar dados locais; exporte um backup.')}},[])
 const update=(project:Project)=>save({...store,projects:store.projects.some(p=>p.id===project.id)?store.projects.map(p=>p.id===project.id?project:p):[project,...store.projects]})
 const remove=(id:string)=>save({...store,projects:store.projects.filter(p=>p.id!==id)})
 const reorderProjects=(sourceId:string,targetId:string,after=false)=>{
  if(sourceId===targetId)return
  const list=[...store.projects]
  const source=list.findIndex(p=>p.id===sourceId)
  if(source<0)return
  const [item]=list.splice(source,1)
  const target=list.findIndex(p=>p.id===targetId)
  if(target<0)return
  list.splice(target+(after?1:0),0,item)
  save({...store,projects:list})
 }
 const setCategories=(categories:Category[])=>save({...store,categories})
 const setCustomPages=(customPages:CustomPage[])=>save({...store,customPages:normalizeCustomPages(customPages)})
 const setHome=(home:HomeContent)=>save({...store,home})
 const markPublished=(revision:string)=>{
  // Credential-free marker only. Never write the GitHub token to localStorage.
  try{localStorage.setItem(PENDING_KEY,JSON.stringify({revision,snapshot:localStorage.getItem(KEY)}))}catch{/* publication itself already succeeded */}
 }
 const restorePublished=()=>{
  localStorage.removeItem(KEY)
  localStorage.removeItem(PENDING_KEY)
  setStore(publishedStore())
  setSaveError('')
 }
 const setGalleryBackground=(galleryBackground:string)=>save({...store,galleryBackground})
 const setBranding=(values:Pick<PortfolioStore,'siteLogo'|'siteLogoHover'|'siteLogoSize'|'siteLogoHoverScale'>)=>save({...store,...values,siteLogoSize:clampBrandScale(values.siteLogoSize,100,65,180),siteLogoHoverScale:clampBrandScale(values.siteLogoHoverScale,110,100,170)})
 const setSiteIdentity=(values:Pick<PortfolioStore,'siteFavicon'|'seoTitle'|'seoDescription'>)=>save({...store,...values,seoTitle:values.seoTitle.trim().slice(0,110),seoDescription:values.seoDescription.trim().slice(0,240)})
 const setThemePalette=(themePalette:ThemePalette)=>save({...store,themePalette:normalizeThemePalette(themePalette)})
 const setAbout=(about:AboutContent)=>save({...store,about})
 const setContactPage=(contact:ContactSettings,socialLinks:SocialLink[])=>save({...store,contact,socialLinks})
 const setTestimonials=(testimonials:Testimonial[])=>save({...store,testimonials})
 const setMusicTracks=(musicTracks:MusicTrack[])=>save({...store,musicTracks})
 const setSocialLinks=(socialLinks:SocialLink[])=>save({...store,socialLinks})
 const setShowLikeCounts=(showLikeCounts:boolean)=>save({...store,showLikeCounts})
 const exportData=async()=>{
  const {default:JSZip}=await import('jszip')
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
  const {default:JSZip}=await import('jszip')
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
 return {...(editing?store:deployedStore),saveError,update,remove,reorderProjects,setCategories,setCustomPages,setHome,setGalleryBackground,setBranding,setSiteIdentity,setThemePalette,setAbout,setContactPage,setTestimonials,setMusicTracks,setSocialLinks,setShowLikeCounts,markPublished,restorePublished,exportData,importData}
}
