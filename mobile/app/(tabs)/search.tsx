import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';

import Colors from '@/constants/Colors';
import { spacing, borderRadius, shadows, typography } from '@/constants/Layout';
import { searchJournalEntries } from '@/services/api';
import { JournalEntryUnion, EntryType, SearchFilters } from '@/types';
import JournalEntryCard from '@/components/JournalEntryCard';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JournalEntryUnion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAllResults, setShowAllResults] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    tags: [],
    location: null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'from' | 'to'>('from');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });

  const popularSearches = [
    'gratitude',
    'morning',
    'inspiration',
    'goals',
    'learning',
    'reflection',
  ];

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Get the first day of the month (0-6, where 0 is Sunday)
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  
  // Create padding array for days before the first day of the month
  const paddingDays = Array(firstDayOfMonth).fill(null);

  const handleDateSelect = (date: Date) => {
    setDateRange(prev => ({
      ...prev,
      [datePickerMode]: date,
    }));
    setShowDatePicker(false);
  };

  const handleSearch = async (query = searchQuery, newPage = 1) => {
    if (!query.trim()) {
      Alert.alert(
        'Empty Search',
        'Please enter something to search for.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      setIsSearching(true);
      if (newPage === 1) {
        setHasSearched(true);
        setSearchResults([]);
      }
      console.log('Searching for:', query);
      console.log('Filters:', filters);
      const results = await searchJournalEntries({
        query,
        ...filters,
        dateRange,
        page: newPage,
        pageSize: 10,
      });
      
      // Filter results based on selected types and location
      let filteredResults = results;
      if (filters.types && filters.types.length > 0) {
        filteredResults = filteredResults.filter(entry => 
          filters.types?.includes(entry.type)
        );
      }
      
      if (filters.location && filters.location.trim() !== '') {
        filteredResults = filteredResults.filter(entry => 
          entry.metadata?.location?.city?.toLowerCase().includes(filters.location?.toLowerCase() || '')
        );
      }
      
      if (newPage === 1) {
        const highScoreResults = filteredResults.filter(entry => entry.score && entry.score > 0.4);
        setSearchResults(highScoreResults);
        const hasLowScoreResults = filteredResults.some(entry => entry.score && entry.score <= 0.4);
        setHasMore(hasLowScoreResults || filteredResults.length === 10);
      } else {
        const lowScoreResults = filteredResults.filter(entry => entry.score && entry.score <= 0.4);
        setSearchResults(prev => [...prev, ...lowScoreResults]);
        setHasMore(filteredResults.length === 10);
      }
      
      setPage(newPage);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = () => {
    if (!isSearching && hasMore) {
      handleSearch(searchQuery, page + 1);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setPage(1);
    setHasMore(true);
    setShowAllResults(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePopularSearch = (term: string) => {
    setSearchQuery(term);
    handleSearch(term);
  };

  const toggleFilter = () => {
    setShowFilters(!showFilters);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleTypeFilter = (type: EntryType) => {
    setFilters(prev => {
      const currentTypes = prev.types || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      
      return {
        ...prev,
        types: newTypes.length > 0 ? newTypes : undefined,
      };
    });
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderDatePicker = () => {
    return (
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            setDatePickerMode('from');
            setCurrentMonth(dateRange.from);
            setShowDatePicker(true);
          }}
        >
          <Calendar size={20} color="rgb(151 88 15)" style={styles.dateIcon} />
          <Text style={styles.dateText}>
            From: {format(dateRange.from, 'MMM d, yyyy')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            setDatePickerMode('to');
            setCurrentMonth(dateRange.to);
            setShowDatePicker(true);
          }}
        >
          <Calendar size={20} color="rgb(151 88 15)" style={styles.dateIcon} />
          <Text style={styles.dateText}>
            To: {format(dateRange.to, 'MMM d, yyyy')}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Select {datePickerMode === 'from' ? 'Start' : 'End'} Date
              </Text>
              
              <View style={styles.monthSelector}>
                <TouchableOpacity
                  onPress={() => setCurrentMonth(prev => subMonths(prev, 1))}
                  style={styles.monthButton}
                >
                  <ChevronLeft size={24} color="rgb(151 88 15)" />
                </TouchableOpacity>
                
                <Text style={styles.monthText}>
                  {format(currentMonth, 'MMMM yyyy')}
                </Text>
                
                <TouchableOpacity
                  onPress={() => setCurrentMonth(prev => addMonths(prev, 1))}
                  style={styles.monthButton}
                >
                  <ChevronRight size={24} color="rgb(151 88 15)" />
                </TouchableOpacity>
              </View>

              <View style={styles.calendarGrid}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Text key={day} style={styles.weekDayText}>
                    {day}
                  </Text>
                ))}
                
                {/* Add padding days */}
                {paddingDays.map((_, index) => (
                  <View key={`padding-${index}`} style={styles.dateCell} />
                ))}
                
                {/* Add actual days */}
                {daysInMonth.map((date, index) => {
                  const isSelected = isSameDay(date, dateRange[datePickerMode]);
                  const isCurrentMonth = isSameMonth(date, currentMonth);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateCell,
                        isSelected && styles.selectedDateCell,
                        !isCurrentMonth && styles.otherMonthDateCell,
                      ]}
                      onPress={() => handleDateSelect(date)}
                      disabled={!isCurrentMonth}
                    >
                      <Text style={[
                        styles.dateText,
                        isSelected && styles.selectedDateText,
                        !isCurrentMonth && styles.otherMonthDateText,
                      ]}>
                        {format(date, 'd')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const NoResults = () => {
    return (
      <View style={styles.noResultsContainer}>
        <View style={styles.noResultsIconContainer}>
          <FontAwesome5 name="search" size={48} color={Colors.themeBrown_colors[250]} />
        </View>
        <Text style={styles.noResultsTitle}>No Results Found</Text>
        <Text style={styles.noResultsText}>
          Try a different search or use natural language to find what you're looking for.
        </Text>
        <View style={styles.searchTips}>
          <Text style={styles.searchTipsTitle}>Search Tips</Text>
          <View style={styles.tipItem}>
            <FontAwesome5 name="lightbulb" size={16} color="rgb(151 88 15)" style={styles.tipIcon} />
            <Text style={styles.tipText}>Use natural language like "photos from last week"</Text>
          </View>
          <View style={styles.tipItem}>
            <FontAwesome5 name="lightbulb" size={16} color="rgb(151 88 15)" style={styles.tipIcon} />
            <Text style={styles.tipText}>Search by tags using # followed by the tag name</Text>
          </View>
          <View style={styles.tipItem}>
            <FontAwesome5 name="lightbulb" size={16} color="rgb(151 88 15)" style={styles.tipIcon} />
            <Text style={styles.tipText}>Use the filter button to narrow down by entry type</Text>
          </View>
        </View>
      </View>
    );
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
            <View style={styles.headerContent}>
              {hasSearched && (
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={() => {
                    setHasSearched(false);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                >
                  <FontAwesome5 name="arrow-left" size={24} color="rgb(151 88 15)" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>
                {hasSearched ? 'Search Results' : 'Search'}
              </Text>
            </View>
          </View>
          
          {!hasSearched ? (
            <View style={styles.mainContent}>
              <View style={styles.searchBoxContainer}>
                <View style={styles.mainSearchInputContainer}>
                  <SearchIcon size={28} color="rgb(151 88 15)" style={styles.searchIcon} />
                  <TextInput
                    style={styles.mainSearchInput}
                    placeholder="Search your memories..."
                    placeholderTextColor={Colors.themeBrown_colors[250]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                      <X size={24} color="rgb(151 88 15)" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={() => handleSearch()}
                >
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.filterButton} onPress={toggleFilter}>
                  <Filter 
                    size={28} 
                    color={filters.types && filters.types.length > 0 ? Colors.themeBrown_colors[250] : "rgb(151 88 15)"} 
                  />
                </TouchableOpacity>
              </View>

              {showFilters && (
                <Animated.View 
                  style={styles.filtersOverlay}
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                >
                  <View style={styles.filtersContainer}>
                    <Text style={styles.filterTitle}>Filter by type:</Text>
                    <View style={styles.typeFilters}>
                      <TouchableOpacity 
                        style={[
                          styles.typeFilter, 
                          filters.types?.includes('text') && styles.activeTypeFilter
                        ]}
                        onPress={() => toggleTypeFilter('text')}
                      >
                        <Text 
                          style={[
                            styles.typeFilterText,
                            filters.types?.includes('text') && styles.activeTypeFilterText
                          ]}
                        >
                          Text
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.typeFilter, 
                          filters.types?.includes('image') && styles.activeTypeFilter
                        ]}
                        onPress={() => toggleTypeFilter('image')}
                      >
                        <Text 
                          style={[
                            styles.typeFilterText,
                            filters.types?.includes('image') && styles.activeTypeFilterText
                          ]}
                        >
                          Photo
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.typeFilter, 
                          filters.types?.includes('audio') && styles.activeTypeFilter
                        ]}
                        onPress={() => toggleTypeFilter('audio')}
                      >
                        <Text 
                          style={[
                            styles.typeFilterText,
                            filters.types?.includes('audio') && styles.activeTypeFilterText
                          ]}
                        >
                          Audio
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.filterTitle, { marginTop: spacing.md }]}>Filter by date range:</Text>
                    {renderDatePicker()}

                    <Text style={[styles.filterTitle, { marginTop: spacing.md }]}>Filter by location:</Text>
                    <View style={styles.locationFilter}>
                      <TextInput
                        style={styles.locationInput}
                        placeholder="Enter city name..."
                        placeholderTextColor={Colors.themeBrown_colors[250]}
                        value={filters.location || ''}
                        onChangeText={(text) => setFilters(prev => ({ ...prev, location: text }))}
                      />
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.applyFiltersButton} 
                      onPress={() => {
                        if (hasSearched) {
                          handleSearch();
                        }
                        setShowFilters(false);
                      }}
                    >
                      <Text style={styles.applyFiltersText}>Apply Filters</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              <View style={styles.popularSearchesContainer}>
                <Text style={styles.sectionTitle}>Popular searches</Text>
                <View style={styles.popularTermsContainer}>
                  {popularSearches.map((term, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.popularTerm}
                      onPress={() => handlePopularSearch(term)}
                    >
                      <Text style={styles.popularTermText}>{term}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <SearchIcon size={24} color="rgb(151 88 15)" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search your memories..."
                    placeholderTextColor={Colors.themeBrown_colors[250]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                      <X size={20} color="rgb(151 88 15)" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <TouchableOpacity style={styles.filterButton} onPress={toggleFilter}>
                  <Filter 
                    size={24} 
                    color={filters.types && filters.types.length > 0 ? Colors.themeBrown_colors[250] : "rgb(151 88 15)"} 
                  />
                </TouchableOpacity>
              </View>

              {showFilters && (
                <Animated.View 
                  style={styles.filtersOverlay}
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                >
                  <View style={styles.filtersContainer}>
                    <Text style={styles.filterTitle}>Filter by type:</Text>
                    <View style={styles.typeFilters}>
                      <TouchableOpacity 
                        style={[
                          styles.typeFilter, 
                          filters.types?.includes('text') && styles.activeTypeFilter
                        ]}
                        onPress={() => toggleTypeFilter('text')}
                      >
                        <Text 
                          style={[
                            styles.typeFilterText,
                            filters.types?.includes('text') && styles.activeTypeFilterText
                          ]}
                        >
                          Text
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.typeFilter, 
                          filters.types?.includes('image') && styles.activeTypeFilter
                        ]}
                        onPress={() => toggleTypeFilter('image')}
                      >
                        <Text 
                          style={[
                            styles.typeFilterText,
                            filters.types?.includes('image') && styles.activeTypeFilterText
                          ]}
                        >
                          Photo
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.typeFilter, 
                          filters.types?.includes('audio') && styles.activeTypeFilter
                        ]}
                        onPress={() => toggleTypeFilter('audio')}
                      >
                        <Text 
                          style={[
                            styles.typeFilterText,
                            filters.types?.includes('audio') && styles.activeTypeFilterText
                          ]}
                        >
                          Audio
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.filterTitle, { marginTop: spacing.md }]}>Filter by date range:</Text>
                    {renderDatePicker()}

                    <Text style={[styles.filterTitle, { marginTop: spacing.md }]}>Filter by location:</Text>
                    <View style={styles.locationFilter}>
                      <TextInput
                        style={styles.locationInput}
                        placeholder="Enter city name..."
                        placeholderTextColor={Colors.themeBrown_colors[250]}
                        value={filters.location || ''}
                        onChangeText={(text) => setFilters(prev => ({ ...prev, location: text }))}
                      />
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.applyFiltersButton} 
                      onPress={() => {
                        if (hasSearched) {
                          handleSearch();
                        }
                        setShowFilters(false);
                      }}
                    >
                      <Text style={styles.applyFiltersText}>Apply Filters</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {isSearching && page === 1 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary[500]} />
                </View>
              ) : (
                <>
                  {searchResults.length > 0 ? (
                    <>
                      <Text style={styles.resultsCount}>
                        {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                      </Text>
                      <FlatList
                        data={searchResults}
                        renderItem={({ item }) => <JournalEntryCard entry={item} />}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.resultsList}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={() => (
                          <View style={styles.footerContainer}>
                            {hasMore && (
                              <TouchableOpacity 
                                style={styles.loadMoreButton}
                                onPress={handleLoadMore}
                                disabled={isSearching}
                              >
                                {isSearching ? (
                                  <ActivityIndicator color={Colors.primary[500]} />
                                ) : (
                                  <Text style={styles.loadMoreText}>Show More Results</Text>
                                )}
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      />
                    </>
                  ) : (
                    <NoResults />
                  )}
                </>
              )}
            </View>
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
    backgroundColor: Colors.themeBrown_colors[100], // transparent overlay
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: 'Tangerine_400Regular',
    fontSize: 55,
    color: Colors.themeBrown,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  searchBoxContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mainSearchInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.lg,
    height: 64,
    marginBottom: spacing.md,
  },
  mainSearchInput: {
    flex: 1,
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.xl,
    color: Colors.themeBrown,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    marginLeft: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  clearButton: {
    padding: spacing.sm,
  },
  searchButton: {
    width: '100%',
    backgroundColor: Colors.themeBrown_colors[250],
    borderRadius: borderRadius.round,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  searchButtonText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.xl,
    color: 'white',
  },
  filterButton: {
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: borderRadius.round,
    height: 56,
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filtersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    width: '80%',
  },
  filterTitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown,
    marginBottom: spacing.sm,
  },
  typeFilters: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  typeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.themeBrown_colors[450],
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  activeTypeFilter: {
    backgroundColor: Colors.themeBrown_colors[250],
  },
  typeFilterText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  activeTypeFilterText: {
    color: 'white',
  },
  applyFiltersButton: {
    backgroundColor: Colors.themeBrown_colors[250],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  popularSearchesContainer: {
    width: '100%',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.xl,
    color: Colors.themeBrown,
    marginBottom: spacing.md,
  },
  popularTermsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  popularTerm: {
    backgroundColor: Colors.themeBrown_colors[450],
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.sm,
  },
  popularTermText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  resultsContainer: {
    marginTop: spacing.lg,
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsCount: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    marginBottom: spacing.sm,
  },
  resultsList: {
    paddingBottom: spacing.xxl,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxxl,
  },
  noResultsIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.nearWhite_2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  noResultsTitle: {
    fontFamily: 'Tangerine_400Regular',
    fontSize: 48,
    color: Colors.themeBrown,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  noResultsText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown_colors[250],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  searchTips: {
    width: '100%',
    backgroundColor: Colors.nearWhite_2,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  searchTipsTitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipIcon: {
    marginRight: spacing.sm,
  },
  tipText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  footerContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  loadMoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  loadMoreText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  locationFilter: {
    marginBottom: spacing.md,
  },
  locationInput: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    backgroundColor: Colors.themeBrown_colors[450],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: Colors.themeBrown,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    marginLeft: spacing.sm,
  },
  dateRangeContainer: {
    marginBottom: spacing.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.themeBrown_colors[450],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateIcon: {
    marginRight: spacing.sm,
  },
  dateText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown,
    marginBottom: spacing.md,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  monthButton: {
    padding: spacing.sm,
  },
  monthText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: spacing.md,
  },
  weekDayText: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    color: Colors.themeBrown,
    marginBottom: spacing.sm,
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  selectedDateCell: {
    backgroundColor: Colors.themeBrown_colors[250],
    borderRadius: borderRadius.round,
  },
  otherMonthDateCell: {
    opacity: 0.3,
  },
  selectedDateText: {
    color: 'white',
  },
  otherMonthDateText: {
    color: Colors.themeBrown,
  },
  modalCloseButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: Colors.themeBrown_colors[250],
    borderRadius: borderRadius.md,
  },
  modalCloseText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: 'white',
  },
});