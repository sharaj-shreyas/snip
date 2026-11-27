import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/topics';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/(tabs)/index" asChild>
            <TabButton>🏠 Daily 5</TabButton>
          </TabTrigger>
          <TabTrigger name="learn" href="/learn" asChild>
            <TabButton>▶️ Learn</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

// `ref` is typed for a View, not a Pressable, so it's dropped rather than forwarded.
export function TabButton({ children, isFocused, ref: _ref, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButton, isFocused && styles.tabButtonFocused]}>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>{children}</Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.inner}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 12,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(22,20,31,0.92)',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  pressed: { opacity: 0.7 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999 },
  tabButtonFocused: { backgroundColor: AppColors.surfaceRaised },
  tabLabel: { color: AppColors.textMuted, fontSize: 14, fontWeight: '700' },
  tabLabelFocused: { color: AppColors.text },
});
