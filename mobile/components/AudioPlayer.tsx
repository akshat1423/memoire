import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, Music } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { spacing, borderRadius, typography } from '@/constants/Layout';

type Props = {
  uri: string;
  title?: string;
  artist?: string;
  isHeader?: boolean;
};

export default function AudioPlayer({ uri, title, artist, isHeader = false }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [uri]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isHeader) {
    return (
      <TouchableOpacity 
        style={styles.headerPlayButton} 
        onPress={togglePlayback}
      >
        {isPlaying ? (
          <Pause size={16} color="white" />
        ) : (
          <Play size={16} color="white" />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Music size={24} color="white" style={styles.musicIcon} />
      
      <TouchableOpacity 
        style={styles.playButton} 
        onPress={togglePlayback}
      >
        {isPlaying ? (
          <Pause size={20} color="white" />
        ) : (
          <Play size={20} color="white" />
        )}
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        {(title || artist) && (
          <View style={styles.songInfo}>
            {title && <Text style={styles.songTitle}>{title}</Text>}
            {artist && <Text style={styles.songArtist}>{artist}</Text>}
          </View>
        )}
        
        <View style={styles.seekBarContainer}>
          <View style={styles.seekBar}>
            <View 
              style={[
                styles.progress, 
                { width: `${(position / duration) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.timeText}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(117, 115, 115, 0.7)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    height: 80,
    width: '100%',
  },
  musicIcon: {
    marginRight: spacing.sm,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerPlayButton: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  contentContainer: {
    flex: 1,
  },
  songInfo: {
    marginBottom: spacing.xs,
  },
  songTitle: {
    color: 'white',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    marginBottom: 1,
  },
  songArtist: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.xs,
  },
  seekBarContainer: {
    flexDirection: 'column',
  },
  seekBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  progress: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: borderRadius.sm,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: typography.xs,
    fontFamily: 'Inter_400Regular',
  },
});
