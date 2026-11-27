import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/chunky-button';
import { TopicPicker } from '@/components/topic-picker';
import { MaxContentWidth } from '@/constants/theme';
import { AppColors, MIN_INTERESTS, type TopicId } from '@/constants/topics';
import { useAuth } from '@/context/auth-context';
import { useProgress } from '@/context/progress-context';
import { haptic } from '@/utils/haptics';

function messageOf(e: unknown) {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}>
        {session ? <TopicsStep /> : <AccountStep />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AccountStep() {
  const { signUpWithEmail, signInWithEmail, signInAsGuest } = useAuth();
  const [mode, setMode] = useState<'signUp' | 'signIn'>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canSubmit = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const submit = async () => {
    setError(null);
    setInfo(null);
    setBusy('email');
    try {
      if (mode === 'signUp') {
        const { needsConfirmation } = await signUpWithEmail(email.trim(), password);
        if (needsConfirmation) {
          setInfo('Check your inbox and tap the confirmation link, then log in here.');
          setMode('signIn');
        }
      } else {
        await signInWithEmail(email.trim(), password);
      }
      haptic.success();
    } catch (e) {
      haptic.error();
      setError(messageOf(e));
    } finally {
      setBusy(null);
    }
  };

  const guest = async () => {
    setError(null);
    setBusy('guest');
    try {
      await signInAsGuest();
      haptic.success();
    } catch (e) {
      haptic.error();
      setError(messageOf(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.step}>
      <View style={styles.hero}>
        <Text style={styles.logo}>⚡ snip</Text>
        <Text style={styles.title}>5 tiny reels.{'\n'}One big brain.</Text>
        <Text style={styles.subtitle}>
          Bite-size tech & science, a 1-tap quiz, and a streak to keep alive.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={AppColors.textMuted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (6+ characters)"
          placeholderTextColor={AppColors.textMuted}
          secureTextEntry
          autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
          textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
          style={styles.input}
          onSubmitEditing={canSubmit ? submit : undefined}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        <ChunkyButton
          label={mode === 'signUp' ? 'Create account' : 'Log in'}
          onPress={submit}
          disabled={!canSubmit || busy !== null}
          loading={busy === 'email'}
        />

        <Pressable
          onPress={() => {
            setMode(mode === 'signUp' ? 'signIn' : 'signUp');
            setError(null);
          }}
          accessibilityRole="button"
          style={styles.linkButton}>
          <Text style={styles.link}>
            {mode === 'signUp' ? 'Already have an account? Log in' : 'New here? Create an account'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <ChunkyButton
        label="Continue as guest"
        variant="secondary"
        onPress={guest}
        disabled={busy !== null}
        loading={busy === 'guest'}
      />
    </Animated.View>
  );
}

function TopicsStep() {
  const { profile, saveInterests } = useProgress();
  const { signOut } = useAuth();
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
      // The root layout's guard switches to the tabs once interests are saved.
    } catch (e) {
      haptic.error();
      setError(messageOf(e));
      setSaving(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.step}>
      <View style={styles.hero}>
        <Text style={styles.title}>What sparks{'\n'}your curiosity?</Text>
        <Text style={styles.subtitle}>
          Pick at least {MIN_INTERESTS}. Your Daily 5 is built from these.
        </Text>
      </View>

      <TopicPicker selected={selected} onChange={(next: TopicId[]) => setSelected(next)} />

      {error && <Text style={styles.error}>{error}</Text>}

      <ChunkyButton
        label={remaining > 0 ? `Pick ${remaining} more` : "Let's go"}
        onPress={save}
        disabled={remaining > 0}
        loading={saving}
      />

      <Pressable onPress={() => signOut()} accessibilityRole="button" style={styles.linkButton}>
        <Text style={styles.link}>Use a different account</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: MaxContentWidth / 1.5,
    alignSelf: 'center',
  },
  step: { gap: 20 },
  hero: { gap: 10 },
  logo: { color: AppColors.success, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  title: { color: AppColors.text, fontSize: 38, lineHeight: 42, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: AppColors.textMuted, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  form: { gap: 12 },
  input: {
    backgroundColor: AppColors.surface,
    borderWidth: 2,
    borderColor: AppColors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  error: { color: AppColors.danger, fontSize: 14, fontWeight: '700' },
  info: { color: AppColors.xp, fontSize: 14, fontWeight: '700' },
  linkButton: { alignSelf: 'center', paddingVertical: 6 },
  link: { color: AppColors.textMuted, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: AppColors.border },
  dividerText: { color: AppColors.textMuted, fontSize: 13, fontWeight: '700' },
});
