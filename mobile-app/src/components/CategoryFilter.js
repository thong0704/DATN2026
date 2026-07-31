import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../theme/theme';

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.pill, isSelected && styles.selectedPill]}
            onPress={() => onSelectCategory(cat.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={cat.icon}
              size={16}
              color={isSelected ? COLORS.textWhite : COLORS.textSecondary}
            />
            <Text style={[styles.pillText, isSelected && styles.selectedPillText]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  selectedPillText: {
    color: COLORS.textWhite,
  },
});
