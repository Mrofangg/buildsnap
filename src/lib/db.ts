import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  type Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";
import { Project, ProjectImage, UploadLink, AppUser } from "@/types";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

// ── Users ─────────────────────────────────────────────────

export async function getUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate() || new Date(),
  })) as AppUser[];
}

// ── Projects ─────────────────────────────────────────────

export async function createProject(data: {
  name: string;
  phase?: string;
  description?: string;
  userId: string;
  userName: string;
  projectLeaderId?: string;
  projectLeaderName?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, "projects"), {
    name: data.name,
    phase: data.phase || null,
    description: data.description || null,
    createdBy: data.userId,
    createdByName: data.userName,
    createdAt: serverTimestamp(),
    coverImageUrl: null,
    imageCount: 0,
    active: true,
    projectLeaderId: data.projectLeaderId || null,
    projectLeaderName: data.projectLeaderName || null,
  });
  return docRef.id;
}

export async function getProjects(options?: {
  userId?: string;
  role?: string;
}): Promise<Project[]> {
  let q;
  // Employees only see projects where they are the leader
  if (options?.role === "employee" && options?.userId) {
    q = query(
      collection(db, "projects"),
      where("active", "==", true),
      where("projectLeaderId", "==", options.userId),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(
      collection(db, "projects"),
      where("active", "==", true),
      orderBy("createdAt", "desc")
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate() || new Date(),
  })) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, "projects", id));
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    ...snap.data(),
    createdAt: (snap.data().createdAt as Timestamp)?.toDate() || new Date(),
  } as Project;
}

export async function deleteProject(id: string): Promise<void> {
  await updateDoc(doc(db, "projects", id), { active: false });
}

// ── Images ────────────────────────────────────────────────

export interface UploadOptions {
  projectId: string;
  file: File;
  userId?: string;
  userName?: string;
  isExternal?: boolean;
  externalName?: string;
  onProgress?: (pct: number) => void;
}

export async function uploadImage(opts: UploadOptions): Promise<ProjectImage> {
  const { projectId, file, userId, userName, isExternal, externalName, onProgress } = opts;

  let uploadFile = file;
  if (file.type.startsWith("image/")) {
    try {
      uploadFile = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      });
    } catch {
      uploadFile = file;
    }
  }

  const fileId = uuidv4();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `projects/${projectId}/${fileId}.${ext}`;
  const storageRef = ref(storage, path);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, uploadFile);
    task.on("state_changed", (snap) => {
      onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100);
    }, reject, () => resolve());
  });

  const url = await getDownloadURL(storageRef);

  const imageData = {
    projectId,
    url,
    uploadedBy: userId || "external",
    uploadedByName: userName || externalName || "Extern",
    uploadedAt: serverTimestamp(),
    isFavorite: false,
    fileName: file.name,
    fileSize: file.size,
    isExternal: isExternal || false,
    externalUploaderName: externalName || null,
    storagePath: path,
  };

  const docRef = await addDoc(collection(db, "images"), imageData);

  // Only set cover if not already set
  const projectSnap = await getDoc(doc(db, "projects", projectId));
  const updates: any = { imageCount: increment(1) };
  if (!projectSnap.data()?.coverImageUrl) {
    updates.coverImageUrl = url;
  }
  await updateDoc(doc(db, "projects", projectId), updates);

  return {
    id: docRef.id,
    ...imageData,
    uploadedAt: new Date(),
  } as unknown as ProjectImage;
}

export async function getProjectImages(projectId: string): Promise<ProjectImage[]> {
  const q = query(
    collection(db, "images"),
    where("projectId", "==", projectId),
    orderBy("uploadedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    uploadedAt: (d.data().uploadedAt as Timestamp)?.toDate() || new Date(),
  })) as ProjectImage[];
}

