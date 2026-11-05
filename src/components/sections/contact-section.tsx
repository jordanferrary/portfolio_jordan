import { useState, type FormEvent } from 'react'
import { Check, Copy, Mail, Send, Sparkles } from 'lucide-react'
import { SectionHeading } from '../ui/section-heading'

export function ContactSection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const draft = `Olá, Jordan!\n\nMeu nome: ${name}\nMeu e-mail: ${email}\n\n${message}`
    try {
      await navigator.clipboard.writeText(draft)
      setStatus('Mensagem copiada! Agora é só colar no seu aplicativo de e-mail ou mensagem.')
    } catch {
      setStatus('Não foi possível acessar a área de transferência neste navegador. Selecione e copie sua mensagem manualmente.')
    }
  }

  return (
    <section data-slot="contact-section" id="contato" className="contact-section page-section">
      <SectionHeading eyebrow="✦ Have a project in mind?" title="Let’s make" highlight="something unreal." description="Tell me a little about your idea. I’d love to hear what you’re imagining." />
      <div className="contact-layout">
        <div className="contact-copy surface-card">
          <div className="contact-orb"><Mail aria-hidden="true" /></div>
          <p className="contact-kicker"><Sparkles aria-hidden="true" /> Open for creative collaborations</p>
          <h3>Every great world<br />starts with an idea.</h3>
          <p>Projetos pessoais, colaborações ou apenas uma conversa sobre arte 3D — mande uma mensagem.</p>
          <div className="contact-note"><span className="availability"><i />Available for projects</span><small>Normalmente respondo assim que possível.</small></div>
        </div>
        <form className="contact-form surface-card" onSubmit={handleSubmit}>
          <label>Seu nome<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Como posso te chamar?" autoComplete="name" /></label>
          <label>Seu e-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" autoComplete="email" /></label>
          <label>Conte sobre sua ideia<textarea required rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Estou pensando em um projeto..." /></label>
          <button type="submit" className="submit-button">Copiar mensagem <Copy aria-hidden="true" /></button>
          {status ? <p className="form-status" role="status"><Check aria-hidden="true" />{status}</p> : <p className="form-footnote"><Send aria-hidden="true" /> O formulário prepara sua mensagem e copia o texto para você enviar.</p>}
        </form>
      </div>
    </section>
  )
}
