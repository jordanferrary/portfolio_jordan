import { ArrowUpRight, Box, Gamepad2, Palette, Sparkles } from 'lucide-react'
import { assetPath } from '../../lib/assets'

export function HeroSection() {
  return (
    <section data-slot="hero-section" id="inicio" className="hero-section page-section" aria-labelledby="hero-title">
      <div className="hero-art" aria-hidden="true">
        <img src={assetPath('hero-character.webp')} alt="" fetchPriority="high" />
      </div>
      <div className="hero-stars" aria-hidden="true"><i>✧</i><i>✦</i><i>✧</i></div>
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-dot" />3D Artist & Digital Creator</p>
        <h1 id="hero-title">The artist<br />behind the <span className="gradient-text">worlds.</span></h1>
        <p className="hero-description">I’m Jordan Ferrary, a 3D artist focused on bringing ideas to life through art, modeling and creativity.</p>
        <a className="hero-cta" href="#/portfolio">Explore my portfolio <span><ArrowUpRight aria-hidden="true" /></span></a>
      </div>
      <aside className="profile-card" aria-label="Perfil do artista">
        <div className="profile-avatar-wrap">
          <img src={assetPath('avatar.webp')} alt="Avatar artístico de Jordan Ferrary" />
          <span className="online-dot" aria-label="Disponível" />
        </div>
        <h2>Jordan Ferrary</h2>
        <p className="profile-role">3D Artist</p>
        <span className="availability"><i />Available for projects</span>
        <p className="profile-tagline">Turning imagination<br />into reality.</p>
        <div className="profile-specialties">
          <span className="specialty-label"><Sparkles aria-hidden="true" />Specialties</span>
          <div><span>3D Modeling</span><span>LookDev</span><span>Stylized Art</span><span>Animation</span></div>
        </div>
      </aside>
      <div className="hero-orbit" aria-hidden="true"><span /></div>
      <div className="hero-bottom-glow" aria-hidden="true" />
    </section>
  )
}

export function FocusItems() {
  return (
    <div className="focus-list">
      <div><Box aria-hidden="true" /><span>3D Art<br />& Characters</span></div>
      <div><Gamepad2 aria-hidden="true" /><span>Games<br />& Interactive</span></div>
      <div><Palette aria-hidden="true" /><span>Stylized Assets<br />& Environments</span></div>
    </div>
  )
}
