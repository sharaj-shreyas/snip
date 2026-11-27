import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppColors } from '@/constants/topics';
import { useProgress } from '@/context/progress-context';

/** Pops whenever `value` changes (skips the first render). */
function useBounceOnChange(value: number) {
  const scale = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.set(withSequence(withTiming(1.25, { duration: 120 }), withSpring(1, { damping: 8 })));
  }, [value, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

type Props = { variant?: 'solid' | 'glass' };

export function StatPills({ variant = 'solid' }: Props) {
  const { xp, streak } = useProgress();
  const streakStyle = useBounceOnChange(streak);
  const xpStyle = useBounceOnChange(xp);
  const pill = variant === 'glass' ? styles.glass : styles.solid;

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.pill, pill, streakStyle]} accessibilityLabel={`${streak} day streak`}>
        <Text style={styles.emoji}>🔥</Text>
        <Text style={[styles.value, { color: AppColors.flame }]}>{streak}</Text>
      </Animated.View>
      <Animated.View style={[styles.pill, pill, xpStyle]} accessibilityLabel={`${xp} XP`}>
        <Text style={styles.emoji}>⚡</Text>
        <Text style={[styles.value, { color: AppColors.xp }]}>{xp} XP</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  solid: { backgroundColor: AppColors.surfaceRaised, borderWidth: 1, borderColor: AppColors.border },
  glass: { backgroundColor: 'rgba(0,0,0,0.28)' },
  emoji: { fontSize: 15 },
  value: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
