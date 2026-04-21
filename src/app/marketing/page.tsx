"use client";

import { useEffect, useState } from "react";
import {
  FileText, Image as ImageIcon, Upload, Download, Trash2,
  Plus, File, Folder, ArrowLeft, FolderPlus, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button, Modal, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import {
  getMarketingCategories, createMarketingCategory, deleteMarketingCategory,
  getMarketingAssets, uploadMarketingAsset, deleteMarketingAsset,
} from "@/lib/db";
import { MarketingCategory, MarketingAsset } from "@/types";
import { formatDateShort } from "@/lib/utils";

function fileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-brand-yellow" />;
  if (type === "application/pdf") return <FileText className="w-8 h-8 text-red-400" />;
  if (type.includes("presentation") || type.includes("powerpoint"))
    return <File className="w-8 h-8 text-orange-400" />;
  return <File className="w-8 h-8 text-brand-gray-400" />;
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Category Folder View ───────────────────────────────────

function CategoryFolderCard({ category, count, canDelete, onDelete, onClick }: {
  category: MarketingCategory;
  count: number;
  canDelete: boolean;
  onDelete: () => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl p-5 shadow-card active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-yellow/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Folder className="w-6 h-6 text-brand-yellow" />
          </div>
          <div>
            <h3 className="font-bold text-brand-black text-base">{category.name}</h3>
            <p className="text-xs text-brand-gray-400 mt-0.5">
              {count} Dokument{count !== 1 ? "e" : ""}
            </p>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-8 h-8 rounded-xl bg-brand-gray-100 flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5 text-brand-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Asset Card ─────────────────────────────────────────────

function AssetCard({ asset, canDelete, onDelete }: {
  asset: MarketingAsset;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const isImage = asset.fileType.startsWith("image/");
  const ext = asset.fileName.split(".").pop()?.toUpperCase() || "";

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-card active:scale-[0.98] transition-all">
      <a href={asset.fileUrl} target="_blank" rel="noopener">
        <div className="aspect-[16/9] bg-brand-gray-100 relative overflow-hidden">
          {isImage ? (
            <img src={asset.fileUrl} alt={asset.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              {fileIcon(asset.fileType)}
              <span className="text-xs text-brand-gray-300 font-medium">{ext}</span>
            </div>
          )}
          {ext && (
            <div className="absolute top-3 left-3">
              <span className="bg-brand-black/70 text-white text-xs font-bold px-2 py-1 rounded-lg">
                {ext}
              </span>
            </div>
          )}
        </div>
      </a>
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-brand-black truncate text-base">{asset.title}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-brand-gray-400">{formatDateShort(asset.uploadedAt)}</p>
            <span className="text-xs text-brand-gray-300">·</span>
            <p className="text-xs text-brand-gray-400 truncate">{asset.uploadedByName}</p>
            {asset.fileSize && (
              <>
                <span className="text-xs text-brand-gray-300">·</span>
                <p className="text-xs text-brand-gray-400">{formatSize(asset.fileSize)}</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <a href={asset.fileUrl} target="_blank" download
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-xl bg-brand-gray-50 flex items-center justify-center active:scale-95 transition-transform">
            <Download className="w-3.5 h-3.5 text-brand-gray-500" />
          </a>
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-8 h-8 rounded-xl bg-brand-gray-50 flex items-center justify-center active:scale-95 transition-transform">
              <Trash2 className="w-3.5 h-3.5 text-brand-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function MarketingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<MarketingCategory[]>([]);
  const [assetCounts, setAssetCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Folder navigation
  const [openCategory, setOpenCategory] = useState<MarketingCategory | null>(null);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Modals
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const canManage = user?.role === "admin";

  // Load categories + asset counts
  const loadCategories = async () => {
    try {
      const cats = await getMarketingCategories();
      setCategories(cats);
      // Load all assets once to count per category
      const all = await getMarketingAssets();
      const counts: Record<string, number> = {};
      all.forEach((a) => { counts[a.categoryId] = (counts[a.categoryId] || 0) + 1; });
      setAssetCounts(counts);
    } catch {
      toast("Fehler beim Laden", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  // Load assets for open category
  const loadAssets = async (categoryId: string) => {
    setLoadingAssets(true);
    try {
      const data = await getMarketingAssets(categoryId);
      setAssets(data);
    } catch {
      toast("Fehler beim Laden", "error");
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleOpenCategory = (cat: MarketingCategory) => {
    setOpenCategory(cat);
    loadAssets(cat.id);
  };

  const handleBackToFolders = () => {
    setOpenCategory(null);
    setAssets([]);
  };

  // Create category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !user) return;
    setCreatingCategory(true);
    try {
      await createMarketingCategory(newCategoryName.trim(), user.uid);
      toast("Kategorie erstellt!", "success");
      setNewCategoryName("");
      setShowNewCategory(false);
      loadCategories();
    } catch {
      toast("Fehler beim Erstellen", "error");
    } finally {
      setCreatingCategory(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (cat: MarketingCategory) => {
    if (!confirm(`Kategorie "${cat.name}" wirklich löschen?`)) return;
    await deleteMarketingCategory(cat.id);
    toast("Kategorie gelöscht", "info");
    loadCategories();
  };

  // Upload asset
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !uploadTitle.trim() || !user || !openCategory) return;
    setUploading(true);
    try {
      await uploadMarketingAsset({
        file,
        title: uploadTitle.trim(),
        description: uploadDesc || undefined,
        categoryId: openCategory.id,
        categoryName: openCategory.name,
        userId: user.uid,
        userName: user.displayName,
        onProgress: setProgress,
      });
      toast("Datei hochgeladen!", "success");
      setShowUpload(false);
      setFile(null);
      setUploadTitle("");
      setUploadDesc("");
      setProgress(0);
      loadAssets(openCategory.id);
      loadCategories();
    } catch {
      toast("Fehler beim Hochladen", "error");
    } finally {
      setUploading(false);
    }
  };

  // Delete asset
  const handleDeleteAsset = async (asset: MarketingAsset) => {
    if (!confirm(`"${asset.title}" wirklich löschen?`)) return;
    await deleteMarketingAsset(asset);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    loadCategories(); // update counts
    toast("Gelöscht", "info");
  };

  // ── Folder list view ───────────────────────────────────
  if (!openCategory) {
    return (
      <AppShell>
        <div className="px-4 py-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-brand-black tracking-tight">Marketing</h1>
              <p className="text-sm text-brand-gray-400 mt-0.5">{categories.length} Kategorie{categories.length !== 1 ? "n" : ""}</p>
            </div>
            {canManage && (
              <Button variant="primary" size="sm" onClick={() => setShowNewCategory(true)}>
                <FolderPlus className="w-4 h-4" />
                Neu
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-3xl" />)}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-20 h-20 bg-brand-gray-100 rounded-3xl flex items-center justify-center">
                <Folder className="w-10 h-10 text-brand-gray-300" />
              </div>
              <div className="text-center">
                <p className="font-bold text-brand-gray-500">Keine Kategorien</p>
                <p className="text-sm text-brand-gray-300 mt-1">
                  {canManage ? "Erstelle deine erste Kategorie" : "Noch keine Inhalte vorhanden"}
                </p>
              </div>
              {canManage && (
                <Button variant="primary" onClick={() => setShowNewCategory(true)}>
                  <FolderPlus className="w-4 h-4" />
                  Kategorie erstellen
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <CategoryFolderCard
                  key={cat.id}
                  category={cat}
                  count={assetCounts[cat.id] || 0}
                  canDelete={canManage}
                  onDelete={() => handleDeleteCategory(cat)}
                  onClick={() => handleOpenCategory(cat)}
                />
              ))}
            </div>
          )}
        </div>

        {/* New Category Modal */}
        <Modal open={showNewCategory} onClose={() => setShowNewCategory(false)} title="Neue Kategorie">
          <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
            <Input
              label="Kategoriename *"
              placeholder="z.B. Flyer, Inserate, Broschüren..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
              required
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowNewCategory(false)}>
                Abbrechen
              </Button>
              <Button type="submit" variant="primary" className="flex-1" loading={creatingCategory} disabled={!newCategoryName.trim()}>
                Erstellen
              </Button>
            </div>
          </form>
        </Modal>
      </AppShell>
    );
  }

  // ── Folder content view ────────────────────────────────
  return (
    <AppShell>
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={handleBackToFolders}
            className="w-9 h-9 rounded-xl bg-brand-gray-100 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-brand-black" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-brand-black truncate">{openCategory.name}</h1>
            <p className="text-xs text-brand-gray-400">{assets.length} Dokument{assets.length !== 1 ? "e" : ""}</p>
          </div>
          {canManage && (
            <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4" />
              Hochladen
            </Button>
          )}
        </div>

        {/* Asset list */}
        {loadingAssets ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => <div key={i} className="h-64 skeleton rounded-3xl" />)}
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-brand-gray-100 rounded-3xl flex items-center justify-center">
              <FileText className="w-10 h-10 text-brand-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-brand-gray-500">Noch keine Dokumente</p>
              {canManage && <p className="text-sm text-brand-gray-300 mt-1">Lade das erste Dokument hoch</p>}
            </div>
            {canManage && (
              <Button variant="primary" onClick={() => setShowUpload(true)}>
                <Upload className="w-4 h-4" />
                Hochladen
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                canDelete={canManage}
                onDelete={() => handleDeleteAsset(asset)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title={`Hochladen in "${openCategory.name}"`}>
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          {/* File picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-gray-600">Datei *</label>
            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-brand-gray-200 rounded-2xl cursor-pointer hover:border-brand-yellow transition-colors">
              {file ? (
                <div className="flex items-center gap-2 w-full">
                  <File className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                  <span className="text-sm text-brand-black truncate flex-1">{file.name}</span>
                  <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }}>
                    <X className="w-4 h-4 text-brand-gray-400" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-brand-gray-300" />
                  <span className="text-sm text-brand-gray-400">Datei auswählen</span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^.]+$/, "")); }
                }}
              />
            </label>
          </div>

          <Input
            label="Titel *"
            placeholder="z.B. Inserat Luzerner Zeitung 2026"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            required
          />
          <Input
            label="Beschreibung (optional)"
            placeholder="Kurze Beschreibung..."
            value={uploadDesc}
            onChange={(e) => setUploadDesc(e.target.value)}
          />

          {uploading && (
            <div className="w-full bg-brand-gray-100 rounded-full h-2">
              <div
                className="bg-brand-yellow h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowUpload(false)} disabled={uploading}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={uploading} disabled={!file || !uploadTitle.trim()}>
              Hochladen
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
