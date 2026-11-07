import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import {registerAlquimago3D} from './lib/alquimago-3d'
import './styles/globals.css'
import './styles/revision.css'
registerAlquimago3D()
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

import './styles/home-revision.css'

import './styles/music-library.css'

import './styles/polish.css'

import './styles/engagement.css'

import './styles/quality.css'

import './styles/studio-expansion.css'

import './styles/scroll-controls.css'


import './styles/contact-studio-v2.css'


import './styles/gallery-background.css'

import './styles/github-publish.css'

import './styles/brand-logo.css'

import './styles/site-identity.css'
import './styles/studio-dock.css'
import './styles/project-focus.css'
import './styles/studio-polish.css'

import './styles/studio-centered.css'

import './styles/creative-direction.css'
import './styles/theme-palette-editor.css'

import './styles/portfolio-review.css'

import './styles/project-framing.css'

import './styles/contact-social.css'

import './styles/media-extras.css'

import './styles/project-model.css'

import './styles/custom-pages.css'

// Load last: visitor-facing palette overrides older fixed violet/graphite values.
import './styles/theme-coverage.css'
