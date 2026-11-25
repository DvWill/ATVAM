import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { useSelectedMonth } from '@/context/MonthContext';
import { monthLabel } from '@/utils/date';

export function MonthSelector() {
  const { month, goToPreviousMonth, goToNextMonth, canGoNext } = useSelectedMonth();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={goToPreviousMonth}
        hitSlop={12}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Mês anterior"
      >
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </Pressable>

      <Text style={styles.label}>{monthLabel(month)}</Text>

      <Pressable
        onPress={goToNextMonth}
        disabled={!canGoNext}
        hitSlop={12}
        style={[styles.button, !canGoNext && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="Próximo mês"
        accessibilityState={{ disabled: !canGoNext }}
      >
        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  button: {
    padding: spacing.sm,
  },
  disabled: {
    opacity: 0.25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
