"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, Share2, Heart, Download, Trash2,
  Link2, CheckCircle, X, ImageIcon, MessageSquare,
  Folder, FolderOpen, Plus, ChevronDown, ChevronRight,
  Pencil, CheckSquare, Square
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button, Modal, Avatar } from "@/components/ui";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useToast } from "@/components/ui/toast";
import {
  getProject, getProjectImages, toggleFavorite,
  deleteImage, createUploadLink, getProjectUploadLinks,
  deactivateUploadLink, setCoverImage, updateImageComment,
  getProjectSubFolders, createProjectSubFolder, deleteProjectSubFolder,
  renameProjectSubFolder, updateProject, deleteProject, getUsers
} from "@/lib/db";
import { Project, ProjectImage, UploadLink, ProjectSubFolder, SubFolderType, AppUser } from "@/types";
import { formatDate } from "@/lib/utils";

// ── Lightbox ───────────────────────────────────────────────

function LightboxModal({ image, onClose, onPrev, onNext, hasPrev, hasNext, onCommentSaved }: {
  image: ProjectImage; onClose: () => void; onPrev: () => void;
  onNext: () => void; hasPrev: boolean; hasNext: boolean;
  onCommentSaved: (imageId: string, comment: string) => void;
}) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState(image.comment || "");
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    setComment(image.comment || "");
    setShowComment(false);
  }, [image.id]);

  const handleSaveComment = async () => {
    setSavingComment(true);
    try {
      await updateImageComment(image.id, comment);
      onCommentSaved(image.id, comment);
      setShowComment(false);
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Avatar name={image.uploadedByName} size="sm" />
          <div>
            <p className="text-white text-sm font-medium">{image.uploadedByName}</p>
            <p className="text-white/50 text-xs">{formatDate(image.uploadedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setComment(image.comment || ""); setShowComment(!showComment); }}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <MessageSquare className={`w-4 h-4 ${image.comment ? "text-brand-yellow" : "text-white"}`} />
          </button>
          <a href={image.url} target="_blank" download className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <Download className="w-4 h-4 text-white" />
          </a>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 min-h-0" onClick={(e) => e.stopPropagation()}>
        <img src={image.url} alt="" className="max-w-full max-h-full object-contain rounded-2xl" />
      </div>
      {image.comment && !showComment && (
        <div className="px-4 pb-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white/10 rounded-2xl px-4 py-3">
            <p className="text-white/60 text-xs font-semibold mb-1">Kommentar</p>
            <p className="text-white text-sm">{image.comment}</p>
          </div>
        </div>
      )}
      {showComment && (
        <div className="px-4 pb-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white/10 rounded-2xl p-3 flex flex-col gap-2">
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Kommentar..." rows={2} autoFocus
              className="w-full bg-transparent text-white text-sm placeholder-white/40 resize-none focus:outline-none" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowComment(false)} className="text-white/50 text-xs px-3 py-1.5 rounded-xl hover:bg-white/10">Abbrechen</button>
              <button onClick={handleSaveComment} disabled={savingComment}
                className="bg-brand-yellow text-brand-black text-xs font-bold px-3 py-1.5 rounded-xl">
                {savingComment ? "..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
      {(hasPrev || hasNext) && (
        <div className="flex justify-between px-4 py-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onPrev} disabled={!hasPrev} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={onNext} disabled={!hasNext} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30">
            <ArrowLeft className="w-5 h-5 text-white rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Image card (mini) ──────────────────────────────────────

function ImageThumb({ image, onClick, onFavorite, onDelete, onSetCover, canDelete, canSetCover, isCover,
  selectMode, selected, onToggleSelect }: {
  image: ProjectImage; onClick: () => void; onFavorite: () => void;
  onDelete: () => void; onSetCover: () => void;
  canDelete: boolean; canSetCover: boolean; isCover: boolean;
  selectMode?: boolean; selected?: boolean; onToggleSelect?: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-brand-gray-100 aspect-square group ${selectMode ? "cursor-pointer" : ""} ${selected ? "ring-2 ring-brand-yellow" : ""}`}
      onClick={selectMode ? onToggleSelect : undefined}
    >
      <img src={image.url} alt="" className={`w-full h-full object-cover ${selectMode ? "" : "cursor-pointer"}`}
        onClick={selectMode ? undefined : onClick} />
      {selectMode && (
        <div className="absolute top-2 left-2">
          {selected
            ? <CheckSquare className="w-5 h-5 text-brand-yellow drop-shadow" />
            : <Square className="w-5 h-5 text-white drop-shadow" />}
        </div>
      )}
      {!selectMode && isCover && (
        <div className="absolute top-2 left-2 bg-brand-yellow text-brand-black text-[9px] font-bold px-1.5 py-0.5 rounded-lg">Titelbild</div>
      )}
      {!selectMode && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${image.isFavorite ? "bg-red-500 text-white" : "bg-black/30 text-white/80"}`}>
            <Heart className="w-3.5 h-3.5" fill={image.isFavorite ? "white" : "none"} />
          </button>
          {image.comment && (
            <div className="absolute bottom-2 left-2">
              <MessageSquare className="w-3.5 h-3.5 text-brand-yellow" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canSetCover && !isCover && (
              <button onClick={(e) => { e.stopPropagation(); onSetCover(); }}
                className="w-6 h-6 rounded-full bg-brand-yellow/90 flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-brand-black" />
              </button>
            )}
            {canDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-folder element row ─────────────────────────────────

function ElementRow({ folder, images, onUpload, onDelete, onRename, onImageClick, onFavorite, onDeleteImage, onSetCover,
  canDeleteFolder, canSetCover, coverImageUrl, lightboxImages, getCanDeleteImage,
  selectMode, selectedIds, onToggleSelect }: {
  folder: ProjectSubFolder;
  images: ProjectImage[];
  onUpload: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  onImageClick: (img: ProjectImage, allImages: ProjectImage[]) => void;
  onFavorite: (img: ProjectImage) => void;
  onDeleteImage: (img: ProjectImage) => void;
  onSetCover: (img: ProjectImage) => void;
  canDeleteFolder: boolean;
  canSetCover: boolean;
  coverImageUrl?: string;
  lightboxImages: ProjectImage[];
  getCanDeleteImage: (img: ProjectImage) => boolean;
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (img: ProjectImage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const handleRenameSubmit = () => {
    if (editName.trim() && editName.trim() !== folder.name) {
      onRename(editName.trim());
    }
    setEditing(false);
  };

  return (
    <div className="border border-brand-gray-100 rounded-2xl overflow-hidden bg-white">
      <button onClick={() => !editing && setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-brand-gray-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {open ? <FolderOpen className="w-5 h-5 text-brand-yellow flex-shrink-0" /> : <Folder className="w-5 h-5 text-brand-gray-400 flex-shrink-0" />}
          {editing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameSubmit(); if (e.key === "Escape") { setEditName(folder.name); setEditing(false); } }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="flex-1 bg-brand-gray-50 text-brand-black text-sm font-semibold px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow min-w-0"
            />
          ) : (
            <span className="font-semibold text-brand-black text-sm truncate">{folder.name}</span>
          )}
          <span className="text-xs text-brand-gray-400 bg-brand-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">{images.length}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button onClick={(e) => { e.stopPropagation(); onUpload(); }}
            className="w-7 h-7 rounded-xl bg-brand-yellow flex items-center justify-center">
            <Upload className="w-3.5 h-3.5 text-brand-black" />
          </button>
          {canDeleteFolder && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setEditName(folder.name); setEditing(true); setOpen(true); }}
                className="w-7 h-7 rounded-xl bg-brand-gray-100 flex items-center justify-center">
                <Pencil className="w-3 h-3 text-brand-gray-500" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-7 h-7 rounded-xl bg-brand-gray-100 flex items-center justify-center">
                <Trash2 className="w-3 h-3 text-brand-gray-400" />
              </button>
            </>
          )}
          {open ? <ChevronDown className="w-4 h-4 text-brand-gray-400" /> : <ChevronRight className="w-4 h-4 text-brand-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3">
          {images.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <p className="text-xs text-brand-gray-300">Noch keine Fotos</p>
              <button onClick={onUpload} className="text-xs text-brand-yellow font-semibold">+ Fotos hochladen</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-1">
              {images.map((img) => (
                <ImageThumb key={img.id} image={img}
                  onClick={() => onImageClick(img, lightboxImages)}
                  onFavorite={() => onFavorite(img)}
                  onDelete={() => onDeleteImage(img)}
                  onSetCover={() => onSetCover(img)}
                  canDelete={getCanDeleteImage(img)} canSetCover={canSetCover}
                  isCover={coverImageUrl === img.url}
                  selectMode={selectMode} selected={selectedIds.has(img.id)} onToggleSelect={() => onToggleSelect(img)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [subFolders, setSubFolders] = useState<ProjectSubFolder[]>([]);
  const [links, setLinks] = useState<UploadLink[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<ProjectImage | null>(null);
  const [lightboxList, setLightboxList] = useState<ProjectImage[]>([]);
  const [creatingLink, setCreatingLink] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showAddElement, setShowAddElement] = useState<SubFolderType | null>(null);
  const [newElementName, setNewElementName] = useState("");
  const [uploadSelection, setUploadSelection] = useState<string>("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const isManagerRole = user?.role === "admin" || user?.role === "projektleiter";
      const [p, imgs, folders, lnks, usrs] = await Promise.all([
        getProject(projectId),
        getProjectImages(projectId).catch(() => []),
        getProjectSubFolders(projectId).catch(() => []),
        isManagerRole ? getProjectUploadLinks(projectId).catch(() => []) : Promise.resolve([]),
        isManagerRole ? getUsers().catch(() => []) : Promise.resolve([]),
      ]);
      setProject(p);
      setImages(imgs as ProjectImage[]);
      setSubFolders(folders as ProjectSubFolder[]);
      setLinks(lnks as UploadLink[]);
      setAllUsers(usrs as AppUser[]);
    } catch (e) {
      console.error(e);
      toast("Fehler beim Laden", "error");
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => { load(); }, [load]);

  const handleFavorite = async (img: ProjectImage) => {
    await toggleFavorite(img.id, img.isFavorite);
    setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, isFavorite: !i.isFavorite } : i));
  };

  const handleDelete = async (img: ProjectImage) => {
    if (!user) return;
    if (!isManager && img.uploadedBy !== user.uid) {
      toast("Du kannst nur deine eigenen Fotos löschen", "error");
      return;
    }
    if (!confirm("Foto wirklich löschen?")) return;
    await deleteImage(img);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    toast("Foto gelöscht", "info");
  };

  const handleSetCover = async (img: ProjectImage) => {
    if (!project) return;
    await setCoverImage(project.id, img.url);
    setProject((prev) => prev ? { ...prev, coverImageUrl: img.url } : prev);
    toast("Titelbild gesetzt!", "success");
  };

  const handleCommentSaved = (imageId: string, comment: string) => {
    setImages((prev) => prev.map((i) => i.id === imageId ? { ...i, comment } : i));
    if (lightboxImg?.id === imageId) setLightboxImg((prev) => prev ? { ...prev, comment } : prev);
  };

  const [savingElement, setSavingElement] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", projectNumber: "", location: "", projectLeaderId: "", projectLeaderName: "" });
  const [savingProject, setSavingProject] = useState(false);

  const handleAddElement = async (type: SubFolderType) => {
    if (!newElementName.trim() || !user) return;
    setSavingElement(true);
    try {
      const name = newElementName.trim();
      await createProjectSubFolder(projectId, type, name);
      setNewElementName("");
      setShowAddElement(null);
      await load();
      toast(`${name} erstellt`, "success");
    } catch (e) {
      console.error("Fehler beim Erstellen des Elements:", e);
      toast("Fehler beim Erstellen", "error");
    } finally {
      setSavingElement(false);
    }
  };

  const handleDeleteFolder = async (folder: ProjectSubFolder) => {
    if (!confirm(`"${folder.name}" wirklich löschen?`)) return;
    try {
      await deleteProjectSubFolder(folder.id);
      await load();
      toast("Ordner gelöscht", "info");
    } catch (e) {
      console.error(e);
      toast("Fehler beim Löschen", "error");
    }
  };

  const handleRenameFolder = async (folder: ProjectSubFolder, newName: string) => {
    try {
      await renameProjectSubFolder(folder.id, newName);
      setSubFolders((prev) => prev.map((f) => f.id === folder.id ? { ...f, name: newName } : f));
      toast("Ordner umbenannt", "success");
    } catch (e) {
      console.error(e);
      toast("Fehler beim Umbenennen", "error");
    }
  };

  const handleToggleSelect = (img: ProjectImage) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(img.id)) next.delete(img.id); else next.add(img.id);
      return next;
    });
  };

  const handleBulkDownload = async () => {
    const selected = images.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) return;
    setDownloading(true);
    try {
      for (const img of selected) {
        const response = await fetch(img.url);
        const blob = await response.blob();
        const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${img.id}.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
        await new Promise((r) => setTimeout(r, 300));
      }
      toast(`${selected.length} Fotos heruntergeladen`, "success");
      setSelectMode(false);
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      toast("Fehler beim Herunterladen", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenEditProject = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      projectNumber: project.projectNumber || "",
      location: project.location || "",
      projectLeaderId: project.projectLeaderId || "",
      projectLeaderName: project.projectLeaderName || "",
    });
    setShowEditProject(true);
  };

  const handleSaveProject = async () => {
    if (!project || !editForm.name.trim()) return;
    setSavingProject(true);
    try {
      await updateProject(project.id, {
        name: editForm.name.trim(),
        projectNumber: editForm.projectNumber.trim() || undefined,
        location: editForm.location.trim() || undefined,
        projectLeaderId: editForm.projectLeaderId || undefined,
        projectLeaderName: editForm.projectLeaderName || undefined,
      });
      setProject((prev) => prev ? { ...prev, ...editForm } : prev);
      setShowEditProject(false);
      toast("Projekt gespeichert", "success");
    } catch (e) {
      console.error(e);
      toast("Fehler beim Speichern", "error");
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!confirm(`Projekt "${project.name}" wirklich löschen?`)) return;
    try {
      await deleteProject(project.id);
      toast("Projekt gelöscht", "info");
      router.replace("/projects");
    } catch (e) {
      console.error(e);
      toast("Fehler beim Löschen", "error");
    }
  };

  const handleCreateLink = async () => {
    if (!user || !project) return;
    setCreatingLink(true);
    try {
      await createUploadLink(project.id, project.name, user.uid);
      toast("Upload-Link erstellt!", "success");
      load();
    } catch { toast("Fehler beim Erstellen des Links", "error"); }
    finally { setCreatingLink(false); }
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/upload/${projectId}/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
    toast("Link kopiert!", "success");
  };

  const handleDeactivateLink = async (token: string) => {
    await deactivateUploadLink(token);
    toast("Link deaktiviert", "info");
    load();
  };

  const openLightbox = (img: ProjectImage, list: ProjectImage[]) => {
    setLightboxImg(img);
    setLightboxList(list);
  };

  const lightboxIndex = lightboxImg ? lightboxList.findIndex((i) => i.id === lightboxImg.id) : -1;

  const isManager = user?.role === "admin" || user?.role === "projektleiter";
  const canUpload = !!user;
  const canShare = isManager;
  const canDeleteFolder = isManager;
  const canSetCover = isManager;
  const canCreateElement = !!user;

  const produktionFolders = subFolders.filter((f) => f.type === "Produktion");
  const montageFolders = subFolders.filter((f) => f.type === "Montage");
  const unassignedImages = images.filter((i) => !i.subFolderId && !i.sectionType);
  const produktionImages = images.filter((i) => i.sectionType === "Produktion" && !i.subFolderId);
  const montageImages = images.filter((i) => i.sectionType === "Montage" && !i.subFolderId);
  const getImagesForFolder = (folderId: string) => images.filter((i) => i.subFolderId === folderId);
  const getCanDeleteImage = (img: ProjectImage) => isManager || img.uploadedBy === user?.uid;

  // Parse upload selection: "" = Allgemein, "Produktion"/"Montage" = section, else = folderId
  const isSectionSelection = uploadSelection === "Produktion" || uploadSelection === "Montage";
  const uploadSubFolderIdFinal = !isSectionSelection && uploadSelection ? uploadSelection : undefined;
  const uploadSectionTypeFinal = isSectionSelection ? uploadSelection as SubFolderType :
    uploadSelection ? subFolders.find(f => f.id === uploadSelection)?.type : undefined;

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 py-5 flex flex-col gap-4">
          <div className="h-6 w-2/3 skeleton rounded-lg" />
          <div className="h-48 skeleton rounded-3xl" />
          {[1, 2].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4 px-4">
          <p className="text-brand-gray-400">Projekt nicht gefunden</p>
          <Button variant="ghost" onClick={() => router.back()}>Zurück</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {lightboxImg && (
        <LightboxModal
          image={lightboxImg}
          onClose={() => setLightboxImg(null)}
          onPrev={() => lightboxIndex > 0 && setLightboxImg(lightboxList[lightboxIndex - 1])}
          onNext={() => lightboxIndex < lightboxList.length - 1 && setLightboxImg(lightboxList[lightboxIndex + 1])}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < lightboxList.length - 1}
          onCommentSaved={handleCommentSaved}
        />
      )}

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-brand-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ArrowLeft className="w-4 h-4 text-brand-black" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-brand-black leading-tight">{project.name}</h1>
            <p className="text-sm text-brand-gray-400 mt-0.5">
              {project.projectNumber && `#${project.projectNumber}`}
              {project.projectNumber && project.location && " · "}
              {project.location}
            </p>
          </div>
          {isManager && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={handleOpenEditProject}
                className="w-9 h-9 rounded-xl bg-brand-gray-100 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-brand-gray-500" />
              </button>
              <button onClick={handleDeleteProject}
                className="w-9 h-9 rounded-xl bg-brand-gray-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}
        </div>

        {/* Cover */}
        {project.coverImageUrl && (
          <div className="relative rounded-3xl overflow-hidden aspect-video shadow-card">
            <img src={project.coverImageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 left-3">
              <span className="bg-brand-yellow text-brand-black text-xs font-bold px-2 py-1 rounded-lg">Titelbild</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {canUpload && !selectMode && (
            <Button variant="primary" size="sm" className="flex-1" onClick={() => { setUploadSelection(""); setShowUpload(true); }}>
              <Upload className="w-4 h-4" />
              Fotos hochladen
            </Button>
          )}
          {!selectMode && (
            <Button variant="ghost" size="sm" onClick={() => { setSelectMode(true); setSelectedIds(new Set()); }}>
              <CheckSquare className="w-4 h-4" />
              Auswählen
            </Button>
          )}
          {selectMode && (
            <>
              <Button variant="ghost" size="sm" onClick={() => {
                if (selectedIds.size === images.length) setSelectedIds(new Set());
                else setSelectedIds(new Set(images.map((i) => i.id)));
              }}>
                {selectedIds.size === images.length ? "Alle abwählen" : "Alle wählen"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }}>
                <X className="w-4 h-4" /> Abbrechen
              </Button>
            </>
          )}
          {canShare && !selectMode && (
            <Button variant="ghost" size="sm" onClick={() => setShowShare(true)}>
              <Share2 className="w-4 h-4" />
              Teilen
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-card text-center">
            <p className="text-2xl font-black text-brand-black">{images.length}</p>
            <p className="text-xs text-brand-gray-400 font-medium">Fotos</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-card text-center">
            <p className="text-2xl font-black text-brand-black">{images.filter((i) => i.isFavorite).length}</p>
            <p className="text-xs text-brand-gray-400 font-medium">Favoriten</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-card text-center">
            <p className="text-2xl font-black text-brand-black">{subFolders.length}</p>
            <p className="text-xs text-brand-gray-400 font-medium">Ordner</p>
          </div>
        </div>

        {/* ── Produktion ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-brand-black text-base">Produktion</h2>
            <div className="flex items-center gap-3">
              {canUpload && (
                <button onClick={() => { setUploadSelection("Produktion"); setShowUpload(true); }}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-gray-500">
                  <Upload className="w-3.5 h-3.5" /> Fotos
                </button>
              )}
              {canCreateElement && (
                <button onClick={() => { setShowAddElement("Produktion"); setNewElementName(`Element ${produktionFolders.length + 1}`); }}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-yellow">
                  <Plus className="w-3.5 h-3.5" /> Element
                </button>
              )}
            </div>
          </div>
          {produktionImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {produktionImages.map((img) => (
                <ImageThumb key={img.id} image={img}
                  onClick={() => openLightbox(img, produktionImages)}
                  onFavorite={() => handleFavorite(img)}
                  onDelete={() => handleDelete(img)}
                  onSetCover={() => handleSetCover(img)}
                  canDelete={getCanDeleteImage(img)} canSetCover={canSetCover}
                  isCover={project.coverImageUrl === img.url}
                  selectMode={selectMode} selected={selectedIds.has(img.id)} onToggleSelect={() => handleToggleSelect(img)} />
              ))}
            </div>
          )}
          {produktionFolders.length === 0 && produktionImages.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-5 text-center shadow-card">
              <p className="text-xs text-brand-gray-300">Noch keine Elemente</p>
              {canCreateElement && <button onClick={() => { setShowAddElement("Produktion"); setNewElementName("Element 1"); }}
                className="text-xs text-brand-yellow font-semibold mt-1">+ Element hinzufügen</button>}
            </div>
          ) : (
            produktionFolders.map((folder) => (
              <ElementRow key={folder.id} folder={folder}
                images={getImagesForFolder(folder.id)}
                lightboxImages={images.filter((i) => i.subFolderId === folder.id)}
                onUpload={() => { setUploadSelection(folder.id); setShowUpload(true); }}
                onDelete={() => handleDeleteFolder(folder)}
                onRename={(name) => handleRenameFolder(folder, name)}
                onImageClick={openLightbox}
                onFavorite={handleFavorite}
                onDeleteImage={handleDelete}
                onSetCover={handleSetCover}
                canDeleteFolder={canDeleteFolder} canSetCover={canSetCover} getCanDeleteImage={getCanDeleteImage}
                coverImageUrl={project.coverImageUrl}
                selectMode={selectMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} />
            ))
          )}
        </div>

        {/* ── Montage ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-brand-black text-base">Montage</h2>
            <div className="flex items-center gap-3">
              {canUpload && (
                <button onClick={() => { setUploadSelection("Montage"); setShowUpload(true); }}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-gray-500">
                  <Upload className="w-3.5 h-3.5" /> Fotos
                </button>
              )}
              {canCreateElement && (
                <button onClick={() => { setShowAddElement("Montage"); setNewElementName(`Element ${montageFolders.length + 1}`); }}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-yellow">
                  <Plus className="w-3.5 h-3.5" /> Element
                </button>
              )}
            </div>
          </div>
          {montageImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {montageImages.map((img) => (
                <ImageThumb key={img.id} image={img}
                  onClick={() => openLightbox(img, montageImages)}
                  onFavorite={() => handleFavorite(img)}
                  onDelete={() => handleDelete(img)}
                  onSetCover={() => handleSetCover(img)}
                  canDelete={getCanDeleteImage(img)} canSetCover={canSetCover}
                  isCover={project.coverImageUrl === img.url}
                  selectMode={selectMode} selected={selectedIds.has(img.id)} onToggleSelect={() => handleToggleSelect(img)} />
              ))}
            </div>
          )}
          {montageFolders.length === 0 && montageImages.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-5 text-center shadow-card">
              <p className="text-xs text-brand-gray-300">Noch keine Elemente</p>
              {canCreateElement && <button onClick={() => { setShowAddElement("Montage"); setNewElementName("Element 1"); }}
                className="text-xs text-brand-yellow font-semibold mt-1">+ Element hinzufügen</button>}
            </div>
          ) : (
            montageFolders.map((folder) => (
              <ElementRow key={folder.id} folder={folder}
                images={getImagesForFolder(folder.id)}
                lightboxImages={images.filter((i) => i.subFolderId === folder.id)}
                onUpload={() => { setUploadSelection(folder.id); setShowUpload(true); }}
                onDelete={() => handleDeleteFolder(folder)}
                onRename={(name) => handleRenameFolder(folder, name)}
                onImageClick={openLightbox}
                onFavorite={handleFavorite}
                onDeleteImage={handleDelete}
                onSetCover={handleSetCover}
                canDeleteFolder={canDeleteFolder} canSetCover={canSetCover} getCanDeleteImage={getCanDeleteImage}
                coverImageUrl={project.coverImageUrl}
                selectMode={selectMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} />
            ))
          )}
        </div>

        {/* ── Unassigned images ── */}
        {unassignedImages.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="font-black text-brand-black text-base">Allgemein</h2>
            <div className="grid grid-cols-3 gap-2">
              {unassignedImages.map((img) => (
                <ImageThumb key={img.id} image={img}
                  onClick={() => openLightbox(img, unassignedImages)}
                  onFavorite={() => handleFavorite(img)}
                  onDelete={() => handleDelete(img)}
                  onSetCover={() => handleSetCover(img)}
                  canDelete={getCanDeleteImage(img)} canSetCover={canSetCover}
                  isCover={project.coverImageUrl === img.url}
                  selectMode={selectMode} selected={selectedIds.has(img.id)} onToggleSelect={() => handleToggleSelect(img)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => { setShowUpload(false); setUploadSelection(""); }} title="Fotos hochladen">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-gray-600">Bereich</label>
            <select value={uploadSelection}
              onChange={(e) => setUploadSelection(e.target.value)}
              className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow">
              <option value="">Allgemein</option>
              {(["Produktion", "Montage"] as SubFolderType[]).map((type) => {
                const folders = subFolders.filter((f) => f.type === type);
                return (
                  <optgroup key={type} label={type}>
                    <option value={type}>{type} (allgemein)</option>
                    {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </optgroup>
                );
              })}
            </select>
          </div>
          <ImageUploader
            projectId={projectId}
            userId={user?.uid}
            userName={user?.displayName}
            subFolderId={uploadSubFolderIdFinal}
            sectionType={uploadSectionTypeFinal}
            onComplete={() => { setShowUpload(false); setUploadSelection(""); load(); }}
          />
        </div>
      </Modal>

      {/* Add Element Modal */}
      <Modal open={!!showAddElement} onClose={() => setShowAddElement(null)} title={`Element zu ${showAddElement} hinzufügen`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-gray-600">Name</label>
            <input type="text" value={newElementName}
              onChange={(e) => setNewElementName(e.target.value)}
              placeholder="z.B. Element 1"
              className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && showAddElement && handleAddElement(showAddElement)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowAddElement(null)}>Abbrechen</Button>
            <Button variant="primary" className="flex-1"
              onClick={() => showAddElement && handleAddElement(showAddElement)}
              disabled={!newElementName.trim() || savingElement}
              loading={savingElement}>
              Erstellen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal open={showEditProject} onClose={() => setShowEditProject(false)} title="Projekt bearbeiten">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-gray-600">Name *</label>
            <input type="text" value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-gray-600">Projektnummer</label>
            <input type="text" value={editForm.projectNumber}
              onChange={(e) => setEditForm((f) => ({ ...f, projectNumber: e.target.value }))}
              placeholder="z.B. 2024-01"
              className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-gray-600">Ort</label>
            <input type="text" value={editForm.location}
              onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="z.B. Zürich"
              className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-gray-600">Projektleiter</label>
            <select
              value={editForm.projectLeaderId}
              onChange={(e) => {
                const selected = allUsers.find((u) => u.uid === e.target.value);
                setEditForm((f) => ({
                  ...f,
                  projectLeaderId: e.target.value,
                  projectLeaderName: selected?.displayName || "",
                }));
              }}
              className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow">
              <option value="">Kein Projektleiter</option>
              {allUsers.map((u) => (
                <option key={u.uid} value={u.uid}>{u.displayName}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEditProject(false)}>Abbrechen</Button>
            <Button variant="primary" className="flex-1"
              onClick={handleSaveProject}
              disabled={!editForm.name.trim() || savingProject}
              loading={savingProject}>
              Speichern
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk download bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={handleBulkDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-brand-black text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl active:scale-95 transition-transform disabled:opacity-60">
            <Download className="w-4 h-4" />
            {downloading ? "Wird heruntergeladen…" : `${selectedIds.size} Foto${selectedIds.size !== 1 ? "s" : ""} herunterladen`}
          </button>
        </div>
      )}

      {/* Share Modal */}
      <Modal open={showShare} onClose={() => setShowShare(false)} title="Projekt teilen">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-brand-gray-500">Erstelle einen Upload-Link für externe Personen.</p>
          <Button variant="primary" onClick={handleCreateLink} loading={creatingLink}>
            <Link2 className="w-4 h-4" />
            Neuen Link erstellen
          </Button>
          {links.filter((l) => l.active).map((link) => (
            <div key={link.token} className="bg-brand-gray-50 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-mono text-brand-gray-400 truncate">{link.token.slice(0, 12)}...</p>
                <p className="text-xs text-brand-gray-300">{link.uploadCount} Uploads</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleCopyLink(link.token)}
                  className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-card">
                  {copied === link.token ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4 text-brand-gray-500" />}
                </button>
                <button onClick={() => handleDeactivateLink(link.token)}
                  className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-card">
                  <X className="w-4 h-4 text-brand-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </AppShell>
  );
}
