/**
 * Studio-only draft of the Alquimago's public visibility.
 *
 * The public setting lives in public/alquimago/config.json (appearance.visible).
 * A browser draft is never public until its owner uses Local Studio > Publicar.
 * No personal data or credentials are stored here.
 */
export const ALQUIMAGO_VISIBILITY_DRAFT_KEY='jf-alquimago-visibility-draft-v1'

export function readAlquimagoVisibilityDraft():boolean|null{
 try{
  const saved=localStorage.getItem(ALQUIMAGO_VISIBILITY_DRAFT_KEY)
  return saved==='true'?true:saved==='false'?false:null
 }catch{return null}
}

export function writeAlquimagoVisibilityDraft(visible:boolean):void{
 try{localStorage.setItem(ALQUIMAGO_VISIBILITY_DRAFT_KEY,String(visible))}
 catch{/* storage may be unavailable */}
}