export async function getAllImages(filters?: {
  projectId?: string;
  favoritesOnly?: boolean;
}): Promise<ProjectImage[]> {
  let q = query(collection(db, "images"), orderBy("uploadedAt", "desc"));
  if (filters?.projectId) {
    q = query(collection(db, "images"), where("projectId", "==", filters.projectId), orderBy("uploadedAt", "desc"));
  }
  if (filters?.favoritesOnly) {
    q = query(collection(db, "images"), where("isFavorite", "==", true), orderBy("uploadedAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    uploadedAt: (d.data().uploadedAt as Timestamp)?.toDate() || new Date(),
  })) as ProjectImage[];
}

export async function toggleFavorite(imageId: string, current: boolean): Promise<void> {
  await updateDoc(doc(db, "images", imageId), { isFavorite: !current });
}

export async function setCoverImage(projectId: string, imageUrl: string): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), { coverImageUrl: imageUrl });
}

export async function deleteImage(image: ProjectImage): Promise<void> {
  const storageRef = ref(storage, (image as any).storagePath);
  try { await deleteObject(storageRef); } catch {}
  await deleteDoc(doc(db, "images", image.id));
  await updateDoc(doc(db, "projects", image.projectId), { imageCount: increment(-1) });
}

// ── Upload Links ──────────────────────────────────────────

export async function createUploadLink(projectId: string, projectName: string, userId: string): Promise<string> {
  const token = uuidv4().replace(/-/g, "");
  await addDoc(collection(db, "uploadLinks"), {
    token, projectId, projectName, active: true,
    createdBy: userId, createdAt: serverTimestamp(), uploadCount: 0,
  });
  return token;
}

export async function getUploadLinkByToken(token: string): Promise<UploadLink | null> {
  const q = query(collection(db, "uploadLinks"), where("token", "==", token), where("active", "==", true));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...d.data(), createdAt: (d.data().createdAt as Timestamp)?.toDate() || new Date() } as UploadLink;
}

export async function incrementLinkUploadCount(token: string): Promise<void> {
  const q = query(collection(db, "uploadLinks"), where("token", "==", token));
  const snap = await getDocs(q);
  if (!snap.empty) await updateDoc(snap.docs[0].ref, { uploadCount: increment(1) });
}

export async function deactivateUploadLink(token: string): Promise<void> {
  const q = query(collection(db, "uploadLinks"), where("token", "==", token));
  const snap = await getDocs(q);
  if (!snap.empty) await updateDoc(snap.docs[0].ref, { active: false });
}

export async function getProjectUploadLinks(projectId: string): Promise<UploadLink[]> {
  const q = query(collection(db, "uploadLinks"), where("projectId", "==", projectId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate() || new Date(),
  })) as UploadLink[];
}

// ── Marketing Assets ──────────────────────────────────────

export async function uploadMarketingAsset(opts: {
  file: File;
  title: string;
  description?: string;
  category: string;
  userId: string;
  userName: string;
  onProgress?: (pct: number) => void;
}): Promise<void> {
  const { file, title, description, category, userId, userName, onProgress } = opts;
  const fileId = uuidv4();
  const ext = file.name.split(".").pop() || "bin";
  const path = `marketing/${fileId}.${ext}`;
  const storageRef = ref(storage, path);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on("state_changed", (snap) => {
      onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100);
    }, reject, () => resolve());
  });

  const url = await getDownloadURL(storageRef);
  await addDoc(collection(db, "marketingAssets"), {
    title,
    description: description || null,
    fileUrl: url,
    fileType: file.type,
    fileName: file.name,
    fileSize: file.size,
    storagePath: path,
    category,
    uploadedBy: userId,
    uploadedByName: userName,
    uploadedAt: serverTimestamp(),
    active: true,
  });
}

export async function getMarketingAssets(): Promise<import("@/types").MarketingAsset[]> {
  const q = query(
    collection(db, "marketingAssets"),
    where("active", "==", true),
    orderBy("uploadedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    uploadedAt: (d.data().uploadedAt as Timestamp)?.toDate() || new Date(),
  })) as import("@/types").MarketingAsset[];
}

export async function deleteMarketingAsset(asset: import("@/types").MarketingAsset): Promise<void> {
  const storageRef = ref(storage, asset.storagePath);
  try { await deleteObject(storageRef); } catch {}
  await updateDoc(doc(db, "marketingAssets", asset.id), { active: false });
}
