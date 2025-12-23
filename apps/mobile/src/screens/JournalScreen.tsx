import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TextInput, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Journal'>;

type JournalType = 'gratitude' | 'manifestation' | 'freestyle';

type JournalEntry = {
  id: string;
  type: JournalType;
  createdAt: string;
  responses: string[];
  freeform?: string;
};

const JOURNAL_TEMPLATES: Record<JournalType, { label: string; description: string; prompts?: string[]; placeholder?: string }> = {
  gratitude: {
    label: 'Gratitude',
    description: 'Shift your attention toward what’s working.',
    prompts: [
      'Three things I’m grateful for right now…',
      'One person I want to appreciate today is…',
      'A small win worth celebrating is…',
    ],
  },
  manifestation: {
    label: 'Manifestation',
    description: 'Script how your next milestone unfolds.',
    prompts: [
      'The future I’m creating looks like…',
      'Here’s how it feels when it’s done…',
      'The next aligned step I’m taking is…',
    ],
  },
  freestyle: {
    label: 'Freestyle',
    description: 'Drop any thought, story, or release you need.',
    placeholder: 'Write whatever you need to let out…',
  },
};

const seedEntries: JournalEntry[] = [
  {
    id: 'seed-1',
    type: 'gratitude',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    responses: [
      'Morning sunlight on my desk.',
      'Teammate Sara who shipped the landing page edits.',
      'Finally getting clarity on the next feature.',
    ],
  },
  {
    id: 'seed-2',
    type: 'manifestation',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    responses: [
      'Users opening the app daily to log focus wins.',
      'Proud, calm, and grounded during the demo.',
      'Record a Loom walkthrough tomorrow morning.',
    ],
  },
  {
    id: 'seed-3',
    type: 'freestyle',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    responses: [],
    freeform: 'Felt the urge to doom scroll tonight but switched to a 5 minute breathing break instead. Proud of that swap.',
  },
];

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

const formatDateKey = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const buildPreview = (entry: JournalEntry) => {
  const text = entry.type === 'freestyle'
    ? entry.freeform ?? ''
    : entry.responses.filter(Boolean).join(' • ');
  if (!text) return 'Tap to expand this entry.';
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
};

