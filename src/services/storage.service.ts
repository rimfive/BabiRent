import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// ── Upload une seule image vers Supabase Storage ──────────────────────────────
// bucket  : 'vehicules' | 'logements' | 'profiles'
// chemin  : ex. "proprietaireId/timestamp_0"
export const uploaderImage = async (
  uri: string,
  chemin: string,
  bucket: string,
): Promise<string> => {
  let blob: Blob;

  if (Platform.OS === 'web') {
    // Sur web, l'URI est soit une data URL soit un blob URL
    if (uri.startsWith('data:')) {
      const res = await fetch(uri);
      blob = await res.blob();
    } else {
      blob = await (await fetch(uri)).blob();
    }
  } else {
    // Sur mobile, l'URI est un chemin local (file://)
    blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response as Blob);
      xhr.onerror = () => reject(new Error('Erreur lecture image'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  }

  // Upload vers Supabase Storage
  const { error } = await supabase.storage
    .from(bucket)
    .upload(chemin, blob, {
      contentType: 'image/jpeg',
      upsert: true,        // remplace si le fichier existe déjà
    });

  if (error) throw new Error(`Upload échoué : ${error.message}`);

  // Récupérer l'URL publique
  const { data } = supabase.storage.from(bucket).getPublicUrl(chemin);
  return data.publicUrl;
};

// ── Upload plusieurs photos en séquence ──────────────────────────────────────
export const uploaderPhotos = async (
  uris: string[],
  dossier: string,           // 'vehicules' ou 'logements'
  proprietaireId: string,
): Promise<string[]> => {
  const timestamp = Date.now();
  const bucket = dossier;   // le nom du bucket correspond au dossier
  const urls: string[] = [];

  for (let i = 0; i < uris.length; i++) {
    const chemin = `${proprietaireId}/${timestamp}_${i}`;
    const url = await uploaderImage(uris[i], chemin, bucket);
    urls.push(url);
  }

  return urls;
};
