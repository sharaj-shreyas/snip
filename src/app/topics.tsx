import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/chunky-button';
import { TopicPicker } from '@/components/topic-picker';
import { AppColors, MIN_INTERESTS } from '@/constants/topics';
import { useProgress } from '@/context/progress-context';
import { haptic } from '@/utils/haptics';

/** Modal for editing interests after onboarding. */
export default function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, saveInterests } = useProgress();
  const [selected, setSelected] = useState<string[]>(profile?.interests ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = Math.max(0, MIN_INTERESTS - selected.length);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveInterests(selected);
      haptic.success();
      router.back();
    } catch (e) {
      haptic.error();
      setError(e instanceof Error ? e.message : 'Could not save your topics.');
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your topics</Text>
        <Text style={styles.subtitle}>Pick at least {MIN_INTERESTS}. Your deck refreshes right away.</Text>
      </View>
      <TopicPicker selected={selected} onChange={setSelected} />
      {error && <Text style={styles.error}>{error}</Text>}
      <ChunkyButton
        label={remaining > 0 ? `Pick ${remaining} more` : 'Save topics'}
        onPress={save}
        disabled={remaining > 0}
        loading={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 24, gap: 20 },
  header: { gap: 6 },
  title: { color: AppColors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: AppColors.textMuted, fontSize: 15, fontWeight: '600' },
  error: { color: AppColors.danger, fontSize: 14, fontWeight: '700' },
});
