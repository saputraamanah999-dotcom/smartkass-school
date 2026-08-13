import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { TampilanConfig } from '../types';
import { DEFAULT_TAMPILAN_CONFIG } from '../lib/firebase/seed';

export function useTampilanConfig() {
  const [config, setConfig] = useState<TampilanConfig>(DEFAULT_TAMPILAN_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = doc(db, 'config', 'tampilan');
    
    // Realtime listener for instant live update on all clients!
    const unsubscribe = onSnapshot(
      configRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setConfig(docSnap.data() as TampilanConfig);
        } else {
          setConfig(DEFAULT_TAMPILAN_CONFIG);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to tampilan config:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { config, loading };
}
