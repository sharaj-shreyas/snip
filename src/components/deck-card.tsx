import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Topics } from '@/constants/topics';
import type { LearningCard } from '@/data/cards';

type Props = {
  card: LearningCard;
  done: boolean;
  onPress: () => void;
};

export function DeckCard({ card, done, onPress }: Props) {
  const theme = Topics[card.topic];
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => scale.set(withSpring(0.97, { damping: 15 }))}
      onPressOut={() => scale.set(withSpring(1, { damping: 12 }))}
      accessibilityRole="button"
      accessibilityLabel={`${theme.label}: ${card.headline}${done ? ', completed' : ''}`}>
      <Animated.View style={[styles.shadow, animatedStyle]}>
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}>
          <Text style={styles.bgEmoji} accessibilityElementsHidden importantForAccessibility="no">
            {theme.emoji}
          </Text>

          <View style={styles.topRow}>
            <View style={[styles.chip, { backgroundColor: theme.accent }]}>
              <Text style={[styles.chipText, { color: theme.onAccent }]}>{theme.label}</Text>
            </View>
            {done ? (
              <View style={styles.doneBadge}>
                <Text style={styles.doneText}>✓ Done</Text>
              </View>
            ) : (
              <Text style={styles.meta}>{card.minutes} min</Text>
            )}
          </View>

          <Text style={styles.headline} numberOfLines={3}>
            {card.headline}
          </Text>
          <Text style={styles.hook} numberOfLines={2}>
            {card.hook}
          </Text>

          <View style={styles.bottomRow}>
            <Text style={styles.meta}>4 stages · 1-tap quiz</Text>
            <View style={[styles.cta, { backgroundColor: done ? 'rgba(255,255,255,0.18)' : theme.accent }]}>
              <Text style={[styles.ctaText, { color: done ? '#FFFFFF' : theme.onAccent }]}>
                {done ? 'Review' : 'Start ▸'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 28,
    boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
  },
  card: {
    borderRadius: 28,
    padding: 20,
    gap: 10,
    overflow: 'hidden',
    minHeight: 210,
  },
  bgEmoji: {
    position: 'absolute',
    right: -10,
    bottom: -18,
    fontSize: 120,
    opacity: 0.18,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '900' },
  doneBadge: {
    backgroundColor: '#58CC02',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  doneText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  meta: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700' },
  headline: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 6,
  },
  hook: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 21, fontWeight: '500' },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 8,
  },
  cta: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  ctaText: { fontSize: 14, fontWeight: '900' },
});
