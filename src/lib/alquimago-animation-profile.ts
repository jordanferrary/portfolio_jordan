/** Animation profiles are local first, published only by the Studio owner. */
export const ANIMATION_IDS=[
 'Breath','Idle','Blink','Happy','Curious','Talk','Sleep','Pet','Surprised','Focused','Sad',
 'Tired','Yawn','Angry','Confused','Excited','Shy','Love','Proud','Thinking',
 'Worried','Laugh','LookLeft','LookRight','LookUp','LookDown'
] as const
export type AnimationKey=typeof ANIMATION_IDS[number]
export type AnimationTiming={durationMs:number;intensity:number;intervalMs:number;loop:boolean}
export const BREATH_MOODS=['tranquilo','feliz','animado','curioso','concentrado','sonolento','meditando','cansado',
 'sad','happy','angry','surprised','curious','focused','pet','tired'] as const
export type BreathMood=typeof BREATH_MOODS[number]
export type AnimationProfile={
 shapes:Record<AnimationKey,AnimationTiming>
 breathMoodSpeed:Record<BreathMood,number>
}
export const ANIMATION_STORAGE_KEY='jf-alquimago-3d-animations-v1'
const clamp=(value:unknown,min:number,max:number,fallback:number)=>{
 const n=typeof value==='number'&&Number.isFinite(value)?value:fallback
 return Math.max(min,Math.min(max,n))
}
const KEY_DEFAULTS:Partial<Record<AnimationKey,[number,number,number]>>={
 Breath:[3000,0.38,0],Idle:[800,0.25,0],Blink:[170,1,5200],
 Happy:[480,0.9,0],Curious:[430,0.85,0],Talk:[280,0.9,0],
 Sleep:[1100,1,0],Pet:[1100,1,0],Surprised:[280,0.9,0],
 Focused:[420,0.8,0],Sad:[700,0.8,0],
 Tired:[1150,0.55,0],Yawn:[1200,0.8,14000],Angry:[400,0.9,0],
 Confused:[550,0.8,0],Excited:[350,0.9,0],Shy:[800,0.7,0],
 Love:[600,0.65,0],Proud:[800,0.85,0],Thinking:[700,0.65,0],
 Worried:[600,0.8,0],Laugh:[650,0.9,0],
 LookLeft:[310,0.35,0],LookRight:[310,0.35,0],LookUp:[310,0.35,0],LookDown:[310,0.35,0]
}
const DEFAULT_LOOPS=new Set<AnimationKey>(['Breath','Idle','Blink','Talk','Sleep','Tired','Happy','Sad','Curious','Focused'])
export const DEFAULT_ANIMATION_PROFILE:AnimationProfile={
 shapes:Object.fromEntries(ANIMATION_IDS.map(id=>{
  const [durationMs,intensity,intervalMs]=KEY_DEFAULTS[id]||[500,0.8,0]
  return [id,{durationMs,intensity,intervalMs,loop:DEFAULT_LOOPS.has(id)}]
 })) as Record<AnimationKey,AnimationTiming>,
 breathMoodSpeed:{
  tranquilo:1,feliz:1.14,animado:1.55,curioso:1.08,
  concentrado:0.9,sonolento:0.75,meditando:0.7,cansado:0.8,
  sad:0.74,happy:1.16,angry:1.45,surprised:1.7,
  curious:1.1,focused:0.93,pet:0.88,tired:0.76
 }
}
let published:AnimationProfile|null=null
export function normalizeAnimationProfile(input:unknown):AnimationProfile{
 const data=input&&typeof input==='object'&&!Array.isArray(input)?input as Partial<AnimationProfile>:{}
 const shapes=data.shapes&&typeof data.shapes==='object'?data.shapes:{} as Partial<Record<AnimationKey,AnimationTiming>>
 const rawSpeeds=data.breathMoodSpeed&&typeof data.breathMoodSpeed==='object'?data.breathMoodSpeed:{} as Partial<Record<BreathMood,number>>
 const result=Object.fromEntries(ANIMATION_IDS.map(id=>{
  const defaults=DEFAULT_ANIMATION_PROFILE.shapes[id]
  const raw=(shapes as Partial<Record<AnimationKey,AnimationTiming>>)[id]||{} as AnimationTiming
  return [id,{
   durationMs:Math.round(clamp(raw.durationMs,80,6000,defaults.durationMs)),
   intensity:Math.round(clamp(raw.intensity,0,1,defaults.intensity)*100)/100,
   loop:typeof raw.loop==='boolean'?raw.loop:defaults.loop,
   intervalMs:id==='Blink'||id==='Yawn'
    ?Math.round(clamp(raw.intervalMs,800,30000,defaults.intervalMs))
    :0
  }]
 })) as Record<AnimationKey,AnimationTiming>
 const breathMoodSpeed=Object.fromEntries(BREATH_MOODS.map(id=>[
  id,Math.round(clamp((rawSpeeds as Partial<Record<BreathMood,number>>)[id],0.4,2.4,DEFAULT_ANIMATION_PROFILE.breathMoodSpeed[id])*100)/100
 ])) as Record<BreathMood,number>
 return {shapes:result,breathMoodSpeed}
}
export function readAnimationDraft():AnimationProfile|null{
 try{const s=localStorage.getItem(ANIMATION_STORAGE_KEY);return s?normalizeAnimationProfile(JSON.parse(s)):null}
 catch{return null}
}
export function readAnimationProfile():AnimationProfile{
 return readAnimationDraft()||published||normalizeAnimationProfile(DEFAULT_ANIMATION_PROFILE)
}
export function writeAnimationProfile(value:unknown):AnimationProfile{
 const next=normalizeAnimationProfile(value)
 try{localStorage.setItem(ANIMATION_STORAGE_KEY,JSON.stringify(next))}catch{/* optional storage */}
 window.dispatchEvent(new CustomEvent<AnimationProfile>('alquimago:animation-profile',{detail:next}))
 return next
}
export function resetAnimationProfile():AnimationProfile{
 try{localStorage.removeItem(ANIMATION_STORAGE_KEY)}catch{/* optional storage */}
 const next=readAnimationProfile()
 window.dispatchEvent(new CustomEvent<AnimationProfile>('alquimago:animation-profile',{detail:next}))
 return next
}
export function applyPublishedAnimationProfile(value:unknown):void{
 if(!value)return
 published=normalizeAnimationProfile(value)
 if(!readAnimationDraft())window.dispatchEvent(new CustomEvent<AnimationProfile>('alquimago:animation-profile',{detail:published}))
}
