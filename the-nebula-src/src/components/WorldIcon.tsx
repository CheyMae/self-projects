import {
  BookOpen,
  Castle,
  Compass,
  Crown,
  Feather,
  Flame,
  Gem,
  Leaf,
  Moon,
  Mountain,
  Newspaper,
  Skull,
  Sparkle,
  Star,
  Sun,
  Swords,
  type LucideIcon,
} from 'lucide-react'

export const WORLD_ICONS: Record<string, LucideIcon> = {
  sparkle: Sparkle,
  feather: Feather,
  sun: Sun,
  notes: Newspaper,
  moon: Moon,
  star: Star,
  flame: Flame,
  mountain: Mountain,
  castle: Castle,
  compass: Compass,
  swords: Swords,
  crown: Crown,
  book: BookOpen,
  gem: Gem,
  leaf: Leaf,
  skull: Skull,
}

export function WorldIcon({ name, size = 24 }: { name: string | null | undefined; size?: number }) {
  const Icon = WORLD_ICONS[name ?? 'sparkle'] ?? Sparkle
  return <Icon size={size} strokeWidth={1.4} />
}
