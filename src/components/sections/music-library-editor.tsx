import { useEffect,useState } from 'react'
import { ArrowDown,ArrowUp,Check,ImagePlus,Pencil,Plus,Save,Trash2,Upload,X } from 'lucide-react'
import type { MusicTrack } from '../../data/studio'
import { AssetImage } from '../ui/asset-image'
import { AssetClipButton } from '../ui/asset-picker'
import {QuickEditImageButton} from '../ui/image-quick-editor'
import { isLocalMedia,saveUploadedAudio,saveUploadedMedia } from '../../lib/media-store'
type Props={tracks:MusicTrack[];onTracks:(tracks:MusicTrack[])=>void;onNotice:(message:string)=>void}
type TrackDraft={id:string;title:string;artist:string;src:string;cover:string}
const fresh=():TrackDraft=>({id:'track-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,5),title:'',artist:'',src:'',cover:''})
export function MusicLibraryEditor({tracks,onTracks,onNotice}:Props){
 const [draft,setDraft]=useState<TrackDraft|null>(null)
 const [audioFile,setAudioFile]=useState<File|null>(null)
 const [coverFile,setCoverFile]=useState<File|null>(null)
 const [coverPreview,setCoverPreview]=useState('')
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 useEffect(()=>{
  if(!coverFile){setCoverPreview('');return}
  const url=URL.createObjectURL(coverFile)
  setCoverPreview(url)
  return ()=>URL.revokeObjectURL(url)
 },[coverFile])
 const update=(value:Partial<TrackDraft>)=>setDraft(p=>p?{...p,...value}:p)
 const edit=(track:MusicTrack)=>{setDraft({id:track.id,title:track.title,artist:track.artist,src:track.src,cover:track.cover??''});setAudioFile(null);setCoverFile(null);setError('')}
 const create=()=>{setDraft(fresh());setAudioFile(null);setCoverFile(null);setError('')}
 const save=async()=>{
  if(!draft)return
  if(!draft.title.trim()||!draft.artist.trim()){setError('Informe o título e o artista.');return}
  if(!draft.src&&!audioFile){setError('Adicione um arquivo de áudio ou uma URL direta.');return}
  const publishedAudio=/^site:\/\/audio\/studio\/[a-f0-9]{64}\.(mp3|wav|ogg|m4a)$/i.test(draft.src)
  if(!audioFile&&!isLocalMedia(draft.src)&&!publishedAudio&&!/^https?:\/\//i.test(draft.src)){setError('Use um arquivo importado, uma faixa já publicada ou uma URL https:// direta.');return}
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
    <div className="music-track-cover-preview">{coverPreview?<img src={coverPreview} alt="Nova capa"/>:draft.cover?<AssetImage src={draft.cover} alt="Capa atual"/>:<div className="music-no-cover"><ImagePlus size={24}/><small>Sem capa</small></div>}</div>
    <div className="music-cover-actions"><b>Imagem da capa</b><label className="media-upload-button"><Upload size={15}/>Importar capa<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{setCoverFile(e.target.files?.[0]??null);e.target.value=''}}/></label><AssetClipButton folder="music" onSelect={cover=>{setCoverFile(null);update({cover})}}/>{draft.cover&&!coverFile&&<QuickEditImageButton source={draft.cover} folder="music" onSave={cover=>update({cover})}/>}{(coverFile||draft.cover)&&<button onClick={()=>{setCoverFile(null);update({cover:''})}}><X size={14}/>Remover capa</button>}</div>
   </div>
   <div className="music-audio-input"><b>Arquivo de áudio</b><label className="audio-upload"><Upload size={17}/>{audioFile?'Substituir arquivo':'Importar MP3, WAV, OGG ou M4A'}<input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/m4a,.mp3,.wav,.ogg,.m4a" onChange={e=>{setAudioFile(e.target.files?.[0]??null);e.target.value=''}}/></label>{audioFile?<span className="music-audio-file"><Check size={15}/>{audioFile.name}</span>:isLocalMedia(draft.src)?<span className="music-audio-file"><Check size={15}/>Áudio salvo neste navegador</span>:null}<label>Ou URL direta do arquivo<input value={isLocalMedia(draft.src)?'':draft.src} placeholder={isLocalMedia(draft.src)?'Áudio local selecionado':'https://site.com/musica.m4a'} onChange={e=>{update({src:e.target.value});setAudioFile(null)}}/></label></div>
   {error&&<p role="alert" className="music-editor-error">{error}</p>}
   <div className="music-form-actions"><button type="button" onClick={()=>setDraft(null)} disabled={busy}>Cancelar</button><button type="button" className="save-action" disabled={busy} onClick={()=>void save()}><Save size={16}/>{busy?'Salvando...':'Salvar música'}</button></div>
  </section>}
  <p className="editor-help">Músicas e imagens enviadas são armazenadas neste navegador e incluídas no backup ZIP. O site público só receberá as faixas quando houver publicação ou armazenamento no servidor. O formato M4A funciona quando o navegador oferece suporte ao codec do arquivo (por exemplo, AAC). Use arquivos que o senhor tenha direito de divulgar.</p>
 </div>
}
