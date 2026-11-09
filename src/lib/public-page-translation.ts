import type {VisitorLanguage} from './visitor-language'
import {VISITOR_PHRASES} from './visitor-phrases'

/**
 * Translate only visible PUBLIC copy. Never send an input, auth panel, draft,
 * Alquimago chat, code, private data or Studio editor text to a third party.
 * Site copy has human-reviewed translations; new public descriptions may use
 * MyMemory (optional, rate-limited) and keep their original if unavailable.
 */
const CACHE_KEY='jf-public-translation-cache-v1'
const USAGE_KEY='jf-public-translation-usage-v1'
const DAY=86_400_000
const MAX_DAY_CHARS=18000
const MAX_DAY_CALLS=100
const MAX_CACHE_ENTRIES=200
const NO_TRANSLATE_SELECTOR=[
 '[translate="no"]','.notranslate','.language-switcher',
 '.editor-overlay','.editor-panel','.studio-dock','.studio-hub',
 '.admin-gate','.gate-overlay',
 '.music-card-details strong','.music-card-details span',
 '.music-track-details b','.music-track-details small',
 '.feedback-content small',
 '.brand-wrap',

 '.contact-social-card-info strong','.project-hero .tools',
 'input','textarea','select','option','button[contenteditable]',
 '[contenteditable="true"]','pre','code','kbd','samp','script','style','svg','noscript'
].join(',')
type TextRecord={source:string;shown:string}
const seen=new WeakMap<Text,TextRecord>()
const attributes=new WeakMap<Element,Map<string,TextRecord>>()
type Cached={translated:string;expires:number}
let known:Record<string,Cached>={}
let pending:Promise<void>=Promise.resolve()
try{
 const stored=localStorage.getItem(CACHE_KEY)
 if(stored){
  const parsed=JSON.parse(stored) as Record<string,Cached>
  known=Object.fromEntries(Object.entries(parsed).filter(([,v])=>
   v&&typeof v.translated==='string'&&typeof v.expires==='number'&&v.expires>Date.now()).slice(-MAX_CACHE_ENTRIES))
 }
}catch{/* private browsing */}
function cacheTranslation(key:string,translated:string){
 known[key]={translated,expires:Date.now()+30*DAY}
 const items=Object.entries(known).slice(-MAX_CACHE_ENTRIES)
 if(Object.keys(known).length>MAX_CACHE_ENTRIES)known=Object.fromEntries(items)
 try{localStorage.setItem(CACHE_KEY,JSON.stringify(known))}catch{/* cache optional */}
}
function usage(){
 try{
  const saved=JSON.parse(localStorage.getItem(USAGE_KEY)||'null') as {date?:number;chars?:number;calls?:number}|null
  if(saved&&typeof saved.date==='number'&&Date.now()-saved.date<DAY&&saved.date<=Date.now())
   return {date:saved.date,chars:saved.chars||0,calls:saved.calls||0}
 }catch{}
 return {date:Date.now(),chars:0,calls:0}
}
function reserveQuota(chars:number){
 const current=usage()
 if(current.chars+chars>MAX_DAY_CHARS||current.calls>=MAX_DAY_CALLS)return false
 current.chars+=chars;current.calls++
 try{localStorage.setItem(USAGE_KEY,JSON.stringify(current))}catch{}
 return true
}
function publicCopy(source:string){
 const clean=source.trim()
 return clean.length>=2&&clean.length<=2500&&
  /[a-zA-ZÀ-ÿ]/.test(clean)&&
  !/^(https?:|site:|mailto:|#\/|www\.)/i.test(clean)&&
  !/^[\d\s.,;/\\+\-|:!?%]+$/.test(clean)&&
  !/^(Jordan Ferrary|Oscar Ibanez|GitHub|Instagram|Behance|ArtStation|YouTube|Blender|ZBrush|Krita|Substance Painter)$/i.test(clean)
}
export function localPhrase(source:string,language:VisitorLanguage):string|null{
 if(language==='en')return source
 const lookup=VISITOR_PHRASES[source.trim()]
 return lookup?.[language]??null
}
function decodeEntities(value:string){
 return value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ')
}
async function fetchTranslation(source:string,language:Exclude<VisitorLanguage,'en'>):Promise<string|null>{
 if(!reserveQuota(source.length))return null
 const controller=new AbortController()
 const timer=setTimeout(()=>controller.abort(),4200)
 try{
  const args=new URLSearchParams({q:source,langpair:'en|'+language})
  const response=await fetch('https://api.mymemory.translated.net/get?'+args,{
   signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'
  })
  if(!response.ok)return null
  const data=await response.json() as {responseStatus?:number;responseData?:{translatedText?:unknown}}
  if(data.responseStatus!==200||typeof data.responseData?.translatedText!=='string')return null
  const translated=decodeEntities(data.responseData.translatedText).trim()
  if(!translated||/^MYMEMORY WARNING|^PLEASE SELECT|QUOTA EXCEEDED/i.test(translated))return null
  return translated.slice(0,2800)
 }catch{return null}
 finally{clearTimeout(timer)}
}
function chunkAtWords(source:string,maxBytes=450):string[]{
 const result:string[]=[]
 let part=''
 for(const word of source.split(/(\s+)/).filter(Boolean)){
  const candidate=part+word
  if(new TextEncoder().encode(candidate).length>maxBytes){
   if(part.trim())result.push(part.trim())
   if(new TextEncoder().encode(word).length>maxBytes)return []
   part=word.trimStart()
  }else part=candidate
 }
 if(part.trim())result.push(part.trim())
 return result
}
export async function translatePublicText(source:string,language:VisitorLanguage):Promise<string>{
 const text=source.trim()
 if(!publicCopy(text)||language==='en')return source
 const translatedLocal=localPhrase(text,language)
 if(translatedLocal)return translatedLocal
 // Keep the artist name intact even inside a sentence not yet in the local phrasebook.
 // Translate only the surrounding text, never send the name to a translation API.
 if(/Jordan Ferrary/i.test(text)){
  const parts=text.split(/(Jordan Ferrary)/gi)
  const translatedParts:string[]=[]
  for(const part of parts){
   if(/^Jordan Ferrary$/i.test(part)){translatedParts.push('Jordan Ferrary');continue}
   if(!part.trim()){translatedParts.push(part);continue}
   const core=part.trim()
   const translated=await translatePublicText(core,language)
   translatedParts.push(part.replace(core,translated))
  }
  const assembled=translatedParts.join('')
  if(assembled!==text)cacheTranslation(language+':'+text,assembled)
  return assembled
 }
 const key=language+':'+text
 if(known[key])return known[key].translated
 const chunks=chunkAtWords(text)
 if(!chunks.length||chunks.length>5)return source
 // Serialize unknown translations and keep a tight free API budget.
 let final=source
 const job=async()=>{
  // Multiple React nodes can contain the same phrase. A translation queued
  // earlier may have populated the cache before this job starts.
  if(known[key]){final=known[key].translated;return}
  const translated:string[]=[]
  for(const chunk of chunks){
   const knownChunk=localPhrase(chunk,language)||known[language+':'+chunk]?.translated
   const value=knownChunk||await fetchTranslation(chunk,language)
   if(!value)return
   translated.push(value)
  }
  final=translated.join(' ')
  if(final!==source)cacheTranslation(key,final)
 }
 pending=pending.catch(()=>{}).then(job)
 await pending
 return final
}
function allowed(element:Element|null):boolean{
 return Boolean(element&&!element.closest(NO_TRANSLATE_SELECTOR))
}
function applyText(node:Text,language:VisitorLanguage,active:()=>boolean){
 if(!allowed(node.parentElement))return
 const current=node.nodeValue||''
 let info=seen.get(node)
 if(!info||current!==info.shown){
  info={source:current,shown:current}
  seen.set(node,info)
 }
 const source=info.source
 const plain=source.trim()
 if(!publicCopy(plain))return
 const setValue=(translated:string)=>{
  if(!active()||!node.isConnected)return
  const previous=seen.get(node)
  if(previous?.source!==source||node.nodeValue!==previous.shown)return
  const replacement=source.replace(plain,translated)
  if(previous.shown!==replacement){
   previous.shown=replacement
   node.nodeValue=replacement
  }
 }
 if(language==='en'){setValue(plain);return}
 const local=localPhrase(plain,language)
 if(local){setValue(local);return}
 const key=language+':'+plain
 if(known[key]){setValue(known[key].translated);return}
 void translatePublicText(plain,language).then(setValue)
}
function translateAttributes(el:Element,language:VisitorLanguage,active:()=>boolean){
 if(!allowed(el))return
 for(const attr of ['placeholder','aria-label','title','alt']){
  const current=el.getAttribute(attr)
  if(!current)continue
  let perElement=attributes.get(el)
  if(!perElement){perElement=new Map();attributes.set(el,perElement)}
  let entry=perElement.get(attr)
  if(!entry||entry.shown!==current){entry={source:current,shown:current};perElement.set(attr,entry)}
  const original=entry.source
  const phrase=original.trim()
  if(!publicCopy(phrase))continue
  const apply=(translated:string)=>{
   if(!active()||!el.isConnected||!allowed(el))return
   const live=attributes.get(el)?.get(attr)
   if(!live||live.source!==original||el.getAttribute(attr)!==live.shown)return
   const next=original.replace(phrase,translated)
   if(next!==live.shown){el.setAttribute(attr,next);live.shown=next}
  }
  if(language==='en'){apply(phrase);continue}
  const local=localPhrase(phrase,language)
  if(local){apply(local);continue}
  void translatePublicText(phrase,language).then(apply)
 }
}
/** Observe React route changes without changing source data or React state. */
export function observePublicTranslation(root:HTMLElement,language:VisitorLanguage):()=>void{
 let live=true
 let scheduled:ReturnType<typeof setTimeout>|null=null
 const active=()=>live
 const scan=()=>{
  if(!live)return
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
  let node:Node|null
  while((node=walker.nextNode()))applyText(node as Text,language,active)
  for(const el of root.querySelectorAll('[placeholder],[aria-label],[title],[alt]'))translateAttributes(el,language,active)
 }
 const queue=()=>{
  if(scheduled!==null)return
  scheduled=setTimeout(()=>{scheduled=null;scan()},55)
 }
 const observer=new MutationObserver(records=>{
  if(records.some(record=>record.type==='childList'||record.type==='characterData'))queue()
 })
 observer.observe(root,{childList:true,subtree:true,characterData:true})
 scan()
 return ()=>{
  live=false
  observer.disconnect()
  if(scheduled!==null)clearTimeout(scheduled)
 }
}
