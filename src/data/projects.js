// Replace these sample entries with your final renders.
// Keep each slug unique: it becomes the project URL.
export const projects = [
  {
    slug: "abyssal-study",
    title: "Abyssal Study",
    category: "Creature design",
    year: "2026",
    status: "In progress",
    featured: true,
    cover: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1800&q=90",
    description: "A creature-focused sculpt study exploring silhouette, surface rhythm and a hand-painted finish.",
    role: "Sculpting, retopology and hand-painted texturing",
    software: ["ZBrush", "Blender"],
    dimensions: "Creature / Sculpt",
    gallery: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1800&q=90",
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85"
    ],
    note: "The modeling is developed from an external concept. The sculpt and final presentation are authored by Jordan."
  },
  {
    slug: "arcane-guardian",
    title: "Arcane Guardian",
    category: "Character",
    year: "2026",
    status: "Personal project",
    featured: true,
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1800&q=90",
    description: "A stylized character exploration built around a readable shape language and a magical-tech atmosphere.",
    role: "Concept development, modeling and look development",
    software: ["Blender", "ZBrush"],
    dimensions: "Character / Stylized",
    gallery: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1800&q=90",
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=85"
    ],
    note: "Sample portfolio content — replace the images and project information with the final artwork."
  },
  {
    slug: "moonlit-sanctuary",
    title: "Moonlit Sanctuary",
    category: "Environment",
    year: "2025",
    status: "Personal project",
    featured: false,
    cover: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1500&q=85",
    description: "An atmospheric environment study focused on layered depth, lighting and a calm visual rhythm.",
    role: "Environment modeling, composition and lighting",
    software: ["Blender"],
    dimensions: "Environment / Lighting",
    gallery: [
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85"
    ],
    note: "Sample portfolio content — replace the images and project information with the final artwork."
  },
  {
    slug: "relic-no-07",
    title: "Relic No. 07",
    category: "Prop design",
    year: "2025",
    status: "Personal project",
    featured: false,
    cover: "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=1500&q=85",
    description: "A small prop study exploring material contrast, ornamental forms and a strong focal point.",
    role: "Hard-surface modeling and materials",
    software: ["Blender", "Substance 3D Painter"],
    dimensions: "Prop / Material study",
    gallery: [
      "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=85"
    ],
    note: "Sample portfolio content — replace the images and project information with the final artwork."
  },
  {
    slug: "dreaming-in-violet",
    title: "Dreaming in Violet",
    category: "Look development",
    year: "2025",
    status: "Personal project",
    featured: false,
    cover: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1500&q=85",
    description: "A visual experiment with color, atmosphere and luminous surfaces.",
    role: "Scene assembly, materials and lighting",
    software: ["Blender"],
    dimensions: "Look development",
    gallery: [
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=85"
    ],
    note: "Sample portfolio content — replace the images and project information with the final artwork."
  }
];

export const featuredProjects = projects.filter((project) => project.featured);
