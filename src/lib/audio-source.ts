/** Classifies audio inputs without trying to fetch or extract media from streaming sites. */
export type AudioSourceKind='missing'|'local'|'published'|'direct'|'video-page'|'web-page'|'invalid'
const STREAM_HOSTS=new Set([
 'youtube.com','youtu.be','youtube-nocookie.com','vimeo.com',
 'soundcloud.com','open.spotify.com','spotify.com','music.apple.com',
 'bandcamp.com','www.bandcamp.com'
])
function isHostOrSubdomain(host:string,base:string):boolean{
 return host===base||host.endsWith('.'+base)
}
export function classifyAudioSource(value:string):AudioSourceKind{
 const source=value.trim()
 if(!source)return 'missing'
 if(/^media:\/\/[a-z0-9/-]+$/i.test(source))return 'local'
 if(/^site:\/\/audio\/studio\/[a-f0-9]{64}\.(mp3|wav|ogg|m4a)$/i.test(source))return 'published'
 try{
  const url=new URL(source)
  if(!['https:','http:'].includes(url.protocol))return 'invalid'
  const host=url.hostname.toLowerCase()
  if([...STREAM_HOSTS].some(base=>isHostOrSubdomain(host,base)))return 'video-page'
  if(/\.(html?|php|aspx?|jsp)$/i.test(url.pathname)||/\.(?:pdf|jpg|jpeg|png|webp|gif|svg|mp4|webm|mov)$/i.test(url.pathname))return 'web-page'
  return 'direct'
 }catch{return 'invalid'}
}
export function audioSourceError(kind:AudioSourceKind):string{
 if(kind==='video-page')return 'Este endereço abre uma plataforma de vídeo ou streaming, não um arquivo de áudio. Para tocar no player, importe um MP3, WAV, OGG ou M4A seu ou use uma URL direta de áudio autorizada. Links do YouTube podem fornecer somente a miniatura.'
 if(kind==='web-page')return 'Este endereço parece ser uma página ou outro tipo de arquivo, não áudio. Use o link direto de um arquivo MP3, WAV, OGG ou M4A.'
 if(kind==='invalid')return 'Insira uma URL HTTP(S) válida ou escolha um arquivo de áudio do seu dispositivo.'
 if(kind==='missing')return 'Importe um arquivo MP3, WAV, OGG ou M4A ou insira uma URL direta de áudio.'
 return ''
}
