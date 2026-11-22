import {useState} from 'react'
import {Download,Upload,Trash2,Save,X} from 'lucide-react'
import {normalizeDesignTheme,readDesignThemes,saveDesignThemes,themeFromCurrent,type DesignTheme} from '../../lib/design-themes'
import type {PortfolioStore} from '../../hooks/use-portfolio'
import {PALETTE_FIELDS} from '../../lib/theme-palette'
export function StudioThemeLibrary({store,onApply,onClose}:{store:PortfolioStore;onApply:(theme:DesignTheme)=>void;onClose:()=>void}){
 const [themes,setThemes]=useState(readDesignThemes)
 const [name,setName]=useState('')
 const [notice,setNotice]=useState('')
 const persist=(next:DesignTheme[])=>{saveDesignThemes(next);setThemes(next)}
 const add=(theme:DesignTheme)=>{
  if(themes.some(t=>t.name.toLowerCase()===theme.name.toLowerCase()))throw new Error('Já existe um tema com este nome. Escolha outro nome.')
  if(themes.length>=30)throw new Error('Limite de 30 temas locais. Exporte ou remova um tema antes de continuar.')
  persist([theme,...themes])
 }
 const create=()=>{try{add(themeFromCurrent(name,store));setName('');setNotice('Tema salvo nesta biblioteca local.')}catch(error){setNotice(error instanceof Error?error.message:'Não foi possível salvar o tema.')}}
 const remove=(index:number)=>{if(!window.confirm('Remover este tema da biblioteca local? O site não será alterado.'))return;try{persist(themes.filter((_,i)=>i!==index));setNotice('Tema removido.')}catch{setNotice('Não foi possível remover o tema.')}}
 const importTheme=async(file:File)=>{try{if(file.size>100_000)throw new Error('Arquivo de tema muito grande.');add(normalizeDesignTheme(JSON.parse(await file.text()) as unknown));setNotice('Tema importado.')}catch(error){setNotice(error instanceof Error?error.message:'Não foi possível importar o tema.')}}
 const download=(theme:DesignTheme)=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(theme,null,2)],{type:'application/json'}))
  const link=document.createElement('a');link.href=url;link.download=theme.name.replace(/[^a-z0-9-]+/gi,'-')+'.jf-theme.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
 }
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel studio-controls-editor" role="dialog" aria-modal="true" aria-label="Biblioteca de temas">
  <header><h2>Biblioteca de temas</h2><button type="button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></header><div className="editor-scroll">
   <p>Salve conjuntos de cores, fontes, símbolos, glitch e layout. O tema não inclui projetos, traduções, menu, credenciais ou visibilidade dos módulos.</p>
   <label>Nome do tema<input value={name} onChange={e=>setName(e.target.value)} maxLength={60}/></label>
   <div className="studio-nav-actions"><button type="button" disabled={!name.trim()} onClick={create}><Save size={16}/>Salvar visual atual</button><label className="file-import"><Upload size={16}/>Importar tema<input type="file" accept=".json,application/json" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void importTheme(file)}}/></label></div>
   {themes.map((theme,i)=><div className="studio-nav-row" key={theme.name}><strong>{theme.name}</strong><div className="studio-theme-swatches">{PALETTE_FIELDS.map(field=><span key={field.key} title={field.label+' '+theme.palette[field.key]} style={{background:theme.palette[field.key]}}/>)}</div><div className="studio-nav-actions"><button type="button" onClick={()=>{onApply(theme);setNotice('Tema aplicado ao rascunho. Publique para atualizar o site.')}}>Aplicar ao rascunho</button><button type="button" onClick={()=>download(theme)}><Download size={16}/>Exportar</button><button type="button" onClick={()=>remove(i)} aria-label={'Excluir '+theme.name}><Trash2 size={16}/></button></div></div>)}
   {!themes.length&&<p>Nenhum tema personalizado salvo neste navegador.</p>}{notice&&<p role="status">{notice}</p>}
  </div><footer><button type="button" className="subtle-action" onClick={onClose}>Fechar</button></footer>
 </section></div>
}
