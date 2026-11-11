import { useEffect,useMemo,useState, type DragEvent } from 'react'
import { ArrowDown,ArrowUp,Download,GripVertical,ImagePlus,Plus,Save,Trash2,Upload,X,Clapperboard,Box as BoxIcon } from 'lucide-react'
import { AssetImage } from '../ui/asset-image'
import { AssetClipButton } from '../ui/asset-picker'
import { QuickEditImageButton } from '../ui/image-quick-editor'
import { FilterIcon } from '../ui/filter-icon'
import { ProjectVideo } from '../ui/project-video'
import { ProjectModel } from '../ui/project-model'
import { parseModelUrl } from '../../lib/model-embed'
import { parseVideoEmbed } from '../../lib/video-embed'
import { TextComposer } from '../ui/text-composer'
import { ProjectFramingEditor } from './project-framing-editor'
import type { ProcessStep } from '../../data/projects'
import { categoryIcons,type Block,type BlockType,type Category,type CategoryIcon,type GalleryEntry,type SlideEntry,type Project } from '../../data/projects'
import { isLocalMedia,saveUploadedMedia } from '../../lib/media-store'

const templates:{type:BlockType;label:string;description:string}[]=[
 {type:'heading',label:'Título',description:'Divisor de seção'},
 {type:'text',label:'Texto',description:'Descrição longa'},
 {type:'image',label:'Imagem',description:'Arte em destaque'},
 {type:'image-left',label:'Imagem à esquerda',description:'Imagem + texto'},
 {type:'image-right',label:'Imagem à direita',description:'Texto + imagem'},
 {type:'before-after',label:'Antes / depois',description:'Comparação arrastável'},
 {type:'gallery',label:'Múltiplas imagens',description:'Grade de imagens'},
 {type:'slideshow',label:'Carrossel de imagens',description:'Transições, duração e várias artes'},
 {type:'process',label:'Processo criativo',description:'Etapas da guia Processo, na posição escolhida'},
 {type:'divider',label:'Linha divisória',description:'Linha com ícone opcional'},
 {type:'video',label:'Vídeo incorporado',description:'Miniatura + YouTube ou Vimeo'},
 {type:'model',label:'Modelo 3D interativo',description:'GLB / glTF, somente após clique'}
]
const titleFor=(type:BlockType)=>templates.find(t=>t.type===type)?.label??type
const blank=(category:string):Project=>({id:'project-'+Date.now().toString(36),title:'Novo projeto',category:category||'Others',year:String(new Date().getFullYear()),image:'',description:'',tools:[],featured:false,blocks:[],processTemplateMigrated:true})

