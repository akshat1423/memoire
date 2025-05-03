import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import { X, Play, Pause, RotateCcw } from 'lucide-react-native';
import { JournalEntryUnion } from '@/types';
import Colors from '@/constants/Colors';
import { spacing, borderRadius, typography } from '@/constants/Layout';

interface EntryViewerProps {
  entry: JournalEntryUnion;
  visible: boolean;
  onClose: () => void;
}

export default function EntryViewer({ entry, visible, onClose }: EntryViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadAudio = async () => {
    if (entry.type !== 'audio' || !entry.audioUri) return;
    
    try {
      setIsLoading(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: entry.audioUri },
        { progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      set

PlaybackPosition(status.positionMillis / 1000);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
        sound?.setPositionAsync(0);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) {
      await loadAudio();
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
    }
  };

  const handleRestart = async () => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(0);
      setPlaybackPosition(0);
      if (!isPlaying) {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error restarting audio:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    switch (entry.type) {
      case 'image':
        return (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: entry.imageUri }}
              style={styles.image}
              contentFit="contain"
            />
            {entry.caption && (
              <Text style={styles.caption}>{entry.caption}</Text>
            )}
          </View>
        );

      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <View style={styles.audioPlayer}>
              {isLoading ? (
                <ActivityIndicator size="large" color={Colors.accent[500]} />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause size={32} color={Colors.white} />
                    ) : (
                      <Play size={32} color={Colors.white} />
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.audioProgress}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${(playbackPosition / (entry.duration || 1)) * 100}%`
                          }
                        ]} 
                      />
                    </View>
                    <View style={styles.timeDisplay}>
                      <Text style={styles.timeText}>
                        {formatTime(playbackPosition)}
                      </Text>
                      <Text style={styles.timeText}>
                        {formatTime(entry.duration)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.restartButton}
                    onPress={handleRestart}
                  >
                    <RotateCcw size={20} color={Colors.accent[500]} />
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            {entry.transcript && (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptLabel}>Transcript</Text>
                <Text style={styles.transcript}>{entry.transcript}</Text>
              </View>
            )}
          </View>
        );

      case 'text':
        return (
          <View style={styles.textContainer}>
            {entry.title && (
              <Text style={styles.title}>{entry.title}</Text>
            )}
            <Text style={styles.content}>{entry.content}</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color={Colors.neutral[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} Entry
          </Text>
          <View style={styles.headerRight} />
        </View>
        
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
          
          <View style={styles.metadata}>
            <Text style={styles.date}>
              {new Date(entry.metadata.timestamp).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            
            {entry.metadata.tags.length > 0 && (
              <View style={styles.tags}>
                {entry.metadata.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {entry.metadata.mood && (
              <View style={styles.mood}>
                <Text style={styles.moodLabel}>Mood</Text>
                <Text style={styles.moodText}>
                  {entry.metadata.mood.charAt(0).toUpperCase() + entry.metadata.mood.slice(1)}
                </Text>
              </View>
            )}
            
            {entry.metadata.location && (
              <View style={styles.location}>
                <Text style={styles.locationText}>
                  📍 {entry.metadata.location.name}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.lg,
    color: Colors.neutral[900],
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: Dimensions.get('window').width - (spacing.md * 2),
    height: Dimensions.get('window').height * 0.6,
    borderRadius: borderRadius.md,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.md,
    color: Colors.neutral[700],
    marginTop: spacing.md,
    textAlign: 'center',
  },
  audioContainer: {
    padding: spacing.xl,
  },
  audioPlayer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  audioProgress: {
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent[500],
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.sm,
    color: Colors.neutral[600],
  },
  restartButton: {
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  transcriptContainer: {
    marginTop: spacing.xl,
  },
  transcriptLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.md,
    color: Colors.neutral[800],
    marginBottom: spacing.sm,
  },
  transcript: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.md,
    color: Colors.neutral[700],
    lineHeight: 24,
  },
  textContainer: {
    padding: spacing.md,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.xl,
    color: Colors.neutral[900],
    marginBottom: spacing.md,
  },
  content: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.md,
    color: Colors.neutral[800],
    lineHeight: 24,
  },
  metadata: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: Colors.neutral[50],
    borderRadius: borderRadius.md,
  },
  date: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.md,
    color: Colors.neutral[700],
    marginBottom: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: Colors.primary[50],
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.sm,
    color: Colors.primary[700],
  },
  mood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  moodLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.sm,
    color: Colors.neutral[600],
    marginRight: spacing.sm,
  },
  moodText: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.sm,
    color: Colors.neutral[800],
  },
  location: {
    marginTop: spacing.sm,
  },
  locationText: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.sm,
    color: Colors.neutral[700],
  },
});