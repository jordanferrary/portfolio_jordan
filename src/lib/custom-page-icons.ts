import {BookOpen,Code2,Download,FileText,FolderOpen,Gem,GraduationCap,Layers,Link2,PenTool,Award,Video} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'
import type {CustomPageIcon} from '../data/custom-pages'

/** The editor preview and sidebar must always render the exact same icon. */
export const customPageIcons:Record<CustomPageIcon,LucideIcon>={
 book:BookOpen,
 graduation:GraduationCap,
 sparkles:PenTool,
 layers:Layers,
 code:Code2,
 download:Download,
 file:FileText,
 gem:Gem,
 folder:FolderOpen,
 video:Video,
 star:Award,
 link:Link2
}
