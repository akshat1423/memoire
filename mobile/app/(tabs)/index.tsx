import React, { useState, useEffect } from 'react';
import { ImageBackground, StyleSheet, View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import JournalEntryCard from '@/components/JournalEntryCard';
import { getAllJournalEntries } from '@/services/api';
import { spacing, borderRadius, shadows, typography } from '@/constants/Layout';
import { supabase } from '@/lib/supabase';
import { JournalEntryUnion } from '@/types';
import { useRouter } from 'expo-router';

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntryUnion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        loadEntries();
      }
    } catch (error) {
      console.error('Failed to check auth:', error);
    }
  };

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'dummy-user';
      
      const data = await getAllJournalEntries(userId, 1, 50);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const LoginPrompt = () => (
    <View style={styles.contentBox}>
      <View style={styles.emptyIconContainer}>
        <FontAwesome5 name="user-lock" size={48} color={Colors.themeBrown_colors[250]} />
      </View>
      <Text style={styles.emptyTitle}>Welcome to Memoire</Text>
      <Text style={styles.emptySubtitle}>
        Please log in to start your journaling journey. Capture your thoughts, memories, and moments.
      </Text>
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={() => router.push('/auth/sign-in')}
      >
        <FontAwesome5 name="sign-in-alt" size={16} color="white" style={styles.plusIcon} />
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.contentBox}>
      <View style={styles.emptyIconContainer}>
        <FontAwesome5 name="book-open" size={48} color={Colors.themeBrown_colors[250]} />
      </View>
      <Text style={styles.emptyTitle}>Your Journal is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Start your journey by creating your first journal entry. Capture your thoughts, memories, and moments.
      </Text>
      <TouchableOpacity 
        style={styles.newEntryButton}
        onPress={() => router.push('/new-entry')}
      >
        <FontAwesome5 name="plus" size={16} color="white" style={styles.plusIcon} />
        <Text style={styles.newEntryButtonText}>Create New Entry</Text>
      </TouchableOpacity>
    </View>
  );

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
          {!isLoggedIn ? (
            <LoginPrompt />
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  Memoire <FontAwesome5 name="pen-fancy" size={24} color="white" style={styles.penIcon} />
                </Text>
              </View>
              <FlatList
                data={entries}
                renderItem={({ item }) => <JournalEntryCard entry={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.entriesList}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={!isLoading ? <EmptyState /> : null}
              />
            </>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.themeBrown_colors[100],
  },
  container: {
    flex: 1,
    backgroundColor: Colors.themeBrown_colors[50],
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
  penIcon: {
    marginLeft: spacing.sm,
    marginTop: 5,
    color: Colors.themeBrown,
  },
  contentBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.nearWhite_2,
    margin: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  entriesList: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.nearWhite_2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'Tangerine_400Regular',
    fontSize: 48,
    color: Colors.themeBrown,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown_colors[250],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  newEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.themeBrown_colors[250],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    ...shadows.small,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.themeBrown_colors[250],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    ...shadows.small,
  },
  plusIcon: {
    marginRight: spacing.sm,
  },
  newEntryButtonText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: 'white',
  },
  loginButtonText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: 'white',
  },
});
