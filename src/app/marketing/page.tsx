"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileText, Image as ImageIcon, Upload, Download, Trash2,
  Search, X, Plus, ChevronDown, File,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button, Modal, Input, Badge } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getMarketingAssets, uploadMarketingAsset, deleteMarketingAsset } from "@/lib/db";
import { MarketingAsset, MARKETING_CATEGORIES } from "@/types";
import { formatDateShort } from "@/lib/utils";

function fileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="w-6 h-6 text-brand-yellow" />;
  if (type === "application/pdf") return <FileText className="w-6 h-6 text-red-400" />;
  if (type.includes("presentation") || type.includes("powerpoint"))
    return <File className="w-6 h-6 text-orange-400" />;
  return <File className="w-6 h-6 text-brand-gray-400" />;
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetCard({ asset, canDelete, onDelete }: {
  asset: MarketingAsset;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const isImage = asset.fileType.startsWith("image/");

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-card">
      {/* Preview */}
      {isImage ? (
        <a href={asset.fileUrl} target="_blank" rel="noopener">
          <div className="aspect-[4/3] overflow-hidden bg-brand-gray-100">
            <img src={asset.fileUrl} alt={asset.title} className="w-full h-full object-cover" />
          </div>
        </a>
      ) : (
        <a href={asset.fileUrl} target="_blank" rel="noopener"
          className="flex items-center justify-center aspect-[4/3] bg-brand-gray-50 hover:bg-brand-gray-100 transition-colors">
          <div className="flex flex-col items-center gap-2">
            {fileIcon(asset.fileType)}
            <span className="text-xs text-brand-gray-400 font-medium uppercase tracking-wide">
              {asset.fileName.split(".").pop()}
            </span>
          </div>
        </a>
      )}

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-brand-black text-sm leading-tight truncate">{asset.title}</h3>
            {asset.description && (
              <p className="text-xs text-brand-gray-400 mt-0.5 line-clamp-2">{asset.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="yellow">{asset.category}</Badge>
              {asset.fileSize && (
                <span className="text-[10px] text-brand-gray-300">{formatSize(asset.fileSize)}</span>
              )}
            </div>
            <p className="text-[10px] text-brand-gray-300 mt-1">
              {formatDateShort(asset.uploadedAt)} · {asset.uploadedByName}
            </p>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <a
              href={asset.fileUrl}
              target="_blank"
              download
              className="w-8 h-8 rounded-xl bg-brand-gray-100 flex items-center justify-center"
            >
              <Download className="w-3.5 h-3.5 text-brand-gray-500" />
            </a>
            {canDelete && (
              <button
                onClick={onDelete}
                className="w-8 h-8 rounded-xl bg-brand-gray-100 flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5 text-brand-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Upload form
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; category: string }>({ title: "", description: "", category: MARKETING_CATEGORIES[0] });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = async () => {
    try {
      const data = await getMarketingAssets();
      setAssets(data);
    } catch {
      toast("Fehler beim Laden", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCategory || a.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [assets, search, filterCategory]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !form.title.trim() || !user) return;
    setUploading(true);
    try {
      await uploadMarketingAsset({
        file,
        title: form.title.trim(),
        description: form.description || undefined,
        category: form.category,
        userId: user.uid,
        userName: user.displayName,
        onProgress: setProgress,
      });
      toast("Datei hochgeladen!", "success");
      setShowUpload(false);
      setFile(null);
      setForm({ title: "", description: "", category: MARKETING_CATEGORIES[0] });
      setProgress(0);
      load();
    } catch {
      toast("Fehler beim Hochladen", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: MarketingAsset) => {
    if (!confirm(`"${asset.title}" wirklich löschen?`)) return;
    await deleteMarketingAsset(asset);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    toast("Gelöscht", "info");
  };

  const canManage = user?.role === "admin";
  const categories = Array.from(new Set(assets.map((a) => a.category)));

  return (
    <AppShell>
      <div className="px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-brand-black tracking-tight">Marketing</h1>
            <p className="text-sm text-brand-gray-400 mt-0.5">
              {filtered.length} Dokument{filtered.length !== 1 ? "e" : ""}
            </p>
          </div>
          {canManage && (
            <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="w-4 h-4" />
              Hochladen
            </Button>
          )}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-300" />
            <input
              type="text"
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white rounded-2xl text-sm border border-brand-gray-100 focus:outline-none focus:border-brand-yellow shadow-card"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-brand-gray-300" />
              </button>
            )}
          </div>
          {categories.length > 1 && (
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2.5 bg-white rounded-2xl text-sm border border-brand-gray-100 focus:outline-none focus:border-brand-yellow shadow-card text-brand-gray-500 font-medium"
              >
                <option value="">Alle</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 skeleton rounded-3xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-brand-gray-100 rounded-3xl flex items-center justify-center">
              <FileText className="w-10 h-10 text-brand-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-brand-gray-500">
                {search || filterCategory ? "Keine Treffer" : "Noch keine Unterlagen"}
              </p>
              <p className="text-sm text-brand-gray-300 mt-1">
                {canManage && !search && !filterCategory
                  ? "Lade Inserate, Flyer oder Broschüren hoch"
                  : "Bald verfügbar"}
              </p>
            </div>
            {canManage && !search && !filterCategory && (
              <Button variant="primary" onClick={() => setShowUpload(true)}>
                <Upload className="w-4 h-4" />
                Erste Datei hochladen
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                canDelete={canManage}
                onDelete={() => handleDelete(asset)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Datei hochladen">
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          {/* File picker */}
          <div>
            <label className="text-sm font-semibold text-brand-gray-600 block mb-1.5">Datei *</label>
            <label className={`flex flex-col items-center justify-center w-full h-28 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
              file ? "border-brand-yellow bg-brand-yellow/5" : "border-brand-gray-200 bg-brand-gray-50 hover:border-brand-yellow"
            }`}>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf,.ppt,.pptx,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    if (!form.title) setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, "") }));
                  }
                }}
              />
              {file ? (
                <div className="text-center px-4">
                  <p className="text-sm font-bold text-brand-black truncate">{file.name}</p>
                  <p className="text-xs text-brand-gray-400 mt-1">{formatSize(file.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-6 h-6 text-brand-gray-300 mx-auto mb-1" />
                  <p className="text-sm text-brand-gray-400">Datei auswählen</p>
                  <p className="text-xs text-brand-gray-300">Bilder, PDF, PowerPoint, Word</p>
                </div>
              )}
            </label>
          </div>

          <Input
            label="Titel *"
            placeholder="z.B. Inserat Luzerner Zeitung 2026"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-gray-600">Kategorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            >
              {MARKETING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <Input
            label="Beschreibung (optional)"
            placeholder="Kurze Beschreibung..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          {uploading && (
            <div className="w-full bg-brand-gray-100 rounded-full h-2">
              <div className="bg-brand-yellow h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowUpload(false)}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={uploading} disabled={!file || !form.title.trim()}>
              Hochladen
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
