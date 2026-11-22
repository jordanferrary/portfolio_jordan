export type WorkflowPrefs={favorites:string[];recent:string[]}
const KEY='jf-studio-workflow-v1'
function list(raw:unknown,max:number):string[]{return Array.isArray(raw)?Array.from(new Set(raw.filter((v):v is string=>typeof v==='string'&&/^[a-z0-9-]{1,80}$/.test(v)))).slice(0,max):[]}
export function normalizeWorkflow(raw:unknown):WorkflowPrefs{
 const value=raw&&typeof raw==='object'?raw as Partial<WorkflowPrefs>:{}
 return {favorites:list(value.favorites,12),recent:list(value.recent,8)}
}
export function readWorkflow():WorkflowPrefs{try{return normalizeWorkflow(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return normalizeWorkflow(null)}}
export function saveWorkflow(value:WorkflowPrefs):void{try{localStorage.setItem(KEY,JSON.stringify(normalizeWorkflow(value)))}catch{/* Preferences remain usable in this session. */}}
export function searchKey(value:string):string{return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
export function matchesTool(query:string,values:string[]):boolean{
 const terms=searchKey(query).split(/\s+/).filter(Boolean),haystack=searchKey(values.join(' '))
 return terms.every(term=>haystack.includes(term))
}
export function visitTool(value:WorkflowPrefs,id:string):WorkflowPrefs{return normalizeWorkflow({...value,recent:[id,...value.recent]})}
export function toggleFavorite(value:WorkflowPrefs,id:string):WorkflowPrefs{return normalizeWorkflow({...value,favorites:value.favorites.includes(id)?value.favorites.filter(entry=>entry!==id):[id,...value.favorites]})}
