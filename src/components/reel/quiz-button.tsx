import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppColors } from '@/constants/topics';

export type QuizButtonState = 'idle' | 'correct' | 'wrong' | 'dimmed';

const EDGE = 5;

const palette: Record<QuizButtonState, { face: string; edge: string; text: string }> = {
  idle: { face: '#FFFFFF', edge: '#C9C5D6', text: '#1F1B2E' },
  correct: { face: AppColors.success, edge: AppColors.successEdge, text: '#FFFFFF' },
  wrong: { face: AppColors.danger, edge: AppColors.dangerEdge, text: '#FFFFFF' },
  dimmed: { face: 'rgba(255,255,255,0.55)', edge: 'rgba(201,197,214,0.55)', text: '#4B4560' },
};

type Props = {
  label: string;
  letter: string;
  state: QuizButtonState;
  disabled?: boolean;
  /** Increment to replay the shake animation. */
  shakeKey: number;
  onPress: () => void;
};

/** Chunky Duolingo-style 3D button: a thick bottom edge that flattens on press. */
export function QuizButton({ label, letter, state, disabled, shakeKey, onPress }: Props) {
  const pressed = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const colors = palette[state];

  useEffect(() => {
    if (shakeKey === 0) return;
    shakeX.set(
      withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      )
    );
  }, [shakeKey, shakeX]);

  const wrapperStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * EDGE }],
  }));

  return (
    <Animated.View style={wrapperStyle}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => pressed.set(withTiming(1, { duration: 60 }))}
        onPressOut={() => pressed.set(withTiming(0, { duration: 90 }))}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, selected: state === 'correct' }}>
        <Animated.View style={[styles.edge, { backgroundColor: colors.edge }]} />
        <Animated.View style={[styles.face, { backgroundColor: colors.face }, faceStyle]}>
          <Text style={[styles.letter, { color: colors.text, borderColor: colors.edge }]}>{letter}</Text>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: EDGE,
    bottom: 0,
    borderRadius: 18,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    marginBottom: EDGE,
  },
  letter: {
    width: 30,
    height: 30,
    lineHeight: 26,
    textAlign: 'center',
    borderWidth: 2,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '900',
    overflow: 'hidden',
  },
  label: { flex: 1, fontSize: 16, fontWeight: '800' },
});
