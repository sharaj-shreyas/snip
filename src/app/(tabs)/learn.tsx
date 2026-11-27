import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LearningReel } from '@/components/reel/learning-reel';
import { BottomTabInset } from '@/constants/theme';
import { AppColors } from '@/constants/topics';
import { useProgress } from '@/context/progress-context';
import type { LearningCard } from '@/data/cards';

export default function LearnScreen() {
  const { cardId, t } = useLocalSearchParams<{ cardId?: string; t?: string }>();
  const { deck, deckStatus } = useProgress();
  const listRef = useRef<FlatList<LearningCard>>(null);
  const [pageHeight, setPageHeight] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && h !== pageHeight) setPageHeight(h);
  };

  // Jump to the card tapped on the Home tab.
  const targetIndex = cardId ? deck.findIndex((c) => c.id === cardId) : -1;
  useEffect(() => {
    if (targetIndex < 0 || pageHeight === 0) return;
    listRef.current?.scrollToOffset({ offset: targetIndex * pageHeight, animated: false });
  }, [targetIndex, t, pageHeight]);

  const goToNext = (index: number) => {
    listRef.current?.scrollToOffset({ offset: (index + 1) * pageHeight, animated: true });
  };

  if (deck.length === 0) {
    return (
      <View style={[styles.screen, styles.center]}>
        {deckStatus === 'loading' ? (
          <ActivityIndicator color={AppColors.text} />
        ) : (
          <Text style={styles.footerBody}>No reels yet. Pull to refresh on the Daily 5 tab.</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen} onLayout={onLayout}>
      {pageHeight > 0 && (
        <FlatList
          ref={listRef}
          data={deck}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <LearningReel
              card={item}
              index={index}
              total={deck.length}
              height={pageHeight}
              onNext={() => goToNext(index)}
            />
          )}
          ListFooterComponent={<DeckCompleteFooter height={pageHeight} />}
          getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
          pagingEnabled
          decelerationRate="fast"
          snapToAlignment="start"
          showsVerticalScrollIndicator={false}
          initialNumToRender={2}
          windowSize={3}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        />
      )}
    </View>
  );
}

function DeckCompleteFooter({ height }: { height: number }) {
  const insets = useSafeAreaInsets();
  const { deck, completedIds, xp } = useProgress();
  const remaining = deck.filter((c) => !completedIds.has(c.id)).length;

  return (
    <View style={[styles.footer, { height, paddingBottom: insets.bottom + BottomTabInset }]}>
      <Text style={styles.footerEmoji}>{remaining === 0 ? '🏆' : '👀'}</Text>
      <Text style={styles.footerTitle}>{remaining === 0 ? "You're all caught up!" : 'End of the feed'}</Text>
      <Text style={styles.footerBody}>
        {remaining === 0
          ? `Every quiz solved. You're at ${xp} XP.`
          : `${remaining} reel${remaining === 1 ? '' : 's'} still waiting for a quiz answer.`}
      </Text>
      <Pressable
        onPress={() => router.navigate('/(tabs)/index')}
        style={({ pressed }) => [styles.footerButton, pressed && styles.footerButtonPressed]}
        accessibilityRole="button">
        <Text style={styles.footerButtonText}>Back to Daily 5</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    backgroundColor: AppColors.background,
  },
  footerEmoji: { fontSize: 72 },
  footerTitle: { color: AppColors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  footerBody: { color: AppColors.textMuted, fontSize: 16, textAlign: 'center', fontWeight: '600' },
  footerButton: {
    marginTop: 12,
    backgroundColor: AppColors.success,
    borderBottomWidth: 5,
    borderBottomColor: AppColors.successEdge,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
  },
  footerButtonPressed: { borderBottomWidth: 0, marginTop: 17 },
  footerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});
