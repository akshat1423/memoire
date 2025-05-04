import { JournalEntryUnion, SearchFilters } from '@/types';
import MemoryClient from 'mem0ai';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

const mem0ApiKey = process.env.MEM0_API_KEY!;
console.log('MEM0 API Key:', mem0ApiKey);
const client = new MemoryClient({ 
  apiKey: "m0-F4TqSBPgG2wdFAl1rM0weKCW9bkhwLeitUYCmFTw",
});

export const createJournalEntry = async (
  type: 'image' | 'audio' | 'text' | 'stored-images',
  data: string | FormData,
  metadata: any
): Promise<JournalEntryUnion> => {
  try {
    let messages;

    // console.log('Creating journal entry:', { type, data, metadata });

   if (type === 'audio') {
    messages = [{
      role: 'user',
      content :   metadata.caption || '',
    }];
    metadata = {
      ...metadata,
      type: 'audio',
      audio_url: data
    }

    } else if (type === 'image') {
      console.log('Uploading image to Supabase:', data);
      messages = [{
        role: 'user',
        content: metadata.caption || '',
      }];
      metadata = {
        ...metadata,
        type: 'image',
        image_url: data}
 
    } else if (type === 'stored-images') {
      console.log('Uploading stored images to Supabase:', data);
      messages = [{
        role: 'user',
        content: metadata.caption || '',
      }];
      metadata = {
        ...metadata,
        type: 'stored-images',
        images: data
      };
    } else if (type === 'text' && typeof data === 'string') {
      messages = [{
        role: 'user',
        content: data
      }];   
    }
    else {
      messages = [{
        role: 'user',
        content: JSON.stringify({
          type,
          data,
          metadata
        })
      }];
    }
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'dummy-user';
    
    const result = await client.add(messages, { 
      user_id: userId,
      metadata: { 
        type,
        ...metadata 
      }
    });
    

    const entry = {
      id: result.id,
      type,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(type === 'text' && { 
        title: metadata.title,
        content: typeof data === 'string' ? data : ''
      }),
      ...(type === 'image' && {
        imageUri: typeof data === 'string' ? data : '',
        caption: metadata.caption
      }),
      ...(type === 'stored-images' && {
        images: typeof data === 'string' ? JSON.parse(data) : {},
        caption: metadata.caption
      }),
      ...(type === 'audio' && {
        audioUri: typeof data === 'string' ? data : '',
        duration: metadata.duration || 0,
        transcript: metadata.transcript
      })
    };

    return entry as JournalEntryUnion;
  } catch (error) {
    console.error('Failed to create entry:', error);
    throw error;
  }
};

