import { Dialog } from '@base-ui/react/dialog'
import { ArrowUpRight, Check, X } from 'lucide-react'
import type { Project } from '../../data/projects'

interface ProjectDialogProps {
  project: Project | null
  onClose: () => void
}

export function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  return (
    <Dialog.Root open={project !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className="project-dialog" data-slot="project-dialog">
          {project ? (
            <>
              <div className="dialog-image-wrap">
                <img src={project.image} alt={`Arte do projeto ${project.title}`} />
                <Dialog.Close className="dialog-close" aria-label="Fechar detalhes"><X aria-hidden="true" /></Dialog.Close>
              </div>
              <div className="dialog-content">
                <p className="eyebrow">✦ {project.category} · {project.year}</p>
                <Dialog.Title className="dialog-title">{project.title}</Dialog.Title>
                <Dialog.Description className="dialog-description">{project.description}</Dialog.Description>
                <div className="dialog-process">
                  <h3>Processo & ferramentas</h3>
                  <div className="tool-list">
                    {project.tools.map((tool) => <span key={tool}><Check aria-hidden="true" />{tool}</span>)}
                  </div>
                </div>
                <a href="#/contato" className="dialog-cta" onClick={onClose}>Conversar sobre um projeto <ArrowUpRight aria-hidden="true" /></a>
              </div>
            </>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
