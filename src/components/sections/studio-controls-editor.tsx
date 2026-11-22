import {useEffect,useRef,useState} from 'react'
import {ArrowDown,ArrowUp,Plus,Trash2,X,Save,RotateCcw} from 'lucide-react'
import {applyStudioControls,normalizeStudioControls,DEFAULT_CONTROLS,NAV_ICONS,type StudioControls,type NavId,type LayoutSettings} from '../../lib/studio-controls'
import '../../styles/studio-controls.css'
type Tab='layout'|'motion'|'features'|'navigation'|'translations'
const tabs:Record<Tab,string>={layout:'Layout e materiais',motion:'Animações',features:'Funcionalidades',navigation:'Navegação',translations:'Idiomas'}
const featureLabels:Record<keyof StudioControls['features'],string>={music:'Player musical',profile:'Cartão de perfil da Home',featured:'Projetos em destaque',focus:'Foco criativo',testimonials:'Depoimentos',footer:'Rodapés opcionais das páginas personalizadas'}
const layoutFields:{key:keyof LayoutSettings;label:string;min:number;max:number;step:number;unit:string}[]=[
 {key:'width',label:'Largura máxima das páginas amplas',min:900,max:1800,step:10,unit:' px'},
 {key:'gutter',label:'Margem lateral adicional',min:0,max:16,step:1,unit:' px'},
 {key:'gap',label:'Espaçamento entre painéis',min:75,max:135,step:5,unit:'%'},
 {key:'radius',label:'Arredondamento dos painéis',min:50,max:150,step:5,unit:'%'},
 {key:'glassBlur',label:'Desfoque dos botões glass',min:0,max:150,step:5,unit:'%'},
 {key:'glassGlow',label:'Brilho dos botões glass',min:0,max:150,step:5,unit:'%'}
]
export function StudioControlsEditor({value,initialTab='layout',onSave,onClose}:{value?:StudioControls;initialTab?:Tab;onSave:(value:StudioControls)=>void;onClose:()=>void}){
 const [draft,setDraft]=useState(()=>normalizeStudioControls(value))
 const [tab,setTab]=useState<Tab>(initialTab)
 const [device,setDevice]=useState<'desktop'|'mobile'>('desktop')
 const original=useRef(normalizeStudioControls(value)),saved=useRef(false)
 useEffect(()=>{applyStudioControls(draft)},[draft])
 useEffect(()=>()=>{if(!saved.current)applyStudioControls(original.current)},[])
 const move=(id:NavId,by:number)=>setDraft(prev=>{
  const order=[...prev.navigation.order],i=order.indexOf(id),j=i+by
  if(j<0||j>=order.length)return prev
  ;[order[i],order[j]]=[order[j],order[i]]
  return {...prev,navigation:{...prev.navigation,order}}
 })
 const setNav=(id:Exclude<NavId,'custom'>,patch:Partial<StudioControls['navigation']['items'][typeof id]>)=>setDraft(prev=>({...prev,navigation:{...prev.navigation,items:{...prev.navigation.items,[id]:{...prev.navigation.items[id],...patch}}}}))
 const setTranslation=(index:number,key:'source'|'pt'|'es',value:string)=>setDraft(prev=>({...prev,translations:prev.translations.map((entry,i)=>i===index?{...entry,[key]:value}:entry)}))
 const save=()=>{const next=normalizeStudioControls(draft);saved.current=true;applyStudioControls(next);onSave(next);onClose()}
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel studio-controls-editor" role="dialog" aria-modal="true" aria-label="Controles globais">
  <header><div><h2>Controles globais</h2><small>Studio 3.0</small></div><button type="button" aria-label="Fechar" onClick={onClose}><X size={20}/></button></header>
  <div className="editor-tabs">{(Object.keys(tabs) as Tab[]).map(id=><button type="button" key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{tabs[id]}</button>)}</div>
  <div className="editor-scroll">
   {tab==='layout'&&<><h3>Layout e materiais</h3><p>Valores relativos ao design original. A prévia visual usa a largura real da janela; salve e redimensione para conferir o outro dispositivo.</p><div className="editor-tabs"><button type="button" aria-pressed={device==='desktop'} onClick={()=>setDevice('desktop')}>Desktop</button><button type="button" aria-pressed={device==='mobile'} onClick={()=>setDevice('mobile')}>Celular e tablet</button></div><div className="studio-control-grid">{layoutFields.filter(field=>device==='mobile'?field.key!=='width':field.key!=='gutter').map(field=><label key={field.key}>{field.label}<output>{draft[device][field.key]}{field.unit}</output><input type="range" min={field.min} max={field.max} step={field.step} value={draft[device][field.key]} onChange={e=>setDraft(prev=>({...prev,[device]:{...prev[device],[field.key]:Number(e.target.value)}}))}/></label>)}</div><button type="button" className="subtle-action" onClick={()=>setDraft(prev=>({...prev,[device]:{...DEFAULT_CONTROLS[device]}}))}><RotateCcw size={15}/>Restaurar dispositivo</button></>}
   {tab==='motion'&&<><h3>Transição de páginas</h3><label>Estilo<select value={draft.motion.mode} onChange={e=>setDraft(prev=>({...prev,motion:{...prev.motion,mode:e.target.value as StudioControls['motion']['mode']}}))}><option value="glitch">Glitch suave</option><option value="fade">Fade</option><option value="none">Sem transição</option></select></label><label>Duração total: {draft.motion.duration} ms<input type="range" min="120" max="600" step="10" disabled={draft.motion.mode==='none'} value={draft.motion.duration} onChange={e=>setDraft(prev=>({...prev,motion:{...prev.motion,duration:Number(e.target.value)}}))}/></label><p>A preferência de movimento reduzido do visitante sempre tem prioridade. As cores e intensidade continuam no editor de glitch.</p></>}
   {tab==='features'&&<><h3>Funcionalidades públicas</h3><p>Desativar não exclui conteúdo. A edição permanece disponível no Studio.</p>{(Object.keys(featureLabels) as (keyof StudioControls['features'])[]).map(key=><label className="checkbox-line" key={key}><input type="checkbox" checked={draft.features[key]} onChange={e=>setDraft(prev=>({...prev,features:{...prev.features,[key]:e.target.checked}}))}/>{featureLabels[key]}</label>)}</>}
   {tab==='navigation'&&<><h3>Menu principal</h3><p>Organize as páginas nativas e a posição do grupo de páginas personalizadas. Ocultar uma página do menu não torna seu conteúdo privado.</p>{draft.navigation.order.map((id,i)=><div className="studio-nav-row" key={id}><div><strong>{id==='custom'?'Páginas personalizadas':draft.navigation.items[id].label}</strong><div className="studio-nav-actions"><button type="button" aria-label="Mover para cima" disabled={i===0} onClick={()=>move(id,-1)}><ArrowUp size={16}/></button><button type="button" aria-label="Mover para baixo" disabled={i===draft.navigation.order.length-1} onClick={()=>move(id,1)}><ArrowDown size={16}/></button></div></div>{id!=='custom'&&<><label>Nome<input maxLength={36} value={draft.navigation.items[id].label} onChange={e=>setNav(id,{label:e.target.value})}/></label><label>Ícone<select value={draft.navigation.items[id].icon} onChange={e=>setNav(id,{icon:e.target.value as StudioControls['navigation']['items'][typeof id]['icon']})}>{NAV_ICONS.map(icon=><option key={icon}>{icon}</option>)}</select></label><label className="checkbox-line"><input type="checkbox" disabled={id==='inicio'} checked={draft.navigation.items[id].visible} onChange={e=>setNav(id,{visible:e.target.checked})}/>Mostrar no menu</label></>}</div>)}</>}
   {tab==='translations'&&<><h3>Traduções manuais</h3><p>Informe a frase original exata em inglês e suas traduções. Elas têm prioridade sobre o dicionário e a tradução automática. Campos vazios usam o padrão.</p>{draft.translations.map((entry,i)=><div className="studio-nav-row" key={i}>{(['source','pt','es'] as const).map(key=><label key={key}>{key==='source'?'Original (EN)':key==='pt'?'Português':'Español'}<textarea rows={2} value={entry[key]} onChange={e=>setTranslation(i,key,e.target.value)}/></label>)}<button type="button" className="subtle-action" onClick={()=>setDraft(prev=>({...prev,translations:prev.translations.filter((_,index)=>i!==index)}))}><Trash2 size={15}/>Remover tradução</button></div>)}<button type="button" className="subtle-action" disabled={draft.translations.length>=400} onClick={()=>setDraft(prev=>({...prev,translations:[...prev.translations,{source:'',pt:'',es:''}]}))}><Plus size={16}/>Adicionar tradução</button></>}
  </div><footer><button type="button" className="subtle-action" onClick={onClose}>Cancelar</button><button type="button" className="save-action" onClick={save}><Save size={16}/>Salvar controles</button></footer>
 </section></div>
}
