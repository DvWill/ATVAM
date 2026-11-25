import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { Category } from '@/constants/categories';

export function CategoryIcon({ category, size = 40 }: { category: Category; size?: number }) {
  return (
    <View
      style={[
        styles.circle,
        // "22" no fim da cor = transparência (~13%), criando um fundo suave.
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${category.color}22` },
      ]}
    >
      <Ionicons name={category.icon} size={size * 0.5} color={category.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
