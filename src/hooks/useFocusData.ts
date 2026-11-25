import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * Executa `load` sempre que a tela ganha foco (ex.: ao voltar do formulário)
 * e sempre que `load` mudar (ex.: troca de mês ou de filtro).
 *
 * IMPORTANTE: envolva `load` em `useCallback` na tela que usar este hook,
 * senão a consulta roda a cada renderização.
 */
export function useFocusData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Evita atualizar o estado com uma resposta antiga se a tela perder
      // o foco (ou o filtro mudar) antes de a consulta terminar.
      let active = true;
      load()
        .then((result) => {
          if (active) {
            setData(result);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (active) setError(err instanceof Error ? err : new Error(String(err)));
        });
      return () => {
        active = false;
      };
    }, [load]),
  );

  return { data, error };
}
