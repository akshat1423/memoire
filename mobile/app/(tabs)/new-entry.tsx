import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable, TextInput, ScrollView, Alert, Platform, ActivityIndicator, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, TextQuote, X, ChevronLeft, Check, Mic, Image as ImageIcon, MapPin, ChevronDown, ImagePlus, Video, Search, Music, Play, Pause } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { ImageBackground} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';

import Colors from '@/constants/Colors';
import { spacing, borderRadius, typography, shadows } from '@/constants/Layout';
import { MoodType, EntryType } from '@/types';
import { createJournalEntry } from '@/services/api';
import { uploadImageViaEdgeFunction } from '@/lib/supabase';
import { uploadAudioViaEdgeFunction } from '@/lib/supabase';

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  preview: string;
  link: string;
}

const LoadingOverlay = () => {
  return (
    <Animated.View 
      style={styles.loadingOverlay}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <View style={styles.loadingContent}>
        <View style={styles.loadingIconContainer}>
          <Feather name="feather" size={48} color="rgb(151 88 15)" />
        </View>
        <Text style={styles.loadingTitle}>Preserving Your Memory</Text>
        <Text style={styles.loadingSubtitle}>Just a moment while we save your thoughts...</Text>
        <ActivityIndicator size="large" color="rgb(151 88 15)" />
      </View>
    </Animated.View>
  );
};

