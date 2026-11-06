import {useState} from 'react'
import {Link2,Save,Sparkles,X} from 'lucide-react'
import type {ContactSettings,SocialLink} from '../../data/studio'
import {SocialLinksEditor} from './social-links-editor'

type Props={
 settings:ContactSettings
 links:SocialLink[]
 onSave:(settings:ContactSettings,links:SocialLink[])=>void
 onClose:()=>void
}

export function ContactEditor({settings,links,onSave,onClose}:Props){
 const [draft,setDraft]=useState<ContactSettings>({...settings})
 const [draftLinks,setDraftLinks]=useState<SocialLink[]>(()=>links.map(link=>({...link})))
 const [error,setError]=useState('')
 const patch=(changes:Partial<ContactSettings>)=>setDraft(prev=>({...prev,...changes}))
 const save=()=>{
  if(!draft.titleFirst.trim()||!draft.titleAccent.trim()||!draft.introduction.trim()){
   setError('Preencha o título e a apresentação da página.');return
  }
  onSave({...draft,titleFirst:draft.titleFirst.trim(),titleAccent:draft.titleAccent.trim(),introduction:draft.introduction.trim(),greeting:draft.greeting.trim()},draftLinks)
  onClose()
 }
 return <div className="editor-overlay" lang="pt-BR"><section className="editor-panel contact-editor contact-social-editor" role="dialog" aria-modal="true" aria-label="Editar contato e redes sociais">
  <header><div><span className="eyebrow">✦ LOCAL STUDIO · CONTATO</span><h2>Contato e redes sociais</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></header>
  <div className="editor-scroll">
   <div className="contact-editor-head"><Sparkles size={20}/><p>O formulário foi substituído por canais de contato reais. Edite os textos em inglês e escolha quais redes devem aparecer na página. Nada é enviado a um serviço externo pelo Local Studio.</p></div>
   <section className="contact-editor-copy">
    <div className="contact-editor-section-title"><span>01 · APRESENTAÇÃO</span><h3>Textos da página</h3></div>
    <div className="contact-editor-title-fields"><label>Primeira linha do título<input value={draft.titleFirst} maxLength={80} onChange={e=>patch({titleFirst:e.target.value})}/></label><label>Linha em destaque<input value={draft.titleAccent} maxLength={80} onChange={e=>patch({titleAccent:e.target.value})}/></label></div>
    <label>Texto principal<textarea rows={3} value={draft.introduction} maxLength={600} onChange={e=>patch({introduction:e.target.value})}/></label>
    <label>Convite acima das redes<textarea rows={2} value={draft.greeting} maxLength={220} onChange={e=>patch({greeting:e.target.value})}/></label>
    <p className="contact-editor-helper">Os textos acima aparecem para os visitantes em inglês. O painel administrativo continua em português.</p>
   </section>
   <section className="contact-editor-networks">
    <div className="contact-editor-section-title"><span>02 · CANAIS DE CONTATO</span><h3>Perfis e links</h3><p>Somente redes com links válidos aparecem na página. A primeira rede configurada recebe maior destaque.</p></div>
    <SocialLinksEditor links={draftLinks} onChange={setDraftLinks}/>
   </section>
   <div className="contact-editor-reminder"><Link2 size={17}/><span>Salve cada perfil dentro do gerenciador e depois clique em <b>Salvar página</b>. Para tornar as mudanças públicas, use <b>Publicar no GitHub</b>.</span></div>
   {error&&<p className="editor-status" role="alert">{error}</p>}
  </div>
  <footer><button type="button" className="subtle-action" onClick={onClose}>Cancelar</button><button type="button" className="save-action" onClick={save}><Save size={16}/>Salvar página</button></footer>
 </section></div>
}
