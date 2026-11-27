import { NativeTabs } from 'expo-router/native-tabs';

import { AppColors } from '@/constants/topics';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={AppColors.background}
      indicatorColor={AppColors.surfaceRaised}
      tintColor={AppColors.success}
      labelStyle={{ selected: { color: AppColors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Daily 5</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="learn">
        <NativeTabs.Trigger.Label>Learn</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'play.rectangle', selected: 'play.rectangle.fill' }}
          md="play_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
