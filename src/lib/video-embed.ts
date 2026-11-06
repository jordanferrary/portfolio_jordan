export type VideoEmbed={provider:'youtube'|'vimeo';id:string;embedUrl:string;thumbnail:string;watchUrl:string}
export function parseVideoEmbed(value:string):VideoEmbed|null{
 try{
  const url=new URL(value.trim())
  if(url.protocol!=='https:'&&url.protocol!=='http:')return null
  const host=url.hostname.toLowerCase().replace(/^www\./,'')
  if(host==='youtube.com'||host==='m.youtube.com'||host==='youtu.be'||host==='youtube-nocookie.com'){
   const path=url.pathname.split('/').filter(Boolean)
   const id=host==='youtu.be'?path[0]:path[0]==='watch'?url.searchParams.get('v'):['shorts','embed','live'].includes(path[0])?path[1]:null
   if(!id||!/^[\w-]{11}$/.test(id))return null
   return {provider:'youtube',id,embedUrl:'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1',thumbnail:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',watchUrl:'https://www.youtube.com/watch?v='+id}
  }
  if(host==='vimeo.com'||host==='player.vimeo.com'){
   const segments=url.pathname.split('/').filter(Boolean)
   const id=segments.find(s=>/^\d+$/.test(s))
   if(!id)return null
   return {provider:'vimeo',id,embedUrl:'https://player.vimeo.com/video/'+id+'?autoplay=1',thumbnail:'',watchUrl:'https://vimeo.com/'+id}
  }
  return null
 }catch{return null}
}
