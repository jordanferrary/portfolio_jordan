/** YouTube's official IFrame Player API; loaded only when a visitor opens a video. */
export interface YouTubePlayerHandle {
 playVideo():void
 pauseVideo():void
 seekTo(seconds:number,allowSeekAhead:boolean):void
 getCurrentTime():number
 getDuration():number
 getPlayerState():number
 destroy():void
}
type PlayerEvent={target:YouTubePlayerHandle}
interface YouTubeApi {
 Player:new (element:HTMLIFrameElement,options:{
  events:{onReady?:(event:PlayerEvent)=>void;onStateChange?:(event:PlayerEvent&{data:number})=>void;onError?:(event:PlayerEvent&{data:number})=>void}
 })=>YouTubePlayerHandle
}
declare global {
 interface Window {
  YT?:YouTubeApi
  onYouTubeIframeAPIReady?():void
 }
}
let loading:Promise<YouTubeApi>|null=null
export function loadYouTubePlayerApi():Promise<YouTubeApi>{
 if(window.YT?.Player)return Promise.resolve(window.YT)
 if(loading)return loading
 loading=new Promise<YouTubeApi>((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady=()=>{
   previous?.()
   if(window.YT?.Player)resolve(window.YT)
   else reject(new Error('A API de vídeo não ficou disponível.'))
  }
  const script=document.createElement('script')
  script.src='https://www.youtube.com/iframe_api'
  script.async=true
  script.onerror=()=>reject(new Error('Não foi possível carregar os controles adicionais do YouTube.'))
  document.head.appendChild(script)
 }).catch(error=>{loading=null;throw error})
 return loading
}
