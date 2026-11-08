import { useEffect,useState } from 'react'
import { ArrowDown,ArrowUp,Check,ImagePlus,Pencil,Plus,Save,Trash2,Upload,X } from 'lucide-react'
import type { MusicTrack } from '../../data/studio'
import { AssetImage } from '../ui/asset-image'
import { AssetClipButton } from '../ui/asset-picker'
import {QuickEditImageButton} from '../ui/image-quick-editor'
import { isLocalMedia,saveUploadedAudio,saveUploadedMedia } from '../../lib/media-store'
import { parseVideoEmbed } from '../../lib/video-embed'
import {classifyAudioSource,audioSourceError} from '../../lib/audio-source'
type Props={tracks:MusicTrack[];onTracks:(tracks:MusicTrack[])=>void;onNotice:(message:string)=>void}
type TrackDraft={id:string;title:string;artist:string;src:string;cover:string}
const fresh=():TrackDraft=>({id:'track-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,5),title:'',artist:'',src:'',cover:''})
export function MusicLibraryEditor({tracks,onTracks,onNotice}:Props){
 const [draft,setDraft]=useState<TrackDraft|null>(null)
 const [audioFile,setAudioFile]=useState<File|null>(null)
 const [coverFile,setCoverFile]=useState<File|null>(null)
 const [coverPreview,setCoverPreview]=useState('')
 const [coverLoadError,setCoverLoadError]=useState(false)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [videoReference,setVideoReference]=useState('')
 const youtubePreview=parseVideoEmbed(videoReference)
 const sourceKind=audioFile||isLocalMedia(draft?.src??'')?'local':classifyAudioSource(draft?.src??'')
 const invalidSource=['video-page','web-page','invalid'].includes(sourceKind)
 const importAudio=(file:File|null)=>{
  setAudioFile(file)
  if(!file)return
  const name=file.name.replace(/\.(mp3|wav|ogg|m4a)$/i,'').trim()
  const pieces=name.split(/\s+[-–—]\s+/)
  setDraft(previous=>previous?{...previous,artist:previous.artist||((pieces.length>1)?pieces[0]:''),title:previous.title||((pieces.length>1)?pieces.slice(1).join(' - '):name)}:previous)
 }
 useEffect(()=>{
  if(!coverFile){setCoverPreview('');return}
  const url=URL.createObjectURL(coverFile)
  setCoverPreview(url)
  return ()=>URL.revokeObjectURL(url)
 },[coverFile])
 const update=(value:Partial<TrackDraft>)=>setDraft(p=>p?{...p,...value}:p)
 const edit=(track:MusicTrack)=>{setDraft({id:track.id,title:track.title,artist:track.artist,src:track.src,cover:track.cover??''});setAudioFile(null);setCoverFile(null);setCoverLoadError(false);setVideoReference('');setError('')}
 const create=()=>{setDraft(fresh());setAudioFile(null);setCoverFile(null);setCoverLoadError(false);setVideoReference('');setError('')}
 const save=async()=>{
  if(!draft)return
  if(!draft.title.trim()||!draft.artist.trim()){setError('Informe o título e o artista.');return}
  if(!draft.src.trim()&&!audioFile){setError(audioSourceError('missing'));return}
  if(!audioFile&&!isLocalMedia(draft.src)){
   const kind=classifyAudioSource(draft.src)
   if(kind!=='direct'&&kind!=='published'){setError(audioSourceError(kind));return}
  }
  const requestedCover=draft.cover.trim()
  if(!coverFile&&requestedCover&&!isLocalMedia(requestedCover)&&!/^site:\/\/images\//.test(requestedCover)&&!/^https:\/\//i.test(requestedCover)&&!requestedCover.startsWith('/')){setError('Para capa online, use um link direto HTTPS de imagem (https://...).');return}
  setBusy(true);setError('')
  try{
   const src=audioFile?await saveUploadedAudio(audioFile):draft.src.trim()
   const cover=coverFile?await saveUploadedMedia(coverFile,'music',draft.id+'-cover'):draft.cover
   const track:MusicTrack={id:draft.id,title:draft.title.trim(),artist:draft.artist.trim(),src,cover}
   onTracks(tracks.some(t=>t.id===track.id)?tracks.map(t=>t.id===track.id?track:t):[...tracks,track])
   setDraft(null);setAudioFile(null);setCoverFile(null)
   onNotice('Música salva na biblioteca local. Clique na capa do player para selecioná-la.')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar a música.')}finally{setBusy(false)}
 }
 const remove=(track:MusicTrack)=>{if(window.confirm('Excluir "'+track.title+'" da playlist local?'))onTracks(tracks.filter(t=>t.id!==track.id))}
 const move=(index:number,direction:number)=>{const to=index+direction;if(to<0||to>=tracks.length)return;const next=[...tracks];[next[index],next[to]]=[next[to],next[index]];onTracks(next)}
 return <div className="music-library-editor">
  <div className="editor-section-title"><h3>Minhas músicas</h3><p>Adicione faixas completas, com capa, nome, artista e áudio. A playlist do player usa esta ordem.</p></div>
  <div className="music-library-list">{tracks.map((track,i)=><article className="music-library-item" key={track.id}><div className="music-library-cover"><AssetImage src={track.cover||import.meta.env.BASE_URL+'images/music/album-cover.webp'} alt={'Capa de '+track.title}/></div><div className="music-library-meta"><b>{track.title}</b><small>{track.artist||'Artista não informado'}</small></div><div className="music-library-actions"><button aria-label={'Subir '+track.title} disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp size={15}/></button><button aria-label={'Descer '+track.title} disabled={i===tracks.length-1} onClick={()=>move(i,1)}><ArrowDown size={15}/></button><button aria-label={'Editar '+track.title} onClick={()=>edit(track)}><Pencil size={15}/></button><button aria-label={'Excluir '+track.title} onClick={()=>remove(track)}><Trash2 size={15}/></button></div></article>)}</div>
  {!draft?<button className="music-create-button" type="button" onClick={create}><Plus size={19}/>Adicionar nova música</button>:<section className="music-track-form" aria-label="Cadastro de música">
   <div className="music-track-form-head"><b>{tracks.some(t=>t.id===draft.id)?'Editar música':'Nova música'}</b><button aria-label="Cancelar edição" onClick={()=>setDraft(null)}><X size={18}/></button></div>
   <div className="music-track-fields"><label>Nome da música<input value={draft.title} maxLength={90} onChange={e=>update({title:e.target.value})} placeholder="Ex.: Midnight" required/></label><label>Artista<input value={draft.artist} maxLength={90} onChange={e=>update({artist:e.target.value})} placeholder="Ex.: Luna Studio" required/></label></div>
   <div className="music-track-image">
    <div className="music-track-cover-preview">{coverPreview?<img src={coverPreview} alt="Nova capa"/>:draft.cover?<AssetImage src={draft.cover} alt="Prévia da capa da música" onError={()=>setCoverLoadError(true)} onLoad={()=>setCoverLoadError(false)}/>:<div className="music-no-cover"><ImagePlus size={24}/><small>Sem capa</small></div>}{coverLoadError&&!coverPreview&&draft.cover&&<div className="music-cover-url-error" role="status">Não foi possível carregar esta imagem. Confira se o link é direto e público.</div>}</div>
    <div className="music-cover-actions"><b>Imagem da capa</b><label className="media-upload-button"><Upload size={15}/>Importar capa<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{setCoverFile(e.target.files?.[0]??null);e.target.value=''}}/></label><AssetClipButton folder="music" onSelect={cover=>{setCoverFile(null);setCoverLoadError(false);update({cover})}}/>{draft.cover&&!coverFile&&<QuickEditImageButton source={draft.cover} folder="music" onSave={cover=>update({cover})}/>}{(coverFile||draft.cover)&&<button onClick={()=>{setCoverFile(null);update({cover:''})}}><X size={14}/>Remover capa</button>}</div>
   </div>
   <div className="music-cover-direct-link"><label>URL direta da capa (qualquer imagem pública)<input type="url" inputMode="url" placeholder="https://exemplo.com/capas/album.webp" value={isLocalMedia(draft.cover)||draft.cover.startsWith('site://')?'':draft.cover} onChange={e=>{setCoverFile(null);setCoverLoadError(false);update({cover:e.target.value})}}/></label><p className="editor-help">Aceita imagens de sites, CDNs e serviços de hospedagem (JPG, PNG, WebP etc.). Use o endereço da imagem, não o endereço de uma página. A capa é exibida no player sem importar o arquivo para o GitHub; o site de origem precisa permitir exibição externa.</p></div>
   <div className="music-youtube-reference"><label>Miniatura de um vídeo do YouTube (opcional)<input type="url" placeholder="https://www.youtube.com/watch?v=..." value={videoReference} onChange={e=>setVideoReference(e.target.value)}/></label>{youtubePreview?.provider==='youtube'&&<div className="music-youtube-preview"><img src={youtubePreview.thumbnail} alt="Prévia da miniatura do YouTube" loading="lazy"/><button type="button" onClick={()=>{setCoverFile(null);setCoverLoadError(false);update({cover:youtubePreview.thumbnail})}}>Usar esta miniatura</button></div>}<p className="editor-help">O link serve apenas para obter uma imagem de capa pública, não para extrair áudio. Nome da faixa e artista continuam totalmente editáveis.</p></div>
   <div className="music-audio-input"><b>Arquivo de áudio</b><label className="audio-upload"><Upload size={17}/>{audioFile?'Substituir arquivo':'Importar MP3, WAV, OGG ou M4A'}<input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/m4a,.mp3,.wav,.ogg,.m4a" onChange={e=>{importAudio(e.target.files?.[0]??null);e.target.value=''}}/></label>{audioFile?<span className="music-audio-file"><Check size={15}/>{audioFile.name}</span>{audioFile&&audioFile.size>8*1024*1024&&<p className="editor-help" role="status">Esta faixa tem {(audioFile.size/1048576).toFixed(1)} MiB. Arquivos grandes ocupam espaço no GitHub Pages e aumentam o consumo de tráfego quando reproduzidos. Considere exportar uma versão MP3/AAC mais compacta, preservando a qualidade.</p>}:isLocalMedia(draft.src)?<span className="music-audio-file"><Check size={15}/>Áudio salvo neste navegador</span>:null}<label>Ou URL direta do arquivo<input value={isLocalMedia(draft.src)?'':draft.src} placeholder={isLocalMedia(draft.src)?'Áudio local selecionado':'https://site.com/musica.m4a'} onChange={e=>{update({src:e.target.value});setAudioFile(null)}}/></label>{invalidSource&&draft.src.trim()&&<div className="music-source-warning" role="alert"><strong>Link não reproduzível</strong><p>{audioSourceError(sourceKind)}</p>{sourceKind==='video-page'&&parseVideoEmbed(draft.src)?.provider==='youtube'&&<button type="button" onClick={()=>{setVideoReference(draft.src);update({src:''})}}>Usar este vídeo somente para a miniatura</button>}</div>}<p className="editor-help">Este campo é para o arquivo de áudio propriamente dito, não links de páginas de vídeos. Arquivos próprios podem ser importados acima.</p></div>
   {error&&<p role="alert" className="music-editor-error">{error}</p>}
   <div className="music-form-actions"><button type="button" onClick={()=>setDraft(null)} disabled={busy}>Cancelar</button><button type="button" className="save-action" disabled={busy} onClick={()=>void save()}><Save size={16}/>{busy?'Salvando...':'Salvar música'}</button></div>
  </section>}
  <p className="editor-help">Músicas e imagens enviadas são armazenadas neste navegador e incluídas no backup ZIP. O site público só receberá as faixas quando houver publicação ou armazenamento no servidor. O formato M4A funciona quando o navegador oferece suporte ao codec do arquivo (por exemplo, AAC). Use arquivos que o senhor tenha direito de divulgar.</p>
 </div>
}