export interface SearchFilters {
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

export const searchJournalEntries = async (filters: SearchFilters): Promise<JournalEntryUnion[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'dummy-user';
    
    console.log('Search filters:', filters);
    
    // Additional free text query
    const query = filters.query || "";
    
    // Build filters for v2 search
    const searchOptions: any = {
      version: "v2",
      user_id: userId, // Direct parameter instead of in filters
      page: filters.page || 1,
      page_size: filters.pageSize || 10
    };
    
    // Optional advanced filters
    const advancedFilters: any = { AND: [] };
    let hasAdvancedFilters = false;
    
    // Apply type filters
    if (filters.types && filters.types.length > 0) {
      advancedFilters.AND.push({
        "metadata": {
          "type": {
            "in": filters.types
          }
        }
      });
      hasAdvancedFilters = true;
    }
    
    // Apply tag filters
    if (filters.tags && filters.tags.length > 0) {
      advancedFilters.AND.push({
        "metadata": {
          "tags": {
            "contains": filters.tags
          }
        }
      });
      hasAdvancedFilters = true;
    }
    
    // Apply location filter
    if (filters.location) {
      advancedFilters.AND.push({
        "metadata": {
          "location": filters.location
        }
      });
      hasAdvancedFilters = true;
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      advancedFilters.AND.push({
        "created_at": {
          "gte": filters.dateRange.from.toISOString().split('T')[0],
          "lte": filters.dateRange.to.toISOString().split('T')[0]
        }
      });
      hasAdvancedFilters = true;
    }
    
    // Only add filters if we have advanced filters
    if (hasAdvancedFilters) {
      searchOptions.filters = advancedFilters;
    }
    
    console.log('Search query:', query);
    console.log('Search options:', searchOptions);
    
    // Use v2 search with options
    const results = await client.search(query, searchOptions);

    return results
      .map(result => {
        const { metadata, memory } = result;
        
        return {
          id: result.id,
          type: metadata?.type || 'unknown',
          metadata,
          createdAt: result.created_at ? new Date(result.created_at).toISOString() : null,
          updatedAt: result.updated_at ? new Date(result.updated_at).toISOString() : null,
          score: result.score,
          ...(metadata?.type === 'text' && {
            title: metadata.title,
            content: memory
          }),
          ...(metadata?.type === 'image' && {
            imageUri: memory,
            caption: metadata.caption
          }),
          ...(metadata?.type === 'audio' && {
            audioUri: memory,
            duration: metadata.duration,
            transcript: metadata.transcript,
          })
        } as JournalEntryUnion;
      })
      .filter(result => result !== null);
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
};

export const searchJournalCalendarEntries = async (
  date: string,
  userId: string
): Promise<JournalEntryUnion[]> => {
  try {
    // Format the date to match the format in the database
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    // For exact date match, we need the same date for both gte and lte
    const searchOptions = {
      version: "v2",
      user_id: userId,
      filters: {
        "AND": [
          {
            "created_at": {
              "gte": formattedDate,
              "lte": formattedDate
            }
          }
        ]
      }
    };
    
    console.log('Calendar search options:', searchOptions);
    
    // Use getAll method instead of search to get all matching entries
    const results = await client.getAll(searchOptions);
    
    console.log('Calendar search results:', results);
    
    return results
      .map(result => {
        const { metadata, memory } = result;
        
        return {
          id: result.id,
          type: metadata?.type || 'unknown',
          metadata,
          createdAt: result.created_at ? new Date(result.created_at).toISOString() : null,
          updatedAt: result.updated_at ? new Date(result.updated_at).toISOString() : null,
          score: result.score,
          ...(metadata?.type === 'text' && {
            title: metadata.title,
            content: memory
          }),
          ...(metadata?.type === 'image' && {
            imageUri: memory,
            caption: metadata.caption
          }),
          ...(metadata?.type === 'audio' && {
            audioUri: memory,
            duration: metadata.duration,
            transcript: metadata.transcript,
          })
        } as JournalEntryUnion;
      })
      .filter(result => result !== null);
  } catch (error) {
    console.error('Calendar search failed:', error);
    throw error;
  }
};

export const getJournalEntry = async (id: string): Promise<JournalEntryUnion | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'dummy-user';
    
    const result = await client.get(id);
    if (!result) return null;

    const { metadata, memory } = result;

    return {
      id: result.id,
      type: metadata?.type || 'unknown', // Default to 'unknown' if metadata or type is null
      metadata,
      createdAt: result.created_at ? new Date(result.created_at).toISOString() : null,
      updatedAt: result.updated_at ? new Date(result.updated_at).toISOString() : null,
      ...(metadata?.type === 'text' && {
        title: metadata.title,
        content: memory
      }),
      ...(metadata?.type === 'image' && {
        imageUri: memory,
        caption: metadata.caption
      }),
      ...(metadata?.type === 'audio' && {
        audioUri: memory,
        duration: metadata.duration,
        transcript: metadata.transcript
      })
    } as JournalEntryUnion;
  } catch (error) {
    console.error('Failed to get entry:', error);
    throw error;
  }
};

export const getAllJournalEntries = async (
  userId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<JournalEntryUnion[]> => {
  try {
    const response = await client.getAll({
      user_id: userId,
      page,
      page_size: pageSize,
    });

    // response.results is the array of memories
    return response.results.map((result: any) => {
      const { metadata, memory } = result;
      return {
        id: result.id,
        type: metadata?.type || 'unknown',
        metadata,
        createdAt: result.created_at ? new Date(result.created_at).toISOString() : null,
        updatedAt: result.updated_at ? new Date(result.updated_at).toISOString() : null,
        ...(metadata?.type === 'text' && {
          title: metadata.title,
          content: memory
        }),
        ...(metadata?.type === 'image' && {
          imageUri: memory,
          caption: metadata.caption
        }),
        ...(metadata?.type === 'audio' && {
          audioUri: memory,
          duration: metadata.duration,
          transcript: metadata.transcript
        })
      } as JournalEntryUnion;
    });
  } catch (error) {
    console.error('Failed to get all entries:', error);
    throw error;
  }
};

export const addEntry = async (messages: any[], metadata: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'dummy-user';
    
    const result = await client.add(messages, { 
      user_id: userId,
      metadata: { 
        type,
        ...metadata 
      }
    });
    return result;
  } catch (error) {
    console.error('Error adding entry:', error);
    throw error;
  }
};

export const getAllEntries = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'dummy-user';
    
    const results = await client.getAll({ 
      user_id: userId
    });
    return results;
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
};

export const deleteJournalEntry = async (id: string): Promise<void> => {
  try {
    await client.delete(id);
  } catch (error) {
    console.error('Failed to delete entry:', error);
    throw error;
  }
};