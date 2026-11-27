import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type SegmentProps = { filled: boolean; color: string };

function Segment({ filled, color }: SegmentProps) {
  const progress = useSharedValue(filled ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(filled ? 1 : 0, { duration: 280 }));
  }, [filled, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

type Props = { total: number; current: number; color?: string };

/** Instagram-Story style segmented bar. Segments up to and including `current` are filled. */
export function StoryProgressBar({ total, current, color = '#FFFFFF' }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}>
      {Array.from({ length: total }, (_, i) => (
        <Segment key={i} filled={i <= current} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2 },
});