const SuccessToast = ({ message }: { message: string }) => {
  return (
    <Animated.View 
      style={styles.successToast}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <View style={styles.successToastContent}>
        <Check size={20} color="white" />
        <Text style={styles.successToastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const PremiumFeatureScreen = ({ onClose }: { onClose: () => void }) => {
  return (
    <Animated.View 
      style={styles.premiumContainer}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <View style={styles.premiumContent}>
        <View style={styles.premiumIconContainer}>
          <Video size={48} color="rgb(151 88 15)" />
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        </View>
        
        <Text style={styles.premiumTitle}>Video Memories</Text>
        <Text style={styles.premiumSubtitle}>Coming Soon!</Text>
        
        <View style={styles.premiumFeatures}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Video size={20} color="rgb(151 88 15)" />
            </View>
            <Text style={styles.featureText}>Record and save video memories</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <ImageIcon size={20} color="rgb(151 88 15)" />
            </View>
            <Text style={styles.featureText}>High quality video storage</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Mic size={20} color="rgb(151 88 15)" />
            </View>
            <Text style={styles.featureText}>Audio included in videos</Text>
          </View>
        </View>

        <View style={styles.premiumMessage}>
          <Text style={styles.premiumMessageText}>
            To enable video memories, we need a Supabase premium account or your support through an app subscription.
          </Text>
          <Text style={styles.premiumMessageText}>
            Help us bring this feature to life! 🎥✨
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.premiumButton}
          onPress={onClose}
        >
          <Text style={styles.premiumButtonText}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const SongSearch = ({ onSelect }: { onSelect: (track: DeezerTrack) => void }) => {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<DeezerTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const playPreview = async (track: DeezerTrack) => {
    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Create and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.preview },
        { shouldPlay: true }
      );
      setSound(newSound);
      setCurrentlyPlaying(track.id);

      // Handle playback completion
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setCurrentlyPlaying(null);
        }
      });
    } catch (error) {
      console.error('Error playing preview:', error);
      Alert.alert('Error', 'Failed to play song preview. Please try again.');
    }
  };

  const stopPreview = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setCurrentlyPlaying(null);
    }
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const searchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTracks([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(searchQuery)}`);
      setTracks(response.data.data);
    } catch (error) {
      console.error('Error searching songs:', error);
      Alert.alert('Error', 'Failed to search songs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.songSearchContainer}>
      <View style={styles.searchInputContainer}>
        <Search size={20} color="rgb(151 88 15)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a song..."
          placeholderTextColor="rgb(151 88 15)"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            searchSongs(text);
          }}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X size={20} color="rgb(151 88 15)" />
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator color="rgb(151 88 15)" style={styles.loadingIndicator} />
      ) : tracks.length > 0 ? (
        <ScrollView style={styles.tracksList}>
          {tracks.map((track) => (
            <View key={track.id} style={styles.trackItem}>
              <TouchableOpacity
                style={styles.trackInfoContainer}
                onPress={() => onSelect(track)}
              >
                <View style={styles.trackIcon}>
                  <Music size={20} color="rgb(151 88 15)" />
                </View>
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackArtist}>{track.artist.name}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => {
                  if (currentlyPlaying === track.id) {
                    stopPreview();
                  } else {
                    playPreview(track);
                  }
                }}
              >
                {currentlyPlaying === track.id ? (
                  <Pause size={20} color="rgb(151 88 15)" />
                ) : (
                  <Play size={20} color="rgb(151 88 15)" />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : query ? (
        <Text style={styles.noResults}>No songs found</Text>
      ) : null}
    </View>
  );
};

export default function NewEntryScreen() {
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [entryContent, setEntryContent] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [mood, setMood] = useState<MoodType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('dummy-user');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
  } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
  } | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelectingImages, setIsSelectingImages] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [selectedSong, setSelectedSong] = useState<DeezerTrack | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const cameraRef = useRef<CameraView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const entryTypes = [
    { type: 'text' as EntryType, label: 'Memo', icon: TextQuote, color: Colors.themeBrown },
    { type: 'image' as EntryType, label: 'Capture', icon: ImageIcon, color: Colors.themeBrown },
    { type: 'audio' as EntryType, label: 'Record', icon: Mic, color: Colors.themeBrown },
    { type: 'stored-images' as EntryType, label: 'Save Memories', icon: ImagePlus, color: Colors.themeBrown },
    { type: 'video' as EntryType, label: 'Video', icon: Video, color: Colors.themeBrown },
  ];

  const moodOptions: { value: MoodType; label: string; color: string }[] = [
    { value: 'happy', label: 'Happy', color: Colors.success[500] },
    { value: 'excited', label: 'Excited', color: Colors.accent[500] },
    { value: 'grateful', label: 'Grateful', color: Colors.primary[500] },
    { value: 'peaceful', label: 'Peaceful', color: Colors.secondary[500] },
    { value: 'neutral', label: 'Neutral', color: Colors.neutral[500] },
    { value: 'thoughtful', label: 'Thoughtful', color: Colors.primary[700] },
    { value: 'anxious', label: 'Anxious', color: Colors.warning[500] },
    { value: 'sad', label: 'Sad', color: Colors.neutral[600] },
    { value: 'frustrated', label: 'Frustrated', color: Colors.error[600] },
    { value: 'angry', label: 'Angry', color: Colors.error[500] },
  ];

  const popularCities = [
    { name: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
    { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
    { name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  ];

  const convertImageUriToArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
    const response = await fetch(uri);
    return await response.arrayBuffer();
  };
  
  const handleTypeSelect = async (type: EntryType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (type === 'video') {
      setShowPremium(true);
      return;
    }
    
    if (type === 'audio') {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone access to record audio.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    }
    
    setSelectedType(type);
  };

  const startRecording = async () => {
    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      
      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setAudioUri(uri);
      recordingRef.current = null;
      setIsRecording(false);
      
      // Clear duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) return;
  
    try {
      const photo = await cameraRef.current.takePictureAsync();
  
      if (photo && photo.uri) {
        setCapturedImage(photo.uri);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error('No photo returned');
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };
  

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleMoodSelect = (selectedMood: MoodType) => {
    setMood(selectedMood === mood ? null : selectedMood);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
      setCapturedImage(null);
      setAudioUri(null);
      setRecordingDuration(0);
      setSelectedImages([]);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      router.back();
    }
  };



const convertToBase64 = async (uri: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
};

  

  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    
    if (selectedType === 'text' && !entryContent.trim()) {
      Alert.alert('Entry content required', 'Please add some content to your journal entry.');
      return;
    }

    if (selectedType === 'image' && !entryTitle.trim()) {
      Alert.alert('Caption required', 'Please add a caption to your image.');
      return;
    }
  
    setIsLoading(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
  
      const metadata = {
        timestamp: new Date().toISOString(),
        tags,
        ...(mood && { mood }),
        ...(location && {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            ...(location.city && { city: location.city }),
          }
        }),
        ...(selectedSong && { 
          song_id: selectedSong.id,
          song_link: selectedSong.link,
          song_title: selectedSong.title,
          song_artist: selectedSong.artist.name
        }),
      };
  
      let data: string | FormData;
      
      switch (selectedType) {
        case 'text':
          data = entryContent;
          await createJournalEntry(selectedType, data, {
            ...metadata,
            title: entryTitle,
          });
          showSuccessToast('Text entry saved successfully!');
          break;
  
        case 'image':
          if (!capturedImage) {
            Alert.alert('Error', 'No image captured');
            return;
          }

          try {
            const base64Image = await convertToBase64(capturedImage);
            const uploadedImageUrl = await uploadImageViaEdgeFunction(base64Image, userId);

            await createJournalEntry('image', uploadedImageUrl, {
              ...metadata,
              caption: entryTitle,
            });
            showSuccessToast('Image saved successfully!');
          } catch (error: any) {
            console.error('Image upload failed:', error);
            Alert.alert('Upload Error', error.message || 'Something went wrong');
          }
          break;
  
        case 'audio':
          if (!audioUri) {
            Alert.alert('Error', 'No audio recorded');
            return;
          }
  
          const audioDataUrl = await fetch(audioUri)
          .then((res) => res.blob())
          .then((blob) => new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }));
        
        const audioUrl = await uploadAudioViaEdgeFunction(audioDataUrl, userId);
          if (audioDataUrl.startsWith('data:audio')) {
            
            await createJournalEntry(selectedType, audioUrl, {
              ...metadata,
              duration: recordingDuration,
              caption: entryTitle,
            });
            showSuccessToast('Audio entry saved successfully!');
          } else {
            throw new Error('Audio format conversion failed');
          }
          break;
      }
  
      // Reset form and navigate back
      setSelectedType(null);
      setEntryContent('');
      setEntryTitle('');
      setTags([]);
      setMood(null);
      setCapturedImage(null);
      setAudioUri(null);
      setRecordingDuration(0);
      setSelectedSong(null);
      
      // Wait for 1 second before redirecting
      await new Promise(resolve => setTimeout(resolve, 1));
      
      // Navigate back to the journal screen and reload
      router.replace({
        pathname: '/',
        params: { refresh: Date.now() } // Add timestamp to force reload
      });
    } catch (error) {
      console.error('Failed to create entry:', error);
      Alert.alert('Error', 'Failed to save your journal entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || 'dummy-user');
    };
    loadUser();
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        const city = address[0]?.city || address[0]?.region || 'Unknown Location';
        
        // Set both location and selectedLocation
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city: city,
        });
        
        setSelectedLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city: city,
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getLocation();
  }, []);

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant access to your photo library to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset: ImagePicker.ImagePickerAsset) => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages]);
        setIsSelectingImages(false);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitImages = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No images selected', 'Please select at least one image to save.');
      return;
    }

    setIsLoading(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const metadata = {
        timestamp: new Date().toISOString(),
        tags,
        ...(mood && { mood }),
        ...(location && {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            ...(location.city && { city: location.city }),
          }
        }),
        ...(selectedSong && { 
          song_id: selectedSong.id,
          song_link: selectedSong.link,
          song_title: selectedSong.title,
          song_artist: selectedSong.artist.name
        }),
        image_count: selectedImages.length,
      };

      // Create a dictionary of image URLs
      const imagesDict: Record<string, string> = {};
      for (let i = 0; i < selectedImages.length; i++) {
        const base64Image = await convertToBase64(selectedImages[i]);
        const uploadedImageUrl = await uploadImageViaEdgeFunction(base64Image, userId);
        imagesDict[`image${i + 1}`] = uploadedImageUrl;
      }

      // Create a single entry for all images
      await createJournalEntry('stored-images', JSON.stringify(imagesDict), {
        ...metadata,
        caption: entryTitle || 'Untitled Images',
      });

      // Reset form and navigate back
      setSelectedImages([]);
      setEntryTitle('');
      setTags([]);
      setMood(null);
      setSelectedSong(null);
      
      showSuccessToast('Images saved successfully!');
      router.replace({
        pathname: '/',
        params: { refresh: Date.now() }
      });
    } catch (error) {
      console.error('Failed to save images:', error);
      Alert.alert('Error', 'Failed to save your images. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          <View style={[
            styles.header,
            selectedType === 'stored-images' && styles.headerStoredImages
          ]}>
            <View style={styles.headerContent}>
              {selectedType && (
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={() => {
                    setSelectedType(null);
                    setCapturedImage(null);
                    setAudioUri(null);
                    setRecordingDuration(0);
                    setSelectedImages([]);
                  }}
                >
                  <ChevronLeft size={24} color="rgb(151 88 15)" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>
                {selectedType ? `New ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Entry` : 'New Entry'}
              </Text>
            </View>
            {selectedType && (
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  selectedType === 'stored-images' && selectedImages.length === 0 ? styles.saveButtonDisabled : null
                ]} 
                onPress={selectedType === 'stored-images' ? handleSubmitImages : handleSubmit}
                disabled={isLoading || (selectedType === 'stored-images' && selectedImages.length === 0)}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Check size={24} color="rgb(151 88 15)" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {!selectedType ? (
            <View style={styles.typeSelection}>
              <View style={styles.typeSelectionBox}>
                <Text style={styles.selectionTitle}>What would you like to add?</Text>
                <View style={styles.typeOptions}>
                  <View style={[styles.typeRow, styles.topRow]}>
                    {entryTypes.slice(0, 3).map((item) => (
                      <TouchableOpacity
                        key={item.type}
                        style={styles.typeOption}
                        onPress={() => handleTypeSelect(item.type)}
                      >
                        <View style={styles.typeIconContainer}>
                          <item.icon size={28} color={item.color} />
                        </View>
                        <Text style={styles.typeLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={[styles.typeRow, styles.bottomRow]}>
                    {entryTypes.slice(3).map((item) => (
                      <TouchableOpacity
                        key={item.type}
                        style={styles.bottomTypeOption}
                        onPress={() => handleTypeSelect(item.type)}
                      >
                        <View style={styles.typeIconContainer}>
                          <item.icon size={28} color={item.color} />
                        </View>
                        <Text style={styles.typeLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <ScrollView 
              style={styles.entryForm}
              contentContainerStyle={styles.entryFormContent}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                {selectedType === 'text' && (
                  <View style={styles.textEntryContainer}>
                    <TextInput
                      style={styles.titleInput}
                      placeholder="Add a title..."
                      placeholderTextColor="rgb(151 88 15)"
                      value={entryTitle}
                      onChangeText={setEntryTitle}
                      maxLength={100}
                    />
                    <View style={styles.contentContainer}>
                      <TextInput
                        style={styles.contentInput}
                        placeholder="Write your thoughts..."
                        placeholderTextColor="rgb(151 88 15)"
                        value={entryContent}
                        onChangeText={setEntryContent}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                )}

                {selectedType === 'audio' && (
                  <View style={styles.audioContainer}>
                    {!audioUri ? (
                      <>
                        <TouchableOpacity
                          style={[styles.recordButton, isRecording && styles.recordingButton]}
                          onPress={isRecording ? stopRecording : startRecording}
                        >
                          <Mic size={32} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.recordingDuration}>
                          {isRecording ? formatDuration(recordingDuration) : 'Tap to record'}
                        </Text>
                      </>
                    ) : (
                      <View style={styles.audioPreview}>
                        <View style={styles.audioWaveform}>
                          {Array.from({ length: 20 }).map((_, i) => (
                            <View
                              key={i}
                              style={[
                                styles.waveformBar,
                                { height: Math.random() * 50 + 20 }
                              ]}
                            />
                          ))}
                        </View>
                        <Text style={styles.audioDuration}>
                          Duration: {formatDuration(recordingDuration)}
                        </Text>
                        <TouchableOpacity
                          style={styles.rerecordButton}
                          onPress={() => {
                            setAudioUri(null);
                            setRecordingDuration(0);
                          }}
                        >
                          <Text style={styles.rerecordButtonText}>Re-record</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.audioCaptionInput}
                          placeholder="Add a caption..."
                          placeholderTextColor="rgb(151 88 15)"
                          value={entryTitle}
                          onChangeText={setEntryTitle}
                          maxLength={100}
                        />
                      </View>
                    )}
                  </View>
                )}

                {selectedType === 'image' && (
                  <View style={styles.cameraContainer}>
                    {!capturedImage ? (
                      <>
                        <CameraView
                          ref={cameraRef}
                          style={styles.camera}
                          facing={cameraType}
                          onCameraReady={() => setIsCameraReady(true)}
                        >
                          <View style={styles.cameraControls}>
                            <TouchableOpacity
                              style={styles.flipButton}
                              onPress={() => setCameraType(current => current === 'back' ? 'front' : 'back')}
                            >
                              <Camera size={24} color={Colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.captureButton}
                              onPress={takePicture}
                              disabled={!isCameraReady}
                            >
                              <View style={styles.captureButtonInner} />
                            </TouchableOpacity>
                          </View>
                        </CameraView>
                      </>
                    ) : (
                      <View style={styles.previewContainer}>
                        <Image
                          source={{ uri: capturedImage }}
                          style={styles.imagePreview}
                          contentFit="cover"
                        />
                        <TouchableOpacity
                          style={styles.retakeButton}
                          onPress={() => setCapturedImage(null)}
                        >
                          <Text style={styles.retakeButtonText}>Retake</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.captionInput}
                          placeholder="Add a caption..."
                          placeholderTextColor={Colors.neutral[400]}
                          value={entryTitle}
                          onChangeText={setEntryTitle}
                        />
                      </View>
                    )}
                  </View>
                )}

                {selectedType === 'stored-images' && (
                  <View style={styles.storageImageContainer}>
                    <TextInput
                      style={styles.titleInput}
                      placeholder="Add a caption for all images..."
                      placeholderTextColor="rgb(151 88 15)"
                      value={entryTitle}
                      onChangeText={setEntryTitle}
                      maxLength={100}
                    />
                    <TouchableOpacity
                      style={styles.selectImagesButton}
                      onPress={pickImages}
                    >
                      <ImagePlus size={24} color="rgb(151 88 15)" />
                      <Text style={styles.selectImagesText}>Select Images</Text>
                    </TouchableOpacity>
                    
                    {selectedImages.length > 0 && (
                      <View style={styles.selectedImagesContainer}>
                        {selectedImages.map((uri, index) => (
                          <View key={index} style={styles.imagePreviewContainer}>
                            <Image
                              source={{ uri }}
                              style={styles.selectedImage}
                              contentFit="cover"
                            />
                            <TouchableOpacity
                              style={styles.removeImageButton}
                              onPress={() => removeImage(index)}
                            >
                              <X size={16} color="white" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.songSection}>
                  <Text style={styles.sectionTitle}>Add a Song (Optional)</Text>
                  {selectedSong ? (
                    <View style={styles.selectedSong}>
                      <View style={styles.trackIcon}>
                        <Music size={20} color="rgb(151 88 15)" />
                      </View>
                      <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle}>{selectedSong.title}</Text>
                        <Text style={styles.trackArtist}>{selectedSong.artist.name}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeSongButton}
                        onPress={() => setSelectedSong(null)}
                      >
                        <X size={20} color="rgb(151 88 15)" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <SongSearch onSelect={setSelectedSong} />
                  )}
                </View>

                <View style={styles.metadataSection}>
                  <Text style={styles.sectionTitle}>Tags</Text>
                  <View style={styles.tagInputContainer}>
                    <TextInput
                      style={styles.tagInput}
                      placeholder="Add tags..."
                      placeholderTextColor={Colors.themeBrown_colors[250]}
                      value={newTag}
                      onChangeText={setNewTag}
                      onSubmitEditing={handleAddTag}
                    />
                    <TouchableOpacity 
                      style={[styles.addTagButton, !newTag.trim() ? styles.addTagButtonDisabled : null]} 
                      onPress={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      <Text style={[styles.addTagButtonText, !newTag.trim() ? styles.addTagButtonTextDisabled : null]}>
                        Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {tags.map((tag, index) => (
                        <View key={index} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>#{tag}</Text>
                          <TouchableOpacity 
                            style={styles.removeTagButton} 
                            onPress={() => handleRemoveTag(tag)}
                          >
                            <X size={14} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Mood</Text>
                  <View style={styles.moodGrid}>
                    {moodOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.moodOption,
                          mood === option.value && { 
                            backgroundColor: option.color + '40',
                            borderColor: option.color ,
                          }
                        ]}
                        onPress={() => handleMoodSelect(option.value)}
                      >
                        <Text 
                          style={[
                            styles.moodText, 
                            mood === option.value && { color: option.color }
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Location</Text>
                  <TouchableOpacity 
                    style={styles.locationSelector}
                    onPress={() => setShowLocationPicker(!showLocationPicker)}
                  >
                    <MapPin size={20} color="rgb(151 88 15)" />
                    <Text style={styles.locationText}>
                      {location?.city || 'Getting location...'}
                    </Text>
                    <ChevronDown size={20} color="rgb(151 88 15)" />
                  </TouchableOpacity>

                  {showLocationPicker && (
                    <Animated.View 
                      style={styles.locationPicker}
                      entering={FadeIn.duration(200)}
                      exiting={FadeOut.duration(200)}
                    >
                      <View style={styles.locationOptions}>
                        {popularCities.map((city) => (
                          <TouchableOpacity
                            key={city.name}
                            style={[
                              styles.locationOption,
                              selectedLocation?.city === city.name && styles.selectedLocation
                            ]}
                            onPress={() => {
                              setSelectedLocation({
                                latitude: city.latitude,
                                longitude: city.longitude,
                                city: city.name
                              });
                              setShowLocationPicker(false);
                            }}
                          >
                            <Text style={[
                              styles.locationOptionText,
                              selectedLocation?.city === city.name && styles.selectedLocationText
                            ]}>
                              {city.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Animated.View>
                  )}
                </View>
              </Animated.View>
            </ScrollView>
          )}
        </View>
        {isLoading && <LoadingOverlay />}
        {showSuccess && <SuccessToast message={successMessage} />}
      </ImageBackground>
      
      {showPremium && (
        <PremiumFeatureScreen onClose={() => setShowPremium(false)} />
      )}
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
  saveButton: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  typeSelection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  typeSelectionBox: {
    backgroundColor: Colors.nearWhite_2,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  selectionTitle: {
    fontFamily: 'Tangerine_400Regular',
    fontSize: 55,
    color: Colors.themeBrown,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  typeOptions: {
    width: '100%',
    gap: spacing.xl,
  },
  typeRow: {
    flexDirection: 'row',
    width: '100%',
  },
  topRow: {
    justifyContent: 'space-between',
  },
  bottomRow: {
    justifyContent: 'center',
  },
  typeOption: {
    alignItems: 'center',
    width: '30%',
    padding: spacing.sm,
  },
  bottomTypeOption: {
    alignItems: 'center',
    width: '40%',
    padding: spacing.sm,
  },
  typeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: Colors.themeBrown_colors[150],
  },
  typeLabel: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    textAlign: 'center',
  },
  entryForm: {
    flex: 1,
  },
  entryFormContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  textEntryContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  titleInput: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.themeBrown_colors[450],
  },
  contentContainer: {
    borderRadius: borderRadius.md,
    backgroundColor: Colors.themeBrown_colors[450],
    overflow: 'hidden',
    height: 200,
  },
  contentInput: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    padding: spacing.md,
    height: '100%',
    textAlignVertical: 'top',
  },
  cameraContainer: {
    height: 400,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: spacing.xl,
  },
  flipButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.round,
    padding: spacing.md,
  },
  captureButton: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
  },
  previewContainer: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    flex: 1,
  },
  retakeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retakeButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.sm,
    color: Colors.white,
  },
  captionInput: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: Colors.white,
    fontFamily: 'Inter_400Regular',
    fontSize: typography.md,
  },
  audioContainer: {
    height: 300,
    marginTop: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.themeBrown,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: Colors.themeBrown_colors[250],
  },
  recordingDuration: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    marginTop: spacing.sm,
  },
  audioPreview: {
    width: '100%',
    alignItems: 'center',
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
    paddingHorizontal: spacing.md,
  },
  waveformBar: {
    width: 3,
    backgroundColor: Colors.themeBrown,
    marginHorizontal: 2,
    borderRadius: borderRadius.sm,
  },
  audioDuration: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    marginTop: spacing.md,
  },
  rerecordButton: {
    marginTop: spacing.xl,
    backgroundColor: Colors.themeBrown,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
  },
  rerecordButtonText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: 'white',
  },
  audioCaptionInput: {
    width: '100%',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    backgroundColor: Colors.themeBrown_colors[450],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  storageImageContainer: {
    marginTop: spacing.md,
  },
  selectImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.themeBrown_colors[450],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: Colors.themeBrown,
  },
  selectImagesText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    marginLeft: spacing.sm,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  imagePreviewContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.themeBrown_colors[450],
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.round,
    padding: spacing.xs,
  },
  premiumContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  premiumContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '90%',
    alignItems: 'center',
  },
  premiumIconContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  premiumBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: Colors.themeBrown,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  premiumBadgeText: {
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.xs,
  },
  premiumTitle: {
    fontFamily: 'Tangerine_400Regular',
    fontSize: 48,
    color: Colors.themeBrown,
    marginBottom: spacing.xs,
  },
  premiumSubtitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.lg,
    color: Colors.themeBrown_colors[250],
    marginBottom: spacing.xl,
  },
  premiumFeatures: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(151, 88, 15, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    flex: 1,
  },
  premiumMessage: {
    backgroundColor: 'rgba(151, 88, 15, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  premiumMessageText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  premiumButton: {
    backgroundColor: Colors.themeBrown,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
  },
  premiumButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.md,
    color: 'white',
  },
  songSection: {
    marginTop: spacing.xl,
    backgroundColor: Colors.themeBrown_colors[450],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  songSearchContainer: {
    marginTop: spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: Colors.themeBrown_colors[150],
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  loadingIndicator: {
    marginTop: spacing.md,
  },
  tracksList: {
    maxHeight: 200,
    marginTop: spacing.md,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  trackInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(151, 88, 15, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  trackArtist: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    color: Colors.themeBrown_colors[250],
  },
  noResults: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  selectedSong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: Colors.themeBrown_colors[150],
  },
  removeSongButton: {
    padding: spacing.xs,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(151, 88, 15, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  headerStoredImages: {
    paddingVertical: spacing.sm,
  },
  successToast: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    zIndex: 1000,
  },
  successToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  successToastText: {
    color: 'white',
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    textAlign: 'center',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.themeBrown_colors[450],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Colors.themeBrown,
  },
  locationText: {
    flex: 1,
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    marginLeft: spacing.sm,
  },
  locationPicker: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationOptions: {
    gap: spacing.sm,
  },
  locationOption: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.themeBrown_colors[450],
  },
  selectedLocation: {
    backgroundColor: Colors.themeBrown_colors[250],
  },
  locationOptionText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  selectedLocationText: {
    color: 'white',
  },
  metadataSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    marginBottom: spacing.sm,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.themeBrown_colors[450],
    borderWidth: 1,
    borderColor: Colors.themeBrown,
  },
  addTagButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: Colors.themeBrown_colors[450],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.themeBrown,
  },
  addTagButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  addTagButtonText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  addTagButtonTextDisabled: {
    color: 'rgba(151, 88, 15, 0.5)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.themeBrown_colors[250],
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagChipText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    color: 'white',
  },
  removeTagButton: {
    marginLeft: spacing.xs,
    padding: 2,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  moodOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: Colors.themeBrown,
    backgroundColor: Colors.nearWhite_2,
  },
  moodText: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.sm,
    color: Colors.themeBrown,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '80%',
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.themeBrown_colors[450],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    fontFamily: 'Tangerine_400Regular',
    fontSize: 48,
    color: Colors.themeBrown,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontFamily: 'Tagesschrift_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown_colors[250],
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
});