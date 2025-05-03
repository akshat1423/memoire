import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};


// export const base64ToAudioBlob = (base64: string): Blob => {
//   const parts = base64.split(';base64,');
//   const contentType = parts[0].split(':')[1]; // e.g., 'audio/mpeg' or 'audio/wav'
//   const byteCharacters = atob(parts[1]);
//   const byteArrays = [];

//   for (let i = 0; i < byteCharacters.length; i += 512) {
//     const slice = byteCharacters.slice(i, i + 512);
//     const byteNumbers = new Array(slice.length).fill(0).map((_, j) => slice.charCodeAt(j));
//     byteArrays.push(new Uint8Array(byteNumbers));
//   }

//   return new Blob(byteArrays, { type: contentType });
// };

// export const uploadAudioToSupabase = async (
//   audio: string | File | Blob,
//   userId: string
// ): Promise<string> => {
//   const supabase = createClient(
//     process.env.EXPO_PUBLIC_SUPABASE_URL!,
//     process.env.EXPO_PUBLIC_SUPABASE_STORAGE_API_KEY!
//   );

//   let blobToUpload: Blob;

//   if (typeof audio === 'string' && audio.startsWith('data:audio')) {
//     blobToUpload = base64ToAudioBlob(audio);
//   } else if (audio instanceof Blob || audio instanceof File) {
//     blobToUpload = audio;
//   } else {
//     throw new Error('Invalid audio format. Must be base64, Blob, or File.');
//   }

//   const extension = blobToUpload.type.split('/')[1]; // e.g., 'mp3', 'wav'
//   const fileName = `${userId}/audio-${Date.now()}.${extension}`;

//   const { error } = await supabase.storage
//     .from('memoireapp')
//     .upload(fileName, blobToUpload, {
//       contentType: blobToUpload.type,
//       upsert: true,
//     });

//   if (error) {
//     throw error;
//   }

//   const { data: publicUrlData } = supabase.storage
//     .from('memoireapp')
//     .getPublicUrl(fileName);

//   if (!publicUrlData?.publicUrl) {
//     throw new Error('Failed to get audio public URL.');
//   }

//   return publicUrlData.publicUrl;
// };


export const uploadImageViaEdgeFunction = async (
  base64Image: string,
  userId: string
): Promise<string> => {
  if (!base64Image.startsWith('data:image')) {
    throw new Error('Expected base64 image string starting with data:image');
  }

  const base64Clean = base64Image.split(',')[1]; // Remove the data:image/jpeg;base64, part
  const fileName = `image-${Date.now()}.jpg`;

  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/upload-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      base64: base64Clean,
      fileName,
      userId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Upload failed:', error);
    throw new Error(error?.error || 'Image upload failed');
  }

  const result = await response.json();
  return result.publicUrl;
};


export const uploadAudioViaEdgeFunction = async (
  base64Audio: string,
  userId: string
): Promise<string> => {
  if (!base64Audio.startsWith('data:audio')) {
    throw new Error('Expected base64 audio string starting with data:audio');
  }

  // Extract MIME type and base64 data
  const [meta, base64Data] = base64Audio.split(';base64,');
  const contentType = meta.split(':')[1]; // e.g., 'audio/webm' or 'audio/mpeg'
  const extension = contentType.split('/')[1] || 'mp3'; // default fallback

  const fileName = `audio-${Date.now()}.${extension}`;

  // console.log('Uploading audio to Supabase Edge Function:', {
  //   base64Data,
  //   fileName,
  //   userId,
  //   contentType
  // });

  const payload = {
    base64: base64Data,
    fileName,
    userId,
    contentType
  };

  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/upload-audio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Audio upload failed: ${err}`);
  }

  const result = await response.json();
  console.log('Audio upload result:', result);
  return result.publicUrl;
};

// export const uploadImageToSupabase = async (
//   input: string, // base64 or file:// URI
//   userId: string = 'default-user'
// ): Promise<string> => {
//   let blobToUpload: Blob;
//   const supabase = createClient(
//     process.env.EXPO_PUBLIC_SUPABASE_URL!,
//     process.env.EXPO_PUBLIC_SUPABASE_STORAGE_API_KEY!
//   );

//   if (input.startsWith('data:image')) {
//     // Base64 string
//     console.log('Blob: using data and image ', input);

//     blobToUpload = base64ToBlob(input);
//     console.log('Blob: using data and image ', blobToUpload);
//   } else if (input.startsWith('file://')) {
//     // Local file URI
//     const response = await fetch(input);
//     console.log('Response:', response);
//     console.log('input:', input);
//     blobToUpload = await response.blob();
//     console.log('Blob:', blobToUpload);
//   } else {
//     throw new Error('Invalid input: Must be base64 or file URI.');
//   }

//   const fileExt = blobToUpload.type.split('/')[1] || 'jpg';
//   const fileName = `${userId}/image-${Date.now()}.${fileExt}`;

//   const { error } = await supabase.storage
//     .from('memoireapp')
//     .upload(fileName, blobToUpload, {
//       contentType: blobToUpload.type,
//       upsert: true,
//     });

//   if (error) throw error;

//   const { data: publicUrlData } = supabase.storage
//     .from('memoireapp')
//     .getPublicUrl(fileName);

//   if (!publicUrlData?.publicUrl) throw new Error('Failed to get public URL.');

//   return publicUrlData.publicUrl;
// };

