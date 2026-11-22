import {useState} from 'react'
import {X,Plus,Copy,Download,Trash2,Upload} from 'lucide-react'
import type {CustomPage} from '../../data/custom-pages'
import {instantiatePage,normalizePageTemplate,readPageTemplates,savePageTemplates,type PageTemplate} from '../../lib/page-composition'
import {NATIVE_ROUTES,type NativeLayouts,type NativeRoute} from '../../lib/component-settings'
const labels:Record<NativeRoute,string>={inicio:'Home',portfolio:'Portfólio',sobre:'Sobre',contato:'Contato'}
export function StudioComposition({pages,layouts,onSetLayouts,onAddPage,onEditPage,onClose}:{pages:CustomPage[];layouts:NativeLayouts;onSetLayouts:(value:NativeLayouts)=>void;onAddPage:(page:CustomPage)=>void;onEditPage:(id:string)=>void;onClose:()=>void}){
 const [tab,setTab]=useState<'routes'|'templates'>('routes')
 const [draft,setDraft]=useState<NativeLayouts>({...layouts})
 const [templates,setTemplates]=useState(readPageTemplates)
 const [source,setSource]=useState('')
 const [name,setName]=useState('')
 const [message,setMessage]=useState('')
 const persist=(next:PageTemplate[])=>{savePageTemplates(next);setTemplates(next)}
 const add=(template:PageTemplate)=>{
  if(templates.length>=20)throw new Error('Limite de 20 modelos locais.')
  if(templates.some(t=>t.name===template.name))throw new Error('Escolha um nome diferente.')
  persist([template,...templates])
 }
 const saveTemplate=()=>{try{const page=pages.find(p=>p.id===source);if(!page)throw new Error('Selecione uma página.');add(normalizePageTemplate({schema:1,name,page:instantiatePage(page,pages)}));setName('');setMessage('Modelo salvo neste navegador.')}catch(e){setMessage(e instanceof Error?e.message:'Falha ao salvar modelo.')}}
 const importTemplate=async(file:File)=>{try{if(file.size>2_000_000)throw new Error('Arquivo grande demais.');add(normalizePageTemplate(JSON.parse(await file.text())));setMessage('Modelo importado.')}catch(e){setMessage(e instanceof Error?e.message:'Falha na importação.')}}
 const exportTemplate=(t:PageTemplate)=>{const url=URL.createObjectURL(new Blob([JSON.stringify(t,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='page-template.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel studio-controls-editor" role="dialog" aria-modal="true" aria-label="Compositor de páginas">
  <header><h2>Compositor de páginas</h2><button type="button" aria-label="Fechar" onClick={onClose}><X size={20}/></button></header>
  <div className="editor-tabs"><button type="button" aria-pressed={tab==='routes'} onClick={()=>setTab('routes')}>Páginas nativas</button><button type="button" aria-pressed={tab==='templates'} onClick={()=>setTab('templates')}>Modelos</button></div>
  <div className="editor-scroll">{tab==='routes'?<>
   <p>Escolha uma página montada com blocos para apresentar em uma rota nativa. O conteúdo original permanece guardado. A rota e os links continuam iguais; substituir o Portfólio oculta sua galeria nativa.</p>
   {NATIVE_ROUTES.map(route=><div className="studio-nav-row" key={route}><strong>{labels[route]}</strong><label>Composição<select value={draft[route]??''} onChange={e=>setDraft(prev=>({...prev,[route]:e.target.value||undefined}))}><option value="">Layout original</option>{pages.map(p=><option key={p.id} value={p.id}>{p.navLabel}</option>)}</select></label>{draft[route]&&<button type="button" className="subtle-action" onClick={()=>onEditPage(draft[route]!)}>Editar composição selecionada</button>}</div>)}
   <button type="button" className="subtle-action" onClick={()=>onEditPage('new')}><Plus size={16}/>Criar composição</button>
  </>:<>
   <p>Salve uma página como modelo independente e reutilizável. Arquivos locais continuam referenciados; para transferi-los a outro navegador, exporte também um backup de mídias.</p>
   <label>Página de origem<select value={source} onChange={e=>setSource(e.target.value)}><option value="">Selecionar</option>{pages.map(p=><option key={p.id} value={p.id}>{p.navLabel}</option>)}</select></label>
   <label>Nome do modelo<input value={name} maxLength={60} onChange={e=>setName(e.target.value)}/></label><div className="studio-nav-actions"><button type="button" disabled={!source||!name.trim()} onClick={saveTemplate}><Copy size={15}/>Salvar modelo</button><label><Upload size={15}/>Importar modelo<input type="file" accept=".json" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void importTemplate(file)}}/></label></div>
   {templates.map((t,i)=><div className="studio-nav-row" key={t.name}><strong>{t.name}</strong><small>{t.page.blocks.length} blocos</small><div className="studio-nav-actions"><button type="button" onClick={()=>{if(pages.length>=80){setMessage('Limite de páginas atingido.');return}onAddPage(instantiatePage(t.page,[]))}}>Criar página</button><button type="button" onClick={()=>exportTemplate(t)}><Download size={15}/>Exportar</button><button type="button" aria-label={'Excluir '+t.name} onClick={()=>{try{persist(templates.filter((_,j)=>i!==j))}catch{setMessage('Falha ao excluir modelo.')}}}><Trash2 size={15}/></button></div></div>)}{message&&<p role="status">{message}</p>}
  </>}</div><footer><button type="button" className="subtle-action" onClick={onClose}>Fechar</button>{tab==='routes'&&<button type="button" className="save-action" onClick={()=>{onSetLayouts(draft);onClose()}}>Salvar composições</button>}</footer>
 </section></div>
}
