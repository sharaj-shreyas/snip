/** Must match the CHECK constraint on `cards.topic_tag` in supabase/schema.sql. */
export const TOPIC_IDS = ['AI', 'Space', 'Biotech', 'Hardware', 'Physics'] as const;
export type TopicId = (typeof TOPIC_IDS)[number];

export function isTopicId(value: string): value is TopicId {
  return (TOPIC_IDS as readonly string[]).includes(value);
}

export const MIN_INTERESTS = 3;

export type TopicTheme = {
  label: string;
  emoji: string;
  /** Top → bottom gradient stops. */
  gradient: readonly [string, string];
  accent: string;
  /** Readable text color when placed on top of `accent`. */
  onAccent: string;
};

export const Topics: Record<TopicId, TopicTheme> = {
  AI: {
    label: '#AI',
    emoji: '🧠',
    gradient: ['#5B21B6', '#1E1B4B'],
    accent: '#A3E635',
    onAccent: '#1A2E05',
  },
  Space: {
    label: '#Space',
    emoji: '🔭',
    gradient: ['#0F172A', '#86198F'],
    accent: '#FACC15',
    onAccent: '#422006',
  },
  Biotech: {
    label: '#Biotech',
    emoji: '🧬',
    gradient: ['#047857', '#115E59'],
    accent: '#FB7185',
    onAccent: '#4C0519',
  },
  Hardware: {
    label: '#Hardware',
    emoji: '🔬',
    gradient: ['#EA580C', '#991B1B'],
    accent: '#FFFFFF',
    onAccent: '#7C2D12',
  },
  Physics: {
    label: '#Physics',
    emoji: '⚛️',
    gradient: ['#0E7490', '#1E1B4B'],
    accent: '#F0ABFC',
    onAccent: '#4A044E',
  },
};

/** Shared dark palette for app chrome (outside the topic-coded reels). */
export const AppColors = {
  background: '#0B0A12',
  surface: '#16141F',
  surfaceRaised: '#211E2E',
  border: '#2C2840',
  text: '#FFFFFF',
  textMuted: '#A19DB5',
  flame: '#FF9600',
  xp: '#FACC15',
  success: '#58CC02',
  successEdge: '#46A302',
  danger: '#FF4B4B',
  dangerEdge: '#D33131',
} as const;

export const XP_PER_CARD = 15;
export const DAILY_GOAL = 5;
