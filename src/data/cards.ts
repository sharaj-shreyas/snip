import { isTopicId, type TopicId } from '@/constants/topics';

export type Quiz = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
};

/** The shape the UI renders. */
export type LearningCard = {
  id: string;
  topic: TopicId;
  /** Stage 1: huge bold headline. */
  headline: string;
  /** Stage 1: one-sentence curiosity hook. */
  hook: string;
  /** Stage 2: bullets. `**keyword**` segments are highlighted. */
  breakdown: string[];
  /** Stage 3: why it matters. */
  impact: string;
  /** Stage 4. */
  quiz: Quiz;
  minutes: number;
};

/** A row of `public.cards`, as returned by PostgREST. */
export type CardRow = {
  id: string;
  source_url: string;
  topic_tag: string;
  hook_headline: string;
  hook_body: string;
  breakdown_bullets: unknown;
  real_world_impact: string;
  quiz_question: string;
  quiz_options: unknown;
  correct_index: number;
  quiz_explanation: string;
  created_at: string;
};

// The `cards` table has no hint column, so wrong answers get a generic nudge.
const DEFAULT_HINT = 'Re-read the breakdown. The answer is hiding in there.';

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** Map a DB row to a UI card. Returns null for rows the app can't render. */
export function cardFromRow(row: CardRow): LearningCard | null {
  if (!isTopicId(row.topic_tag)) return null;
  const options = toStringArray(row.quiz_options);
  if (options.length < 2 || row.correct_index >= options.length) return null;

  return {
    id: row.id,
    topic: row.topic_tag,
    headline: row.hook_headline,
    hook: row.hook_body,
    breakdown: toStringArray(row.breakdown_bullets),
    impact: row.real_world_impact,
    quiz: {
      question: row.quiz_question,
      options,
      correctIndex: row.correct_index,
      explanation: row.quiz_explanation,
      hint: DEFAULT_HINT,
    },
    minutes: 1,
  };
}
