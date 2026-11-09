/**
 * Lightweight, transparent language preference for the public portfolio.
 * IP geolocation returns ONLY a country code to our runtime; the IP itself is
 * never saved, logged, added to the portfolio, or shown to Studio.
 * A manual choice always wins; browser locale is the offline fallback.
 */
export type VisitorLanguage='en'|'pt'|'es'
export const LANGUAGE_KEY='jf-visitor-language-v1'
const GEO_KEY='jf-visitor-geo-country-v1'
const GEO_TTL=7*24*60*60*1000

export const LANGUAGE_OPTIONS=[
 {value:'en',name:'English',label:'EN'},
 {value:'pt',name:'Português',label:'PT'},
 {value:'es',name:'Español',label:'ES'}
] as const

const portugueseCountries=new Set(['BR','PT','AO','MZ','CV','GW','ST','TL'])
const spanishCountries=new Set(['ES','MX','AR','BO','CL','CO','CR','CU','DO','EC','SV','GT','HN','NI','PA','PY','PE','PR','UY','VE','GQ'])
export function languageFromCountry(country:string):VisitorLanguage{
 const iso=String(country||'').trim().toUpperCase()
 if(portugueseCountries.has(iso))return 'pt'
 if(spanishCountries.has(iso))return 'es'
 return 'en'
}
export function languageFromBrowser(locales:readonly string[]):VisitorLanguage{
 for(const locale of locales){
  const code=String(locale||'').trim().split(/[-_]/)[0].toLowerCase()
  if(code==='pt'||code==='es'||code==='en')return code
 }
 return 'en'
}
function storage():Storage|null{
 try{return typeof localStorage==='undefined'?null:localStorage}catch{return null}
}
export function savedLanguage():VisitorLanguage|null{
 const value=storage()?.getItem(LANGUAGE_KEY)
 return value==='pt'||value==='es'||value==='en'?value:null
}
export function initialLanguage():VisitorLanguage{
 const saved=savedLanguage()
 if(saved)return saved
 const locales=typeof navigator!=='undefined'
  ?(navigator.languages?.length?navigator.languages:[navigator.language]):[]
 return languageFromBrowser(locales)
}
export function saveLanguageChoice(language:VisitorLanguage){
 try{storage()?.setItem(LANGUAGE_KEY,language)}catch{/* private browsing */ }
}
export function cachedGeoCountry(now=Date.now()):string|null{
 try{
  const cached=storage()?.getItem(GEO_KEY)
  if(!cached)return null
  const {country,expires}=JSON.parse(cached) as {country?:unknown;expires?:unknown}
  if(typeof country==='string'&&/^[A-Z]{2}$/.test(country)&&typeof expires==='number'&&expires>now)return country
 }catch{/* corrupt or disabled cache */ }
 return null
}
export async function detectCountryByIp(signal?:AbortSignal):Promise<string|null>{
 const cached=cachedGeoCountry()
 if(cached)return cached
 const controller=new AbortController()
 const abort=()=>controller.abort()
 signal?.addEventListener('abort',abort,{once:true})
 const timer=setTimeout(()=>controller.abort(),1800)
 try{
  // No auth, no new Cloudflare account. Free API: 1,000 queries/day/domain.
  // The request naturally exposes the visitor's IP to ipwho.is.
  const res=await fetch('https://ipwho.is/?fields=success,country_code',{
   signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'
  })
  if(!res.ok)return null
  const data=await res.json() as {success?:boolean;country_code?:unknown}
  if(data.success!==true||typeof data.country_code!=='string'||!/^[A-Z]{2}$/.test(data.country_code))return null
  try{storage()?.setItem(GEO_KEY,JSON.stringify({country:data.country_code,expires:Date.now()+GEO_TTL}))}catch{}
  return data.country_code
 }catch{return null}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
