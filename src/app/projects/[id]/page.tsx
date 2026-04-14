"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, Share2, Heart, Download, Trash2,
  Link2, CheckCircle, X, ImageIcon, MessageSquare,
  Folder, FolderOpen, Plus, ChevronDown, ChevronRight
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
  getProjectSubFolders, createProjectSubFolder, deleteProjectSubFolder
} from "@/lib/db";
import { Project, ProjectImage, UploadLink, ProjectSubFolder, SubFolderType } from "@/types";
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

function ImageThumb({ image, onClick, onFavorite, onDelete, onSetCover, canDelete, canSetCover, isCover }: {
  image: ProjectImage; onClick: () => void; onFavorite: () => void;
  onDelete: () => void; onSetCover: () => void;
  canDelete: boolean; canSetCover: boolean; isCover: boolean;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-brand-gray-100 aspect-square group">
      <img src={image.url} alt="" className="w-full h-full object-cover cursor-pointer" onClick={onClick} />
      {isCover && (
        <div className="absolute top-2 left-2 bg-brand-yellow text-brand-black text-[9px] font-bold px-1.5 py-0.5 rounded-lg">Titelbild</div>
      )}
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
    </div>
  );
}

// ── Sub-folder element row ─────────────────────────────────

function ElementRow({ folder, images, onUpload, onDelete, onImageClick, onFavorite, onDeleteImage, onSetCover,
  canManage, canDelete, canSetCover, coverImageUrl, lightboxImages }: {
  folder: ProjectSubFolder;
  images: ProjectImage[];
  onUpload: () => void;
  onDelete: () => void;
  onImageClick: (img: ProjectImage, allImages: ProjectImage[]) => void;
  onFavorite: (img: ProjectImage) => void;
  onDeleteImage: (img: ProjectImage) => void;
  onSetCover: (img: ProjectImage) => void;
  canManage: boolean;
  canDelete: boolean;
  canSetCover: boolean;
  coverImageUrl?: string;
  lightboxImages: ProjectImage[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-brand-gray-100 rounded-2xl overflow-hidden bg-white">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-brand-gray-50">
        <div className="flex items-center gap-3">
          {open ? <FolderOpen className="w-5 h-5 text-brand-yellow" /> : <Folder className="w-5 h-5 text-brand-gray-400" />}
          <span className="font-semibold text-brand-black text-sm">{folder.name}</span>
          <span className="text-xs text-brand-gray-400 bg-brand-gray-100 px-2 py-0.5 rounded-full">{images.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button onClick={(e) => { e.stopPropagation(); onUpload(); }}
              className="w-7 h-7 rounded-xl bg-brand-yellow flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-brand-black" />
            </button>
          )}
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-xl bg-brand-gray-100 flex items-center justify-center">
              <Trash2 className="w-3 h-3 text-brand-gray-400" />
            </button>
          )}
          {open ? <ChevronDown className="w-4 h-4 text-brand-gray-400" /> : <ChevronRight className="w-4 h-4 text-brand-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3">
          {images.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <p className="text-xs text-brand-gray-300">Noch keine Fotos</p>
              {canManage && <button onClick={onUpload} className="text-xs text-brand-yellow font-semibold">+ Fotos hochladen</button>}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-1">
              {images.map((img) => (
                <ImageThumb key={img.id} image={img}
                  onClick={() => onImageClick(img, lightboxImages)}
                  onFavorite={() => onFavorite(img)}
                  onDelete={() => onDeleteImage(img)}
                  onSetCover={() => onSetCover(img)}
                  canDelete={canDelete} canSetCover={canSetCover}
                  isCover={coverImageUrl === img.url} />
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
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSubFolderId, setUploadSubFolderId] = useState<string | undefined>();
  const [showShare, setShowShare] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<ProjectImage | null>(null);
  const [lightboxList, setLightboxList] = useState<ProjectImage[]>([]);
  const [creatingLink, setCreatingLink] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showAddElement, setShowAddElement] = useState<SubFolderType | null>(null);
  const [newElementName, setNewElementName] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, imgs, folders, lnks] = await Promise.all([
        getProject(projectId),
        getProjectImages(projectId),
        getProjectSubFolders(projectId),
        user?.role === "admin" ? getProjectUploadLinks(projectId) : Promise.resolve([]),
      ]);
      setProject(p);
      setImages(imgs);
      setSubFolders(folders);
      setLinks(lnks);
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

  const handleAddElement = async (type: SubFolderType) => {
    if (!newElementName.trim() || !user) return;
    const existing = subFolders.filter((f) => f.type === type);
    const name = newElementName.trim() || `Element ${existing.length + 1}`;
    await createProjectSubFolder(projectId, type, name);
    setNewElementName("");
    setShowAddElement(null);
    load();
    toast(`${name} erstellt`, "success");
  };

  const handleDeleteFolder = async (folder: ProjectSubFolder) => {
    if (!confirm(`"${folder.name}" wirklich löschen?`)) return;
    await deleteProjectSubFolder(folder.id);
    load();
    toast("Ordner gelöscht", "info");
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

  const canUpload = user?.role === "admin" || user?.role === "employee";
  const canShare = user?.role === "admin";
  const canDelete = user?.role === "admin";
  const canSetCover = user?.role === "admin";
  const canManage = user?.role === "admin";

  const produktionFolders = subFolders.filter((f) => f.type === "Produktion");
  const montageFolders = subFolders.filter((f) => f.type === "Montage");
  const unassignedImages = images.filter((i) => !i.subFolderId);
  const getImagesForFolder = (folderId: string) => images.filter((i) => i.subFolderId === folderId);

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
          {canUpload && (
            <Button variant="primary" size="sm" className="flex-1" onClick={() => { setUploadSubFolderId(undefined); setShowUpload(true); }}>
              <Upload className="w-4 h-4" />
              Fotos hochladen
            </Button>
          )}
          {canShare && (
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
            {canManage && (
              <button onClick={() => { setShowAddElement("Produktion"); setNewElementName(`Element ${produktionFolders.length + 1}`); }}
                className="flex items-center gap-1 text-xs font-semibold text-brand-yellow">
                <Plus className="w-3.5 h-3.5" /> Element
              </button>
            )}
          </div>
          {produktionFolders.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-5 text-center shadow-card">
              <p className="text-xs text-brand-gray-300">Noch keine Elemente</p>
              {canManage && <button onClick={() => { setShowAddElement("Produktion"); setNewElementName("Element 1"); }}
                className="text-xs text-brand-yellow font-semibold mt-1">+ Element hinzufügen</button>}
            </div>
          ) : (
            produktionFolders.map((folder) => (
              <ElementRow key={folder.id} folder={folder}
                images={getImagesForFolder(folder.id)}
                lightboxImages={images.filter((i) => i.subFolderId === folder.id)}
                onUpload={() => { setUploadSubFolderId(folder.id); setShowUpload(true); }}
                onDelete={() => handleDeleteFolder(folder)}
                onImageClick={openLightbox}
                onFavorite={handleFavorite}
                onDeleteImage={handleDelete}
                onSetCover={handleSetCover}
                canManage={canManage} canDelete={canDelete} canSetCover={canSetCover}
                coverImageUrl={project.coverImageUrl} />
            ))
          )}
        </div>

        {/* ── Montage ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-brand-black text-base">Montage</h2>
            {canManage && (
              <button onClick={() => { setShowAddElement("Montage"); setNewElementName(`Element ${montageFolders.length + 1}`); }}
                className="flex items-center gap-1 text-xs font-semibold text-brand-yellow">
                <Plus className="w-3.5 h-3.5" /> Element
              </button>
            )}
          </div>
          {montageFolders.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-5 text-center shadow-card">
              <p className="text-xs text-brand-gray-300">Noch keine Elemente</p>
              {canManage && <button onClick={() => { setShowAddElement("Montage"); setNewElementName("Element 1"); }}
                className="text-xs text-brand-yellow font-semibold mt-1">+ Element hinzufügen</button>}
            </div>
          ) : (
            montageFolders.map((folder) => (
              <ElementRow key={folder.id} folder={folder}
                images={getImagesForFolder(folder.id)}
                lightboxImages={images.filter((i) => i.subFolderId === folder.id)}
                onUpload={() => { setUploadSubFolderId(folder.id); setShowUpload(true); }}
                onDelete={() => handleDeleteFolder(folder)}
                onImageClick={openLightbox}
                onFavorite={handleFavorite}
                onDeleteImage={handleDelete}
                onSetCover={handleSetCover}
                canManage={canManage} canDelete={canDelete} canSetCover={canSetCover}
                coverImageUrl={project.coverImageUrl} />
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
                  canDelete={canDelete} canSetCover={canSetCover}
                  isCover={project.coverImageUrl === img.url} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Fotos hochladen">
        <div className="flex flex-col gap-4">
          {subFolders.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-brand-gray-600">In Ordner ablegen</label>
              <select value={uploadSubFolderId || ""}
                onChange={(e) => setUploadSubFolderId(e.target.value || undefined)}
                className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                <option value="">Allgemein (kein Ordner)</option>
                {["Produktion", "Montage"].map((type) => {
                  const folders = subFolders.filter((f) => f.type === type);
                  if (!folders.length) return null;
                  return (
                    <optgroup key={type} label={type}>
                      {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          )}
          <ImageUploader
            projectId={projectId}
            userId={user?.uid}
            userName={user?.displayName}
            subFolderId={uploadSubFolderId}
            onComplete={() => { setShowUpload(false); load(); }}
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
              disabled={!newElementName.trim()}>
              Erstellen
            </Button>
          </div>
        </div>
      </Modal>

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
