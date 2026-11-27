import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HighlightedText } from '@/components/highlighted-text';
import { StatPills } from '@/components/stat-pills';
import { BottomTabInset } from '@/constants/theme';
import { Topics, XP_PER_CARD } from '@/constants/topics';
import { useProgress } from '@/context/progress-context';
import type { LearningCard } from '@/data/cards';
import { haptic } from '@/utils/haptics';

import { QuizStage } from './quiz-stage';
import { StoryProgressBar } from './story-progress-bar';

const STAGES = ['Hook', 'Breakdown', 'Why it matters', 'Quiz'] as const;
const LAST_STAGE = STAGES.length - 1;
/** Left 35% of the screen goes back, the rest goes forward (like Stories). */
const BACK_ZONE = 0.35;

type Props = {
  card: LearningCard;
  index: number;
  total: number;
  height: number;
  onNext: () => void;
};

export function LearningReel({ card, index, total, height, onNext }: Props) {
  const theme = Topics[card.topic];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { completedIds, completeCard } = useProgress();
  const alreadyDone = completedIds.has(card.id);

  const [stage, setStage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Correct-answer effects
  const flash = useSharedValue(0);
  const xpFloat = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const xpStyle = useAnimatedStyle(() => ({
    opacity: xpFloat.value === 0 ? 0 : 1 - Math.max(0, xpFloat.value - 0.6) / 0.4,
    transform: [{ translateY: -90 * xpFloat.value }, { scale: 0.8 + 0.4 * Math.min(1, xpFloat.value * 3) }],
  }));

  const goTo = (next: number) => {
    setDirection(next > stage ? 1 : -1);
    setStage(next);
    haptic.tap();
  };

  const handleTap = (e: GestureResponderEvent) => {
    const goingBack = e.nativeEvent.pageX < width * BACK_ZONE;
    if (goingBack) {
      if (stage > 0) goTo(stage - 1);
      return;
    }
    if (stage < LAST_STAGE) {
      goTo(stage + 1);
    } else if (completedIds.has(card.id)) {
      haptic.tap();
      onNext();
    }
  };

  const handleCorrect = () => {
    const gained = completeCard(card.id);
    flash.set(withSequence(withTiming(0.55, { duration: 90 }), withTiming(0, { duration: 450 })));
    if (gained > 0) {
      xpFloat.set(0);
      xpFloat.set(withDelay(120, withTiming(1, { duration: 1100 })));
    }
  };

  const entering = (direction === 1 ? FadeInRight : FadeInLeft).duration(260);

  return (
    <Pressable
      onPress={handleTap}
      style={{ height, width }}
      accessibilityHint="Tap the right side to continue, the left side to go back">
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, { backgroundColor: theme.accent }]} pointerEvents="none" />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + BottomTabInset + 12 },
        ]}>
        <StoryProgressBar total={STAGES.length} current={stage} color={theme.accent} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.chip, { backgroundColor: theme.accent }]}>
              <Text style={[styles.chipText, { color: theme.onAccent }]}>{theme.label}</Text>
            </View>
            <Text style={styles.counter}>
              {index + 1}/{total} · {STAGES[stage]}
            </Text>
          </View>
          <StatPills variant="glass" />
        </View>

        <View style={styles.stageArea}>
          <Animated.View
            key={stage}
            entering={entering}
            exiting={FadeOut.duration(120)}
            style={StyleSheet.absoluteFill}>
            {stage === 0 && (
              <View style={styles.hookStage}>
                <Text style={styles.emoji}>{theme.emoji}</Text>
                <Text style={styles.headline}>{card.headline}</Text>
                <Text style={styles.hook}>{card.hook}</Text>
              </View>
            )}

            {stage === 1 && (
              <View style={styles.centerStage}>
                <Text style={[styles.kicker, { color: theme.accent }]}>THE BREAKDOWN</Text>
                {card.breakdown.map((point, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.delay(80 + i * 90).springify()}
                    style={styles.bulletRow}>
                    <View style={[styles.bulletBadge, { backgroundColor: theme.accent }]}>
                      <Text style={[styles.bulletNum, { color: theme.onAccent }]}>{i + 1}</Text>
                    </View>
                    <HighlightedText style={styles.bulletText} highlightColor={theme.accent}>
                      {point}
                    </HighlightedText>
                  </Animated.View>
                ))}
              </View>
            )}

            {stage === 2 && (
              <View style={styles.centerStage}>
                <Text style={[styles.kicker, { color: theme.accent }]}>🌍 WHY IT MATTERS</Text>
                <View style={[styles.impactCard, { borderLeftColor: theme.accent }]}>
                  <Text style={styles.impactText}>{card.impact}</Text>
                </View>
              </View>
            )}

            {stage === 3 && (
              <QuizStage
                quiz={card.quiz}
                theme={theme}
                initiallySolved={alreadyDone}
                onCorrect={handleCorrect}
              />
            )}
          </Animated.View>
        </View>

        <Animated.Text key={`hint-${stage}-${alreadyDone}`} entering={FadeIn.delay(400)} style={styles.footerHint}>
          {stage < LAST_STAGE
            ? 'Tap to continue  ›'
            : alreadyDone
              ? index < total - 1
                ? 'Tap or swipe up for the next reel  ↑'
                : 'Tap to finish your deck  ✓'
              : 'Pick an answer'}
        </Animated.Text>
      </View>

      {/* Correct-answer green flash */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#58CC02' }, flashStyle]}
      />

      {/* +XP float */}
      <Animated.View pointerEvents="none" style={[styles.xpFloat, xpStyle]}>
        <Text style={styles.xpFloatText}>+{XP_PER_CARD} XP ⚡</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -120,
    right: -120,
    opacity: 0.14,
  },
  content: { flex: 1, paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '900' },
  counter: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700', flexShrink: 1 },
  stageArea: { flex: 1 },
  hookStage: { flex: 1, justifyContent: 'center', gap: 18 },
  emoji: { fontSize: 56 },
  headline: {
    color: '#FFFFFF',
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  hook: { color: 'rgba(255,255,255,0.88)', fontSize: 20, lineHeight: 28, fontWeight: '600' },
  centerStage: { flex: 1, justifyContent: 'center', gap: 18 },
  kicker: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  bulletRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 20,
    padding: 16,
  },
  bulletBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletNum: { fontSize: 15, fontWeight: '900' },
  bulletText: { flex: 1, color: '#FFFFFF', fontSize: 18, lineHeight: 25, fontWeight: '600' },
  impactCard: {
    borderLeftWidth: 5,
    paddingLeft: 18,
    paddingVertical: 6,
  },
  impactText: { color: '#FFFFFF', fontSize: 26, lineHeight: 36, fontWeight: '800' },
  footerHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  xpFloat: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    backgroundColor: '#FACC15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderBottomWidth: 4,
    borderBottomColor: '#CA8A04',
  },
  xpFloatText: { color: '#422006', fontSize: 24, fontWeight: '900' },
});
