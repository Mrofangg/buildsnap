"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, Share2, Heart, Download, Trash2,
  Link2, CheckCircle, X, Calendar, User, ImageIcon
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button, Modal, Badge, Avatar } from "@/components/ui";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useToast } from "@/components/ui/toast";
import {
  getProject, getProjectImages, toggleFavorite,
  deleteImage, createUploadLink, getProjectUploadLinks,
  deactivateUploadLink, setCoverImage
} from "@/lib/db";
import { Project, ProjectImage, UploadLink } from "@/types";
import { formatDate, groupImagesByDate, formatDateShort } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

function ImageCard({
  image, onFavorite, onDelete, onSetCover,
  canDelete, canSetCover, onClick, isCover,
}: {
  image: ProjectImage;
  onFavorite: () => void;
  onDelete: () => void;
  onSetCover: () => void;
  canDelete: boolean;
  canSetCover: boolean;
  onClick: () => void;
  isCover: boolean;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-brand-gray-100 aspect-square group">
      <img src={image.url} alt="" className="w-full h-full object-cover cursor-pointer" loading="lazy" onClick={onClick} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {isCover && (
        <div className="absolute top-2 left-2 bg-brand-yellow text-brand-black text-[9px] font-bold px-1.5 py-0.5 rounded-lg">
          Titelbild
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onFavorite(); }}
        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
          image.isFavorite ? "bg-red-500 text-white" : "bg-black/30 text-white/80"
        }`}
      >
        <Heart className="w-3.5 h-3.5" fill={image.isFavorite ? "white" : "none"} />
      </button>

      {image.isExternal && (
        <div className="absolute bottom-2 left-2">
          <span className="bg-brand-yellow text-brand-black text-[9px] font-bold px-1.5 py-0.5 rounded-lg">Extern</span>
        </div>
      )}

      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canSetCover && !isCover && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetCover(); }}
            className="w-6 h-6 rounded-full bg-brand-yellow/90 flex items-center justify-center"
            title="Als Titelbild setzen"
          >
            <ImageIcon className="w-3 h-3 text-brand-black" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

function LightboxModal({ image, onClose, onPrev, onNext, hasPrev, hasNext }: {
  image: ProjectImage; onClose: () => void; onPrev: () => void;
  onNext: () => void; hasPrev: boolean; hasNext: boolean;
}) {
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [links, setLinks] = useState<UploadLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<ProjectImage | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, imgs, lnks] = await Promise.all([
        getProject(projectId),
        getProjectImages(projectId),
        user?.role === "admin" ? getProjectUploadLinks(projectId) : Promise.resolve([]),
      ]);
      setProject(p);
      setImages(imgs);
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

  const handleCreateLink = async () => {
    if (!user || !project) return;
    setCreatingLink(true);
    try {
      await createUploadLink(project.id, project.name, user.uid);
      toast("Upload-Link erstellt!", "success");
      load();
    } catch {
      toast("Fehler beim Erstellen des Links", "error");
    } finally {
      setCreatingLink(false);
    }
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

  const lightboxIndex = lightboxImg ? images.findIndex((i) => i.id === lightboxImg.id) : -1;
  const grouped = groupImagesByDate(images);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const canUpload = user?.role === "admin" || user?.role === "employee";
  const canShare = user?.role === "admin";
  const canDelete = user?.role === "admin";
  const canSetCover = user?.role === "admin";

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 py-5 flex flex-col gap-4">
          <div className="h-6 w-2/3 skeleton rounded-lg" />
          <div className="h-48 skeleton rounded-3xl" />
          {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton rounded-3xl" />)}
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
          onPrev={() => setLightboxImg(images[lightboxIndex - 1])}
          onNext={() => setLightboxImg(images[lightboxIndex + 1])}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < images.length - 1}
        />
      )}

      <div className="px-4 py-4">
        <div className="flex items-start gap-3 mb-4">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-brand-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ArrowLeft className="w-4 h-4 text-brand-black" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-brand-black leading-tight">{project.name}</h1>
            {project.phase && <Badge variant="yellow" className="mt-1">{project.phase}</Badge>}
          </div>
        </div>

        {project.coverImageUrl && (
          <div className="relative rounded-3xl overflow-hidden aspect-video mb-4 shadow-card">
            <img src={project.coverImageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 left-3">
              <span className="bg-brand-yellow text-brand-black text-xs font-bold px-2 py-1 rounded-lg">Titelbild</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5">
          {canUpload && (
            <Button variant="primary" size="sm" className="flex-1" onClick={() => setShowUpload(true)}>
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

        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-card">
            <p className="text-2xl font-black text-brand-black">{images.length}</p>
            <p className="text-xs text-brand-gray-400 font-medium">Fotos</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-card">
            <p className="text-2xl font-black text-brand-black">{images.filter((i) => i.isFavorite).length}</p>
            <p className="text-xs text-brand-gray-400 font-medium">Favoriten</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-card">
            <p className="text-2xl font-black text-brand-black">{new Set(images.map((i) => i.uploadedBy)).size}</p>
            <p className="text-xs text-brand-gray-400 font-medium">Uploader</p>
          </div>
        </div>

        {canSetCover && images.length > 0 && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-black flex-shrink-0" />
            <p className="text-xs text-brand-gray-600 font-medium">
              Hover über ein Foto → 🟡 Symbol = Als Titelbild setzen
            </p>
          </div>
        )}

        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 bg-brand-gray-100 rounded-3xl flex items-center justify-center">
              <Upload className="w-7 h-7 text-brand-gray-300" />
            </div>
            <p className="font-semibold text-brand-gray-400">Noch keine Fotos</p>
            {canUpload && (
              <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>Erste Fotos hochladen</Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {sortedDates.map((dateKey) => {
              const dayImages = grouped[dateKey];
              const date = new Date(dateKey);
              return (
                <div key={dateKey}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-brand-gray-200" />
                    <div className="flex items-center gap-1.5 bg-brand-gray-100 rounded-full px-3 py-1">
                      <Calendar className="w-3 h-3 text-brand-gray-400" />
                      <span className="text-xs font-semibold text-brand-gray-500">
                        {format(date, "dd. MMMM yyyy", { locale: de })}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-brand-gray-200" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {dayImages.map((img) => (
                      <ImageCard
                        key={img.id}
                        image={img as ProjectImage}
                        onFavorite={() => handleFavorite(img as ProjectImage)}
                        onDelete={() => handleDelete(img as ProjectImage)}
                        onSetCover={() => handleSetCover(img as ProjectImage)}
                        canDelete={canDelete}
                        canSetCover={canSetCover}
                        isCover={project.coverImageUrl === (img as ProjectImage).url}
                        onClick={() => setLightboxImg(img as ProjectImage)}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[...new Set(dayImages.map((i) => i.uploadedByName))].map((name) => (
                      <div key={name} className="flex items-center gap-1 bg-brand-gray-50 rounded-full px-2 py-1">
                        <User className="w-2.5 h-2.5 text-brand-gray-400" />
                        <span className="text-[10px] text-brand-gray-400 font-medium">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Fotos hochladen">
        <ImageUploader
          projectId={projectId}
          userId={user?.uid}
          userName={user?.displayName}
          onComplete={() => { setShowUpload(false); load(); }}
          onClose={() => setShowUpload(false)}
        />
      </Modal>

      <Modal open={showShare} onClose={() => setShowShare(false)} title="Upload-Link teilen">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-brand-gray-500">
            Externe Personen können über diesen Link Fotos hochladen, ohne sich anzumelden oder andere Bilder zu sehen.
          </p>
          <Button variant="primary" size="md" className="w-full" loading={creatingLink} onClick={handleCreateLink}>
            <Link2 className="w-4 h-4" />
            Neuen Link erstellen
          </Button>
          {links.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <p className="text-xs font-semibold text-brand-gray-400 uppercase tracking-wide">Aktive Links</p>
              {links.map((link) => (
                <div key={link.token} className="flex items-center gap-3 bg-brand-gray-50 rounded-2xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-brand-gray-400 truncate">/upload/.../{link.token.slice(0, 8)}...</p>
                    <p className="text-xs text-brand-gray-300 mt-0.5">{link.uploadCount} Uploads</p>
                  </div>
                  <button
                    onClick={() => handleCopyLink(link.token)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${copied === link.token ? "bg-green-500" : "bg-brand-yellow"}`}
                  >
                    {copied === link.token ? <CheckCircle className="w-4 h-4 text-white" /> : <Link2 className="w-4 h-4 text-brand-black" />}
                  </button>
                  <button onClick={() => handleDeactivateLink(link.token)} className="w-8 h-8 rounded-xl bg-brand-gray-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-brand-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </AppShell>
  );
}
