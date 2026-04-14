"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, FolderOpen, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button, Modal, Input, Select, Badge } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getProjects, createProject } from "@/lib/db";
import { Project, PROJECT_PHASES } from "@/types";
import { formatDate, formatDateShort } from "@/lib/utils";

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-3xl overflow-hidden shadow-card card-hover active:scale-[0.98] transition-all">
        {/* Cover image */}
        <div className="aspect-[16/9] bg-brand-gray-100 relative overflow-hidden">
          {project.coverImageUrl ? (
            <img
              src={project.coverImageUrl}
              alt={project.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <FolderOpen className="w-10 h-10 text-brand-gray-200" />
              <span className="text-xs text-brand-gray-300 font-medium">
                Noch keine Fotos
              </span>
            </div>
          )}
          {/* Yellow accent overlay on no-image */}
          {!project.coverImageUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/10 to-transparent" />
          )}
          {/* Phase badge */}
          {project.phase && (
            <div className="absolute top-3 left-3">
              <Badge variant="yellow">{project.phase}</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-brand-black truncate text-base">
              {project.name}
            </h3>
            <p className="text-xs text-brand-gray-400 mt-0.5">
              {formatDateShort(project.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 bg-brand-gray-50 rounded-2xl px-3 py-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-brand-gray-400" />
            <span className="text-sm font-bold text-brand-gray-500">
              {project.imageCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-card">
      <div className="aspect-[16/9] skeleton" />
      <div className="p-4 flex gap-3">
        <div className="flex-1">
          <div className="h-4 skeleton rounded-lg w-3/4 mb-2" />
          <div className="h-3 skeleton rounded-lg w-1/3" />
        </div>
        <div className="h-8 w-14 skeleton rounded-2xl" />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phase: "", description: "" });

  const load = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      toast("Fehler beim Laden der Projekte", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !user) return;
    setCreating(true);
    try {
      await createProject({
        name: form.name.trim(),
        phase: form.phase || undefined,
        description: form.description || undefined,
        userId: user.uid,
        userName: user.displayName,
      });
      toast("Projekt erstellt!", "success");
      setForm({ name: "", phase: "", description: "" });
      setShowCreate(false);
      load();
    } catch {
      toast("Projekt konnte nicht erstellt werden", "error");
    } finally {
      setCreating(false);
    }
  };

  const canCreate = user?.role === "admin";

  return (
    <AppShell>
      <div className="px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-brand-black tracking-tight">
              Projekte
            </h1>
            <p className="text-sm text-brand-gray-400 mt-0.5">
              {projects.length} aktive{projects.length !== 1 ? "" : "s"} Projekt{projects.length !== 1 ? "e" : ""}
            </p>
          </div>
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" />
              Neu
            </Button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-brand-gray-100 rounded-3xl flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-brand-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-brand-gray-500">Keine Projekte</p>
              <p className="text-sm text-brand-gray-300 mt-1">
                {canCreate ? "Erstelle dein erstes Projekt" : "Noch keine Projekte vorhanden"}
              </p>
            </div>
            {canCreate && (
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                Projekt erstellen
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Neues Projekt"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Projektname *"
            placeholder="z.B. Einfamilienhaus Musterstr. 12"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
          <Select
            label="Bauphase (optional)"
            placeholder="Bauphase wählen..."
            value={form.phase}
            onChange={(e) => setForm({ ...form, phase: e.target.value })}
            options={PROJECT_PHASES.map((p) => ({ value: p, label: p }))}
          />
          <Input
            label="Beschreibung (optional)"
            placeholder="Kurze Projektbeschreibung..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setShowCreate(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={creating}
              disabled={!form.name.trim()}
            >
              Erstellen
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
