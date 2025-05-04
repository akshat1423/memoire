import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Pressable, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { Headphones, Image as ImageIcon, FileText, Maximize2, ChevronLeft, ChevronRight, Music, Play, Pause, X, Trash2 } from 'lucide-react-native';

import { JournalEntryUnion } from '@/types';
import AudioPlayer from './AudioPlayer';
import Colors from '@/constants/Colors';
import { spacing, borderRadius, shadows, typography } from '@/constants/Layout';
import { deleteJournalEntry } from '@/services/api';

type Props = {
  entry: JournalEntryUnion;
  onPress?: () => void;
};

export default function JournalEntryCard({ entry, onPress }: Props) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchPreviewUrl = async (songId: string) => {
    try {
      const response = await fetch(`https://api.deezer.com/track/${songId}`);
      setPreviewUrl(response.data.preview);
      return response.data.preview;
    } catch (error) {
      console.error('Error fetching preview URL:', error);
      setPreviewUrl(null);
      return null;
    }
  };

  // Fetch preview URL when song is available and full screen is opened
  useEffect(() => {
    if (isFullScreen && entry.metadata.song_id) {
      fetchPreviewUrl(entry.metadata.song_id);
    }
  }, [isFullScreen, entry.metadata.song_id]);

  const handleDelete = async () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry(entry.id);
              setIsFullScreen(false);
              if (onPress) onPress(); // Refresh the list
            } catch (error) {
              console.error('Failed to delete entry:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: (Dimensions.get('window').width - spacing.lg * 2) * newIndex,
        animated: true
      });
    }
  };

  const handleNextImage = () => {
    const imageCount = entry.type === 'stored-images' ? entry.metadata.image_count : 1;
    if (currentImageIndex < imageCount - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: (Dimensions.get('window').width - spacing.lg * 2) * newIndex,
        animated: true
      });
    }
  };

  const renderNavigationArrows = (isFullScreen: boolean = false) => {
    const imageCount = entry.type === 'stored-images' ? entry.metadata.image_count : 1;
    const containerStyle = isFullScreen ? styles.fullScreenNavigationContainer : styles.navigationContainer;
    const buttonStyle = isFullScreen ? styles.fullScreenNavigationButton : styles.navigationButton;
    const iconSize = isFullScreen ? 32 : 24;

    return (
      <View style={containerStyle}>
        <TouchableOpacity
          style={[buttonStyle, currentImageIndex === 0 && styles.disabledButton]}
          onPress={handlePreviousImage}
          disabled={currentImageIndex === 0}
        >
          <ChevronLeft size={iconSize} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[buttonStyle, currentImageIndex === imageCount - 1 && styles.disabledButton]}
          onPress={handleNextImage}
          disabled={currentImageIndex === imageCount - 1}
        >
          <ChevronRight size={iconSize} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEntryTypeIcon = () => {
    switch (entry.type) {
      case 'image': return <ImageIcon size={16} style={styles.typeIcon} />;
      case 'audio': return <Headphones size={16} style={styles.typeIcon} />;
      case 'text': return <FileText size={16} style={styles.typeIcon} />;
      default: return null;
    }
  };

  const renderFullScreenButton = () => (
    <View style={styles.topButtonsContainer}>
      <TouchableOpacity 
        style={styles.fullScreenButton}
        onPress={() => setIsFullScreen(true)}
      >
        <Maximize2 size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderPlayButton = () => {
    if (entry.metadata.song_id && previewUrl) {
      return (
        <AudioPlayer 
          uri={previewUrl}
          isHeader={true}
        />
      );
    }
    return null;
  };

  const renderFullScreenContent = () => {
    switch (entry.type) {
      case 'image':
        return (
          <View style={styles.fullScreenImageContainer}>
            {entry.metadata.song_id && (
              <View style={styles.songHeader}>
                <View style={styles.songInfo}>
                </View>
                {previewUrl && (
                  <AudioPlayer 
                    uri={previewUrl}
                    title={entry.metadata.song_title}
                    artist={entry.metadata.song_artist}
                  />
                )}
              </View>
            )}
            <Image
              source={{ uri: entry.metadata.image_url }}
              style={styles.fullScreenImage}
              contentFit="contain"
              transition={200}
            />
            {entry.metadata.caption && (
              <View style={styles.fullScreenCaptionContainer}>
                <Text style={styles.fullScreenCaption}>{entry.metadata.caption}</Text>
              </View>
            )}
          </View>
        );
      case 'stored-images':
        const imageCount = entry.metadata.image_count || 0;
        
        if (imageCount === 0) {
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No images available</Text>
            </View>
          );
        }

        const imageUrls = Array.from({ length: imageCount }, (_, i) => {
          const imageKey = `image${i + 1}`;
          const jsonString = JSON.parse(entry.metadata.images);
          const imageUrl = jsonString[imageKey];
          return {
            key: imageKey,
            uri: imageUrl || ''
          };
        }).filter(img => img.uri);

        if (imageUrls.length === 0) {
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Unable to load images</Text>
            </View>
          );
        }

        return (
          <View style={styles.fullScreenStoredImagesContainer}>
            {entry.metadata.song_id && (
              <View style={styles.songHeader}>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{entry.metadata.song_title}</Text>
                  <Text style={styles.songArtist}>{entry.metadata.song_artist}</Text>
                </View>
                {previewUrl && (
                  <AudioPlayer 
                    uri={previewUrl}
                    title={entry.metadata.song_title}
                    artist={entry.metadata.song_artist}
                  />
                )}
              </View>
            )}
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              style={styles.fullScreenCarousel}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                setCurrentImageIndex(newIndex);
              }}
            >
              {imageUrls.map(({ key, uri }, index) => (
                <View key={key} style={styles.fullScreenCarouselImageContainer}>
                  <Image
                    source={{ uri }}
                    style={styles.fullScreenCarouselImage}
                    contentFit="contain"
                    transition={200}
                  />
                  <View style={styles.fullScreenCarouselInfo}>
                    <Text style={styles.fullScreenCarouselCount}>
                      {index + 1} / {imageUrls.length}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            {renderNavigationArrows(true)}
            {entry.metadata.caption && (
              <View style={styles.fullScreenCaptionContainer}>
                <Text style={styles.fullScreenCaption}>{entry.metadata.caption}</Text>
              </View>
            )}
          </View>
        );
      case 'audio':
        return (
          <View style={styles.audioContainer}>
            {entry.metadata.song_id && (
              <View style={styles.songInfoHeader}>
                <Music size={20} color="white" style={styles.songInfoIcon} />
                <View style={styles.songInfoText}>
                  <Text style={styles.songInfoTitle}>{entry.metadata.song_title}</Text>
                  <Text style={styles.songInfoArtist}>{entry.metadata.song_artist}</Text>
                </View>
              </View>
            )}
            <View style={styles.audioContent}>
              <AudioPlayer uri={entry.metadata.audio_url} />
              {entry.metadata.caption && (
                <Text style={styles.audioCaption}>{entry.metadata.caption}</Text>
              )}
            </View>
            {renderFullScreenButton()}
          </View>
        );
      case 'text':
        return (
          <View style={styles.fullScreenTextContainer}>
            {entry.metadata.song_id && (
              <View style={styles.songHeader}>
                <View style={styles.songInfo}>
                </View>
                {previewUrl && (
                  <AudioPlayer 
                    uri={previewUrl}
                    title={entry.metadata.song_title}
                    artist={entry.metadata.song_artist}
                  />
                )}
              </View>
            )}
            <View style={styles.textContentContainer}>
              {entry.title && <Text style={styles.fullScreenTextTitle}>{entry.title}</Text>}
              <Text style={styles.fullScreenTextContent}>{entry.content}</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderEntryPreview = () => {
    switch (entry.type) {
      case 'image':
        return (
          <View style={styles.imageContainer}>
            {entry.metadata.song_id && (
              <View style={styles.songInfoHeader}>
                <Music size={20} color="white" style={styles.songInfoIcon} />
                <View style={styles.songInfoText}>
                  <Text style={styles.songInfoTitle}>{entry.metadata.song_title}</Text>
                  <Text style={styles.songInfoArtist}>{entry.metadata.song_artist}</Text>
                </View>
              </View>
            )}
            <Image
              source={{ uri: entry.metadata.image_url }}
              style={styles.imagePreview}
              contentFit="cover"
              transition={200}
            />
           
            {renderFullScreenButton()}
            {entry.metadata.caption && (
              <View style={styles.imageCaptionContainer}>
                <Text style={styles.imageCaption}>{entry.metadata.caption}</Text>
              </View>
            )}
          </View>
        );
      case 'stored-images':
        const imageCount = entry.metadata.image_count || 0;
        
        if (imageCount === 0) {
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No images available</Text>
            </View>
          );
        }

        const imageUrls = Array.from({ length: imageCount }, (_, i) => {
          const imageKey = `image${i + 1}`;
          const jsonString = JSON.parse(entry.metadata.images);
          const imageUrl = jsonString[imageKey];
          return {
            key: imageKey,
            uri: imageUrl || ''
          };
        }).filter(img => img.uri);

        if (imageUrls.length === 0) {
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Unable to load images</Text>
            </View>
          );
        }

        return (
          <View style={styles.storedImagesContainer}>
            {entry.metadata.song_id && (
              <View style={styles.songInfoHeader}>
                <Music size={20} color="white" style={styles.songInfoIcon} />
                <View style={styles.songInfoText}>
                  <Text style={styles.songInfoTitle}>{entry.metadata.song_title}</Text>
                  <Text style={styles.songInfoArtist}>{entry.metadata.song_artist}</Text>
                </View>
              </View>
            )}
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              style={styles.imageCarousel}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.x / (Dimensions.get('window').width - spacing.lg * 2));
                setCurrentImageIndex(newIndex);
              }}
            >
              {imageUrls.map(({ key, uri }, index) => (
                <View key={key} style={styles.carouselImageContainer}>
                  <Image
                    source={{ uri }}
                    style={styles.carouselImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.carouselImageInfo}>
                    <Text style={styles.carouselImageCount}>
                      {index + 1} / {imageUrls.length}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            {renderNavigationArrows()}
            {renderPlayButton()}
            {renderFullScreenButton()}
            {entry.metadata.caption && (
              <View style={styles.imageCaptionContainer}>
                <Text style={styles.imageCaption}>{entry.metadata.caption}</Text>
              </View>
            )}
          </View>
        );
      case 'audio':
        return (
          <View style={styles.audioContainer}>
            {entry.metadata.song_id && (
              <View style={styles.songInfoHeader}>
                <Music size={20} color="white" style={styles.songInfoIcon} />
                <View style={styles.songInfoText}>
                  <Text style={styles.songInfoTitle}>{entry.metadata.song_title}</Text>
                  <Text style={styles.songInfoArtist}>{entry.metadata.song_artist}</Text>
                </View>
              </View>
            )}
            <View style={styles.audioContent}>
              <AudioPlayer uri={entry.metadata.audio_url} />
              {entry.metadata.caption && (
                <Text style={styles.audioCaption}>{entry.metadata.caption}</Text>
              )}
            </View>
            {renderFullScreenButton()}
          </View>
        );
      case 'text':
        return (
          <View style={styles.textPreview}>
            {entry.metadata.song_id && (
              <View style={[styles.songInfoHeader, styles.textSongInfoHeader]}>
                <Music size={20} color="white" style={styles.songInfoIcon} />
                <View style={styles.songInfoText}>
                  <Text style={styles.songInfoTitle}>{entry.metadata.song_title}</Text>
                  <Text style={styles.songInfoArtist}>{entry.metadata.song_artist}</Text>
                </View>
              </View>
            )}
            <View style={styles.textContentContainer}>
              {entry.title && <Text style={styles.textTitle}>{entry.title}</Text>}
              <Text style={styles.textContent} numberOfLines={4}>{entry.content}</Text>
            </View>
            {renderPlayButton()}
            {renderFullScreenButton()}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <TouchableOpacity style={[styles.card, { opacity: 0.9 }]} activeOpacity={0.5} onPress={onPress}>
        {renderEntryPreview()}
        <View style={styles.entryMeta}>
          <View style={styles.entryInfo}>
            {renderEntryTypeIcon()}
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

      <Modal
        visible={isFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsFullScreen(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity 
              style={styles.fullScreenDeleteButton}
              onPress={handleDelete}
            >
              <Trash2 size={24} color="red" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.fullScreenCloseButton}
              onPress={() => {
                setIsFullScreen(false);
              }}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>
          {renderFullScreenContent()}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  imagePreview: {
    width: '100%',
    height: 300,
  },
  imageCaptionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
  },
  imageCaption: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    color: 'white',
    textAlign: 'center',
  },
  audioContainer: {
    backgroundColor: Colors.themeBrown_colors[450],
    padding: spacing.md,
    marginTop: -spacing.md,
    marginLeft: -spacing.md,
    marginRight: -spacing.md,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  audioWaveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  waveformBar: {
    width: 3,
    backgroundColor: Colors.themeBrown_colors[250],
    marginHorizontal: 2,
    borderRadius: borderRadius.sm,
  },
  audioContent: {
    alignItems: 'center',
  },
  audioCaption: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    color: Colors.themeBrown,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  textPreview: {
    backgroundColor: Colors.themeBrown_colors[450],
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  textTitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.xl,
    color: Colors.neutral[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  textContent: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sd,
    color: Colors.neutral[700],
    lineHeight: 22,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
    color: "rgb(151, 88, 15)",
  },
  entryDate: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.xs,
    color: Colors.themeBrown_colors[250],
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: Colors.themeBrown_colors[250],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginLeft: spacing.xs,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.xs,
    color: "white",
  },
  moreTagsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.xs,
    color: Colors.neutral[500],
    marginLeft: spacing.xs,
  },
  fullScreenButtonContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fullScreenButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
    borderRadius: borderRadius.round,
  },
  playButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.xl + spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
    borderRadius: borderRadius.round,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    zIndex: 1,
  },
  fullScreenDeleteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
    borderRadius: borderRadius.round,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
    borderRadius: borderRadius.round,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenCaptionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.md,
  },
  fullScreenCaption: {
    color: 'white',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    textAlign: 'center',
  },
  fullScreenAudioContainer: {
    width: Dimensions.get('window').width * 0.9,
    padding: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
  },
  fullScreenAudioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  fullScreenWaveformBar: {
    width: 4,
    backgroundColor: Colors.themeBrown_colors[250],
    marginHorizontal: 2,
    borderRadius: borderRadius.sm,
  },
  fullScreenAudioContent: {
    alignItems: 'center',
  },
  fullScreenAudioCaption: {
    color: 'white',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  fullScreenTextContainer: {
    width: Dimensions.get('window').width * 0.9,
    padding: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  fullScreenTextTitle: {
    color: 'white',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.xl,
    marginBottom: spacing.xl,
    textAlign: 'center',
    width: '100%',
  },
  fullScreenTextContent: {
    color: 'white',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    lineHeight: 24,
    width: '100%',
  },
  storedImagesContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  imageCarousel: {
    width: '100%',
    height: '100%',
  },
  carouselImageContainer: {
    width: Dimensions.get('window').width - spacing.lg * 2,
    height: '100%',
    marginHorizontal: spacing.lg,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  carouselImageInfo: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  carouselImageCount: {
    color: 'white',
    fontFamily: 'Inter_500Medium',
    fontSize: typography.sm,
  },
  fullScreenStoredImagesContainer: {
    flex: 1,
    width: '100%',
  },
  fullScreenCarousel: {
    flex: 1,
    width: '100%',
  },
  fullScreenCarouselImageContainer: {
    width: Dimensions.get('window').width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCarouselImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenCarouselInfo: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  fullScreenCarouselCount: {
    color: 'white',
    fontFamily: 'Inter_500Medium',
    fontSize: typography.md,
  },
  errorContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.themeBrown_colors[450],
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.md,
    color: Colors.error[500],
  },
  navigationContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  navigationButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
    borderRadius: borderRadius.round,
  },
  disabledButton: {
    opacity: 0.5,
  },
  fullScreenNavigationContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  fullScreenNavigationButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.md,
    borderRadius: borderRadius.round,
  },
  songHeader: {
    backgroundColor: 'rgba(117, 115, 115, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  songInfo: {
    // marginBottom: spacing.sm,
  },
  songTitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: 'white',
    marginBottom: 2,
  },
  songArtist: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  songPlayer: {
    marginTop: spacing.md,
    width: '100%',
  },
  textContentContainer: {
    padding: spacing.md,
  },
  songInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.sm,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  songInfoIcon: {
    marginRight: spacing.sm,
  },
  songInfoText: {
    flex: 1,
  },
  songInfoTitle: {
    color: 'white',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    marginBottom: 1,
  },
  songInfoArtist: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.xs,
  },
  textSongInfoHeader: {
    marginBottom: 0,
  },
  topButtonsContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
    borderRadius: borderRadius.round,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
    borderRadius: borderRadius.round,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
