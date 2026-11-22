import { useCallback,useRef,useState } from 'react'
import {normalizeDesignTheme,type DesignTheme} from '../lib/design-themes'
import {createCheckpoint,restoreCheckpoint} from '../lib/studio-checkpoints'
import {auditStudio} from '../lib/studio-health'
import {normalizeStudioControls,type StudioControls} from '../lib/studio-controls'
import {normalizeTypography,type TypographySettings} from '../lib/typography'
import { DEFAULT_THEME,normalizeThemePalette,type ThemePalette } from '../lib/theme-palette'
import {DEFAULT_GLITCH_PALETTE,normalizeGlitchPalette,type GlitchPalette} from '../lib/glitch-palette'
import {DEFAULT_HEADING_SYMBOL,normalizeHeadingSymbol,type HeadingSymbolStyle} from '../lib/heading-symbol'
import { isKnownDemoTestimonial } from '../lib/testimonial-safety'
import { DEFAULT_FRAMING,DEFAULT_GALLERY_BANNER_FRAMING,normalizeFraming,type ImageFraming } from '../lib/image-framing'
import {applyFeaturedSelection} from '../lib/featured-projects'
import type {ResponsiveImageMap} from '../lib/image-variants'
import {normalizeNativeLayouts,type NativeLayouts} from '../lib/component-settings'
import {refreshLinkedBlocks} from '../lib/page-composition'
import {normalizeCustomPages,type CustomPage} from '../data/custom-pages'
import publishedPackage from '../data/published-portfolio.json'
import { initialProjects, starterCategories, upgradeProcessTemplate, type Project, type Category } from '../data/projects'
import { normalizeBundledImage } from '../lib/default-assets'
import {defaultHome,defaultMusicTracks,defaultTestimonials,type HomeContent,type Testimonial,type MusicTrack,type SocialLink,defaultSocialLinks,type AboutContent,defaultAbout,type ContactSettings,defaultContact,defaultGalleryBackground,normalizeContactTags,defaultGalleryContent,normalizeGalleryContent,type GalleryContent} from '../data/studio'
import { mediaKey,mediaRefs,readMedia,saveMediaBlob,isLocalMedia,listMediaAssets,saveCatalogItems,type LibraryAsset } from '../lib/media-store'
const KEY='jordan-portfolio-local-v2'
const PENDING_KEY='jordan-portfolio-publish-pending-v1'
const bundled=publishedPackage as {schema:number;revision:string;store:unknown}
export const currentPublishedRevision=bundled.revision||'initial'
export interface PortfolioStore {customPages:CustomPage[];imageVariants:ResponsiveImageMap;themePalette:ThemePalette;typography?:TypographySettings;studioControls?:StudioControls;nativeLayouts?:NativeLayouts;glitchPalette:GlitchPalette;headingSymbol:HeadingSymbolStyle;siteFavicon:string;seoTitle:string;seoDescription:string;projects:Project[];categories:Category[];home:HomeContent;testimonials:Testimonial[];musicTracks:MusicTrack[];socialLinks:SocialLink[];showLikeCounts:boolean;about:AboutContent;contact:ContactSettings;galleryBackground:string;galleryFocus:ImageFraming;galleryContent:GalleryContent;siteLogo:string;siteLogoHover:string;siteLogoSize:number;siteLogoHoverScale:number}
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
 const projects=obj.projects.map(p=>({...p,category:englishCategory(p.category),image:normalizeBundledImage(p.image),featuredOrder:Number.isInteger(p.featuredOrder)&&p.featuredOrder!>=0&&p.featuredOrder!<3?p.featuredOrder:undefined,coverFocus:normalizeFraming(p.coverFocus),homeFocus:normalizeFraming(p.homeFocus??p.coverFocus),heroFocus:normalizeFraming(p.heroFocus),blocks:p.blocks.map(b=>({...b,content:b.type==='image'?normalizeBundledImage(b.content):b.content,media:b.media?normalizeBundledImage(b.media):b.media,after:b.after?normalizeBundledImage(b.after):b.after,gallery:b.gallery?.map(normalizeBundledImage),galleryEntries:b.galleryEntries?.map(item=>({...item,image:normalizeBundledImage(item.image)})),slides:b.slides?.map(item=>({...item,image:normalizeBundledImage(item.image)}))})),processSteps:Array.isArray(p.processSteps)?p.processSteps.map(step=>({...step,image:normalizeBundledImage(step.image)})):[]}))
 const home={...defaultHome,...(obj.home??{}),avatar:normalizeBundledImage(obj.home?.avatar??defaultHome.avatar),background:normalizeBundledImage(obj.home?.background??defaultHome.background),backgroundFocus:normalizeFraming(obj.home?.backgroundFocus??DEFAULT_FRAMING)}
 const galleryBackground=normalizeBundledImage(obj.galleryBackground??obj.home?.background??defaultGalleryBackground)
 const galleryFocus=normalizeFraming(obj.galleryFocus??DEFAULT_GALLERY_BANNER_FRAMING)
 const galleryContent=normalizeGalleryContent(obj.galleryContent)
 const themePalette=normalizeThemePalette(obj.themePalette)
 const typography=normalizeTypography(obj.typography)
 const studioControls=normalizeStudioControls(obj.studioControls)
 const nativeLayouts=normalizeNativeLayouts(obj.nativeLayouts)
 const glitchPalette=normalizeGlitchPalette(obj.glitchPalette)
 const headingSymbol=normalizeHeadingSymbol(obj.headingSymbol)
 const siteLogo=typeof obj.siteLogo==='string'?normalizeBundledImage(obj.siteLogo):''
 const siteFavicon=typeof obj.siteFavicon==='string'?normalizeBundledImage(obj.siteFavicon):''
 const seoTitle=typeof obj.seoTitle==='string'&&obj.seoTitle.trim()?obj.seoTitle.replace(/^Jordan Ferrary — Creative Portfolio$/,'Jordan Ferrary | 3D Artist'):'Jordan Ferrary | 3D Artist'
 const seoDescription=typeof obj.seoDescription==='string'&&obj.seoDescription.trim()?obj.seoDescription.replace(/^Jordan Ferrary — 3D artist/,'Jordan Ferrary is a 3D artist'):'Jordan Ferrary is a 3D artist, illustrator and motion designer. Discover characters, environments and creative projects.'
 const siteLogoHover=typeof obj.siteLogoHover==='string'?normalizeBundledImage(obj.siteLogoHover):''
 const siteLogoSize=clampBrandScale(obj.siteLogoSize,100,65,180)
 const siteLogoHoverScale=clampBrandScale(obj.siteLogoHoverScale,110,100,170)
 const legacyBio=obj.about?.bio
 const about={...defaultAbout,...(obj.about??{}),bio:legacyBio&&/Lorem ipsum|Curabitur vehicula|Praesent et finibus/i.test(legacyBio)?defaultAbout.bio:legacyBio??defaultAbout.bio,portrait:normalizeBundledImage(obj.about?.portrait??defaultAbout.portrait),secondaryImage:normalizeBundledImage(obj.about?.secondaryImage??defaultAbout.secondaryImage)}
 const contact:ContactSettings={
  titleFirst:typeof obj.contact?.titleFirst==='string'?obj.contact.titleFirst:defaultContact.titleFirst,
  titleAccent:typeof obj.contact?.titleAccent==='string'?obj.contact.titleAccent:defaultContact.titleAccent,
  introduction:(obj.contact?.introduction?.startsWith('Conte sua ideia')||obj.contact?.introduction==='For collaborations, commissions, or questions about my work, reach out through my social profiles. Let’s start a conversation.'||obj.contact?.introduction==='Share your idea, creative goals, and what you need from a 3D artist. Let’s explore how we can bring your project to life.')
   ?defaultContact.introduction:typeof obj.contact?.introduction==='string'?obj.contact.introduction:defaultContact.introduction,
  greeting:(obj.contact?.greeting?.startsWith('Olá!')||obj.contact?.greeting==='Choose a platform below to explore my work or get in touch.'||obj.contact?.greeting==='Tell me about your project and share any references you have in mind.')
   ?defaultContact.greeting:typeof obj.contact?.greeting==='string'?obj.contact.greeting:defaultContact.greeting,
  footerTags:normalizeContactTags(obj.contact?.footerTags)
 }
 const testimonials=Array.isArray(obj.testimonials)?obj.testimonials.filter(t=>typeof t.id==='string'&&typeof t.quote==='string'&&!isKnownDemoTestimonial(t)):[...defaultTestimonials]
 const musicTracks=Array.isArray(obj.musicTracks)?obj.musicTracks.filter(t=>typeof t.id==='string'&&typeof t.src==='string').map(t=>({...t,cover:t.cover?normalizeBundledImage(t.cover):t.cover})):[...defaultMusicTracks]
 const socialLinks=Array.isArray(obj.socialLinks)?obj.socialLinks.filter(s=>typeof s.id==='string'&&typeof s.label==='string'&&typeof s.url==='string'&&typeof s.icon==='string'):defaultSocialLinks
 return {customPages,imageVariants,themePalette,typography,studioControls,nativeLayouts,glitchPalette,headingSymbol,projects:projects.map(upgradeProcessTemplate),categories,home,testimonials,musicTracks,socialLinks,showLikeCounts:typeof obj.showLikeCounts==='boolean'?obj.showLikeCounts:false,about,contact,galleryBackground,galleryFocus,galleryContent,siteLogo,siteLogoHover,siteLogoSize,siteLogoHoverScale,siteFavicon,seoTitle,seoDescription}
}
function publishedStore():PortfolioStore{
 if(bundled.schema===1&&bundled.store){
  try{return parseStore(bundled.store)}catch{/* preserve original defaults when a malformed content file is committed */}
 }
 return {customPages:[],imageVariants:{},themePalette:{...DEFAULT_THEME},glitchPalette:{...DEFAULT_GLITCH_PALETTE},headingSymbol:DEFAULT_HEADING_SYMBOL,projects:initialProjects,categories:starterCategories,home:defaultHome,testimonials:defaultTestimonials,musicTracks:defaultMusicTracks,socialLinks:defaultSocialLinks,showLikeCounts:false,about:defaultAbout,contact:defaultContact,galleryBackground:defaultGalleryBackground,galleryFocus:{...DEFAULT_GALLERY_BANNER_FRAMING},galleryContent:{...defaultGalleryContent},siteLogo:'',siteLogoHover:'',siteLogoSize:100,siteLogoHoverScale:110,siteFavicon:'',seoTitle:'Jordan Ferrary | 3D Artist',seoDescription:'Jordan Ferrary is a 3D artist, illustrator and motion designer. Discover characters, environments and creative projects.'}
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
export function refsFor(store:PortfolioStore):string[]{
 const refs=new Set(mediaRefs(store.projects,store.categories))
 for(const project of store.projects)for(const block of project.blocks){
  if(block.modelPresentation?.backdrop?.image&&isLocalMedia(block.modelPresentation.backdrop.image))refs.add(block.modelPresentation.backdrop.image)
  for(const item of block.galleryEntries??[])if(isLocalMedia(item.image))refs.add(item.image)
  for(const slide of block.slides??[])if(isLocalMedia(slide.image))refs.add(slide.image)
 }

 for(const page of store.customPages){
  if(isLocalMedia(page.heroImage))refs.add(page.heroImage)
  for(const block of page.blocks){
   if((block.type==='image'||block.type==='model')&&isLocalMedia(block.content))refs.add(block.content)
   if(block.modelPresentation?.backdrop?.image&&isLocalMedia(block.modelPresentation.backdrop.image))refs.add(block.modelPresentation.backdrop.image)
   if(block.media&&isLocalMedia(block.media))refs.add(block.media)
   if(block.after&&isLocalMedia(block.after))refs.add(block.after)
   for(const src of block.gallery??[])if(isLocalMedia(src))refs.add(src)
   for(const slide of block.slideItems??[])if(isLocalMedia(slide.image))refs.add(slide.image)
   for(const item of block.showcaseItems??[])if(isLocalMedia(item.image))refs.add(item.image)
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
 const storeRef=useRef(store)
 const [saveError,setSaveError]=useState('')
 type HistoryEntry={store:PortfolioStore;time:number;label:string}
 const history=useRef<{past:HistoryEntry[];future:HistoryEntry[]}>({past:[],future:[]})
 const persist=useCallback((next:PortfolioStore)=>{storeRef.current=next;setStore(next);try{localStorage.setItem(KEY,JSON.stringify(next));setSaveError('')}catch{setSaveError('Sem espaço para salvar dados locais; exporte um backup.')}},[])
 const save=useCallback((next:PortfolioStore)=>{
  const previous=storeRef.current
  const keys=(Object.keys(next) as (keyof PortfolioStore)[]).filter(key=>previous[key]!==next[key]&&JSON.stringify(previous[key])!==JSON.stringify(next[key]))
  if(!keys.length)return
  history.current.past=[...history.current.past,{store:previous,time:Date.now(),label:keys.join(', ')}].slice(-30)
  history.current.future=[]
  persist(next)
 },[persist])
 const undo=()=>{
  const entry=history.current.past.pop()
  if(!entry)return
  history.current.future.push({...entry,store:storeRef.current})
  persist(entry.store)
 }
 const redo=()=>{
  const entry=history.current.future.pop()
  if(!entry)return
  history.current.past.push({...entry,store:storeRef.current})
  persist(entry.store)
 }
 const runAudit=()=>auditStudio(storeRef.current,refsFor(storeRef.current))
 const historyInfo=()=>({past:history.current.past.map(({time,label})=>({time,label})),future:history.current.future.map(({time,label})=>({time,label}))})
 const update=(project:Project)=>save({...storeRef.current,projects:storeRef.current.projects.some(p=>p.id===project.id)?storeRef.current.projects.map(p=>p.id===project.id?project:p):[project,...storeRef.current.projects]})
 const remove=(id:string)=>save({...storeRef.current,projects:storeRef.current.projects.filter(p=>p.id!==id)})
 const setFeaturedProjects=(ids:string[])=>save({...storeRef.current,projects:applyFeaturedSelection(storeRef.current.projects,ids)})
 const reorderProjects=(sourceId:string,targetId:string,after=false)=>{
  if(sourceId===targetId)return
  const list=[...storeRef.current.projects]
  const source=list.findIndex(p=>p.id===sourceId)
  if(source<0)return
  const [item]=list.splice(source,1)
  const target=list.findIndex(p=>p.id===targetId)
  if(target<0)return
  list.splice(target+(after?1:0),0,item)
  save({...storeRef.current,projects:list})
 }
 const setCategories=(categories:Category[])=>save({...storeRef.current,categories})
 const setCustomPages=(customPages:CustomPage[])=>save({...storeRef.current,customPages:refreshLinkedBlocks(normalizeCustomPages(customPages))})
 const setNativeLayouts=(nativeLayouts:NativeLayouts)=>save({...storeRef.current,nativeLayouts:normalizeNativeLayouts(nativeLayouts)})
 const setHome=(home:HomeContent)=>save({...storeRef.current,home})
 const markPublished=(revision:string,snapshot:string|null)=>{
  // Credential-free marker only. Never write the GitHub token to localStorage.
  try{localStorage.setItem(PENDING_KEY,JSON.stringify({revision,snapshot}))}catch{/* publication itself already succeeded */}
  // A successful authenticated publication is a meaningful familiar milestone.
  // Only the non-sensitive revision id is exposed to the local companion.
  window.dispatchEvent(new CustomEvent('alquimago:activity',{detail:{type:'published',revision}}))
 }
 const makeCheckpoint=(label='Checkpoint manual')=>createCheckpoint(storeRef.current,refsFor(storeRef.current),label)
 const recoverCheckpoint=async(id:string)=>{
  const previous=storeRef.current
  await makeCheckpoint('Antes de restaurar checkpoint')
  if(storeRef.current!==previous)throw new Error('O rascunho mudou durante a operação. Tente novamente.')
  const restored=await restoreCheckpoint(id)
  if(storeRef.current!==previous)throw new Error('O rascunho mudou durante a recuperação. Tente novamente.')
  save(parseStore(restored))
 }
 const restorePublished=async()=>{
  const previous=storeRef.current
  await makeCheckpoint('Antes de restaurar versão publicada')
  if(storeRef.current!==previous)throw new Error('O rascunho mudou durante a operação. Tente novamente.')
  localStorage.removeItem(KEY)
  localStorage.removeItem(PENDING_KEY)
  history.current={past:[],future:[]}
  const restored=publishedStore();storeRef.current=restored;setStore(restored)
  setSaveError('')
 }
 const setGalleryBackground=(galleryBackground:string)=>save({...storeRef.current,galleryBackground})
 const setGalleryPage=(galleryBackground:string,galleryContent:GalleryContent,galleryFocus:ImageFraming)=>save({...storeRef.current,galleryBackground,galleryFocus:normalizeFraming(galleryFocus),galleryContent:normalizeGalleryContent(galleryContent)})
 const setBranding=(values:Pick<PortfolioStore,'siteLogo'|'siteLogoHover'|'siteLogoSize'|'siteLogoHoverScale'>)=>save({...storeRef.current,...values,siteLogoSize:clampBrandScale(values.siteLogoSize,100,65,180),siteLogoHoverScale:clampBrandScale(values.siteLogoHoverScale,110,100,170)})
 const setSiteIdentity=(values:Pick<PortfolioStore,'siteFavicon'|'seoTitle'|'seoDescription'>)=>save({...storeRef.current,...values,seoTitle:values.seoTitle.trim().slice(0,110),seoDescription:values.seoDescription.trim().slice(0,240)})
 const setThemePalette=(themePalette:ThemePalette,headingSymbol:HeadingSymbolStyle=storeRef.current.headingSymbol,typography?:TypographySettings)=>save({...storeRef.current,themePalette:normalizeThemePalette(themePalette),headingSymbol:normalizeHeadingSymbol(headingSymbol),typography:normalizeTypography(typography??storeRef.current.typography)})
 const applyDesignTheme=(input:DesignTheme)=>{
  const theme=normalizeDesignTheme(input),current=storeRef.current
  save({...current,themePalette:theme.palette,typography:theme.typography,glitchPalette:theme.glitch,headingSymbol:theme.symbol,studioControls:normalizeStudioControls({...normalizeStudioControls(current.studioControls),...theme.design})})
 }
 const setStudioControls=(studioControls:StudioControls)=>save({...storeRef.current,studioControls:normalizeStudioControls(studioControls)})
 const setTypography=(typography:TypographySettings)=>save({...storeRef.current,typography:normalizeTypography(typography)})
 const setGlitchPalette=(glitchPalette:GlitchPalette)=>save({...storeRef.current,glitchPalette:normalizeGlitchPalette(glitchPalette)})
 const setAbout=(about:AboutContent)=>save({...storeRef.current,about})
 const setContactPage=(contact:ContactSettings,socialLinks:SocialLink[])=>save({...storeRef.current,contact,socialLinks})
 const setTestimonials=(testimonials:Testimonial[])=>save({...storeRef.current,testimonials})
 const setMusicTracks=(musicTracks:MusicTrack[])=>save({...storeRef.current,musicTracks})
 const setSocialLinks=(socialLinks:SocialLink[])=>save({...storeRef.current,socialLinks})
 const setShowLikeCounts=(showLikeCounts:boolean)=>save({...storeRef.current,showLikeCounts})
 const exportData=async()=>{
  const store=storeRef.current
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
   else throw new Error('Não foi possível exportar: uma mídia local está ausente.')
  }
  const result=await zip.generateAsync({type:'blob'})
  const url=URL.createObjectURL(result)
  const link=document.createElement('a')
  link.href=url;link.download='jordan-portfolio-backup.zip';link.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
 }
 const importData=async(file:File)=>{
  const previous=storeRef.current
  if(file.name.toLowerCase().endsWith('.json')){const parsed=parseStore(JSON.parse(await file.text()) as unknown);for(const ref of refsFor(parsed))if(!await readMedia(ref))throw new Error('Backup JSON contém mídia local ausente. Importe o ZIP completo.');await makeCheckpoint('Antes de importar JSON');if(storeRef.current!==previous)throw new Error('Rascunho alterado durante a importação.');save(parsed);return}
  const {default:JSZip}=await import('jszip')
  const zip=await JSZip.loadAsync(file)
  const manifest=zip.file('portfolio.json')
  if(!manifest)throw new Error('portfolio.json não encontrado.')
  const parsed=parseStore(JSON.parse(await manifest.async('string')) as unknown)
  const catalogFile=zip.file('media-library.json')
  await makeCheckpoint('Antes de importar ZIP')
  if(storeRef.current!==previous)throw new Error('Rascunho alterado durante a importação.')
  const rawCatalog:unknown=catalogFile?JSON.parse(await catalogFile.async('string')):[]
  if(!Array.isArray(rawCatalog))throw new Error('Biblioteca de mídias inválida.')
  const catalog:LibraryAsset[]=rawCatalog.filter((item):item is LibraryAsset=>Boolean(item&&typeof item==='object'&&typeof item.ref==='string'))
  const allRefs=new Set([...refsFor(parsed),...catalog.filter(a=>isLocalMedia(a.ref)).map(a=>a.ref)])
  for(const ref of allRefs){
   const item=zip.file('public/assets/'+mediaKey(ref))??zip.file('public/images/'+mediaKey(ref))
   if(item)await saveMediaBlob(ref,await item.async('blob'))
   else if(!await readMedia(ref))throw new Error('Backup incompleto: há mídia local ausente. A restauração não foi concluída.')
  }
  if(Array.isArray(catalog)&&catalog.length)await saveCatalogItems(catalog)
  if(storeRef.current!==previous)throw new Error('Rascunho alterado durante a importação.')
  save(parsed)
 }
 return {...(editing?store:deployedStore),saveError,undo,redo,runAudit,makeCheckpoint,recoverCheckpoint,applyDesignTheme,historyInfo:historyInfo(),update,remove,reorderProjects,setFeaturedProjects,setCategories,setCustomPages,setNativeLayouts,setHome,setGalleryBackground,setGalleryPage,setBranding,setSiteIdentity,setThemePalette,setTypography,setStudioControls,setGlitchPalette,setAbout,setContactPage,setTestimonials,setMusicTracks,setSocialLinks,setShowLikeCounts,markPublished,restorePublished,exportData,importData}
}
