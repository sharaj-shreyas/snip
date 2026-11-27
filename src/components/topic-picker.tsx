import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors, TOPIC_IDS, Topics, type TopicId } from '@/constants/topics';
import { haptic } from '@/utils/haptics';

type Props = {
  selected: readonly string[];
  onChange: (next: TopicId[]) => void;
};

export function TopicPicker({ selected, onChange }: Props) {
  const toggle = (id: TopicId) => {
    haptic.tap();
    const isOn = selected.includes(id);
    const next = TOPIC_IDS.filter((t) => (t === id ? !isOn : selected.includes(t)));
    onChange(next);
  };

  return (
    <View style={styles.grid}>
      {TOPIC_IDS.map((id) => {
        const theme = Topics[id];
        const on = selected.includes(id);
        return (
          <Pressable
            key={id}
            onPress={() => toggle(id)}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={theme.label}>
            {on ? (
              <LinearGradient colors={theme.gradient} style={[styles.inner, { borderColor: theme.accent }]}>
                <TileContent id={id} on />
              </LinearGradient>
            ) : (
              <View style={[styles.inner, styles.off]}>
                <TileContent id={id} on={false} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function TileContent({ id, on }: { id: TopicId; on: boolean }) {
  const theme = Topics[id];
  return (
    <>
      <Text style={styles.emoji}>{theme.emoji}</Text>
      <Text style={[styles.label, on && { color: theme.accent }]}>{theme.label}</Text>
      <View style={[styles.check, on && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
        {on && <Text style={[styles.checkMark, { color: theme.onAccent }]}>✓</Text>}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47%', flexGrow: 1 },
  pressed: { transform: [{ scale: 0.97 }] },
  inner: {
    minHeight: 104,
    borderRadius: 22,
    borderWidth: 2,
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  off: { backgroundColor: AppColors.surface, borderColor: AppColors.border },
  emoji: { fontSize: 30 },
  label: { color: AppColors.text, fontSize: 18, fontWeight: '900' },
  check: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 13, fontWeight: '900' },
});
