import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { getCategory } from '@/constants/categories';
import { colors, spacing } from '@/constants/theme';
import type { Transaction } from '@/database/transactions';
import { isoToBR } from '@/utils/date';
import { formatMoney } from '@/utils/money';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  showDate?: boolean;
}

export function TransactionItem({ transaction, onPress, showDate = false }: TransactionItemProps) {
  const category = getCategory(transaction.category);
  const isIncome = transaction.type === 'income';
  const subtitle = showDate ? `${category.name} · ${isoToBR(transaction.date)}` : category.name;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.description}, ${isIncome ? 'receita' : 'despesa'} de ${formatMoney(transaction.amountCents)}`}
    >
      <CategoryIcon category={category} />
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {isIncome ? '+ ' : '- '}
        {formatMoney(transaction.amountCents)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  info: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