function MediaField({value,onChange,folder,slot,label,onError}:{value:string;onChange:(url:string)=>void;folder:string;slot:string;label:string;onError:(text:string)=>void}){
 const [sending,setSending]=useState(false)
 const upload=async(file:File)=>{setSending(true);try{onChange(await saveUploadedMedia(file,folder,slot))}catch(e){onError(e instanceof Error?e.message:'Falha ao importar imagem')}finally{setSending(false)}}
 const drop=(event:DragEvent<HTMLDivElement>)=>{
  event.preventDefault()
  const media=event.dataTransfer.getData('application/x-jf-asset')
  const file=event.dataTransfer.files[0]
  if(file)void upload(file)
  else if(media)onChange(media)
 }
 return <div className="media-field"><div className="media-upload-zone" onDragOver={event=>event.preventDefault()} onDrop={drop}>{value?<AssetImage src={value} alt={'Prévia: '+label}/>:<div className="empty-media"><ImagePlus size={25}/><span>Arraste uma imagem aqui</span></div>}</div><div className="media-controls"><label className="media-upload-button"><Upload size={15}/>{sending?'Importando...':'Carregar imagem'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value=''}}/></label><AssetClipButton folder={folder} onSelect={onChange}/>{value&&<QuickEditImageButton source={value} folder={folder} onSave={onChange}/>} {value&&<button type="button" onClick={()=>onChange('')}><X size={15}/>Remover</button>}</div><label className="media-url-label">{label} — URL ou arquivo<input value={isLocalMedia(value)?'':value} onChange={e=>onChange(e.target.value)} placeholder={isLocalMedia(value)?'Imagem armazenada neste navegador':'https://...'} aria-label={label+' URL'}/></label></div>
}
function ToolTags({tools,onChange}:{tools:string[];onChange:(next:string[])=>void}){
 const [text,setText]=useState('')
 const add=(input:string)=>{
  const pieces=input.split(/[,\n]+/).map(s=>s.trim()).filter(Boolean)
  if(pieces.length)onChange([...new Set([...tools,...pieces])])
  setText('')
 }
 return <div className="tool-tags"><div className="tag-list">{tools.map(tool=><button type="button" key={tool} onClick={()=>onChange(tools.filter(t=>t!==tool))}>{tool}<X size={13}/></button>)}</div><input aria-label="Adicionar ferramentas" placeholder="Ex.: Blender, ZBrush, Substance…" value={text} onChange={e=>{if(e.target.value.includes(',')||e.target.value.includes('\n')){const fragments=e.target.value.split(/[,\n]+/);const trailing=fragments.pop()??'';const values=fragments.map(x=>x.trim()).filter(Boolean);if(values.length)onChange([...new Set([...tools,...values])]);setText(trailing)}else setText(e.target.value)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();add(text)}else if(e.key==='Tab'&&text.trim())add(text)}} onBlur={()=>{if(text.trim())add(text)}}/><small>Vírgula, Enter ou Tab adicionam uma ferramenta. Clique na etiqueta para remover.</small></div>
}
interface Props {project:Project|null; projects:Project[];categories:Category[];onSave:(project:Project)=>void;onDelete:(id:string)=>void;onClose:()=>void;onCategories:(categories:Category[])=>void;onExport:()=>Promise<void>;onImport:(file:File)=>Promise<void>}
export function AdminEditor({project,projects,categories,onSave,onDelete,onClose,onCategories,onExport,onImport}:Props){
 const [draft,setDraft]=useState<Project>(project??blank(categories[0]?.label))
 const [tab,setTab]=useState<'project'|'framing'|'composition'|'process'|'filters'|'backup'>('project')
 const [newCategory,setNewCategory]=useState('')
 const [newIcon,setNewIcon]=useState<CategoryIcon>('grid')
 const [newImage,setNewImage]=useState('')
 const [message,setMessage]=useState('')
 const [dragged,setDragged]=useState('')
 const [pending,setPending]=useState(false)
 const [insertAt,setInsertAt]=useState<number|null>(null)
 useEffect(()=>{
  const previous=document.body.style.overflow
  document.body.style.overflow='hidden'
  return ()=>{document.body.style.overflow=previous}
 },[])
 const patch=(next:Partial<Project>)=>setDraft(prev=>({...prev,...next}))
 const updateBlock=(id:string,next:Partial<Block>)=>patch({blocks:draft.blocks.map(b=>b.id===id?{...b,...next}:b)})
 const addBlock=(type:BlockType,index=draft.blocks.length)=>{
  if(type==='process'&&draft.blocks.some(b=>b.type==='process')){
   setMessage('O template de Processo Criativo já está no projeto. Arraste-o na Composição para mudar de posição.')
   setInsertAt(null)
   return
  }
  const b:Block={id:'b-'+Math.random().toString(36).slice(2),type,content:type==='process'?'Creative process':'',gallery:type==='gallery'?['','']:undefined,galleryMode:type==='gallery'?'simple':undefined,galleryEntries:type==='gallery'?[]:undefined,slides:type==='slideshow'?[]:undefined,slideAutoplay:false,slideEffect:'fade',slideInterval:5000,slideHeight:420,slideShowPauseButton:false,dividerIcon:type==='divider'?'sparkles':undefined,dividerStyle:type==='divider'?'glow':undefined}
  const result=[...draft.blocks];result.splice(index,0,b);patch({blocks:result});setInsertAt(null);requestAnimationFrame(()=>document.querySelector('[data-block-id="'+b.id+'"]')?.scrollIntoView({block:'nearest',behavior:'smooth'}))
 }
 const move=(from:number,to:number)=>{
  if(from<0||to<0||from>=draft.blocks.length||to>=draft.blocks.length||from===to)return
  const next=[...draft.blocks];const [item]=next.splice(from,1);next.splice(to,0,item);patch({blocks:next})
 }
 const onBlockDrop=(event:DragEvent<HTMLElement>,index:number)=>{
  event.preventDefault()
  const source=event.dataTransfer.getData('application/x-jf-block')
  const type=event.dataTransfer.getData('application/x-jf-template') as BlockType
  if(source){move(draft.blocks.findIndex(b=>b.id===source),index);setDragged('')}
  else if(templates.some(t=>t.type===type))addBlock(type,index)
 }
 const media=useMemo(()=>[...new Set([draft.image,...draft.blocks.flatMap(b=>[b.type==='image'?b.content:b.media??'',b.after??'',...(b.gallery??[]),...(b.galleryEntries??[]).map(x=>x.image),...(b.slides??[]).map(x=>x.image)]),...(draft.processSteps??[]).map(s=>s.image)].filter(Boolean))],[draft])
 const steps=draft.processSteps??[]
 const addStep=()=>patch({processSteps:[...steps,{id:'step-'+Math.random().toString(36).slice(2),label:'Etapa '+(steps.length+1),image:''}]})
 const updateStep=(id:string,next:Partial<ProcessStep>)=>patch({processSteps:steps.map(s=>s.id===id?{...s,...next}:s)})
 const moveStep=(from:number,to:number)=>{if(to<0||to>=steps.length)return;const arr=[...steps];const [item]=arr.splice(from,1);arr.splice(to,0,item);patch({processSteps:arr})}

 const setCategory=(id:string,next:Partial<Category>)=>onCategories(categories.map(c=>c.id===id?{...c,...next}:c))
 const uploadCategoryIcon=async(file:File,id:string)=>{try{const src=await saveUploadedMedia(file,'filter-icons',id);setCategory(id,{image:src});setMessage('Ícone de filtro salvo localmente.')}catch(e){setMessage(e instanceof Error?e.message:'Falha no upload')}}
 const createCategory=()=>{
  const label=newCategory.trim()
  if(!label){setMessage('Escreva o nome do filtro.');return}
  if(categories.some(c=>c.label.toLowerCase()===label.toLowerCase())){setMessage('Este filtro já existe.');return}
  const id=label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-')+'-'+Math.random().toString(36).slice(2,5)
  onCategories([...categories,{id,label,icon:newIcon,image:newImage||undefined}])
  setNewCategory('');setNewImage('');setMessage('Filtro criado. Ele aparecerá na galeria e poderá ser usado em qualquer projeto.')
 }
 const save=()=>{if(!draft.title.trim()||!draft.image.trim()){setTab('project');setMessage('Informe título e imagem de capa para salvar.');return}onSave(draft);onClose()}
 return <div className="editor-overlay project-focus-overlay" lang="pt-BR"><section className="editor-panel v2-editor" role="dialog" aria-modal="true" aria-label="Espaço de trabalho do projeto"><header className="editor-head"><div className="studio-project-identity"><div className="studio-project-thumb">{draft.image?<AssetImage src={draft.image} alt="Capa do projeto atual"/>:<ImagePlus size={24}/>}</div><div><span className="eyebrow">✦ LOCAL STUDIO · PROJETO EM FOCO</span><h2>{draft.title||'Novo projeto'}</h2><small>{draft.category} · {draft.year} · Alterações locais</small></div></div><button type="button" onClick={onClose} aria-label="Fechar editor"><X/></button></header>
 <div className="editor-tabs" role="tablist" aria-label="Áreas de edição"><button type="button" role="tab" aria-selected={tab==='project'} onClick={()=>setTab('project')}>01 · Informações</button><button type="button" role="tab" aria-selected={tab==='framing'} onClick={()=>setTab('framing')}>02 · Enquadramento</button><button type="button" role="tab" aria-selected={tab==='composition'} onClick={()=>setTab('composition')}>03 · Composição</button><button type="button" role="tab" aria-selected={tab==='process'} onClick={()=>setTab('process')}>04 · Processo</button><button type="button" role="tab" aria-selected={tab==='filters'} onClick={()=>setTab('filters')}>05 · Categorias</button><button type="button" role="tab" aria-selected={tab==='backup'} onClick={()=>setTab('backup')}>06 · Arquivos</button></div>
 <div className="editor-scroll">
 {tab==='project'&&<>
 <p className="local-warning">Edição exclusiva deste projeto. O rascunho fica neste navegador; depois de salvar, use “Publicar no GitHub” para atualizar o portfólio público.</p>
 <label>Título<input value={draft.title} onChange={e=>patch({title:e.target.value})}/></label>
 <div className="editor-two"><label>Filtro do projeto<select value={draft.category} onChange={e=>patch({category:e.target.value})}>{categories.map(c=><option key={c.id} value={c.label}>{c.label}</option>)}</select></label><label>Ano<input value={draft.year} onChange={e=>patch({year:e.target.value})}/></label></div>
 <MediaField value={draft.image} onChange={image=>patch({image})} folder={'projects/'+draft.id} slot="cover" label="Capa" onError={setMessage}/>{draft.image&&<button type="button" className="framing-shortcut" onClick={()=>setTab('framing')}>✦ Ajustar enquadramento da capa e do banner</button>}
 <div className="project-description-composer"><p>Descrição principal</p><TextComposer label="Descrição do projeto" rows={4} value={draft.description} onChange={description=>patch({description})}/></div>
 <div className="tools-control"><p>Ferramentas utilizadas</p><ToolTags tools={draft.tools} onChange={tools=>patch({tools})}/></div>
 <label className="checkbox-line"><input type="checkbox" checked={draft.featured} onChange={e=>patch({featured:e.target.checked})}/>Exibir em trabalhos de destaque</label>
 </>}
 {tab==='framing'&&<ProjectFramingEditor image={draft.image} coverFocus={draft.coverFocus} heroFocus={draft.heroFocus} onChange={values=>patch(values)}/>}
 {tab==='composition'&&<>
 <p className="local-warning">Organize apenas a apresentação deste projeto. Os blocos abaixo formarão a página completa da obra.</p>
 {media.length>0&&<><div className="editor-section-title"><h3>Meus assets deste projeto</h3><p>Arraste estas miniaturas até um campo de imagem abaixo.</p></div><div className="asset-shelf">{media.map(src=><div key={src} className="asset-shelf-item" draggable onDragStart={event=>event.dataTransfer.setData('application/x-jf-asset',src)} title="Arraste para uma área de imagem"><AssetImage src={src} alt="Asset disponível"/></div>)}</div></>}
 <div className="editor-section-title"><h3>Blocos visuais do projeto</h3><p>Clique para adicionar. Você também pode arrastar um modelo para a sequência de blocos.</p></div>
 <div className="template-gallery">{templates.map(t=><button type="button" key={t.type} className="template-tile" draggable={t.type!=='process'||!draft.blocks.some(b=>b.type==='process')} disabled={t.type==='process'&&draft.blocks.some(b=>b.type==='process')} title={t.type==='process'&&draft.blocks.some(b=>b.type==='process')?'Já adicionado. Arraste o bloco na composição para reposicionar.':t.description} onDragStart={e=>e.dataTransfer.setData('application/x-jf-template',t.type)} onClick={()=>addBlock(t.type)}><span className={'template-sketch '+t.type} aria-hidden="true">{t.type==='video'?<Clapperboard size={27}/>:t.type==='model'?<BoxIcon size={29}/>:<><i/><i/><i/></>}</span><b>{t.label}</b><small>{t.description}</small></button>)}</div>
 <div className="editor-section-title"><h3>Composição do projeto</h3><p>Arraste pela alça para reordenar; use as setas como alternativa.</p></div>
 <div className="blocks-list" onDragOver={e=>e.preventDefault()} onDrop={e=>{if(e.target===e.currentTarget){const t=e.dataTransfer.getData('application/x-jf-template') as BlockType;if(templates.some(a=>a.type===t))addBlock(t)}}}>
 {draft.blocks.map((b,i)=><section key={b.id} data-block-id={b.id} className={'edit-block '+(dragged===b.id?'dragging':'')} onDragOver={e=>e.preventDefault()} onDrop={e=>onBlockDrop(e,i)}>
 <div className="edit-block-top"><span className="drag-handle" draggable onDragStart={e=>{e.dataTransfer.setData('application/x-jf-block',b.id);setDragged(b.id)}} onDragEnd={()=>setDragged('')} title="Arrastar bloco"><GripVertical size={18}/></span><b>{i+1}. {titleFor(b.type)}</b><div><button type="button" onClick={()=>move(i,i-1)} aria-label="Mover acima"><ArrowUp size={16}/></button><button type="button" onClick={()=>move(i,i+1)} aria-label="Mover abaixo"><ArrowDown size={16}/></button><button type="button" onClick={()=>patch({blocks:draft.blocks.filter(x=>x.id!==b.id)})} aria-label="Excluir bloco"><Trash2 size={16}/></button></div></div>
 {b.type==='process'&&<div className="project-composition-enhanced">
  <label>Título da seção<input value={b.content} onChange={e=>updateBlock(b.id,{content:e.target.value})} maxLength={90} placeholder="Creative process"/></label>
  <p className="editor-help">Este template exibe as {(draft.processSteps??[]).filter(step=>step.image?.trim()).length} etapa(s) com imagem da guia Processo. No computador, ocupa uma linha; no celular, vira um carrossel. Mova este bloco usando as setas ou a alça acima.</p>
  <button type="button" className="subtle-action" onClick={()=>setTab('process')}>Editar imagens e nomes das etapas</button>
 </div>}
 {b.type==='heading'&&<TextComposer heading label="Título formatável" rows={3} value={b.content} onChange={content=>updateBlock(b.id,{content})}/>} 
 {b.type==='text'&&<TextComposer label="Conteúdo formatável" value={b.content} onChange={content=>updateBlock(b.id,{content})}/>} 
 {b.type==='image'&&<MediaField label="Imagem única" folder={'projects/'+draft.id} slot={b.id} value={b.content} onChange={content=>updateBlock(b.id,{content})} onError={setMessage}/>}
 {(b.type==='image-left'||b.type==='image-right')&&<><MediaField label="Imagem deste bloco" folder={'projects/'+draft.id} slot={b.id} value={b.media??''} onChange={media=>updateBlock(b.id,{media})} onError={setMessage}/><TextComposer label="Texto ao lado da imagem" value={b.content} onChange={content=>updateBlock(b.id,{content})} rows={4}/></>}
 {b.type==='before-after'&&<><div className="editor-two"><MediaField label="Imagem da esquerda" folder={'projects/'+draft.id} slot={b.id+'-before'} value={b.media??''} onChange={media=>updateBlock(b.id,{media})} onError={setMessage}/><MediaField label="Imagem da direita" folder={'projects/'+draft.id} slot={b.id+'-after'} value={b.after??''} onChange={after=>updateBlock(b.id,{after})} onError={setMessage}/></div><div className="editor-two compare-caption-inputs"><label>Nome da primeira versão<input maxLength={28} placeholder="Wireframe" value={b.beforeLabel??'Before'} onChange={e=>updateBlock(b.id,{beforeLabel:e.target.value})}/></label><label>Nome da segunda versão<input maxLength={28} placeholder="Final" value={b.afterLabel??'After'} onChange={e=>updateBlock(b.id,{afterLabel:e.target.value})}/></label></div><textarea aria-label="Legenda da comparação" rows={2} placeholder="Descrição da comparação" value={b.content} onChange={e=>updateBlock(b.id,{content:e.target.value})}/></>}
 {b.type==='video'&&<div className="video-block-editor"><label>Título exibido abaixo do player (opcional)<input maxLength={100} placeholder={draft.title+' — Creative process'} value={b.videoTitle??''} onChange={e=>updateBlock(b.id,{videoTitle:e.target.value})}/></label><label>Link do YouTube ou Vimeo<input type="url" placeholder="https://www.youtube.com/watch?v=..." value={b.content} onChange={e=>updateBlock(b.id,{content:e.target.value})}/></label><p className="editor-help">O vídeo só carrega depois do clique. Aceita YouTube, Shorts e Vimeo. Uma miniatura personalizada é opcional.</p>{b.content&&!parseVideoEmbed(b.content)&&<p role="alert" className="editor-status">Link inválido. Use uma URL do YouTube ou Vimeo.</p>}<MediaField label="Miniatura personalizada (opcional)" folder={'projects/'+draft.id} slot={b.id+'-video-poster'} value={b.media??''} onChange={media=>updateBlock(b.id,{media})} onError={setMessage}/>{parseVideoEmbed(b.content)&&<div className="project-video-edit-preview"><ProjectVideo url={b.content} poster={b.media} title={b.videoTitle?.trim()||draft.title}/></div>}</div>}
 {b.type==='model'&&<div className="model-block-editor"><label>URL direta do modelo GLB ou glTF<input type="url" placeholder="https://site.com/portfolio/modelo.glb" value={b.content} onChange={e=>updateBlock(b.id,{content:e.target.value})}/></label><p className="editor-help">Renderização 3D somente após o clique. O servidor precisa aceitar carregamento público e CORS. GLB é recomendado por reunir texturas e malha em um único arquivo. Para FBX, importe no Blender e exporte como GLB.</p>{b.content&&!parseModelUrl(b.content)&&<p className="editor-status" role="alert">Este endereço não é um link direto .glb ou .gltf. FBX precisa ser convertido para GLB antes de ser incorporado.</p>}<MediaField label="Capa representativa do modelo (opcional)" folder={'projects/'+draft.id} slot={b.id+'-3d-poster'} value={b.media??''} onChange={media=>updateBlock(b.id,{media})} onError={setMessage}/>{parseModelUrl(b.content)&&<div className="project-model-edit-preview"><ProjectModel url={b.content} poster={b.media} title={draft.title+' model preview'}/></div>}</div>}
 {b.type==='divider'&&<div className="divider-editor-fields"><div className="editor-two"><label>Ícone central<select value={b.dividerIcon??'sparkles'} onChange={e=>updateBlock(b.id,{dividerIcon:e.target.value as Block['dividerIcon']})}><option value="none">Sem ícone</option><option value="sparkles">Brilho</option><option value="star">Estrela</option><option value="diamond">Diamante</option><option value="circle">Círculo</option></select></label><label>Estilo da linha<select value={b.dividerStyle??'glow'} onChange={e=>updateBlock(b.id,{dividerStyle:e.target.value as Block['dividerStyle']})}><option value="glow">Brilho suave</option><option value="solid">Linha contínua</option><option value="dashed">Pontilhada</option></select></label></div><div className="divider-editor-preview">───── ✦ ─────</div></div>}
 {b.type==='gallery'&&<div className="project-composition-enhanced">
  <label>Modo da galeria<select value={b.galleryMode??'simple'} onChange={e=>updateBlock(b.id,{galleryMode:e.target.value as 'simple'|'artists'})}><option value="simple">Grade simples · imagens com zoom</option><option value="artists">Galeria com detalhes · créditos e links</option></select></label>
  {(b.galleryMode??'simple')==='simple'?<><div className="gallery-fields">{(b.gallery??[]).map((value,index)=><div key={index} className="gallery-field"><MediaField label={'Imagem '+(index+1)} folder={'projects/'+draft.id} slot={b.id+'-'+index} value={value} onChange={src=>updateBlock(b.id,{gallery:(b.gallery??[]).map((x,j)=>j===index?src:x)})} onError={setMessage}/><button type="button" onClick={()=>updateBlock(b.id,{gallery:(b.gallery??[]).filter((_,j)=>j!==index)})} className="remove-gallery-item"><X size={13}/>Remover quadro</button></div>)}</div><button type="button" className="subtle-action" onClick={()=>updateBlock(b.id,{gallery:[...(b.gallery??[]),'']})}><Plus size={15}/>Outra imagem</button></>:
   <><p className="editor-help">Use esta apresentação para créditos de artistas, certificados ou obras. O visitante só abre os detalhes ao selecionar uma imagem; os links são opcionais.</p>{(b.galleryEntries??[]).map((item,index)=><div className="project-composition-item" key={item.id}>
    <div className="edit-block-top"><b>{item.title||'Item sem título'}</b><div><button type="button" disabled={index===0} aria-label="Subir item" onClick={()=>{const arr=[...(b.galleryEntries??[])];[arr[index-1],arr[index]]=[arr[index],arr[index-1]];updateBlock(b.id,{galleryEntries:arr})}}><ArrowUp size={15}/></button><button type="button" disabled={index===(b.galleryEntries??[]).length-1} aria-label="Descer item" onClick={()=>{const arr=[...(b.galleryEntries??[])];[arr[index+1],arr[index]]=[arr[index],arr[index+1]];updateBlock(b.id,{galleryEntries:arr})}}><ArrowDown size={15}/></button><button type="button" onClick={()=>updateBlock(b.id,{galleryEntries:(b.galleryEntries??[]).filter(x=>x.id!==item.id)})} aria-label="Remover item"><Trash2 size={15}/></button></div></div>
    <MediaField label="Arte ou certificado" folder={'projects/'+draft.id} slot={item.id} value={item.image} onChange={image=>updateBlock(b.id,{galleryEntries:(b.galleryEntries??[]).map(x=>x.id===item.id?{...x,image}:x)})} onError={setMessage}/>
    <div className="editor-two"><label>Título<input value={item.title} onChange={e=>updateBlock(b.id,{galleryEntries:(b.galleryEntries??[]).map(x=>x.id===item.id?{...x,title:e.target.value}:x)})}/></label><label>Crédito ou participante (opcional)<input value={item.artist} onChange={e=>updateBlock(b.id,{galleryEntries:(b.galleryEntries??[]).map(x=>x.id===item.id?{...x,artist:e.target.value}:x)})}/></label></div>
    <label>Descrição<textarea rows={3} value={item.description} onChange={e=>updateBlock(b.id,{galleryEntries:(b.galleryEntries??[]).map(x=>x.id===item.id?{...x,description:e.target.value}:x)})}/></label><label>Link externo (opcional)<input type="url" value={item.portfolioUrl} placeholder="https://..." onChange={e=>updateBlock(b.id,{galleryEntries:(b.galleryEntries??[]).map(x=>x.id===item.id?{...x,portfolioUrl:e.target.value}:x)})}/></label>
   </div>)}<button type="button" className="subtle-action" onClick={()=>updateBlock(b.id,{galleryEntries:[...(b.galleryEntries??[]),{id:'entry-'+crypto.randomUUID(),image:'',artist:'',title:'',description:'',portfolioUrl:''} satisfies GalleryEntry]})}><Plus size={15}/>Adicionar item</button></>}
 </div>}
 {b.type==='slideshow'&&<div className="project-composition-enhanced">
  <p className="editor-help">Carrossel com zoom, setas laterais e transição configurável. Ajuste somente a altura; a quantidade visível é calculada automaticamente e a largura acompanha o projeto.</p>
  <div className="editor-two"><label>Altura · {b.slideHeight??420} px<input type="range" min="180" max="640" step="20" value={b.slideHeight??420} onChange={e=>updateBlock(b.id,{slideHeight:Number(e.target.value)})}/></label><label>Transição<select value={b.slideEffect??'fade'} onChange={e=>updateBlock(b.id,{slideEffect:e.target.value as Block['slideEffect']})}><option value="fade">Fade</option><option value="slide">Deslizar</option><option value="zoom">Zoom</option><option value="none">Sem animação</option></select></label></div>
  <div className="editor-two"><label>Troca automática<select value={b.slideAutoplay?'yes':'no'} onChange={e=>updateBlock(b.id,{slideAutoplay:e.target.value==='yes'})}><option value="no">Manual</option><option value="yes">Automática</option></select></label><label>Intervalo (segundos)<input type="number" min="1.5" max="30" step=".5" value={(b.slideInterval??5000)/1000} onChange={e=>updateBlock(b.id,{slideInterval:Math.min(30000,Math.max(1500,Math.round(Number(e.target.value||5)*1000)))})}/></label></div>
  <label className="checkbox-line"><input type="checkbox" checked={b.slideShowPauseButton===true} onChange={e=>updateBlock(b.id,{slideShowPauseButton:e.target.checked})}/>Mostrar botão flutuante de pausa/reprodução</label>
  {(b.slides??[]).map((item,index)=><div className="project-composition-item" key={item.id}><div className="edit-block-top"><b>Slide {index+1}</b><div><button type="button" disabled={index===0} aria-label="Subir slide" onClick={()=>{const arr=[...(b.slides??[])];[arr[index-1],arr[index]]=[arr[index],arr[index-1]];updateBlock(b.id,{slides:arr})}}><ArrowUp size={15}/></button><button type="button" disabled={index===(b.slides??[]).length-1} aria-label="Descer slide" onClick={()=>{const arr=[...(b.slides??[])];[arr[index+1],arr[index]]=[arr[index],arr[index+1]];updateBlock(b.id,{slides:arr})}}><ArrowDown size={15}/></button><button type="button" onClick={()=>updateBlock(b.id,{slides:(b.slides??[]).filter(x=>x.id!==item.id)})} aria-label="Remover slide"><Trash2 size={15}/></button></div></div>
   <MediaField label="Imagem do slide" folder={'projects/'+draft.id} slot={item.id} value={item.image} onChange={image=>updateBlock(b.id,{slides:(b.slides??[]).map(x=>x.id===item.id?{...x,image}:x)})} onError={setMessage}/>
   <label>Nome alternativo da imagem<input value={item.title} onChange={e=>updateBlock(b.id,{slides:(b.slides??[]).map(x=>x.id===item.id?{...x,title:e.target.value}:x)})} placeholder="Ex.: Close-up da escultura"/></label>
  </div>)}
  <button type="button" className="subtle-action" onClick={()=>updateBlock(b.id,{slides:[...(b.slides??[]),{id:'slide-'+crypto.randomUUID(),image:'',title:'',caption:''} satisfies SlideEntry]})}><Plus size={15}/>Adicionar slide</button>
 </div>}
 <button className="inline-add-block" type="button" onClick={()=>setInsertAt(i+1)}><Plus size={14}/>Inserir layout depois deste bloco</button>
 </section>)}</div>
 <div className="add-blocks"><button type="button" onClick={()=>setInsertAt(draft.blocks.length)}><Plus size={16}/>Adicionar bloco — escolher layout</button></div>
 </>}
 {tab==='process'&&<>
 <p className="local-warning">As etapas são exibidas pelo template “Processo criativo” da guia Composição, na posição que você escolher. No computador formam uma única linha e no celular um carrossel. Use apenas imagens reais do processo.</p>
 <div className="editor-section-title"><h3>Etapas do processo criativo</h3><p>Quantidade livre, títulos editáveis e ordem personalizada.</p></div>
 {steps.map((step,index)=><article className="process-edit-card" key={step.id}><div className="edit-block-top"><b>Etapa {index+1}</b><div><button type="button" aria-label="Mover etapa acima" onClick={()=>moveStep(index,index-1)}><ArrowUp size={16}/></button><button type="button" aria-label="Mover etapa abaixo" onClick={()=>moveStep(index,index+1)}><ArrowDown size={16}/></button><button type="button" aria-label="Excluir etapa" onClick={()=>patch({processSteps:steps.filter(s=>s.id!==step.id)})}><Trash2 size={16}/></button></div></div><label>Nome da etapa<input value={step.label} onChange={e=>updateStep(step.id,{label:e.target.value})} placeholder="Sculpt, Retopology, Texturing, Final..."/></label><MediaField value={step.image} onChange={image=>updateStep(step.id,{image})} label={'Imagem '+step.label} folder={'projects/'+draft.id} slot={'process-'+step.id} onError={setMessage}/></article>)}
 <button type="button" className="subtle-action" onClick={addStep}><Plus size={16}/>Adicionar etapa</button>
 {steps.length===0&&<p className="editor-help">Adicione etapas e, na guia Composição, insira o template “Processo criativo” para exibi-las no projeto.</p>}
 </>}
 {tab==='filters'&&<>
 <p className="local-warning">Cada filtro usa um ícone Lucide ou um arquivo na pasta lógica <strong>filter-icons/</strong>. Apenas projetos vinculados à categoria aparecerão quando ela for selecionada.</p>
 <div className="filter-edit-list">{categories.map(c=><div key={c.id} className="filter-edit-row"><div className="filter-edit-title"><FilterIcon category={c}/><b>{c.label}</b><small>{projects.filter(p=>p.category===c.label).length} projetos</small></div><label>Ícone<select aria-label={'Ícone de '+c.label} value={c.icon} onChange={e=>setCategory(c.id,{icon:e.target.value as CategoryIcon,image:undefined})}>{categoryIcons.map(icon=><option key={icon} value={icon}>{icon}</option>)}</select></label><label className="media-upload-button"><Upload size={14}/>Importar ícone<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const f=e.target.files?.[0];if(f)void uploadCategoryIcon(f,c.id)}}/></label><AssetClipButton folder="filter-icons" onSelect={image=>setCategory(c.id,{image})}/><button type="button" disabled={projects.some(p=>p.category===c.label)||draft.category===c.label} onClick={()=>onCategories(categories.filter(x=>x.id!==c.id))} aria-label={'Remover filtro '+c.label}><Trash2 size={17}/></button></div>)}</div>
 <div className="editor-section-title"><h3>Novo filtro</h3></div><label>Nome<input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="Ex.: Motion Design"/></label><label>Ícone inicial<select value={newIcon} onChange={e=>setNewIcon(e.target.value as CategoryIcon)}>{categoryIcons.map(icon=><option key={icon} value={icon}>{icon}</option>)}</select></label>
 <MediaField label="Ícone personalizado (opcional)" folder="filter-icons" slot={newCategory||'new-icon'} value={newImage} onChange={setNewImage} onError={setMessage}/>
 <button type="button" className="subtle-action" onClick={createCategory}><Plus size={16}/>Criar filtro</button><p className="editor-help">Para usar o novo filtro, volte a Projeto e selecione-o no campo Categoria. Mudanças nos filtros são salvas imediatamente.</p>
 </>}
 {tab==='backup'&&<><p className="local-warning">O modo local não altera os arquivos públicos do GitHub. Exporte o ZIP para obter seu conteúdo e as imagens agrupadas em <strong>public/images/projects/&lt;id&gt;/</strong> e <strong>public/images/filter-icons/</strong>. Importar o ZIP restaura o Studio neste navegador.</p><div className="backup-actions"><button type="button" disabled={pending} onClick={async()=>{setPending(true);try{await onExport();setMessage('Backup ZIP gerado.')}catch{setMessage('Não foi possível exportar o backup.')}finally{setPending(false)}}}><Download size={17}/>Exportar pacote ZIP</button><label className="file-import"><Upload size={17}/>Restaurar ZIP/JSON<input type="file" accept=".zip,.json,application/zip,application/json" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;setPending(true);try{await onImport(f);setMessage('Backup restaurado! Feche e reabra o editor para recarregar os dados.')}catch(err){setMessage(err instanceof Error?err.message:'Arquivo de backup inválido.')}finally{setPending(false)}}}/></label></div><p className="editor-help">Mídias enviadas por você ficam no IndexedDB deste navegador. Um ZIP é útil para backup e transferência, mas não publica nada automaticamente.</p></>}
 {message&&<p className="editor-status" role="status">{message}</p>}
 </div>
 {insertAt!==null&&<div className="quick-insert-popover" role="dialog" aria-label="Escolher layout de bloco"><div className="quick-insert-head"><b>Qual layout deseja adicionar?</b><button onClick={()=>setInsertAt(null)} aria-label="Fechar escolha"><X size={18}/></button></div><div className="quick-insert-grid">{templates.map(t=><button type="button" key={t.type} onClick={()=>{addBlock(t.type,insertAt);setTab('composition')}}><span className={'template-sketch '+t.type} aria-hidden="true">{t.type==='video'?<Clapperboard size={27}/>:t.type==='model'?<BoxIcon size={29}/>:<><i/><i/><i/></>}</span><b>{t.label}</b></button>)}</div></div>}
 <footer>{project&&<button type="button" className="delete-action" onClick={()=>{if(window.confirm('Excluir o projeto deste navegador?')){onDelete(project.id);onClose()}}}><Trash2 size={16}/>Excluir</button>}<span className="studio-project-save-hint">Rascunho local · Publique depois de revisar</span>{tab==='composition'&&<button type="button" className="add-footer-block" onClick={()=>setInsertAt(draft.blocks.length)}><Plus size={16}/>Novo bloco</button>}<button type="button" className="save-action" onClick={save}><Save size={17}/>Salvar alterações</button></footer></section></div>
}
