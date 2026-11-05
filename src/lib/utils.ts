import { twMerge } from 'tailwind-merge'

type ClassInput = string | false | null | undefined

export function cn(...inputs: ClassInput[]): string {
  return twMerge(inputs.filter(Boolean).join(' '))
}
