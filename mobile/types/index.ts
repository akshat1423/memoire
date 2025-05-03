// Entry types
export type EntryType = 'image' | 'audio' | 'text' | 'stored-images';

// Mood options for journal entries
export type MoodType =
  | 'happy'
  | 'excited'
  | 'grateful'
  | 'peaceful'
  | 'neutral'
  | 'thoughtful'
  | 'anxious'
  | 'sad'
  | 'frustrated'
  | 'angry';

// Location data structure
export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string; // Optional location name
}

// Metadata for journal entries
export interface EntryMetadata {
  timestamp: string; // ISO format
  tags: string[];
  mood?: MoodType;
  location?: LocationData;
  image_count?: number; // For stored images
}

// Base journal entry interface
export interface JournalEntry {
  id: string;
  type: EntryType;
  metadata: EntryMetadata;
  createdAt: string; // ISO format
  updatedAt: string; // ISO format
  score?: number; // Optional score from search results
}

// Specific entry types extending the base
export interface ImageEntry extends JournalEntry {
  type: 'image';
  imageUri: string;
  caption?: string;
}

export interface StoredImagesEntry extends JournalEntry {
  type: 'stored-images';
  images: Record<string, string>; // Dictionary of image URLs
  caption?: string;
}

export interface AudioEntry extends JournalEntry {
  type: 'audio';
  audioUri: string;
  duration: number; // in seconds
  transcript?: string; // Optional transcription
}

export interface TextEntry extends JournalEntry {
  type: 'text';
  title?: string;
  content: string;
}

// Union type for all entry types
export type JournalEntryUnion = ImageEntry | StoredImagesEntry | AudioEntry | TextEntry;

// Search filter options
export interface SearchFilters {
  query?: string;
  types?: EntryType[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  mood?: MoodType;
  page?: number;
  pageSize?: number;
}