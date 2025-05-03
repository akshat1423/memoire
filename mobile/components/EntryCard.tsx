import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { Headphones, Image as ImageIcon, FileText } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { spacing, borderRadius, shadows, typography } from '@/constants/Layout';
import { JournalEntryUnion } from '@/types';

interface EntryCardProps {
  entry: JournalEntryUnion;
  onPress?: () => void;
}

export default function EntryCard({ entry, onPress }: EntryCardProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={16} color={Colors.primary[500]} style={styles.typeIcon} />;
      case 'audio':
        return <Headphones size={16} color={Colors.accent[500]} style={styles.typeIcon} />;
      case 'text':
        return <FileText size={16} color={Colors.secondary[500]} style={styles.typeIcon} />;
      default:
        return null;
    }
  };

  const renderEntryPreview = () => {
    switch (entry.type) {
      case 'image':
        return (
          <Image
            source={{ uri: entry.imageUri }}
            style={styles.imagePreview}
            contentFit="cover"
            transition={200}
          />
        );
      case 'audio':
        return (
          <View style={styles.audioPreview}>
            <Headphones size={32} color={Colors.accent[500]} />
            <Text style={styles.audioTranscript} numberOfLines={2}>
              {entry.transcript || 'Audio recording'}
            </Text>
            <Text style={styles.audioDuration}>{formatDuration(entry.duration)}</Text>
          </View>
        );
      case 'text':
        return (
          <View style={styles.textPreview}>
            {entry.title && <Text style={styles.textTitle}>{entry.title}</Text>}
            <Text style={styles.textContent} numberOfLines={4}>
              {entry.content}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      {renderEntryPreview()}
      <View style={styles.entryMeta}>
        <View style={styles.entryInfo}>
          {renderEntryTypeIcon(entry.type)}
          <Text style={styles.entryDate}>
            {format(new Date(entry.metadata.timestamp), 'MMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.tagContainer}>
          {entry.metadata.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {entry.metadata.tags.length > 2 && (
            <Text style={styles.moreTagsText}>+{entry.metadata.tags.length - 2}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  audioPreview: {
    padding: spacing.md,
    backgroundColor: Colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  audioTranscript: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.sm,
    color: Colors.neutral[700],
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  audioDuration: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.xs,
    color: Colors.neutral[500],
    marginTop: spacing.xs,
  },
  textPreview: {
    padding: spacing.md,
    backgroundColor: Colors.neutral[50],
    minHeight: 120,
  },
  textTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.md,
    color: Colors.neutral[900],
    marginBottom: spacing.xs,
  },
  textContent: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.sm,
    color: Colors.neutral[700],
    lineHeight: 22,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginRight: spacing.xs,
  },
  entryDate: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.xs,
    color: Colors.neutral[600],
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginLeft: spacing.xs,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.xs,
    color: Colors.primary[700],
  },
  moreTagsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.xs,
    color: Colors.neutral[500],
    marginLeft: spacing.xs,
  },
});