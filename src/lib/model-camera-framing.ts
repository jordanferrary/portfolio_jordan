
/** The published desktop frame is the reference composition for all viewports.
 * Narrower frames expand the vertical field of view rather than cropping the
 * horizontal field. Wider frames retain the reference vertical field.
 */
export const MODEL_REFERENCE_ASPECT=16/10
export const MODEL_MOBILE_ASPECT=4/5
const radians=(degrees:number)=>degrees*Math.PI/180
const degrees=(rad:number)=>rad*180/Math.PI
export function responsiveCameraFov(referenceFov:number,aspect:number){
 const scale=Math.max(1,MODEL_REFERENCE_ASPECT/Math.max(aspect,.01))
 return degrees(2*Math.atan(Math.tan(radians(referenceFov/2))*scale))
}
export function referenceFitDistance(radius:number,fov:number){
 const vertical=radians(fov/2)
 const horizontal=Math.atan(Math.tan(vertical)*MODEL_REFERENCE_ASPECT)
 return radius/Math.sin(Math.min(vertical,horizontal))*1.12
}
export function cameraZoomForDistance(radius:number,fov:number,distance:number){
 return referenceFitDistance(radius,fov)/Math.max(distance,.00001)
}
export function wrapCameraAzimuth(angle:number){
 return ((angle+180)%360+360)%360-180
}

/** Explicit turntable orbit, matching OrbitControls' speed convention (6 degrees/sec at 1).
 * Rotate the XZ offset about the target without changing elevation or zoom. */
export function horizontalOrbitStep(x:number,z:number,deltaSeconds:number,speed:number):[number,number]{
 const angle=-2*Math.PI/60*Math.max(0,deltaSeconds)*speed
 const c=Math.cos(angle),s=Math.sin(angle)
 return [x*c+z*s,z*c-x*s]
}
export function shouldOrbit(enabled:boolean,interacting:boolean,controlsEnabled:boolean,now:number,resumeAt:number){
 return enabled&&!interacting&&controlsEnabled&&now>=resumeAt
}
