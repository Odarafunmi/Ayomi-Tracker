/**
 * Editorial content per phase. Voice: short, warm and reassuring —
 * explain the why in one line, then offer one suggestion.
 */
import type { PhaseId } from './types';

export interface PhaseContent {
  id: PhaseId;
  name: string;
  /** One-word label used in compact spots. */
  short: string;
  headline: string;
  /** The key word highlighted on an amber pill inside the headline. */
  highlight: string;
  why: string;
  suggestion: string;
  mood: string;
  energy: string;
  body: string;
  /** Tailwind hex for this phase (mirrors tailwind.config). */
  color: string;
}

export const PHASE_ORDER: PhaseId[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];

export const PHASE_CONTENT: Record<PhaseId, PhaseContent> = {
  menstrual: {
    id: 'menstrual',
    name: 'Menstrual',
    short: 'Period',
    headline: 'It is okay to slow down',
    highlight: 'slow down',
    why: 'Your period has started as oestrogen and progesterone dip to their lowest point.',
    suggestion: 'Warmth, iron-rich food and early nights genuinely help right now.',
    mood: 'Reflective, maybe a little tender',
    energy: 'Low, building back slowly',
    body: 'Cramps, backache or tiredness are common',
    color: '#D6336C',
  },
  follicular: {
    id: 'follicular',
    name: 'Follicular',
    short: 'Rising',
    headline: 'Your energy is rising',
    highlight: 'rising',
    why: 'Oestrogen is climbing as your body prepares to release an egg.',
    suggestion: 'A lovely window for new projects, social plans and tougher workouts.',
    mood: 'Upbeat and focused',
    energy: 'Rising day by day',
    body: 'Skin often clearer, appetite steadier',
    color: '#2BB3A3',
  },
  ovulation: {
    id: 'ovulation',
    name: 'Ovulation',
    short: 'Peak',
    headline: 'You are at your peak',
    highlight: 'peak',
    why: 'An egg is released while oestrogen and testosterone briefly hit their high point.',
    suggestion: 'Confidence and energy are high — lean into big conversations and plans.',
    mood: 'Confident and sociable',
    energy: 'At its monthly peak',
    body: 'Possible mild twinges, libido often higher',
    color: '#F2A33A',
  },
  luteal: {
    id: 'luteal',
    name: 'Luteal',
    short: 'Winding down',
    headline: 'Be gentle with yourself',
    highlight: 'gentle',
    why: 'Progesterone rises, then falls — which can bring PMS as your period approaches.',
    suggestion: 'Lighter movement, complex carbs and earlier nights soften the dip.',
    mood: 'More inward, sometimes changeable',
    energy: 'Gradually winding down',
    body: 'Bloating, tender breasts or cravings can appear',
    color: '#9B7EDE',
  },
};

/** Typical energy level (1–10) at key moments of a 28-day cycle, for the chart. */
export const ENERGY_CURVE: Array<{ frac: number; level: number }> = [
  { frac: 0.02, level: 2.5 },
  { frac: 0.14, level: 3.2 },
  { frac: 0.32, level: 5.2 },
  { frac: 0.46, level: 7.2 },
  { frac: 0.5, level: 9 },
  { frac: 0.58, level: 8 },
  { frac: 0.72, level: 5.8 },
  { frac: 0.86, level: 4 },
  { frac: 1, level: 3 },
];

export const MEDICAL_DISCLAIMER =
  'Ayomi Tracker offers educational insights, not medical advice. Always speak with a qualified healthcare professional about your health.';
