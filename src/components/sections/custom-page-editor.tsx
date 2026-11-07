import {useEffect,useState,type DragEvent} from 'react'
import {ArrowDown,ArrowUp,BookOpen,Copy,ExternalLink,FileText,ImagePlus,Layers,Link2,Plus,Save,Sparkles,Trash2,Upload,X,GripVertical,Clapperboard,Box as BoxIcon,GalleryHorizontal,Heading2,AlignLeft,Columns2,Minus} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'
import {AssetImage} from '../ui/asset-image'
import {AssetClipButton} from '../ui/asset-picker'
import {QuickEditImageButton} from '../ui/image-quick-editor'
import {TextComposer} from '../ui/text-composer'
import {ProjectVideo} from '../ui/project-video'
import {ProjectModel} from '../ui/project-model'
import {parseVideoEmbed} from '../../lib/video-embed'
import {parseModelUrl} from '../../lib/model-embed'
import {isLocalMedia,saveUploadedMedia} from '../../lib/media-store'
import {customPageIconOptions,newCustomPage,normalizeCustomPages,safePageHref,type CustomPage,type CustomPageIcon,type PageBlock,type PageButtonAction,type ShowcaseItem,type SlideItem,type SlideTransition} from '../../data/custom-pages'

type Props={
 pages:CustomPage[]
 initialPageId?:string|null
 onSavePages:(pages:CustomPage[])=>void
 onNavigatePage:(id:string)=>void
 onClose:()=>void
}
type Tab='manage'|'identity'|'composition'
type Kind=PageBlock['type']
const templates:{type:Kind;title:string;description:string;Icon:LucideIcon}[]=[
 {type:'heading',title:'Título',description:'Seção de destaque',Icon:Heading2},
 {type:'text',title:'Texto rico',description:'Descrição e conteúdo',Icon:AlignLeft},
 {type:'image',title:'Imagem',description:'Arte com zoom',Icon:ImagePlus},
 {type:'image-left',title:'Imagem + texto',description:'Imagem à esquerda',Icon:Columns2},
 {type:'image-right',title:'Texto + imagem',description:'Imagem à direita',Icon:Columns2},
 {type:'gallery',title:'Galeria',description:'Múltiplas imagens',Icon:GalleryHorizontal},
 {type:'before-after',title:'Antes / depois',description:'Comparador de imagens',Icon:Layers},
 {type:'video',title:'Vídeo',description:'YouTube ou Vimeo',Icon:Clapperboard},
 {type:'model',title:'Modelo 3D',description:'GLB ou glTF',Icon:BoxIcon},
 {type:'divider',title:'Divisor',description:'Separar seções',Icon:Minus},
 {type:'action',title:'Botão de ação',description:'Copiar ou abrir link',Icon:Link2},
 {type:'showcase',title:'Galeria interativa',description:'Artes, certificados ou coleções',Icon:GalleryHorizontal},
 {type:'slideshow',title:'Slides',description:'Transições e reprodução',Icon:Clapperboard}
]
function PageMediaField({value,onChange,folder,slot,label,onError}:{value:string;onChange:(value:string)=>void;folder:string;slot:string;label:string;onError:(message:string)=>void}){
 const [busy,setBusy]=useState(false)
 const upload=async(file:File)=>{
  setBusy(true)
  try{onChange(await saveUploadedMedia(file,folder,slot))}
  catch(e){onError(e instanceof Error?e.message:'Falha ao importar imagem.')}
  finally{setBusy(false)}
 }
 const drop=(event:DragEvent<HTMLDivElement>)=>{
  event.preventDefault()
  const file=event.dataTransfer.files[0]
  const ref=event.dataTransfer.getData('application/x-jf-asset')
  if(file)void upload(file)
  else if(ref)onChange(ref)
 }
 return <div className="custom-page-media-field">
  <div className="custom-page-media-preview" onDragOver={e=>e.preventDefault()} onDrop={drop}>{value?<AssetImage src={value} alt={'Prévia: '+label}/>:<span><ImagePlus size={23}/>Arraste ou selecione uma imagem</span>}</div>
  <div className="custom-page-media-tools">
   <label className="custom-page-upload"><Upload size={14}/>{busy?'Importando…':'Enviar imagem'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file)}}/></label>
   <AssetClipButton folder={folder} onSelect={onChange}/>
   {value&&<QuickEditImageButton source={value} folder={folder} onSave={onChange}/>}
   {value&&<button type="button" onClick={()=>onChange('')}><X size={14}/>Remover</button>}
  </div>
  <label>{label} · Endereço da imagem<input value={isLocalMedia(value)?'':value} onChange={e=>onChange(e.target.value)} placeholder={isLocalMedia(value)?'Imagem armazenada neste navegador':'https://... ou site://images/...'} aria-label={label}/></label>
 </div>
}
const clone=(page:CustomPage):CustomPage=>JSON.parse(JSON.stringify(page)) as CustomPage
export function CustomPageEditor({pages,initialPageId,onSavePages,onNavigatePage,onClose}:Props){
 const original=pages.find(page=>page.id===initialPageId)
 const [draft,setDraft]=useState<CustomPage|null>(()=>original?clone(original):initialPageId==='new'?newCustomPage():null)
 const [tab,setTab]=useState<Tab>(()=>original||initialPageId==='new'?'identity':'manage')
 const [error,setError]=useState('')
 const [dragged,setDragged]=useState('')
 const [insertAt,setInsertAt]=useState<number|null>(null)
 const folder='pages/'+(draft?.id??'new')
 useEffect(()=>{if(insertAt===null)return;const onEscape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();setInsertAt(null)}};document.addEventListener('keydown',onEscape);return()=>document.removeEventListener('keydown',onEscape)},[insertAt])
 useEffect(()=>{const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=before}},[])
 const dirty=()=>!!draft&&JSON.stringify(draft)!==JSON.stringify(pages.find(p=>p.id===draft.id)??null)
 const close=()=>{if(dirty()&&!window.confirm('Descartar alterações ainda não salvas desta página?'))return;onClose()}
 const open=(page:CustomPage)=>{if(dirty()&&!window.confirm('Descartar mudanças não salvas antes de abrir outra página?'))return;setDraft(clone(page));setError('');setTab('identity')}
 const create=()=>{if(dirty()&&!window.confirm('Descartar mudanças não salvas antes de criar outra página?'))return;setDraft(newCustomPage());setError('');setTab('identity')}
 const patch=(change:Partial<CustomPage>)=>setDraft(value=>value?{...value,...change}:value)
 const patchBlock=(id:string,change:Partial<PageBlock>)=>setDraft(value=>value?{...value,blocks:value.blocks.map(block=>block.id===id?{...block,...change}:block)}:value)
 const addBlock=(type:Kind,index?:number)=>{
  if(!draft)return
  const block:PageBlock={
   id:'block-'+crypto.randomUUID(),type,content:'',
   gallery:type==='gallery'?['','']:undefined,
   showcaseItems:type==='showcase'?[]:undefined,
   slideItems:type==='slideshow'?[]:undefined,
   slideAutoplay:false,slideTransition:'fade',slideInterval:5000,
   slideHeight:520,slideFit:'contain',slideShowPauseButton:false,
   dividerIcon:type==='divider'?'sparkles':undefined,
   dividerStyle:type==='divider'?'glow':undefined,
   buttonLabel:type==='action'?'Copy content':undefined,
   buttonAction:type==='action'?'copy':undefined,
   buttonStyle:'primary',buttonAlign:'left',buttonWidth:'auto'
  }
  const blocks=[...draft.blocks]
  blocks.splice(index??blocks.length,0,block)
  patch({blocks})
  setInsertAt(null)
 }
 const moveBlock=(from:number,to:number)=>{
  if(!draft||to<0||to>=draft.blocks.length||from===to)return
  const blocks=[...draft.blocks]
  const [item]=blocks.splice(from,1);blocks.splice(to,0,item);patch({blocks})
 }
 const dropBlock=(e:DragEvent<HTMLElement>,index:number)=>{
  e.preventDefault()
  const id=e.dataTransfer.getData('application/x-jf-page-block')
  if(!id||!draft)return
  const from=draft.blocks.findIndex(b=>b.id===id)
  if(from>=0)moveBlock(from,index)
  setDragged('')
 }
 const setPages=(next:CustomPage[])=>onSavePages(normalizeCustomPages(next))
 const movePage=(index:number,direction:number)=>{const to=index+direction;if(to<0||to>=pages.length)return;const next=[...pages];[next[index],next[to]]=[next[to],next[index]];setPages(next)}
 const toggleVisibility=(id:string)=>setPages(pages.map(p=>p.id===id?{...p,showInNav:!p.showInNav}:p))
 const duplicate=(page:CustomPage)=>{
  if(dirty()&&!window.confirm('Descartar mudanças não salvas antes de duplicar?'))return
  const next=clone(page)
  next.id='page-'+crypto.randomUUID()
  next.title=page.title+' — Copy'
  next.navLabel=(page.navLabel+' Copy').slice(0,35)
  next.showInNav=false
  next.blocks=page.blocks.map(b=>({...b,id:'block-'+crypto.randomUUID()}))
  setDraft(next);setTab('identity');setError('')
 }
 const remove=(id:string)=>{
  const page=pages.find(item=>item.id===id)
  if(!page||!window.confirm('Excluir a página "'+page.title+'"? Seus links externos deixarão de funcionar depois da publicação. Faça backup se quiser preservar o conteúdo.'))return
  setPages(pages.filter(item=>item.id!==id))
  if(draft?.id===id){setDraft(null);setTab('manage')}
  setError('')
 }
 const save=()=>{
  if(!draft)return
  const title=draft.title.trim(),navLabel=draft.navLabel.trim()
  if(!title||!navLabel){setError('Informe o título da página e o texto do menu.');setTab('identity');return}
  if(!draft.blocks.every(block=>block.type!=='action'||block.buttonAction==='copy'||!block.content.trim()||!!safePageHref(block.content))){
   setError('Há um botão com link inválido. Use https://, http://, mailto: ou um link interno como #/portfolio.')
   setTab('composition');return
  }
  const result=normalizeCustomPages([{...draft,title,navLabel},...pages.filter(p=>p.id!==draft.id)])
  // Preserve the position of an existing page in the navigation.
  const index=pages.findIndex(p=>p.id===draft.id)
  if(index>=0){const item=result.shift()!;result.splice(index,0,item)}
  setPages(result)
  onNavigatePage(draft.id)
  onClose()
 }
 const saveNeeded=!!draft
 return <div className="editor-overlay custom-page-editor-overlay" lang="pt-BR"><section className="editor-panel custom-page-editor" role="dialog" aria-modal="true" aria-label="Construtor de páginas personalizadas">
  <header><div><span className="eyebrow">✦ LOCAL STUDIO · PAGE BUILDER</span><h2>{draft?draft.title||'Nova página':'Criar e organizar páginas'}</h2><small>Conteúdo modular · Menu lateral · Rascunho local</small></div><button type="button" onClick={close} aria-label="Fechar construtor de páginas"><X size={20}/></button></header>
  <div className="custom-page-editor-tabs" role="tablist" aria-label="Seções do construtor">
   <button role="tab" aria-selected={tab==='manage'} onClick={()=>{if(dirty()&&!window.confirm('Descartar alterações não salvas e voltar à lista?'))return;setDraft(null);setTab('manage')}}>01 · Minhas páginas</button>
   <button role="tab" aria-selected={tab==='identity'} disabled={!draft} onClick={()=>setTab('identity')}>02 · Identidade</button>
   <button role="tab" aria-selected={tab==='composition'} disabled={!draft} onClick={()=>setTab('composition')}>03 · Composição</button>
  </div>
  <div className="editor-scroll">
   {tab==='manage'&&<div className="custom-pages-manager">
    <div className="custom-pages-intro"><span className="custom-page-symbol"><BookOpen size={24}/></span><div><h3>Seu site pode crescer com seus projetos.</h3><p>Crie cursos, recursos, downloads, guias ou qualquer página nova. Reorganize o menu e publique tudo quando estiver pronto.</p></div></div>
    <button type="button" className="custom-pages-create" onClick={create}><Plus size={18}/> Criar nova página</button>
    <div className="custom-pages-list">
     {pages.map((page,index)=><article className="custom-pages-entry" key={page.id}><span className="custom-pages-entry-mark"><FileText size={19}/></span><div className="custom-pages-entry-info"><strong>{page.navLabel}</strong><small>{page.title} · {page.blocks.length} blocos · {page.showInNav?'Visível no menu':'Oculta do menu'}</small><span>#/page/{page.id}</span></div><div className="custom-pages-entry-actions">
      <button type="button" onClick={()=>movePage(index,-1)} disabled={index===0} title="Mover para cima" aria-label={'Subir '+page.navLabel}><ArrowUp size={15}/></button>
      <button type="button" onClick={()=>movePage(index,1)} disabled={index===pages.length-1} title="Mover para baixo" aria-label={'Descer '+page.navLabel}><ArrowDown size={15}/></button>
      <button type="button" onClick={()=>toggleVisibility(page.id)} title={page.showInNav?'Ocultar do menu':'Mostrar no menu'}>{page.showInNav?'Visível':'Oculta'}</button>
      <button type="button" onClick={()=>open(page)} title="Editar página">Editar</button>
      <button type="button" onClick={()=>duplicate(page)} title="Duplicar página" aria-label={'Duplicar '+page.navLabel}><Copy size={14}/></button>
      <button type="button" onClick={()=>remove(page.id)} title="Excluir página" aria-label={'Excluir '+page.navLabel}><Trash2 size={15}/></button>
     </div></article>)}
     {!pages.length&&<p className="custom-pages-empty"><Sparkles size={22}/> Nenhuma página adicional criada. Comece com uma página de curso, recursos ou materiais.</p>}
    </div>
    <p className="editor-help">Páginas ocultas apenas saem do menu — continuam acessíveis com o link direto. A ordem acima se aplica às páginas adicionais, entre Portfolio e About.</p>
   </div>}
   {draft&&tab==='identity'&&<div className="custom-page-settings">
    <p className="local-warning">O endereço da página permanece estável mesmo quando o título muda. Suas alterações são locais até clicar em Publicar no GitHub.</p>
    <div className="editor-two"><label>Título principal<input maxLength={160} value={draft.title} onChange={e=>patch({title:e.target.value})} placeholder="Creative resources"/></label><label>Nome na barra lateral<input maxLength={35} value={draft.navLabel} onChange={e=>patch({navLabel:e.target.value})} placeholder="Resources"/></label></div>
    <div className="editor-two"><label>Ícone da navegação<select value={draft.icon} onChange={e=>patch({icon:e.target.value as CustomPageIcon})}>{customPageIconOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Área de conteúdo<select value={draft.layout} onChange={e=>patch({layout:e.target.value as CustomPage['layout']})}><option value="standard">Editorial · Leitura</option><option value="wide">Expandida · Galerias</option></select></label></div>
    <label className="custom-page-visibility"><input type="checkbox" checked={draft.showInNav} onChange={e=>patch({showInNav:e.target.checked})}/> Mostrar esta página na barra de navegação</label>
    <label>Texto pequeno acima do título<input maxLength={120} value={draft.eyebrow} onChange={e=>patch({eyebrow:e.target.value})} placeholder="✦ PREMIUM RESOURCES"/></label>
    <TextComposer label="Apresentação abaixo do título" rows={4} value={draft.subtitle} onChange={subtitle=>patch({subtitle})}/>
    <div className="editor-section-title"><h3>Capa da página</h3><p>Opcional. Use uma imagem discreta como nos projetos; ela não substitui seu conteúdo.</p></div>
    <PageMediaField value={draft.heroImage} onChange={heroImage=>patch({heroImage})} folder={folder} slot="hero" label="Banner / arte de fundo" onError={setError}/>
    {draft.heroImage&&<div className="custom-page-framing">
     <label>Posição horizontal · {draft.heroPositionX}%<input type="range" min="0" max="100" value={draft.heroPositionX} onChange={e=>patch({heroPositionX:Number(e.target.value)})}/></label>
     <label>Posição vertical · {draft.heroPositionY}%<input type="range" min="0" max="100" value={draft.heroPositionY} onChange={e=>patch({heroPositionY:Number(e.target.value)})}/></label>
     <div className="custom-page-framing-preview"><AssetImage src={draft.heroImage} alt="Prévia do enquadramento" style={{objectPosition:draft.heroPositionX+'% '+draft.heroPositionY+'%'}}/></div>
    </div>}
    <p className="editor-help">Endereço permanente da página: <code>#/page/{draft.id}</code>. Ele funciona mesmo se você alterar o nome do menu.</p>
   </div>}
   {draft&&tab==='composition'&&<div className="custom-page-composition">
    <p className="local-warning">Monte seu conteúdo como um projeto: títulos, textos, imagens, galerias, vídeos, modelos 3D e botões. Organize os blocos com as setas ou arraste pela alça.</p>
    <div className="editor-section-title"><h3>Biblioteca de blocos</h3><p>Escolha o tipo de seção. Você poderá reorganizar tudo antes de salvar.</p></div>
    <div className="custom-page-template-grid">{templates.map(({type,title,description,Icon})=><button type="button" key={type} onClick={()=>addBlock(type)}><span className="custom-page-template-icon"><Icon size={23}/></span><strong>{title}</strong><small>{description}</small></button>)}</div>
    <div className="editor-section-title"><h3>Estrutura da página</h3><p>{draft.blocks.length} blocos · os visitantes verão esta mesma sequência.</p></div>
    {draft.blocks.map((block,index)=><section className={'custom-page-edit-block'+(dragged===block.id?' dragging':'')} key={block.id} onDragOver={e=>e.preventDefault()} onDrop={e=>dropBlock(e,index)}>
     <div className="custom-page-edit-block-head"><span className="custom-page-drag" draggable onDragStart={e=>{e.dataTransfer.setData('application/x-jf-page-block',block.id);setDragged(block.id)}} onDragEnd={()=>setDragged('')} title="Arrastar para reordenar"><GripVertical size={18}/></span><strong>{String(index+1).padStart(2,'0')} · {templates.find(t=>t.type===block.type)?.title??block.type}</strong><div><button type="button" onClick={()=>moveBlock(index,index-1)} disabled={index===0} aria-label="Mover bloco para cima"><ArrowUp size={16}/></button><button type="button" onClick={()=>moveBlock(index,index+1)} disabled={index===draft.blocks.length-1} aria-label="Mover bloco para baixo"><ArrowDown size={16}/></button><button type="button" onClick={()=>patch({blocks:draft.blocks.filter(item=>item.id!==block.id)})} aria-label="Excluir bloco"><Trash2 size={16}/></button></div></div>
     {block.type==='heading'&&<TextComposer heading value={block.content} label="Título da seção" rows={3} onChange={content=>patchBlock(block.id,{content})}/>}
     {block.type==='text'&&<TextComposer value={block.content} label="Texto e descrição" rows={5} onChange={content=>patchBlock(block.id,{content})}/>}
     {block.type==='image'&&<PageMediaField value={block.content} onChange={content=>patchBlock(block.id,{content})} folder={folder} slot={block.id} label="Imagem de destaque" onError={setError}/>}
     {(block.type==='image-left'||block.type==='image-right')&&<><PageMediaField value={block.media??''} onChange={media=>patchBlock(block.id,{media})} folder={folder} slot={block.id} label="Imagem lateral" onError={setError}/><TextComposer value={block.content} rows={4} onChange={content=>patchBlock(block.id,{content})} label="Texto ao lado da imagem"/></>}
     {block.type==='gallery'&&<><div className="custom-page-gallery-fields">{(block.gallery??[]).map((src,j)=><div key={j} className="custom-page-gallery-item"><PageMediaField value={src} onChange={value=>patchBlock(block.id,{gallery:(block.gallery??[]).map((item,k)=>k===j?value:item)})} folder={folder} slot={block.id+'-'+j} label={'Imagem '+(j+1)} onError={setError}/><button type="button" className="subtle-action" onClick={()=>patchBlock(block.id,{gallery:(block.gallery??[]).filter((_,k)=>k!==j)})}><X size={14}/> Remover imagem</button></div>)}</div><button type="button" className="custom-page-add-image" onClick={()=>patchBlock(block.id,{gallery:[...(block.gallery??[]),'']})}><Plus size={15}/> Adicionar imagem</button></>}
     {block.type==='showcase'&&<div className="custom-page-rich-gallery-editor">
      <p className="editor-help">Galeria interativa para certificados, concursos, artistas, coleções ou outros destaques. Cada item pode ter título, imagem e descrição. O painel de detalhes só abre ao clicar em um item; links são opcionais e os nomes não recebem numeração automática. Use URLs diretas de imagens públicas para evitar armazenamento adicional.</p>
      {(block.showcaseItems??[]).map((item,index)=><div className="custom-page-rich-gallery-entry" key={item.id}>
       <div className="custom-page-rich-gallery-head"><strong>{item.name.trim()||'Item sem título'}</strong><button type="button" onClick={()=>patchBlock(block.id,{showcaseItems:(block.showcaseItems??[]).filter(x=>x.id!==item.id)})}><Trash2 size={15}/> Remover</button></div>
       <label>Título do item<input value={item.name} onChange={e=>patchBlock(block.id,{showcaseItems:(block.showcaseItems??[]).map(x=>x.id===item.id?{...x,name:e.target.value}:x)})} placeholder="Ex.: Certificado de conclusão, obra ou participante"/></label>
       <label>URL direta da imagem<input type="url" value={item.image} onChange={e=>patchBlock(block.id,{showcaseItems:(block.showcaseItems??[]).map(x=>x.id===item.id?{...x,image:e.target.value}:x)})} placeholder="https://site.com/certificado.webp"/></label>
       {item.image&&<div className="custom-page-external-preview"><AssetImage src={item.image} alt={'Prévia de '+(item.name||'item')}/></div>}
       <label>Descrição do item<textarea rows={3} value={item.description} onChange={e=>patchBlock(block.id,{showcaseItems:(block.showcaseItems??[]).map(x=>x.id===item.id?{...x,description:e.target.value}:x)})} placeholder="Descreva a conquista, o trabalho ou a coleção..."/></label>
       <label className="custom-page-showcase-link-toggle"><input type="checkbox" checked={item.showLink!==false} onChange={e=>patchBlock(block.id,{showcaseItems:(block.showcaseItems??[]).map(x=>x.id===item.id?{...x,showLink:e.target.checked}:x)})}/><span><strong>Mostrar botão no painel de detalhes</strong><small>Desative para certificados ou itens que não precisam de link.</small></span></label>
       {item.showLink!==false&&<div className="editor-two"><label>Texto do botão<input maxLength={90} value={item.linkLabel??'View portfolio'} onChange={e=>patchBlock(block.id,{showcaseItems:(block.showcaseItems??[]).map(x=>x.id===item.id?{...x,linkLabel:e.target.value}:x)})} placeholder="Ex.: Ver certificado / Abrir portfólio"/></label><label>Destino do botão<input type="url" value={item.portfolioUrl} onChange={e=>patchBlock(block.id,{showcaseItems:(block.showcaseItems??[]).map(x=>x.id===item.id?{...x,portfolioUrl:e.target.value}:x)})} placeholder="https://..."/></label></div>}
       <div className="custom-page-item-order"><button type="button" disabled={index===0} onClick={()=>{const items=[...(block.showcaseItems??[])];[items[index-1],items[index]]=[items[index],items[index-1]];patchBlock(block.id,{showcaseItems:items})}}>↑ Subir</button><button type="button" disabled={index===(block.showcaseItems??[]).length-1} onClick={()=>{const items=[...(block.showcaseItems??[])];[items[index+1],items[index]]=[items[index],items[index+1]];patchBlock(block.id,{showcaseItems:items})}}>↓ Descer</button></div>
      </div>)}
      <button type="button" className="custom-page-add-image" onClick={()=>patchBlock(block.id,{showcaseItems:[...(block.showcaseItems??[]),{id:'item-'+crypto.randomUUID(),image:'',name:'',description:'',portfolioUrl:'',linkLabel:'View details',showLink:false} satisfies ShowcaseItem]})}><Plus size={15}/> Adicionar item à galeria</button>
     </div>}
     {block.type==='slideshow'&&<div className="custom-page-rich-gallery-editor">
      <div className="custom-page-slide-layout">
       <div className="editor-section-title"><h3>Altura e apresentação do carrossel</h3><p>A largura acompanha a composição do site. Ajuste somente a altura: quanto menor, mais imagens aparecem lado a lado.</p></div>
       <div className="custom-page-slide-layout-controls">
        <label>Altura do carrossel · {block.slideHeight??520} px<input type="range" min="180" max="640" step="20" value={block.slideHeight??520} onChange={e=>patchBlock(block.id,{slideHeight:Number(e.target.value)})}/></label>
        <label>Enquadramento<select value={block.slideFit??'contain'} onChange={e=>patchBlock(block.id,{slideFit:e.target.value as 'contain'|'cover'})}><option value="contain">Mostrar imagem completa</option><option value="cover">Preencher quadro (recortar)</option></select></label>
       </div>
       <label className="custom-page-slide-pause-option"><input type="checkbox" checked={block.slideShowPauseButton===true} onChange={e=>patchBlock(block.id,{slideShowPauseButton:e.target.checked})}/><span><strong>Mostrar botão flutuante de pausa/reprodução</strong><small>Discreto, sobre o canto inferior direito do carrossel. Desativado por padrão.</small></span></label>
       <div className="custom-page-slide-size-preview" aria-hidden="true"><div style={{height:Math.round(68*(block.slideHeight??520)/520)+22}}>{Array.from({length:(block.slideHeight??520)<=240?4:(block.slideHeight??520)<=320?3:(block.slideHeight??520)<=430?2:1},(_,j)=><span key={j}/>)}</div></div>
       <p className="editor-help">A largura acompanha sempre a área da página. Ajustar somente a altura determina quantas imagens aparecem lado a lado; no celular a quantidade se adapta ao espaço. Sem descrições, números ou faixa inferior.</p>
      </div>
      <div className="custom-page-button-options"><label>Reprodução automática<select value={block.slideAutoplay?'yes':'no'} onChange={e=>patchBlock(block.id,{slideAutoplay:e.target.value==='yes'})}><option value="no">Não · Manual</option><option value="yes">Sim · Automática</option></select></label><label>Transição<select value={block.slideTransition??'fade'} onChange={e=>patchBlock(block.id,{slideTransition:e.target.value as SlideTransition})}><option value="fade">Fade suave</option><option value="slide">Deslizamento</option><option value="zoom">Zoom cinematográfico</option></select></label><label>Intervalo (segundos)<input type="number" min="1.5" max="30" step=".5" value={(block.slideInterval??5000)/1000} onChange={e=>patchBlock(block.id,{slideInterval:Math.max(1500,Math.min(30000,Math.round(Number(e.target.value||5)*1000)))})}/></label></div>
      {(block.slideItems??[]).map((item,index)=><div className="custom-page-rich-gallery-entry" key={item.id}>
       <div className="custom-page-rich-gallery-head"><strong>Slide {index+1}</strong><button type="button" onClick={()=>patchBlock(block.id,{slideItems:(block.slideItems??[]).filter(x=>x.id!==item.id)})}><Trash2 size={15}/> Remover</button></div>
       <PageMediaField value={item.image} onChange={image=>patchBlock(block.id,{slideItems:(block.slideItems??[]).map(x=>x.id===item.id?{...x,image}:x)})} folder={folder} slot={block.id+'-slide-'+item.id} label="Imagem do slide" onError={setError}/>
       <div className="custom-page-item-order"><button type="button" disabled={index===0} onClick={()=>{const items=[...(block.slideItems??[])];[items[index-1],items[index]]=[items[index],items[index-1]];patchBlock(block.id,{slideItems:items})}}>↑ Subir</button><button type="button" disabled={index===(block.slideItems??[]).length-1} onClick={()=>{const items=[...(block.slideItems??[])];[items[index+1],items[index]]=[items[index],items[index+1]];patchBlock(block.id,{slideItems:items})}}>↓ Descer</button></div>
      </div>)}
      <button type="button" className="custom-page-add-image" onClick={()=>patchBlock(block.id,{slideItems:[...(block.slideItems??[]),{id:'slide-'+crypto.randomUUID(),image:'',caption:''} satisfies SlideItem]})}><Plus size={15}/> Adicionar slide</button>
     </div>}
     {block.type==='before-after'&&<><div className="editor-two"><PageMediaField value={block.media??''} onChange={media=>patchBlock(block.id,{media})} folder={folder} slot={block.id+'-before'} label="Antes" onError={setError}/><PageMediaField value={block.after??''} onChange={after=>patchBlock(block.id,{after})} folder={folder} slot={block.id+'-after'} label="Depois" onError={setError}/></div><div className="editor-two"><label>Legenda Antes<input value={block.beforeLabel??'Before'} onChange={e=>patchBlock(block.id,{beforeLabel:e.target.value})}/></label><label>Legenda Depois<input value={block.afterLabel??'After'} onChange={e=>patchBlock(block.id,{afterLabel:e.target.value})}/></label></div><TextComposer value={block.content} onChange={content=>patchBlock(block.id,{content})} rows={2} label="Legenda da comparação"/></>}
     {block.type==='divider'&&<div className="editor-two"><label>Ícone central<select value={block.dividerIcon??'sparkles'} onChange={e=>patchBlock(block.id,{dividerIcon:e.target.value as PageBlock['dividerIcon']})}><option value="sparkles">Brilho</option><option value="star">Estrela</option><option value="diamond">Diamante</option><option value="circle">Círculo</option><option value="none">Sem ícone</option></select></label><label>Estilo da linha<select value={block.dividerStyle??'glow'} onChange={e=>patchBlock(block.id,{dividerStyle:e.target.value as PageBlock['dividerStyle']})}><option value="glow">Brilho</option><option value="solid">Contínua</option><option value="dashed">Pontilhada</option></select></label></div>}
     {block.type==='video'&&<><label>Link do YouTube / Vimeo<input type="url" value={block.content} onChange={e=>patchBlock(block.id,{content:e.target.value})} placeholder="https://www.youtube.com/watch?v=..."/></label><label>Nome exibido no player (opcional)<input value={block.videoTitle??''} onChange={e=>patchBlock(block.id,{videoTitle:e.target.value})}/></label><PageMediaField value={block.media??''} onChange={media=>patchBlock(block.id,{media})} folder={folder} slot={block.id+'-video'} label="Miniatura do vídeo" onError={setError}/>{parseVideoEmbed(block.content)&&<div className="custom-page-inline-preview"><ProjectVideo url={block.content} poster={block.media} title={block.videoTitle||draft.title}/></div>}{block.content&&!parseVideoEmbed(block.content)&&<p role="alert" className="editor-status">Use um endereço de YouTube ou Vimeo.</p>}</>}
     {block.type==='model'&&<><label>Link direto GLB / glTF<input type="url" value={block.content} onChange={e=>patchBlock(block.id,{content:e.target.value})} placeholder="https://.../model.glb"/></label><PageMediaField value={block.media??''} onChange={media=>patchBlock(block.id,{media})} folder={folder} slot={block.id+'-3d'} label="Miniatura do 3D" onError={setError}/>{parseModelUrl(block.content)&&<div className="custom-page-inline-preview"><ProjectModel url={block.content} poster={block.media} title={draft.title}/></div>}{block.content&&!parseModelUrl(block.content)&&<p role="alert" className="editor-status">Use um link direto GLB / glTF com CORS, ou converta FBX para GLB.</p>}</>}
     {block.type==='action'&&<div className="custom-page-button-form">
      <div className="editor-two"><label>Texto do botão<input value={block.buttonLabel??''} onChange={e=>patchBlock(block.id,{buttonLabel:e.target.value})} placeholder="Copy PIX key / Download / Copy prompt"/></label><label>Ação do clique<select value={block.buttonAction??'copy'} onChange={e=>patchBlock(block.id,{buttonAction:e.target.value as PageButtonAction})}><option value="copy">Copiar texto ou chave PIX</option><option value="url-new">Abrir link em nova aba</option><option value="url-current">Abrir link nesta aba</option></select></label></div>
      {(block.buttonAction??'copy')==='copy'?<label>Texto a copiar (chave PIX, prompt, código ou qualquer texto)<textarea rows={6} spellCheck={false} value={block.content} onChange={e=>patchBlock(block.id,{content:e.target.value})} placeholder="Cole a chave PIX ou o prompt completo. O visitante copiará exatamente este conteúdo."/></label>:<label>Endereço de destino<input type="text" value={block.content} onChange={e=>patchBlock(block.id,{content:e.target.value})} placeholder="https://exemplo.com ou #/portfolio"/>{block.content&&!safePageHref(block.content)&&<small className="custom-page-field-warning">Link inválido. Use HTTPS ou um endereço interno do site.</small>}</label>}
      <label>Descrição opcional antes do botão<input value={block.buttonNote??''} onChange={e=>patchBlock(block.id,{buttonNote:e.target.value})} placeholder="Ex.: Copie a chave para efetuar o pagamento"/></label>
      <div className="custom-page-button-options"><label>Aparência<select value={block.buttonStyle??'primary'} onChange={e=>patchBlock(block.id,{buttonStyle:e.target.value as PageBlock['buttonStyle']})}><option value="primary">Destaque neon</option><option value="outline">Contorno minimalista</option></select></label><label>Alinhamento<select value={block.buttonAlign??'left'} onChange={e=>patchBlock(block.id,{buttonAlign:e.target.value as PageBlock['buttonAlign']})}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label><label>Largura<select value={block.buttonWidth??'auto'} onChange={e=>patchBlock(block.id,{buttonWidth:e.target.value as PageBlock['buttonWidth']})}><option value="auto">Adaptável ao texto</option><option value="full">Largura total</option></select></label></div>
      <div className="custom-page-button-sample">{(block.buttonAction??'copy')==='copy'?<Copy size={16}/>:<ExternalLink size={16}/>} <span>{block.buttonLabel||'Button preview'}</span></div>
      <p className="editor-help">Copiar funciona para PIX, prompts e textos grandes. Abrir URL usa apenas links permitidos; nunca executa código inserido no endereço. O botão não processa pagamentos.</p>
     </div>}
     <button type="button" className="custom-page-insert" onClick={()=>setInsertAt(index+1)}><Plus size={14}/> Inserir bloco depois deste · escolher layout</button>
    </section>)}
    {!draft.blocks.length&&<p className="custom-page-empty-composition"><Layers size={23}/> Sua página está vazia. Escolha um bloco acima para começar.</p>}
    <button type="button" className="custom-page-insert custom-page-add-end" onClick={()=>setInsertAt(draft.blocks.length)}><Plus size={15}/> Adicionar bloco · escolher layout</button>
   </div>}
   {error&&<p role="alert" className="custom-page-editor-error">{error}</p>}
  </div>
  {insertAt!==null&&draft&&tab==='composition'&&<div className="custom-page-block-picker-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)setInsertAt(null)}}>
   <div className="custom-page-block-picker" role="dialog" aria-label="Escolher tipo de bloco">
    <div className="custom-page-block-picker-header"><div><span className="eyebrow">✦ PAGE BUILDER</span><h3>Qual bloco deseja adicionar?</h3><p>O bloco será inserido na posição escolhida, sem alterar os demais.</p></div><button type="button" onClick={()=>setInsertAt(null)} aria-label="Fechar seleção de bloco"><X size={19}/></button></div>
    <div className="custom-page-block-picker-grid">{templates.map(({type,title,description,Icon})=><button type="button" key={type} onClick={()=>addBlock(type,insertAt)}><span className="custom-page-template-icon"><Icon size={23}/></span><strong>{title}</strong><small>{description}</small></button>)}</div>
   </div>
  </div>}
  <footer>
   <button type="button" className="subtle-action" onClick={close}>Fechar</button>
   {saveNeeded&&<><button type="button" className="subtle-action" onClick={()=>setTab('manage')}><BookOpen size={15}/> Voltar às páginas</button><button type="button" className="save-action" onClick={save}><Save size={17}/> Salvar página</button></>}
   {!saveNeeded&&<button type="button" className="save-action" onClick={create}><Plus size={16}/> Nova página</button>}
  </footer>
 </section></div>
}
