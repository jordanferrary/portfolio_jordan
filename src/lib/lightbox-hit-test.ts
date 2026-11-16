/**
 * Determine whether a pointer is on the actual image pixels displayed by
 * object-fit: contain, rather than the full <img> element's letterboxed box.
 * The element rectangle may already include CSS transforms (zoom and pan).
 */
export type HitPoint={x:number;y:number}
export type HitBox={left:number;top:number;width:number;height:number}
export function isPointOnDisplayedArtwork(point:HitPoint,box:HitBox,naturalWidth:number,naturalHeight:number):boolean{
 if(!Number.isFinite(naturalWidth)||!Number.isFinite(naturalHeight)||
  naturalWidth<=0||naturalHeight<=0||box.width<=0||box.height<=0)return true
 const scale=Math.min(box.width/naturalWidth,box.height/naturalHeight)
 const width=naturalWidth*scale
 const height=naturalHeight*scale
 const left=box.left+(box.width-width)/2
 const top=box.top+(box.height-height)/2
 return point.x>=left&&point.x<=left+width&&point.y>=top&&point.y<=top+height
}
