import { useEffect, useState } from 'react'

const sectionIds = ['inicio', 'portfolio', 'sobre', 'contato']

export function useActiveSection(): string {
  const [activeSection, setActiveSection] = useState('inicio')

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target instanceof HTMLElement) setActiveSection(visible.target.id)
      },
      { rootMargin: '-22% 0px -54% 0px', threshold: [0, 0.1, 0.25, 0.5] },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return activeSection
}
