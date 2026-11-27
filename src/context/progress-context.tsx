import { createContext, use, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { DAILY_GOAL, XP_PER_CARD } from '@/constants/topics';
import { useAuth } from '@/context/auth-context';
import { cardFromRow, type CardRow, type LearningCard } from '@/data/cards';
import { localDateDaysAgo, localDateString, startOfLocalDay } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  interests: string[];
  xp: number;
  streak: number;
  last_active_date: string | null;
};

type Status = 'idle' | 'loading' | 'ready' | 'error';

type ProgressState = {
  profile: Profile | null;
  /** True once the signed-in user's profile has been fetched (or there is no user). */
  profileLoaded: boolean;
  xp: number;
  /** Streak as shown to the user: 0 if they missed yesterday. */
  streak: number;
  deck: LearningCard[];
  deckStatus: Status;
  error: string | null;
  completedIds: ReadonlySet<string>;
  /** Optimistically mark a card solved and sync to Supabase. Returns XP gained (0 if already done). */
  completeCard: (cardId: string) => number;
  saveInterests: (interests: string[]) => Promise<void>;
  refresh: () => Promise<void>;
};

const ProgressContext = createContext<ProgressState | null>(null);

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String(e.message) : 'Something went wrong';
}

/** Mirrors the streak logic in `complete_card()` for optimistic updates. */
function nextStreak(profile: Profile, today: string): number {
  const last = profile.last_active_date;
  if (last && last >= today) return Math.max(profile.streak, 1);
  if (last === localDateDaysAgo(1)) return profile.streak + 1;
  return 1;
}

function visibleStreak(profile: Profile | null): number {
  if (!profile?.last_active_date) return 0;
  return profile.last_active_date >= localDateDaysAgo(1) ? profile.streak : 0;
}

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, interests, xp, streak, last_active_date')
    .eq('id', userId)
    .maybeSingle<Profile>();
  if (error) throw error;
  // Row is normally created by the `on_auth_user_created` trigger.
  return data ?? { id: userId, interests: [], xp: 0, streak: 0, last_active_date: null };
}

async function fetchDeck(): Promise<{ deck: LearningCard[]; completed: Set<string> }> {
  const { data, error } = await supabase.rpc('get_daily_deck', {
    p_since: startOfLocalDay().toISOString(),
    p_size: DAILY_GOAL,
  });
  if (error) throw error;

  const deck = ((data ?? []) as CardRow[])
    .map(cardFromRow)
    .filter((c): c is LearningCard => c !== null);
  if (deck.length === 0) return { deck, completed: new Set() };

  const { data: done, error: doneError } = await supabase
    .from('user_card_progress')
    .select('card_id')
    .in(
      'card_id',
      deck.map((c) => c.id)
    );
  if (doneError) throw doneError;

  return { deck, completed: new Set((done ?? []).map((r: { card_id: string }) => r.card_id)) };
}

/** Keyed by user id so all state resets cleanly on sign-in / sign-out. */
export function ProgressProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  return (
    <UserProgressProvider key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </UserProgressProvider>
  );
}

function UserProgressProvider({ userId, children }: PropsWithChildren<{ userId: string | null }>) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(!userId);
  const [deck, setDeck] = useState<LearningCard[]>([]);
  const [deckStatus, setDeckStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(new Set());
  const loadedForDate = useRef<string | null>(null);

  const loadDeck = async () => {
    setDeckStatus('loading');
    try {
      const result = await fetchDeck();
      setDeck(result.deck);
      setCompletedIds(result.completed);
      setDeckStatus('ready');
      setError(null);
      loadedForDate.current = localDateString();
    } catch (e) {
      setError(errorMessage(e));
      setDeckStatus('error');
    }
  };

  const refresh = async () => {
    if (!userId) return;
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
      if (p.interests.length > 0) await loadDeck();
    } catch (e) {
      setError(errorMessage(e));
      setDeckStatus('error');
    } finally {
      setProfileLoaded(true);
    }
  };

  // Initial load for this user (the provider remounts when the user changes).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const p = await fetchProfile(userId);
        if (cancelled) return;
        setProfile(p);
        setProfileLoaded(true);
        if (p.interests.length === 0) return;
        setDeckStatus('loading');
        const result = await fetchDeck();
        if (cancelled) return;
        setDeck(result.deck);
        setCompletedIds(result.completed);
        setDeckStatus('ready');
        loadedForDate.current = localDateString();
      } catch (e) {
        if (cancelled) return;
        setError(errorMessage(e));
        setDeckStatus('error');
        setProfileLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // New day while the app was in the background -> fetch a fresh deck.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && loadedForDate.current && loadedForDate.current !== localDateString()) {
        refreshRef.current();
      }
    });
    return () => sub.remove();
  }, []);

  const completeCard = (cardId: string) => {
    if (!profile || completedIds.has(cardId)) return 0;

    const today = localDateString();
    const before = { profile, completedIds };
    setCompletedIds(new Set(completedIds).add(cardId));
    setProfile({
      ...profile,
      xp: profile.xp + XP_PER_CARD,
      streak: nextStreak(profile, today),
      last_active_date: profile.last_active_date && profile.last_active_date > today ? profile.last_active_date : today,
    });

    supabase
      .rpc('complete_card', { p_card_id: cardId, p_local_date: today })
      .single<Profile>()
      .then(({ data, error: rpcError }) => {
        if (rpcError) {
          // Roll back the optimistic update.
          setProfile(before.profile);
          setCompletedIds(before.completedIds);
          setError(`Couldn't save your progress: ${rpcError.message}`);
          return;
        }
        if (data) setProfile(data);
      });

    return XP_PER_CARD;
  };

  const saveInterests = async (interests: string[]) => {
    if (!userId) throw new Error('Not signed in');
    // Clients may only write `interests` (see column grants in schema.sql).
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ interests })
      .eq('id', userId)
      .select('id, interests, xp, streak, last_active_date');
    if (updateError) throw updateError;

    let saved = (data as Profile[] | null)?.[0];
    if (!saved) {
      // No profile row yet (user created before the trigger existed).
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, interests })
        .select('id, interests, xp, streak, last_active_date')
        .single<Profile>();
      if (insertError) throw insertError;
      saved = inserted;
    }
    setProfile(saved);
    setProfileLoaded(true);
    await loadDeck();
  };

  const value: ProgressState = {
    profile,
    profileLoaded,
    xp: profile?.xp ?? 0,
    streak: visibleStreak(profile),
    deck,
    deckStatus,
    error,
    completedIds,
    completeCard,
    saveInterests,
    refresh,
  };

  return <ProgressContext value={value}>{children}</ProgressContext>;
}

export function useProgress() {
  const ctx = use(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
