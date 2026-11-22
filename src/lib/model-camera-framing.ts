
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

/** Fit a full turntable sweep using a cylinder enclosing the model's bounds
 * relative to its orbit target. Frustum-plane support functions account for
 * perspective depth and elevation, without over-framing long, flat models
 * using a full bounding sphere. Margin is reserved on each screen edge. */
export function safeTurntableDistance(horizontalRadius:number,halfHeight:number,elevation:number,fov:number,aspect:number,margin=.08){
 const r=Math.max(0,horizontalRadius),h=Math.max(0,halfHeight)
 const scale=1-2*Math.min(.3,Math.max(0,margin))
 const tv=Math.max(.0001,Math.tan(radians(fov/2))*scale)
 const th=Math.max(.0001,tv*aspect)
 const c=Math.abs(Math.cos(elevation)),s=Math.abs(Math.sin(elevation))
 const horizontal=r*Math.hypot(1/th,c)+h*s
 const verticalA=r*Math.abs(c-s/tv)+h*Math.abs(s+c/tv)
 const verticalB=r*Math.abs(c+s/tv)+h*Math.abs(s-c/tv)
 return Math.max(horizontal,verticalA,verticalB,Math.hypot(r,h)*.01,.0001)*1.015
}
/** Guard bands are in drawing-buffer pixels. Bloom uses a quarter-size buffer. */
export function orbitEdgeMargin(width:number,height:number,pixelRatio:number,chromatic:number,bloom:number,bloomRadius:number,crt:number,vhs:number,pixelSize:number){
 const shortest=Math.max(1,Math.min(width,height))
 const effectPixels=chromatic*pixelRatio+(vhs>0?3:0)+(pixelSize*pixelRatio*.5)+(bloom>0?4*3.230769*bloomRadius+2:0)
 return Math.min(.28,.065+effectPixels/shortest+crt*.035)
}
