import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/chunky-button';
import { DeckCard } from '@/components/deck-card';
import { StatPills } from '@/components/stat-pills';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { AppColors, DAILY_GOAL, isTopicId, Topics } from '@/constants/topics';
import { useAuth } from '@/context/auth-context';
import { useProgress } from '@/context/progress-context';
import { haptic } from '@/utils/haptics';

function DeckProgress({ done }: { done: number }) {
  const clamped = Math.min(done, DAILY_GOAL);
  const progress = useSharedValue(clamped / DAILY_GOAL);
  useEffect(() => {
    progress.set(withSpring(clamped / DAILY_GOAL, { damping: 14 }));
  }, [clamped, progress]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const complete = clamped >= DAILY_GOAL;

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Today&apos;s Deck</Text>
        <Text style={styles.progressCount}>
          {clamped}/{DAILY_GOAL}
        </Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: DAILY_GOAL, now: clamped }}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <View style={styles.fillShine} />
        </Animated.View>
      </View>
      <Text style={styles.progressSub}>
        {complete
          ? '🎉 Deck complete! Come back tomorrow.'
          : done === 0
            ? 'Finish a reel to keep your 🔥 streak alive'
            : `${DAILY_GOAL - clamped} to go. You're on a roll!`}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { deck, deckStatus, error, completedIds, profile, refresh } = useProgress();
  const { session, signOut } = useAuth();
  const navCount = useRef(0);
  const [refreshing, setRefreshing] = useState(false);
  const doneCount = deck.filter((c) => completedIds.has(c.id)).length;
  const isGuest = session?.user.is_anonymous ?? false;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const openCard = (cardId: string) => {
    haptic.tap();
    // `t` forces a re-scroll even if the same card is tapped twice.
    navCount.current += 1;
    router.navigate({ pathname: '/learn', params: { cardId, t: String(navCount.current) } });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + BottomTabInset + 24 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.text} />
      }>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Good to see you 👋</Text>
          <Text style={styles.title}>Daily 5</Text>
        </View>
        <StatPills />
      </View>

      <DeckProgress done={doneCount} />

      <Pressable
        onPress={() => router.push('/topics')}
        style={({ pressed }) => [styles.topicsRow, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Edit your topics">
        <View style={styles.topicChips}>
          {(profile?.interests ?? []).filter(isTopicId).map((id) => (
            <View key={id} style={[styles.topicChip, { borderColor: Topics[id].gradient[0] }]}>
              <Text style={styles.topicChipText}>
                {Topics[id].emoji} {Topics[id].label}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.editLink}>Edit</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Up next</Text>
      <View style={styles.feed}>
        {deckStatus === 'loading' && deck.length === 0 ? (
          <ActivityIndicator color={AppColors.text} style={styles.statusBox} />
        ) : deckStatus === 'error' && deck.length === 0 ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>Couldn&apos;t load your deck</Text>
            <Text style={styles.statusBody}>{error}</Text>
            <ChunkyButton label="Try again" variant="secondary" onPress={onRefresh} />
          </View>
        ) : deck.length === 0 ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>You&apos;ve cleared every card in your topics 🎉</Text>
            <Text style={styles.statusBody}>Add more topics or check back when new cards drop.</Text>
          </View>
        ) : (
          deck.map((card) => (
            <DeckCard
              key={card.id}
              card={card}
              done={completedIds.has(card.id)}
              onPress={() => openCard(card.id)}
            />
          ))
        )}
        {error && deck.length > 0 && <Text style={styles.inlineError}>{error}</Text>}
      </View>

      <Pressable onPress={() => signOut()} accessibilityRole="button" style={styles.signOut}>
        <Text style={styles.signOutText}>
          {isGuest ? 'Sign out (guest progress will be lost)' : 'Sign out'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.background },
  content: {
    paddingHorizontal: 20,
    gap: 18,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  greeting: { color: AppColors.textMuted, fontSize: 14, fontWeight: '600' },
  title: { color: AppColors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  progressCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 18,
    gap: 12,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { color: AppColors.text, fontSize: 18, fontWeight: '800' },
  progressCount: { color: AppColors.success, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  track: {
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 8, backgroundColor: AppColors.success },
  fillShine: {
    position: 'absolute',
    top: 3,
    left: 8,
    right: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  progressSub: { color: AppColors.textMuted, fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: AppColors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  feed: { gap: 16 },
  pressed: { opacity: 0.7 },
  topicsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicChips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: AppColors.surface,
  },
  topicChipText: { color: AppColors.text, fontSize: 12, fontWeight: '800' },
  editLink: { color: AppColors.success, fontSize: 14, fontWeight: '900' },
  statusBox: {
    paddingVertical: 32,
    paddingHorizontal: 8,
    gap: 10,
    alignItems: 'stretch',
  },
  statusTitle: { color: AppColors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  statusBody: { color: AppColors.textMuted, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  inlineError: { color: AppColors.danger, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  signOut: { alignSelf: 'center', paddingVertical: 8 },
  signOutText: { color: AppColors.textMuted, fontSize: 13, fontWeight: '700' },
});
