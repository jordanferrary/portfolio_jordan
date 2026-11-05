import { assetPath } from '../lib/assets'

export type ProjectCategory = 'Characters' | 'Environments' | 'Props' | 'Stylized' | 'Others'

export interface Project {
  id: string
  title: string
  category: ProjectCategory
  year: string
  image: string
  description: string
  tools: string[]
  featured?: boolean
}

export const projectCategories = ['All', 'Characters', 'Environments', 'Props', 'Stylized', 'Others'] as const
export type ProjectFilter = (typeof projectCategories)[number]

export const projects: Project[] = [
  {
    id: 'void-wanderer',
    title: 'Void Wanderer',
    category: 'Characters',
    year: '2026',
    image: assetPath('void-wanderer.webp'),
    description: 'Um estudo de personagem focado em silhueta, expressão e atmosfera. A proposta explora uma estética introspectiva com detalhes de materiais e iluminação violeta.',
    tools: ['Blender', 'Substance 3D', 'Marmoset'],
    featured: true,
  },
  {
    id: 'moonlit-cottage',
    title: 'Moonlit Cottage',
    category: 'Environments',
    year: '2026',
    image: assetPath('moonlit-cottage.webp'),
    description: 'Um pequeno refúgio fantástico construído com formas estilizadas, luz quente nas janelas e uma atmosfera noturna cinematográfica.',
    tools: ['Blender', 'Photoshop', 'Cycles'],
    featured: true,
  },
  {
    id: 'deepwalker',
    title: 'Deepwalker',
    category: 'Characters',
    year: '2026',
    image: assetPath('deepwalker.webp'),
    description: 'Exploração de personagem inspirada no universo submarino, com foco em volumes suaves, leitura de forma e contraste de cores.',
    tools: ['ZBrush', 'Blender', 'Substance 3D'],
    featured: true,
  },
  {
    id: 'astral-guardian',
    title: 'Astral Guardian',
    category: 'Stylized',
    year: '2025',
    image: assetPath('astral-guardian.webp'),
    description: 'Uma peça de personagem estilizado que combina linguagem visual de fantasia e acabamento gráfico.',
    tools: ['Blender', 'Krita'],
  },
  {
    id: 'neon-armor',
    title: 'Neon Armor',
    category: 'Props',
    year: '2025',
    image: assetPath('neon-armor.webp'),
    description: 'Design de equipamento e superfícies rígidas com materiais escuros, recortes luminosos e detalhes modulares.',
    tools: ['Blender', 'Substance 3D'],
  },
  {
    id: 'ancient-ruins',
    title: 'Ancient Ruins',
    category: 'Environments',
    year: '2025',
    image: assetPath('ancient-ruins.webp'),
    description: 'Estudo de ambiente com arquitetura monumental, vegetação e uma paleta de cores noturna.',
    tools: ['Blender', 'Cycles'],
  },
]
