import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';

export interface HabitGridTile {
  date: string;
  completed: boolean;
  isToday: boolean;
  accentColor: string;
}

export interface HabitGridViewModel {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  tiles: HabitGridTile[];
  stats: {
    streak: number;
    completionPercent: number;
  };
}

interface HabitGridSectionProps {
  habits: HabitGridViewModel[];
  onToggleDay: (habitId: string, date: string, nextCompleted: boolean) => void;
  disabled?: boolean;
}

const GRID_COLUMNS = 7;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const hexToRGBA = (hex: string | null | undefined, alpha: number) => {
  if (!hex) {
    return `rgba(77, 161, 255, ${alpha})`;
  }

  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) {
    return `rgba(77, 161, 255, ${alpha})`;
  }

  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function HabitGridSection({ habits, onToggleDay, disabled = false }: HabitGridSectionProps) {
  if (habits.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Habit Grid</Text>
          <Text style={styles.sectionSubtitle}>Past 8 weeks of momentum</Text>
        </View>
      </View>

      {habits.map(habit => {
        const rows = Math.ceil(habit.tiles.length / GRID_COLUMNS);
        const accent = habit.tiles[0]?.accentColor ?? COLORS.ACCENT_GRADIENT_START;
        const backgroundTint = hexToRGBA(accent, 0.08);
        const borderTint = hexToRGBA(accent, 0.24);

        return (
          <View
            key={habit.id}
            style={[
              styles.habitCard,
              {
                backgroundColor: '#fff',
                borderColor: borderTint,
                shadowColor: hexToRGBA(accent, 0.25),
              },
            ]}
            accessibilityRole="summary"
          >
            <View style={styles.habitHeader}>
              <View style={styles.habitIdentity}>
                {habit.icon ? (
                  <View style={[styles.iconChip, { backgroundColor: backgroundTint, borderColor: borderTint }]}>
                    <Text style={styles.iconText}>{habit.icon}</Text>
                  </View>
                ) : null}
                <View style={styles.identityCopy}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  {habit.description ? <Text style={styles.habitDescription}>{habit.description}</Text> : null}
                </View>
              </View>
              <View
                style={[
                  styles.metricPill,
                  {
                    backgroundColor: hexToRGBA(accent, 0.12),
                    borderColor: borderTint,
                  },
                ]}
                accessibilityLabel={`Streak ${habit.stats.streak} days, ${habit.stats.completionPercent}% complete`}
              >
                <Text style={[styles.metricPillValue, { color: accent }]}>{habit.stats.streak}d</Text>
                <Text style={styles.metricPillHint}>{habit.stats.completionPercent}%</Text>
              </View>
            </View>

            <View style={styles.gridWrapper}>
              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map(label => (
                  <Text key={label} style={styles.weekdayLabel}>
                    {label}
                  </Text>
                ))}
              </View>
              {Array.from({ length: rows }).map((_, rowIndex) => {
                const start = rowIndex * GRID_COLUMNS;
                const rowTiles = habit.tiles.slice(start, start + GRID_COLUMNS);
                return (
                  <View key={`${habit.id}-row-${rowIndex}`} style={[styles.gridRow, rowIndex < rows - 1 && styles.gridRowSpacing]}>
                    {rowTiles.map((tile, _tileIndex) => {
                      const next = !tile.completed;
                      const accentHex = tile.accentColor ?? accent;
                      const borderColor = tile.completed ? accentHex : '#1f2937';
                      const fill = tile.completed ? accentHex : '#fff';
                      const shadowColor = tile.completed ? hexToRGBA(accentHex, 0.45) : 'rgba(31, 41, 55, 0.08)';
                      const todayOutline =
                        tile.isToday && !tile.completed
                          ? {
                              borderColor: hexToRGBA(accentHex, 0.8),
                              borderWidth: 1.8,
                            }
                          : null;

                      return (
                        <TouchableOpacity
                          key={`${habit.id}-${tile.date}`}
                          style={[
                            styles.gridDot,
                            {
                              backgroundColor: fill,
                              borderColor,
                              shadowColor,
                            },
                            tile.completed && styles.gridDotCompleted,
                            todayOutline,
                          ]}
                          disabled={disabled}
                          activeOpacity={0.85}
                          onPress={() => onToggleDay(habit.id, tile.date, next)}
                          accessibilityRole="button"
                          accessibilityLabel={`${habit.title} on ${tile.date}`}
                          accessibilityState={{ selected: tile.completed }}
                        />
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingBottom: SPACING.space_4,
    width: '100%',
    gap: SPACING.space_3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_1,
  },
  sectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  habitCard: {
    borderRadius: 26,
    borderWidth: 1.6,
    padding: SPACING.space_3,
    marginBottom: SPACING.space_2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_3,
  },
  habitIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.space_3,
  },
  iconChip: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.4,
  },
  iconText: {
    fontSize: 30,
  },
  identityCopy: {
    flexShrink: 1,
  },
  habitTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  habitDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    marginTop: 2,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    minWidth: 92,
    justifyContent: 'center',
    borderWidth: 1.2,
    gap: 6,
  },
  metricPillValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
  },
  metricPillHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  gridWrapper: {
    marginTop: SPACING.space_2,
    gap: SPACING.space_1,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_1,
    paddingHorizontal: SPACING.space_1,
  },
  weekdayLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 12,
    color: '#94a3b8',
    width: 32,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.space_1,
  },
  gridRowSpacing: {
    marginBottom: SPACING.space_1,
  },
  gridDot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    maxWidth: 34,
  },
  gridDotCompleted: {
    shadowOpacity: 0.4,
  },
});