export default function JournalScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const [activeType, setActiveType] = useState<JournalType>('gratitude');
  const [entries, setEntries] = useState<JournalEntry[]>(seedEntries);
  const [responses, setResponses] = useState<string[]>(JOURNAL_TEMPLATES.gratitude.prompts?.map(() => '') ?? []);
  const [freeform, setFreeform] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()));

  const template = useMemo(() => JOURNAL_TEMPLATES[activeType], [activeType]);
  const prompts = template.prompts ?? [];

  const canSave = activeType === 'freestyle'
    ? freeform.trim().length > 0
    : responses.some(value => value.trim().length > 0);

  const entriesByDate = useMemo(() => {
    return entries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
      const key = formatDateKey(entry.createdAt);
      acc[key] = acc[key] ? [...acc[key], entry] : [entry];
      return acc;
    }, {});
  }, [entries]);

  const calendarMatrix = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const weeks: Array<Array<{ date: Date; key: string; inMonth: boolean; hasEntries: boolean }>> = [];
    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + week * 7 + day);
        const key = formatDateKey(date);
        days.push({
          date,
          key,
          inMonth: date.getMonth() === month,
          hasEntries: !!entriesByDate[key],
        });
      }
      weeks.push(days);
    }
    return weeks;
  }, [calendarMonth, entriesByDate]);

  const selectedEntries = entriesByDate[selectedDateKey] ?? [];
  const selectedDisplayDate = useMemo(() => {
    const [year, month, day] = selectedDateKey.split('-').map(Number);
    if (!year || !month || !day) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
      new Date(year, month - 1, day),
    );
  }, [selectedDateKey]);

  const handleSelectType = (type: JournalType) => {
    setActiveType(type);
    setResponses(JOURNAL_TEMPLATES[type].prompts?.map(() => '') ?? []);
    setFreeform('');
  };

  const handleChangeResponse = (value: string, index: number) => {
    setResponses(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleSaveEntry = () => {
    if (!canSave) return;
    const timestamp = new Date().toISOString();
    const key = formatDateKey(timestamp);

    const entry: JournalEntry = {
      id: `journal-${timestamp}`,
      type: activeType,
      createdAt: timestamp,
      responses: responses.map(item => item.trim()),
      freeform: activeType === 'freestyle' ? freeform.trim() : undefined,
    };

    setEntries(prev => [entry, ...prev]);
    setResponses(JOURNAL_TEMPLATES[activeType].prompts?.map(() => '') ?? []);
    setFreeform('');
    setSelectedDateKey(key);
    setCalendarMonth(new Date(timestamp));
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollCompact]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Journal</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.heroTitle}>Capture the day.</Text>
          <Text style={styles.heroSubtitle}>Switch modes to log gratitude, script manifestations, or dump thoughts freely.</Text>

          <WatercolorCard style={styles.typeSwitcher}>
            <Text style={styles.cardLabel}>Choose a mode</Text>
            <View style={styles.typeChipRow}>
              {Object.entries(JOURNAL_TEMPLATES).map(([key, value]) => {
                const selected = activeType === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.typeChip, selected && styles.typeChipActive]}
                    onPress={() => handleSelectType(key as JournalType)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.typeChipLabel, selected && styles.typeChipLabelActive]}>{value.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </WatercolorCard>

          <WatercolorCard style={styles.editorCard}>
            <Text style={styles.editorTitle}>{template.label} journal</Text>
            <Text style={styles.editorSubtitle}>{template.description}</Text>

            {activeType === 'freestyle' ? (
              <TextInput
                style={styles.freeformInput}
                placeholder={template.placeholder}
                placeholderTextColor="#94a3b8"
                multiline
                value={freeform}
                onChangeText={setFreeform}
                textAlignVertical="top"
              />
            ) : (
              <View style={styles.promptList}>
                {prompts.map((prompt, index) => (
                  <View key={prompt} style={styles.promptBlock}>
                    <Text style={styles.promptLabel}>{prompt}</Text>
                    <TextInput
                      style={styles.promptInput}
                      placeholder="Write your reflection…"
                      placeholderTextColor="#94a3b8"
                      multiline
                      value={responses[index]}
                      onChangeText={value => handleChangeResponse(value, index)}
                      textAlignVertical="top"
                    />
                  </View>
                ))}
              </View>
            )}

            <WatercolorButton color="blue" onPress={handleSaveEntry} style={!canSave && styles.saveButtonDisabled}>
              <Text style={styles.saveButtonText}>{canSave ? 'Save entry' : 'Start typing to save'}</Text>
            </WatercolorButton>
          </WatercolorCard>

          <WatercolorCard style={styles.calendarCard}>
            <View style={styles.entriesHeader}>
              <Text style={styles.entriesTitle}>Past entries</Text>
              <Text style={styles.entriesSubtitle}>Tap a day to see what you logged.</Text>
            </View>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => handleMonthChange('prev')} style={styles.monthNav}>
                <Text style={styles.monthNavText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarMonth)}
              </Text>
              <TouchableOpacity onPress={() => handleMonthChange('next')} style={styles.monthNav}>
                <Text style={styles.monthNavText}>→</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weekdayRow}>
              {weekdayLabels.map(label => (
                <Text key={label} style={styles.weekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.weeksContainer}>
              {calendarMatrix.map((week, index) => (
                <View key={`week-${index}`} style={styles.weekRow}>
                  {week.map(day => {
                    const isSelected = day.key === selectedDateKey;
                    return (
                      <TouchableOpacity
                        key={day.key}
                        style={[
                          styles.dayCell,
                          !day.inMonth && styles.dayCellMuted,
                          isSelected && styles.dayCellSelected,
                        ]}
                        onPress={() => setSelectedDateKey(day.key)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dayLabel,
                            !day.inMonth && styles.dayLabelMuted,
                            isSelected && styles.dayLabelSelected,
                          ]}
                        >
                          {day.date.getDate()}
                        </Text>
                        {day.hasEntries ? <View style={styles.dayDot} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.entriesHeader}>
              <Text style={styles.entriesTitle}>{selectedDisplayDate}</Text>
              <Text style={styles.entriesSubtitle}>
                {selectedEntries.length ? 'Your notes from this day.' : 'No entries saved yet.'}
              </Text>
            </View>
            <View style={styles.entriesList}>
              {selectedEntries.map(entry => (
                <WatercolorCard key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryType}>{JOURNAL_TEMPLATES[entry.type].label}</Text>
                    <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                  </View>
                  <Text style={styles.entryPreview}>{buildPreview(entry)}</Text>
                </WatercolorCard>
              ))}
              {!selectedEntries.length && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No journal entries for this date yet.</Text>
                </View>
              )}
            </View>
          </WatercolorCard>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    paddingTop: SPACING.space_3,
    gap: SPACING.space_4,
  },
  scrollCompact: {
    paddingHorizontal: SPACING.space_3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 30,
    color: '#1f2937',
  },
  headerSpacer: {
    width: 44,
  },
  heroTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 26,
    color: '#111827',
  },
  heroSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  typeSwitcher: {
    padding: SPACING.space_4,
    gap: SPACING.space_3,
  },
  cardLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  typeChipRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  typeChip: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    paddingVertical: SPACING.space_2,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeChipActive: {
    backgroundColor: '#fee2e2',
  },
  typeChipLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  typeChipLabelActive: {
    color: '#b91c1c',
  },
  editorCard: {
    gap: SPACING.space_3,
  },
  editorTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  editorSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  promptList: {
    gap: SPACING.space_4,
  },
  promptBlock: {
    gap: SPACING.space_2,
  },
  promptLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  promptInput: {
    minHeight: 90,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_3,
    color: '#1f2937',
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
  },
  freeformInput: {
    minHeight: 160,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_3,
    color: '#1f2937',
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  entriesHeader: {
    gap: SPACING.space_1,
  },
  entriesTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  entriesSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  entriesList: {
    gap: SPACING.space_2,
  },
  entryCard: {
    gap: SPACING.space_1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryType: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  entryDate: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  entryPreview: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  emptyState: {
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: SPACING.space_3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  emptyStateText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#94a3b8',
  },
  calendarCard: {
    gap: SPACING.space_3,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.space_2,
  },
  monthNav: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  monthNavText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  monthLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_2,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  weeksContainer: {
    gap: SPACING.space_1,
  },
  weekRow: {
    flexDirection: 'row',
    gap: SPACING.space_1,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#fff',
  },
  dayCellMuted: {
    opacity: 0.45,
  },
  dayCellSelected: {
    borderColor: '#1f2937',
    backgroundColor: '#fde68a',
  },
  dayLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  dayLabelMuted: {
    color: '#94a3b8',
  },
  dayLabelSelected: {
    color: '#1f2937',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1f2937',
    position: 'absolute',
    bottom: 10,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
