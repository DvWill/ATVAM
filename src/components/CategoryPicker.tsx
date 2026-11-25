import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Category } from '@/constants/categories';
import { colors, radius, spacing } from '@/constants/theme';

interface CategoryPickerProps {
  categories: Category[];
  value: string | null;
  onChange: (id: string) => void;
  error?: string;
}

export function CategoryPicker({ categories, value, onChange, error }: CategoryPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Categoria</Text>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {categories.map((category) => {
          const selected = category.id === value;
          return (
            <Pressable
              key={category.id}
              onPress={() => onChange(category.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={category.name}
              style={[
                styles.chip,
                selected && { backgroundColor: `${category.color}22`, borderColor: category.color },
              ]}
            >
              <Ionicons name={category.icon} size={16} color={category.color} />
              <Text style={[styles.chipText, selected && { color: colors.text, fontWeight: '700' }]}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  error: {
    fontSize: 13,
    color: colors.expense,
  },
});
