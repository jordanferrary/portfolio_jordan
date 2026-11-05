import { useCallback, useState } from 'react'
import { initialProjects, starterCategories, type Project } from '../data/projects'
const KEY = 'jordan-portfolio-local-v2'
type PortfolioStore = { projects: Project[]; categories: string[] }
function load(): PortfolioStore {
 try { const data = localStorage.getItem(KEY); if(data){ const parsed:unknown = JSON.parse(data); if(parsed && typeof parsed === 'object' && 'projects' in parsed && 'categories' in parsed){const p = parsed as PortfolioStore; if(Array.isArray(p.projects)&&Array.isArray(p.categories))return p} } } catch { /* invalid local draft */ }
 return {projects:initialProjects,categories:starterCategories}
}
export function usePortfolio(){
 const [store,setStore] = useState<PortfolioStore>(load)
 const save = useCallback((next:PortfolioStore)=>{setStore(next);try{localStorage.setItem(KEY,JSON.stringify(next))}catch{/* storage unavailable */}},[])
 const update = (project:Project) => save({...store,projects:store.projects.some(p=>p.id===project.id)?store.projects.map(p=>p.id===project.id?project:p):[project,...store.projects]})
 const remove = (id:string)=>save({...store,projects:store.projects.filter(p=>p.id!==id)})
 const setCategories=(categories:string[])=>save({...store,categories})
 const exportData=()=>{const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='portfolio-content.json';link.click();URL.revokeObjectURL(url)}
 const importData=async(file:File)=>{const raw:unknown=JSON.parse(await file.text());if(!raw||typeof raw!=='object'||!('projects' in raw)||!('categories' in raw))throw new Error('Arquivo inválido');const value=raw as PortfolioStore;if(!Array.isArray(value.projects)||!Array.isArray(value.categories))throw new Error('Formato inválido');save(value)}
 return {...store,update,remove,setCategories,exportData,importData}
}
