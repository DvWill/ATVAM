// Guarda o mês selecionado e o compartilha entre as abas, para que
// Resumo, Transações e Orçamentos mostrem sempre o mesmo período.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { addMonths, compareYearMonth, currentYearMonth, type YearMonth } from '@/utils/date';

interface MonthContextValue {
  month: YearMonth;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  /** Não deixamos avançar além do mês atual, pois não há lançamentos futuros. */
  canGoNext: boolean;
}

const MonthContext = createContext<MonthContextValue | null>(null);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState<YearMonth>(currentYearMonth);

  const value = useMemo<MonthContextValue>(() => {
    const canGoNext = compareYearMonth(month, currentYearMonth()) < 0;
    return {
      month,
      canGoNext,
      goToPreviousMonth: () => setMonth((m) => addMonths(m, -1)),
      goToNextMonth: () => {
        if (canGoNext) setMonth((m) => addMonths(m, 1));
      },
    };
  }, [month]);

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useSelectedMonth(): MonthContextValue {
  const context = useContext(MonthContext);
  if (!context) throw new Error('useSelectedMonth precisa estar dentro de <MonthProvider>.');
  return context;
}
