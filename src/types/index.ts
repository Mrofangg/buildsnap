export type UserRole = "admin" | "employee" | "marketing";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  phase?: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  coverImageUrl?: string;
  imageCount: number;
  active: boolean;
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

export const PROJECT_PHASES = [
  "Planung",
  "Erdarbeiten",
  "Rohbau",
  "Dach",
  "Fassade",
  "Ausbau",
  "Elektrik & Sanitär",
  "Innenausbau",
  "Fertigstellung",
  "Übergabe",
] as const;

export type ProjectPhase = (typeof PROJECT_PHASES)[number];
