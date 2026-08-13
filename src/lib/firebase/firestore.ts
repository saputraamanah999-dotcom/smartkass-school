import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  addDoc,
} from 'firebase/firestore';
import { db } from './config';
import {
  Sekolah,
  Jurusan,
  Kelas,
  Siswa,
  Pembayaran,
  Pengeluaran,
  UserProfile,
  AuditLog,
  TampilanConfig,
  Role,
} from '../../types';

// ================= USER PROFILES =================

export async function createOrUpdateUser(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
}

export async function getUsersByRole(role: Role): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), where('role', '==', role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

export function subscribeUsersByRole(role: Role, callback: (users: UserProfile[]) => void): Unsubscribe {
  const q = query(collection(db, 'users'), where('role', '==', role));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));
  });
}

// ================= SEKOLAH, JURUSAN, KELAS =================

export function subscribeSekolahList(callback: (list: Sekolah[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'sekolah'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sekolah)));
  });
}

export async function addSekolah(data: Omit<Sekolah, 'id' | 'createdAt'>): Promise<string> {
  const newRef = doc(collection(db, 'sekolah'));
  const sekolahObj: Sekolah = {
    id: newRef.id,
    ...data,
    createdAt: new Date().toISOString(),
  };
  await setDoc(newRef, sekolahObj);
  return newRef.id;
}

export function subscribeJurusanList(sekolahId: string, callback: (list: Jurusan[]) => void): Unsubscribe {
  const ref = collection(db, `sekolah/${sekolahId}/jurusan`);
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Jurusan)));
  });
}

export async function addJurusan(sekolahId: string, nama: string): Promise<string> {
  const ref = doc(collection(db, `sekolah/${sekolahId}/jurusan`));
  const jurusanObj: Jurusan = {
    id: ref.id,
    sekolahId,
    nama,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, jurusanObj);
  return ref.id;
}

export function subscribeKelassList(
  sekolahId: string,
  jurusanId: string,
  callback: (list: Kelas[]) => void
): Unsubscribe {
  const ref = collection(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas`);
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Kelas)));
  });
}

export async function updateKelasData(
  sekolahId: string,
  jurusanId: string,
  kelasId: string,
  partialData: Partial<Kelas>
): Promise<void> {
  const ref = doc(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}`);
  await updateDoc(ref, partialData);
}

// ================= SISWA =================

export function subscribeSiswaList(
  sekolahId: string,
  jurusanId: string,
  kelasId: string,
  callback: (list: Siswa[]) => void
): Unsubscribe {
  const ref = collection(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`);
  const q = query(ref, orderBy('noAbsen', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Siswa)));
  });
}

export async function addSiswa(
  sekolahId: string,
  jurusanId: string,
  kelasId: string,
  siswaData: Omit<Siswa, 'id' | 'sekolahId' | 'jurusanId' | 'kelasId' | 'createdAt'>
): Promise<string> {
  const ref = doc(collection(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa`));
  const siswaObj: Siswa = {
    id: ref.id,
    sekolahId,
    jurusanId,
    kelasId,
    ...siswaData,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, siswaObj);
  return ref.id;
}

// ================= PEMBAYARAN KAS =================

export function subscribePembayaranList(
  sekolahId: string,
  jurusanId: string,
  kelasId: string,
  siswaId: string,
  callback: (list: Pembayaran[]) => void
): Unsubscribe {
  const ref = collection(
    db,
    `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/siswa/${siswaId}/pembayaran`
  );
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pembayaran)));
  });
}

// ================= PENGELUARAN KAS =================

export function subscribePengeluaranList(
  sekolahId: string,
  jurusanId: string,
  kelasId: string,
  callback: (list: Pengeluaran[]) => void
): Unsubscribe {
  const ref = collection(db, `sekolah/${sekolahId}/jurusan/${jurusanId}/kelas/${kelasId}/pengeluaran`);
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pengeluaran)));
  });
}

// ================= AUDIT LOGS =================

export async function logAuditActivity(
  uid: string,
  userNama: string,
  userRole: Role,
  aksi: string,
  detail?: string
): Promise<void> {
  const log: Omit<AuditLog, 'id'> = {
    uid,
    userNama,
    userRole,
    aksi,
    detail: detail || '',
    timestamp: new Date().toISOString(),
  };
  await addDoc(collection(db, 'audit_log'), log);
}
