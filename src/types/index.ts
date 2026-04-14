export type UserRole = "admin" | "projektleiter" | "employee" | "marketing";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

export interface Project {
  id: string;
  projectNumber?: string;
  name: string;
  location?: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  coverImageUrl?: string;
  imageCount: number;
  active: boolean;
  projectLeaderId?: string;
  projectLeaderName?: string;
}

export interface ProjectImage {
  id: string;
  projectId: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  isFavorite: boolean;
  fileName: string;
  fileSize?: number;
  isExternal?: boolean;
  externalUploaderName?: string;
  comment?: string;
  subFolderId?: string;
  sectionType?: SubFolderType;
}

export type SubFolderType = "Produktion" | "Montage";

export interface ProjectSubFolder {
  id: string;
  projectId: string;
  type: SubFolderType;
  name: string;
  createdAt: Date;
  order: number;
}

export interface UploadLink {
  token: string;
  projectId: string;
  projectName: string;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  uploadCount: number;
}

export interface MarketingCategory {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  order: number;
}

export interface MarketingAsset {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize?: number;
  storagePath: string;
  categoryId: string;
  categoryName: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  active: boolean;
}
