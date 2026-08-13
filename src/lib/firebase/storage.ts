import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload image or document to Firebase Storage
 * Returns download URL
 */
export async function uploadFile(file: File, folderPath: string): Promise<string> {
  try {
    const fileRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('Firebase storage upload failed, using Data URL fallback:', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}
