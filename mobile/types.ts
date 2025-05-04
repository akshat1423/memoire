export type EntryType = 'text' | 'image' | 'audio' | 'stored-images';

export interface SearchFilters {
  query?: string;
  types?: EntryType[];
  tags?: string[];
  location?: string | null;
  dateRange?: {
    from: Date;
    to: Date;
  };
  page?: number;
  pageSize?: number;
}

export interface JournalEntryUnion {
  id: string;
  type: EntryType;
  metadata: {
    title?: string;
    caption?: string;
    duration?: number;
    transcript?: string;
    tags?: string[];
    location?: {
      city?: string;
      country?: string;
    };
    song_id?: string;
    song_title?: string;
    song_artist?: string;
    image_url?: string;
    image_count?: number;
    images?: string;
  };
  createdAt: string | null;
  updatedAt: string | null;
  score?: number;
  title?: string;
  content?: string;
  imageUri?: string;
  audioUri?: string;
}

export interface Memory {
  id: string;
  type: EntryType;
  metadata: {
    title?: string;
    caption?: string;
    duration?: number;
    transcript?: string;
    tags?: string[];
    location?: {
      city?: string;
      country?: string;
    };
  };
  created_at: string;
  updated_at: string;
  score?: number;
  memory?: string;
} 