import {useEffect,useState} from 'react'
import {Download,ImageDown,Upload,X} from 'lucide-react'
import {optimizeImage} from '../../lib/image-optimize'
export function ImageConverter({onClose}:{onClose:()=>void}){
 const [file,setFile]=useState<File|null>(null)
 const [max,setMax]=useState(2048)
 const [quality,setQuality]=useState(82)
 const [result,setResult]=useState<File|null>(null)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [preview,setPreview]=useState('')
 useEffect(()=>{if(!result){setPreview('');return}const url=URL.createObjectURL(result);setPreview(url);return()=>URL.revokeObjectURL(url)},[result])
 const convert=async()=>{
  if(!file)return
  setBusy(true);setError('')
  try{setResult(await optimizeImage(file,{maxDimension:max,quality:quality/100}))}
  catch(e){setResult(null);setError(e instanceof Error?e.message:'Falha na conversão.')}
  finally{setBusy(false)}
 }
 const download=()=>{if(!result||!preview)return;const a=document.createElement('a');a.href=preview;a.download=result.name;a.click()}
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel image-converter-panel" role="dialog" aria-modal="true" aria-label="Conversor WebP"><header><div><span className="eyebrow">✦ LOCAL STUDIO · MÍDIA</span><h2>Conversor de imagens WebP</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></header>
 <div className="editor-scroll">
 <p className="editor-help">A conversão acontece apenas neste navegador. Arquivos importados pelo Studio já são otimizados automaticamente; use esta ferramenta para gerar arquivos WebP para outros projetos.</p>
 <label className="media-upload-button"><Upload size={17}/> {file?file.name:'Escolher imagem PNG, JPG, WebP ou AVIF'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{setFile(e.target.files?.[0]??null);setResult(null);setError('')}}/></label>
 <div className="converter-fields"><label>Lado máximo (pixels)<select value={max} onChange={e=>{setMax(Number(e.target.value));setResult(null)}}><option value={1024}>1024 px — compacto</option><option value={1600}>1600 px — equilíbrio</option><option value={2048}>2048 px — portfólio</option><option value={4096}>4096 px — alta resolução</option></select></label><label>Qualidade WebP: {quality}%<input type="range" min="55" max="95" step="1" value={quality} onChange={e=>{setQuality(Number(e.target.value));setResult(null)}}/></label></div>
 {result&&<div className="converter-result"><img src={preview} alt="Prévia convertida"/><p><strong>{result.name}</strong></p><p>{(file!.size/1048576).toFixed(2)} MB → {(result.size/1048576).toFixed(2)} MB · {Math.round((1-result.size/file!.size)*100)}% de diferença no tamanho</p></div>}
 {error&&<p className="editor-status" role="alert">{error}</p>}
 </div><footer><button type="button" className="subtle-action" onClick={onClose}>Fechar</button><button type="button" className="save-action" disabled={!file||busy} onClick={()=>void convert()}><ImageDown size={16}/>{busy?'Convertendo…':'Converter'}</button>{result&&<button type="button" className="save-action" onClick={download}><Download size={16}/>Baixar WebP</button>}</footer></section></div>
}
