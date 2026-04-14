"use client";

import { useEffect, useState } from "react";
import { Heart, Download, Filter, Search, X, CheckSquare, Square } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button, Badge, Select } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getAllImages, getProjects, toggleFavorite } from "@/lib/db";
import { ProjectImage, Project } from "@/types";
import { formatDate, formatDateShort, downloadImages } from "@/lib/utils";
import { X as Close } from "lucide-react";

export default function MarketingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [images, setImages] = useState<ProjectImage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [filterProject, setFilterProject] = useState("");
  const [filterFavs, setFilterFavs] = useState(false);
  const [lightbox, setLightbox] = useState<ProjectImage | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [imgs, projs] = await Promise.all([getAllImages(), getProjects()]);
      setImages(imgs);
      setProjects(projs);
    } catch {
      toast("Fehler beim Laden", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = images.filter((img) => {
    if (filterProject && img.projectId !== filterProject) return false;
    if (filterFavs && !img.isFavorite) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleDownloadSelected = async () => {
    const selected = filtered.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) return;
    await downloadImages(
      selected.map((i) => i.url),
      "BuildSnap-Export"
    );
    toast(`${selected.length} Fotos werden geöffnet/heruntergeladen`, "info");
  };

  const handleFavorite = async (img: ProjectImage) => {
    await toggleFavorite(img.id, img.isFavorite);
    setImages((prev) =>
      prev.map((i) => i.id === img.id ? { ...i, isFavorite: !i.isFavorite } : i)
    );
  };

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.name || "Unbekannt";

  const hasFilters = filterProject || filterFavs;

  return (
    <AppShell>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setLightbox(null)}
        >
          <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-white font-semibold text-sm">{getProjectName(lightbox.projectId)}</p>
              <p className="text-white/50 text-xs">{formatDate(lightbox.uploadedAt)} · {lightbox.uploadedByName}</p>
            </div>
            <div className="flex gap-2">
              <a href={lightbox.url} target="_blank" download
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                onClick={e => e.stopPropagation()}>
                <Download className="w-4 h-4 text-white" />
              </a>
              <button
                onClick={() => setLightbox(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <Close className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 min-h-0" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt="" className="max-w-full max-h-full object-contain rounded-2xl" />
          </div>
        </div>
      )}

      <div className="px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-brand-black">Marketing</h1>
            <p className="text-sm text-brand-gray-400 mt-0.5">
              {filtered.length} Fotos
            </p>
          </div>
          <div className="flex gap-2">
            {selectMode ? (
              <>
                <Button variant="ghost" size="sm" onClick={selectAll}>Alle</Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadSelected}
                  disabled={selectedIds.size === 0}
                >
                  <Download className="w-4 h-4" />
                  {selectedIds.size > 0 ? selectedIds.size : ""}
                </Button>
                <Button variant="ghost" size="icon" onClick={clearSelection}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectMode(true)}
              >
                <CheckSquare className="w-4 h-4" />
                Auswählen
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterFavs(!filterFavs)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-semibold flex-shrink-0 transition-all ${
              filterFavs
                ? "bg-red-500 text-white"
                : "bg-white text-brand-gray-500 border border-brand-gray-200"
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={filterFavs ? "white" : "none"} />
            Favoriten
          </button>

          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterProject(filterProject === p.id ? "" : p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-semibold flex-shrink-0 transition-all truncate max-w-[160px] ${
                filterProject === p.id
                  ? "bg-brand-black text-white"
                  : "bg-white text-brand-gray-500 border border-brand-gray-200"
              }`}
            >
              {p.name}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={() => { setFilterProject(""); setFilterFavs(false); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-2xl text-sm text-brand-gray-400 flex-shrink-0 bg-brand-gray-100"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Images grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square skeleton rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="font-semibold text-brand-gray-400">Keine Fotos gefunden</p>
            {hasFilters && (
              <button
                onClick={() => { setFilterProject(""); setFilterFavs(false); }}
                className="text-sm text-brand-yellow font-semibold"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((img) => {
              const isSelected = selectedIds.has(img.id);
              return (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-brand-gray-100 group cursor-pointer"
                  onClick={() => {
                    if (selectMode) toggleSelect(img.id);
                    else setLightbox(img);
                  }}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Select overlay */}
                  {selectMode && (
                    <div className={`absolute inset-0 transition-all ${
                      isSelected ? "bg-brand-yellow/30 ring-2 ring-brand-yellow ring-inset" : "bg-black/10"
                    }`}>
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-brand-yellow" : "bg-white/80"
                      }`}>
                        {isSelected ? (
                          <CheckSquare className="w-3 h-3 text-brand-black" />
                        ) : (
                          <Square className="w-3 h-3 text-brand-gray-400" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Favorite button */}
                  {!selectMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFavorite(img); }}
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
                        img.isFavorite ? "bg-red-500 opacity-100" : "bg-black/30"
                      }`}
                    >
                      <Heart className="w-3 h-3 text-white" fill={img.isFavorite ? "white" : "none"} />
                    </button>
                  )}

                  {/* Project badge on hover */}
                  {!selectMode && !filterProject && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[9px] font-semibold truncate">
                        {getProjectName(img.projectId)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
