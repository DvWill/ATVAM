import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/constants/theme';

interface ProgressBarProps {
  /** Proporção entre 0 e 1 (valores maiores são limitados a 1). */
  progress: number;
  color: string;
  height?: number;
}

export function ProgressBar({ progress, color, height = 8 }: ProgressBarProps) {
  const percent = Math.max(0, Math.min(progress, 1)) * 100;
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  );
}

/** Cor do progresso de um orçamento: verde até 80%, laranja até 100%, vermelho acima. */
export function budgetColor(progress: number): string {
  if (progress > 1) return colors.expense;
  if (progress >= 0.8) return colors.warning;
  return colors.income;
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
