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
import { Project, ProjectImage, UploadLink, AppUser, MarketingAsset, MarketingCategory, ProjectSubFolder, SubFolderType } from "@/types";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

// ── Users ─────────────────────────────────────────────────

export async function getUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return { uid: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() || new Date() } as AppUser;
  });
}

// ── Projects ─────────────────────────────────────────────

export async function createProject(data: {
  projectNumber?: string;
  name: string;
  location?: string;
  description?: string;
  userId: string;
  userName: string;
  projectLeaderId?: string;
  projectLeaderName?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, "projects"), {
    projectNumber: data.projectNumber || null,
    name: data.name,
    location: data.location || null,
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

export async function getProjects(): Promise<Project[]> {
  const q = query(
    collection(db, "projects"),
    where("active", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    } as Project;
  });
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

export async function updateProject(id: string, data: {
  name?: string; projectNumber?: string | null; location?: string | null; description?: string | null;
  projectLeaderId?: string | null; projectLeaderName?: string | null;
}): Promise<void> {
  // Firestore akzeptiert kein `undefined` — wir filtern es raus. null bleibt erhalten (löscht das Feld).
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  await updateDoc(doc(db, "projects", id), clean);
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
  subFolderId?: string;
  sectionType?: string;
}

export async function uploadImage(opts: UploadOptions): Promise<ProjectImage> {
  const { projectId, file, userId, userName, isExternal, externalName, onProgress, subFolderId, sectionType } = opts;

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
    subFolderId: subFolderId || null,
    sectionType: sectionType || null,
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
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return { id: d.id, ...data, uploadedAt: (data.uploadedAt as Timestamp)?.toDate() || new Date() } as ProjectImage;
  });
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
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return { id: d.id, ...data, uploadedAt: (data.uploadedAt as Timestamp)?.toDate() || new Date() } as ProjectImage;
  });
}

export async function toggleFavorite(imageId: string, current: boolean): Promise<void> {
  await updateDoc(doc(db, "images", imageId), { isFavorite: !current });
}

export async function updateImageComment(imageId: string, comment: string): Promise<void> {
  await updateDoc(doc(db, "images", imageId), { comment: comment || null });
}

export async function moveImage(
  imageId: string,
  subFolderId: string | null,
  sectionType: SubFolderType | null
): Promise<void> {
  await updateDoc(doc(db, "images", imageId), {
    subFolderId: subFolderId || null,
    sectionType: sectionType || null,
  });
}

export async function setCoverImage(projectId: string, imageUrl: string): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), { coverImageUrl: imageUrl });
}

// ── Sub-Folders ────────────────────────────────────────────

export async function getProjectSubFolders(projectId: string): Promise<ProjectSubFolder[]> {
  const q = query(
    collection(db, "projectSubFolders"),
    where("projectId", "==", projectId)
  );
  const snap = await getDocs(q);
  const folders = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() || new Date() } as ProjectSubFolder;
  });
  // Sort client-side: Produktion before Montage, then by order
  return folders.sort((a, b) => {
    if (a.type !== b.type) return a.type === "Produktion" ? -1 : 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

export async function createProjectSubFolder(projectId: string, type: SubFolderType, name: string): Promise<string> {
  const docRef = await addDoc(collection(db, "projectSubFolders"), {
    projectId,
    type,
    name,
    createdAt: serverTimestamp(),
    order: Date.now(),
  });
  return docRef.id;
}

export async function renameProjectSubFolder(id: string, name: string): Promise<void> {
  await updateDoc(doc(db, "projectSubFolders", id), { name });
}

export async function deleteProjectSubFolder(id: string): Promise<void> {
  await deleteDoc(doc(db, "projectSubFolders", id));
}

export async function getImagesBySubFolder(projectId: string, subFolderId: string): Promise<ProjectImage[]> {
  const q = query(
    collection(db, "images"),
    where("projectId", "==", projectId),
    where("subFolderId", "==", subFolderId),
    orderBy("uploadedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return { id: d.id, ...data, uploadedAt: (data.uploadedAt as Timestamp)?.toDate() || new Date() } as ProjectImage;
  });
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
  const data = d.data() as Record<string, unknown>;
  return { ...data, createdAt: (data.createdAt as Timestamp)?.toDate() || new Date() } as UploadLink;
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
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return { ...data, createdAt: (data.createdAt as Timestamp)?.toDate() || new Date() } as UploadLink;
  });
}

// ── Marketing Categories ──────────────────────────────────

export async function getMarketingCategories(): Promise<MarketingCategory[]> {
  const q = query(collection(db, "marketingCategories"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return { id: d.id, ...data, createdAt: (data.createdAt as Timestamp)?.toDate() || new Date() } as MarketingCategory;
  });
}

export async function createMarketingCategory(name: string, userId: string): Promise<string> {
  const existing = await getMarketingCategories();
  const order = existing.length;
  const docRef = await addDoc(collection(db, "marketingCategories"), {
    name,
    createdBy: userId,
    createdAt: serverTimestamp(),
    order,
  });
  return docRef.id;
}

export async function deleteMarketingCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, "marketingCategories", categoryId));
}

// ── Marketing Assets ──────────────────────────────────────

export async function uploadMarketingAsset(opts: {
  file: File;
  title: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  userName: string;
  onProgress?: (pct: number) => void;
}): Promise<void> {
  const { file, title, description, categoryId, categoryName, userId, userName, onProgress } = opts;
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
    categoryId,
    categoryName,
    uploadedBy: userId,
    uploadedByName: userName,
    uploadedAt: serverTimestamp(),
    active: true,
  });
}

export async function getMarketingAssets(categoryId?: string): Promise<MarketingAsset[]> {
  let q;
  if (categoryId) {
    q = query(
      collection(db, "marketingAssets"),
      where("active", "==", true),
      where("categoryId", "==", categoryId),
      orderBy("uploadedAt", "desc")
    );
  } else {
    q = query(
      collection(db, "marketingAssets"),
      where("active", "==", true),
      orderBy("uploadedAt", "desc")
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return { id: d.id, ...data, uploadedAt: (data.uploadedAt as Timestamp)?.toDate() || new Date() } as MarketingAsset;
  });
}

export async function deleteMarketingAsset(asset: MarketingAsset): Promise<void> {
  const storageRef = ref(storage, asset.storagePath);
  try { await deleteObject(storageRef); } catch {}
  await updateDoc(doc(db, "marketingAssets", asset.id), { active: false });
}

export async function updateMarketingAsset(id: string, data: {
  title?: string; description?: string | null;
  categoryId?: string; categoryName?: string;
}): Promise<void> {
  // Firestore akzeptiert kein `undefined` — wir filtern es raus.
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  await updateDoc(doc(db, "marketingAssets", id), clean);
}
