/**
 * autoSetupCollections — Ensures ALL required Firestore collections exist
 * by creating a placeholder doc in each one. This runs once on admin dashboard load.
 *
 * Collections created:
 *   - config/tampilan
 *   - sekolah/{sid}
 *   - sekolah/{sid}/jurusan/{jid}
 *   - sekolah/{sid}/jurusan/{jid}/kelas/{kid}
 *   - sekolah/{sid}/jurusan/{jid}/kelas/{kid}/pengeluaran/_placeholder
 *   - sekolah/{sid}/jurusan/{jid}/kelas/{kid}/siswa/{sid2}/pembayaran/_placeholder
 *
 * The placeholder docs have id `_init` and can be safely deleted after setup.
 */
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './config';

const PLACEHOLDER = { _init: true, createdAt: new Date().toISOString() };

async function safeSet(path: string, data: Record<string, unknown>) {
  try {
    const ref = doc(db, path);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, data);
      console.log(`[AutoSetup] Created: ${path}`);
    }
  } catch (e) {
    console.warn(`[AutoSetup] Skipped ${path}:`, e);
  }
}

/**
 * Ensure a pengeluaran subcollection exists under a kelas.
 * Creates a _init placeholder doc if the collection is empty.
 */
async function ensurePengeluaranCollection(kelasPath: string) {
  try {
    const collRef = collection(db, `${kelasPath}/pengeluaran`);
    const snap = await getDocs(collRef);
    if (snap.empty) {
      await setDoc(doc(db, `${kelasPath}/pengeluaran`, '_init'), PLACEHOLDER);
      console.log(`[AutoSetup] Created pengeluaran collection under: ${kelasPath}`);
    }
  } catch (e) {
    console.warn(`[AutoSetup] Could not check pengeluaran under ${kelasPath}:`, e);
  }
}

/**
 * Ensure a pembayaran subcollection exists under a siswa.
 * Creates a _init placeholder doc if the collection is empty.
 */
async function ensurePembayaranCollection(siswaPath: string) {
  try {
    const collRef = collection(db, `${siswaPath}/pembayaran`);
    const snap = await getDocs(collRef);
    if (snap.empty) {
      await setDoc(doc(db, `${siswaPath}/pembayaran`, '_init'), PLACEHOLDER);
      console.log(`[AutoSetup] Created pembayaran collection under: ${siswaPath}`);
    }
  } catch (e) {
    console.warn(`[AutoSetup] Could not check pembayaran under ${siswaPath}:`, e);
  }
}

/**
 * Main setup function — call this from admin dashboard on mount.
 * It scans all sekolah > jurusan > kelas > siswa and creates
 * missing pengeluaran and pembayaran collections.
 */
export async function autoSetupCollections() {
  console.log('[AutoSetup] Starting collection setup...');

  try {
    // 1. Ensure config/tampilan exists
    await safeSet('config/tampilan', {
      _init: true,
      tema: 'dark',
      tagline: 'Kelola Uang Kas Sekolah Cerdas, Transparan & Realtime',
      updatedAt: new Date().toISOString(),
    });

    // 2. Scan all sekolah
    const sekolahSnap = await getDocs(collection(db, 'sekolah'));
    if (sekolahSnap.empty) {
      console.log('[AutoSetup] No sekolah found. Creating default...');
      await safeSet('sekolah/demo-sekolah', {
        id: 'demo-sekolah',
        nama: 'SMK Demo',
        alamat: 'Jl. Demo No. 1',
        createdAt: new Date().toISOString(),
      });
    }

    // 3. For each sekolah, scan jurusan > kelas > siswa
    const sekolahs = await getDocs(collection(db, 'sekolah'));
    for (const sekolah of sekolahs.docs) {
      const sid = sekolah.id;
      const sekolahPath = `sekolah/${sid}`;

      // Scan jurusan
      try {
        const jurusanSnap = await getDocs(collection(db, `${sekolahPath}/jurusan`));
        for (const jurusan of jurusanSnap.docs) {
          const jid = jurusan.id;
          const jurusanPath = `${sekolahPath}/jurusan/${jid}`;

          // Scan kelas
          try {
            const kelasSnap = await getDocs(collection(db, `${jurusanPath}/kelas`));
            for (const kelas of kelasSnap.docs) {
              const kid = kelas.id;
              const kelasPath = `${jurusanPath}/kelas/${kid}`;

              // Ensure pengeluaran collection exists
              await ensurePengeluaranCollection(kelasPath);

              // Scan siswa and ensure pembayaran collection exists
              try {
                const siswaSnap = await getDocs(collection(db, `${kelasPath}/siswa`));
                for (const siswa of siswaSnap.docs) {
                  const siswaPath = `${kelasPath}/siswa/${siswa.id}`;
                  await ensurePembayaranCollection(siswaPath);
                }
              } catch (e) {
                console.warn(`[AutoSetup] Could not scan siswa for ${kelasPath}:`, e);
              }
            }
          } catch (e) {
            console.warn(`[AutoSetup] Could not scan kelas for ${jurusanPath}:`, e);
          }
        }
      } catch (e) {
        console.warn(`[AutoSetup] Could not scan jurusan for ${sekolahPath}:`, e);
      }
    }

    console.log('[AutoSetup] Collection setup complete!');
  } catch (e) {
    console.warn('[AutoSetup] Setup failed (non-critical):', e);
  }
}

/**
 * Quick setup — creates pengeluaran + pembayaran placeholder for a SINGLE kelas.
 * Call this right after creating a new kelas.
 */
export async function setupKelasCollections(
  sekolahId: string,
  jurusanId: string,
  kelasId: string
) {
  const kelasPath = `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`;
  await ensurePengeluaranCollection(kelasPath);
  // pembayaran will be created when first siswa is added
  console.log(`[AutoSetup] Kelas ${kelasId} collections ready.`);
}
