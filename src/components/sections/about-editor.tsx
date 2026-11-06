import {useState} from 'react'
import {ImagePlus,Save,Upload,X} from 'lucide-react'
import type {AboutContent} from '../../data/studio'
import {AssetImage} from '../ui/asset-image'
import {AssetClipButton} from '../ui/asset-picker'
import {TextComposer} from '../ui/text-composer'
import {saveUploadedMedia} from '../../lib/media-store'
type Props={value:AboutContent;onSave:(next:AboutContent)=>void;onClose:()=>void}
export function AboutEditor({value,onSave,onClose}:Props){
 const [draft,setDraft]=useState<AboutContent>({...value,specialties:[...value.specialties]})
 const [skillsText,setSkillsText]=useState(value.specialties.join('\n'))
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const patch=(delta:Partial<AboutContent>)=>setDraft(current=>({...current,...delta}))
 const upload=async(file:File,field:'portrait'|'secondaryImage')=>{
  setBusy(true)
  try{const source=await saveUploadedMedia(file,'about',field);patch({[field]:source});setError('')}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível importar a imagem.')}
  finally{setBusy(false)}
 }
 const save=()=>{if(!draft.titleFirst.trim()||!draft.name.trim()){setError('Informe o título e o nome do artista.');return}onSave({...draft,specialties:skillsText.split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean).slice(0,30)});onClose()}
 return <div className="editor-overlay"><section className="editor-panel about-editor" role="dialog" aria-modal="true" aria-label="Editar página Sobre"><header><div><span className="eyebrow">✦ LOCAL STUDIO</span><h2>Personalizar Sobre</h2></div><button onClick={onClose} aria-label="Fechar editor"><X/></button></header>
  <div className="editor-scroll"><p className="local-warning">Todas as alterações ficam neste navegador até o conteúdo ser publicado em uma hospedagem com backend.</p>
  <label>Texto pequeno acima do título<input value={draft.eyebrow} onChange={e=>patch({eyebrow:e.target.value})}/></label>
  <label>Primeira parte do título<input value={draft.titleFirst} onChange={e=>patch({titleFirst:e.target.value})}/></label>
  <label>Parte destacada em roxo<input value={draft.titleAccent} onChange={e=>patch({titleAccent:e.target.value})}/></label>
  <label>Nome exibido<input value={draft.name} onChange={e=>patch({name:e.target.value})}/></label>
  <div className="about-editor-label">Biografia — aceita negrito, itálico e destaque roxo</div><TextComposer label="Biografia Sobre" value={draft.bio} onChange={bio=>patch({bio})} rows={6}/>
  <label>Profissões e especialidades (uma por linha)<textarea value={skillsText} onChange={e=>setSkillsText(e.target.value)} rows={7} placeholder="Modelagem 3D&#10;Sculpting&#10;Motion Design"/></label>
  {(['portrait','secondaryImage'] as const).map(field=><div className="about-editor-media" key={field}><h3>{field==='portrait'?'Imagem principal':'Imagem complementar (opcional)'}</h3><div className="about-editor-image-frame">{draft[field]?<AssetImage src={draft[field]} alt="Prévia da imagem"/>:<ImagePlus size={28}/>}</div><div className="about-editor-image-actions"><label className="media-upload-button"><Upload size={15}/>{busy?'Importando...':'Importar imagem'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file,field);e.target.value=''}}/></label><AssetClipButton folder="about" onSelect={source=>patch({[field]:source})}/>{draft[field]&&<button onClick={()=>patch({[field]:''})}>Remover</button>}</div></div>)}
  {error&&<p role="alert" className="editor-status">{error}</p>}</div>
  <footer><button className="save-action" onClick={save}><Save size={16}/>Salvar página Sobre</button></footer>
 </section></div>
}
