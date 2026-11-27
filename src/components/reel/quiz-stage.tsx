import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppColors, type TopicTheme } from '@/constants/topics';
import type { Quiz } from '@/data/cards';
import { haptic } from '@/utils/haptics';

import { QuizButton, type QuizButtonState } from './quiz-button';

type Props = {
  quiz: Quiz;
  theme: TopicTheme;
  initiallySolved: boolean;
  onCorrect: () => void;
};

const LETTERS = 'ABCD';

export function QuizStage({ quiz, theme, initiallySolved, onCorrect }: Props) {
  const [solved, setSolved] = useState(initiallySolved);
  const [wrong, setWrong] = useState<ReadonlySet<number>>(new Set());
  const [shakeKeys, setShakeKeys] = useState(() => quiz.options.map(() => 0));

  const handlePress = (i: number) => {
    if (solved) return;
    if (i === quiz.correctIndex) {
      haptic.success();
      setSolved(true);
      onCorrect();
    } else {
      haptic.error();
      setWrong((prev) => new Set(prev).add(i));
      setShakeKeys((prev) => prev.map((k, j) => (j === i ? k + 1 : k)));
    }
  };

  const stateFor = (i: number): QuizButtonState => {
    if (solved) return i === quiz.correctIndex ? 'correct' : 'dimmed';
    return wrong.has(i) ? 'wrong' : 'idle';
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.kicker, { color: theme.accent }]}>⚡ 1-TAP QUIZ</Text>
      <Text style={styles.question}>{quiz.question}</Text>

      <View style={styles.options}>
        {quiz.options.map((option, i) => (
          <QuizButton
            key={i}
            letter={LETTERS[i] ?? String(i + 1)}
            label={option}
            state={stateFor(i)}
            disabled={solved}
            shakeKey={shakeKeys[i]}
            onPress={() => handlePress(i)}
          />
        ))}
      </View>

      {solved ? (
        <Animated.View entering={FadeInDown.springify()} style={[styles.feedback, styles.success]}>
          <Text style={styles.feedbackTitle}>🎉 Nailed it!</Text>
          <Text style={styles.feedbackBody}>{quiz.explanation}</Text>
        </Animated.View>
      ) : wrong.size > 0 ? (
        <Animated.View
          key={wrong.size}
          entering={FadeInDown.springify()}
          style={[styles.feedback, styles.hint]}>
          <Text style={styles.feedbackTitle}>💡 Not quite. Try again!</Text>
          <Text style={styles.feedbackBody}>{quiz.hint}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 16 },
  kicker: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  question: { color: '#FFFFFF', fontSize: 26, lineHeight: 32, fontWeight: '900' },
  options: { gap: 10 },
  feedback: { borderRadius: 18, padding: 14, gap: 4, borderWidth: 2 },
  success: { backgroundColor: 'rgba(88,204,2,0.22)', borderColor: AppColors.success },
  hint: { backgroundColor: 'rgba(255,75,75,0.2)', borderColor: AppColors.danger },
  feedbackTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  feedbackBody: { color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 21, fontWeight: '600' },
});
