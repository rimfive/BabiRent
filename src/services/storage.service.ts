import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export const uploaderImage = async (uri: string, chemin: string): Promise<string> => {
  const storageRef = ref(storage, chemin);

  // Sur web, expo-image-picker renvoie une URL blob: ou data:
  if (uri.startsWith('data:')) {
    // URI base64 → upload direct comme string
    const base64 = uri.split(',')[1];
    const contentType = uri.split(';')[0].split(':')[1] ?? 'image/jpeg';
    await uploadString(storageRef, base64, 'base64', { contentType });
  } else {
    // URI blob: ou file: → fetch puis blob
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Impossible de lire l'image (status ${response.status})`);
    }
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Image vide — réessaie de sélectionner la photo');
    }
    await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
  }

  const url = await getDownloadURL(storageRef);
  return url;
};

export const uploaderPhotos = async (
  uris: string[],
  dossier: string,
  proprietaireId: string,
): Promise<string[]> => {
  const timestamp = Date.now();
  const urls: string[] = [];

  for (let i = 0; i < uris.length; i++) {
    const url = await uploaderImage(
      uris[i],
      `${dossier}/${proprietaireId}/${timestamp}_${i}`,
    );
    urls.push(url);
  }

  return urls;
};
