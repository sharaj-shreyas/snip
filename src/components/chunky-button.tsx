import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppColors } from '@/constants/topics';

const EDGE = 5;

const variants = {
  primary: { face: AppColors.success, edge: AppColors.successEdge, text: '#FFFFFF' },
  secondary: { face: AppColors.surfaceRaised, edge: '#0E0C16', text: AppColors.text },
} as const;

type Props = {
  label: string;
  onPress: () => void;
  variant?: keyof typeof variants;
  disabled?: boolean;
  loading?: boolean;
};

/** Duolingo-style button with a thick bottom edge that flattens on press. */
export function ChunkyButton({ label, onPress, variant = 'primary', disabled, loading }: Props) {
  const pressed = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * EDGE }] }));
  const colors = variants[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      onPressIn={() => pressed.set(withTiming(1, { duration: 60 }))}
      onPressOut={() => pressed.set(withTiming(0, { duration: 90 }))}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={inactive && styles.inactive}>
      <Animated.View style={[styles.edge, { backgroundColor: colors.edge }]} />
      <Animated.View style={[styles.face, { backgroundColor: colors.face }, faceStyle]}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inactive: { opacity: 0.5 },
  edge: { position: 'absolute', left: 0, right: 0, top: EDGE, bottom: 0, borderRadius: 18 },
  face: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 18,
    marginBottom: EDGE,
  },
  label: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
});
