import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react-native';
import { searchJournalCalendarEntries } from '@/services/api';
import { JournalEntryUnion } from '@/types';
import Colors from '@/constants/Colors';
import { spacing, typography, borderRadius } from '@/constants/Layout';
import JournalEntryCard from '@/components/JournalEntryCard';
import { supabase } from '@/lib/supabase';


export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntryUnion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [selectedDate]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'dummy-user';
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const results = await searchJournalCalendarEntries(dateStr, userId);
      setEntries(results);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ImageBackground
        source={{
          uri: 'https://ynxmsntmoccpldagoxrh.supabase.co/storage/v1/object/public/memoireapp/default-user/grunge-paper-background.jpg',
        }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Calendar</Text>
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
                <ChevronLeft size={24} color="rgb(151 88 15)" />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
                <ChevronRight size={24} color="rgb(151 88 15)" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendar}>
              {days.map((date) => {
                const isSelected = isSameDay(date, selectedDate);
                const isCurrentMonth = isSameMonth(date, currentMonth);

                return (
                  <TouchableOpacity
                    key={date.toString()}
                    style={[
                      styles.day,
                      !isCurrentMonth && styles.otherMonth,
                      isSelected && styles.selectedDay,
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !isCurrentMonth && styles.otherMonthText,
                        isSelected && styles.selectedDayText,
                      ]}
                    >
                      {format(date, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.selectedDateHeader}>
            <Text style={styles.selectedDateText}>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Text>
            <TouchableOpacity 
              style={styles.fullScreenButton}
              onPress={() => setIsFullScreen(true)}
            >
              <Maximize2 size={20} color="rgb(151 88 15)" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.entriesList} contentContainerStyle={styles.entriesContent}>
            {entries.map((entry) => (
              <JournalEntryCard key={entry.id} entry={entry} />
            ))}
            {entries.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No entries for this date</Text>
              </View>
            )}
          </ScrollView>

          <Modal
            visible={isFullScreen}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsFullScreen(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setIsFullScreen(false)}
                  >
                    <X size={24} color="rgb(151 88 15)" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalEntriesList}>
                  {entries.map((entry) => (
                    <JournalEntryCard key={entry.id} entry={entry} />
                  ))}
                  {entries.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No entries for this date</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.themeBrown_colors[50],
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.themeBrown_colors[100],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.nearWhite_2,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  headerTitle: {
    fontFamily: 'Tangerine_400Regular',
    fontSize: 55,
    color: Colors.themeBrown,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: Colors.nearWhite_2,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    padding: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  monthButton: {
    padding: spacing.sm,
  },
  monthText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown,
  },
  weekDays: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.themeBrown_colors[150],
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    color: Colors.themeBrown,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.xs,
  },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  otherMonth: {
    opacity: 0.4,
  },
  otherMonthText: {
    color: Colors.themeBrown_colors[200],
  },
  selectedDay: {
    backgroundColor: Colors.themeBrown_colors[250],
    borderRadius: borderRadius.round,
  },
  selectedDayText: {
    color: 'white',
  },
  selectedDateHeader: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    backgroundColor: Colors.nearWhite_2,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDateText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown,
    textAlign: 'center',
  },
  fullScreenButton: {
    padding: spacing.sm,
    backgroundColor: Colors.themeBrown_colors[300],
    borderRadius: borderRadius.round,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: Colors.themeBrown_colors[50],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: Colors.nearWhite_2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.themeBrown_colors[150],
  },
  modalTitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown,
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalEntriesList: {
    flex: 1,
    padding: spacing.md,
  },
  entriesList: {
    flex: 1,
  },
  entriesContent: {
    padding: spacing.md,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.nearWhite_2,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
  },
  emptyStateText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
});