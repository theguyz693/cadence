import {
  Repeat, Dumbbell, BookOpen, Droplets, Utensils, Pill, Music, Footprints, Flower2,
  Laptop, PenLine, Palette, Leaf, Moon, Sparkles, Brain, Bike, Coffee, Languages, Heart,
} from 'lucide-react';

/** Curated routine icons. Keys are stored on the routine as `icon`. */
export const ROUTINE_ICONS = {
  repeat: { Icon: Repeat, label: 'Routine' },
  dumbbell: { Icon: Dumbbell, label: 'Training' },
  run: { Icon: Footprints, label: 'Running' },
  bike: { Icon: Bike, label: 'Cycling' },
  book: { Icon: BookOpen, label: 'Reading' },
  brain: { Icon: Brain, label: 'Study' },
  language: { Icon: Languages, label: 'Language' },
  laptop: { Icon: Laptop, label: 'Deep work' },
  pen: { Icon: PenLine, label: 'Writing' },
  palette: { Icon: Palette, label: 'Creative' },
  music: { Icon: Music, label: 'Practice' },
  meditate: { Icon: Flower2, label: 'Mindfulness' },
  care: { Icon: Droplets, label: 'Self-care' },
  meds: { Icon: Pill, label: 'Medication' },
  food: { Icon: Utensils, label: 'Cooking' },
  coffee: { Icon: Coffee, label: 'Morning' },
  leaf: { Icon: Leaf, label: 'Outdoors' },
  sleep: { Icon: Moon, label: 'Sleep' },
  heart: { Icon: Heart, label: 'Health' },
  tidy: { Icon: Sparkles, label: 'Tidying' },
};

/** Best-effort mapping from legacy emoji to an icon key. */
const EMOJI_TO_ICON = {
  '🏋️': 'dumbbell', '📚': 'book', '🧴': 'care', '🍳': 'food', '💊': 'meds', '🎵': 'music',
  '🏃': 'run', '🧘': 'meditate', '💻': 'laptop', '✍️': 'pen', '🎨': 'palette', '🌿': 'leaf',
  '💤': 'sleep', '🧹': 'tidy', '📋': 'repeat',
};

export function resolveRoutineIcon(routine) {
  if (routine?.icon && ROUTINE_ICONS[routine.icon]) return routine.icon;
  if (routine?.emoji && EMOJI_TO_ICON[routine.emoji]) return EMOJI_TO_ICON[routine.emoji];
  return 'repeat';
}
