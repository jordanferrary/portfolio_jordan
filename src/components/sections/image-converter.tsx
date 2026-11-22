import {useEffect,useRef,useState} from 'react'
import type {ChangeEvent,DragEvent} from 'react'
import {Download,FileImage,ImageDown,Info,Upload,X} from 'lucide-react'
import {optimizeImage} from '../../lib/image-optimize'

const ACCEPTED=['image/png','image/jpeg','image/webp','image/avif']
const formatSize=(size:number)=>size>=1048576?(size/1048576).toFixed(2)+' MB':(size/1024).toFixed(0)+' KB'

export function ImageConverter({onClose}:{onClose:()=>void}){
 const [file,setFile]=useState<File|null>(null)
 const [max,setMax]=useState(2048)
 const [quality,setQuality]=useState(82)
 const [result,setResult]=useState<File|null>(null)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [dragging,setDragging]=useState(false)
 const [preview,setPreview]=useState('')
 const [sourcePreview,setSourcePreview]=useState('')
 const inputRef=useRef<HTMLInputElement>(null)
 useEffect(()=>{if(!file){setSourcePreview('');return}const url=URL.createObjectURL(file);setSourcePreview(url);return()=>URL.revokeObjectURL(url)},[file])
 useEffect(()=>{if(!result){setPreview('');return}const url=URL.createObjectURL(result);setPreview(url);return()=>URL.revokeObjectURL(url)},[result])
 const acceptFile=(next:File|null)=>{
  setError('')
  if(!next){setFile(null);setResult(null);return}
  if(!ACCEPTED.includes(next.type)){setError('Escolha uma imagem PNG, JPG, WebP ou AVIF.');return}
  setFile(next);setResult(null)
 }
 const pickFile=(event:ChangeEvent<HTMLInputElement>)=>{
  acceptFile(event.currentTarget.files?.[0]??null)
  event.currentTarget.value=''
 }
 const dropFile=(event:DragEvent<HTMLElement>)=>{
  event.preventDefault();setDragging(false)
  if(busy)return
  acceptFile(event.dataTransfer.files?.[0]??null)
 }
 const convert=async()=>{
  if(!file||busy)return
  setBusy(true);setError('')
  try{setResult(await optimizeImage(file,{maxDimension:max===6144?2048:max,quality:quality/100,profile:max===6144?'auto':'fixed'}))}
  catch(e){setResult(null);setError(e instanceof Error?e.message:'Falha na conversão.')}
  finally{setBusy(false)}
 }
 const download=()=>{
  if(!result||!preview)return
  const a=document.createElement('a')
  a.href=preview;a.download=result.name;a.click()
 }
 const savedPercent=result&&file?Math.round((1-result.size/file.size)*100):null
 return <div className="editor-overlay" lang="pt-BR">
  <section className="editor-panel image-converter-panel" role="dialog" aria-modal="true" aria-label="Conversor WebP">
   <header>
    <div><span className="eyebrow">LOCAL STUDIO / MÍDIA</span><h2>Conversor WebP</h2></div>
    <button type="button" disabled={busy} onClick={onClose} aria-label="Fechar"><X size={20}/></button>
   </header>
   <div className="editor-scroll converter-workspace">
    <p className="converter-intro">Converta e redimensione imagens no navegador. O arquivo original permanece intacto.</p>
    <div className="converter-section">
     <div className="converter-section-heading"><span className="converter-step">01</span><h3>Imagem de origem</h3></div>
     <div className={'converter-upload'+(dragging?' is-dragging':'')+(file?' has-file':'')}
      onDragOver={event=>{event.preventDefault();if(!busy)setDragging(true)}}
      onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setDragging(false)}}
      onDrop={dropFile}>
      <input ref={inputRef} className="converter-file-input" tabIndex={-1} type="file" accept={ACCEPTED.join(',')} onChange={pickFile} aria-label="Escolher imagem para converter" disabled={busy}/>
      {file&&sourcePreview?<img className="converter-source-thumb" src={sourcePreview} alt="Miniatura da imagem selecionada"/>:
       <span className="converter-upload-icon" aria-hidden="true"><Upload size={20}/></span>}
      <div className="converter-upload-text">
       <strong>{file?file.name:'Selecione uma imagem'}</strong>
       <span>{file?formatSize(file.size)+' · PNG, JPG, WebP ou AVIF':'PNG, JPG, WebP ou AVIF · arraste para cá ou procure no dispositivo'}</span>
      </div>
      <button type="button" className="converter-choose" disabled={busy} onClick={()=>inputRef.current?.click()}>{file?'Trocar':'Escolher arquivo'}</button>
     </div>
    </div>
    <div className="converter-section">
     <div className="converter-section-heading"><span className="converter-step">02</span><h3>Configurações</h3></div>
     <div className="converter-fields">
      <label className="converter-dimension"><span>Lado máximo</span>
       <select value={max} disabled={busy} onChange={event=>{setMax(Number(event.target.value));setResult(null)}}>
        <option value={1024}>1024 px · Compacto</option>
        <option value={1600}>1600 px · Equilíbrio</option>
        <option value={2048}>2048 px · Portfólio</option>
        <option value={4096}>4096 px · Alta resolução</option>
        <option value={6144}>Panorama / turnaround</option>
       </select>
      </label>
      <label className="converter-quality">
       <span className="converter-quality-caption">Qualidade WebP <output htmlFor="converter-quality" tabularNums>{quality}%</output></span>
       <input id="converter-quality" type="range" min={55} max={95} step={1} value={quality} disabled={busy}
        style={{'--converter-progress':((quality-55)/40*100)+'%'} as React.CSSProperties}
        onChange={event=>{setQuality(Number(event.target.value));setResult(null)}}/>
       <span className="converter-quality-scale"><small>Menor arquivo</small><small>Mais detalhes</small></span>
      </label>
     </div>
     <details className="converter-panorama-note">
      <summary><Info size={15}/> Sobre o modo panorama</summary>
      <p>Para imagens com proporção de pelo menos 2:1, o modo panorama preserva até 2048 px no lado menor, 6144 px no maior e 13 megapixels. Outros modos limitam o maior lado.</p>
     </details>
    </div>
    {result&&<div className="converter-section converter-result" role="status">
     <div className="converter-section-heading"><span className="converter-step">03</span><h3>Arquivo pronto</h3></div>
     <div className="converter-result-content">
      {preview&&<img src={preview} alt="Prévia da imagem convertida"/>}
      <div><strong>{result.name}</strong>
       <p>Original: {formatSize(file!.size)}</p>
       <p>WebP: {formatSize(result.size)}</p>
       <p>{savedPercent!==null?(savedPercent>=0?savedPercent+'% menor que o original':Math.abs(savedPercent)+'% maior que o original'):''}</p>
      </div>
     </div>
    </div>}
    {error&&<p className="editor-status converter-error" role="alert">{error}</p>}
   </div>
   <footer className="converter-footer">
    <span className="converter-local-note"><FileImage size={15}/> Processamento local</span>
    <button type="button" className="subtle-action" disabled={busy} onClick={onClose}>Fechar</button>
    <button type="button" className="save-action" disabled={!file||busy} onClick={()=>void convert()}><ImageDown size={16}/>{busy?'Convertendo…':result?'Converter novamente':'Converter'}</button>
    {result&&<button type="button" className="save-action converter-download" onClick={download}><Download size={16}/>Baixar WebP</button>}
   </footer>
  </section>
 </div>
}
