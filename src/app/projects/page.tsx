"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, FolderOpen, Image as ImageIcon, Search, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button, Modal, Input, Select, Badge } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getProjects, createProject, getUsers } from "@/lib/db";
import { Project, AppUser, PROJECT_PHASES } from "@/types";
import { formatDateShort } from "@/lib/utils";

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-3xl overflow-hidden shadow-card active:scale-[0.98] transition-all">
        <div className="aspect-[16/9] bg-brand-gray-100 relative overflow-hidden">
          {project.coverImageUrl ? (
            <img
              src={project.coverImageUrl}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <FolderOpen className="w-10 h-10 text-brand-gray-200" />
              <span className="text-xs text-brand-gray-300 font-medium">Noch keine Fotos</span>
            </div>
          )}
          {!project.coverImageUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/10 to-transparent" />
          )}
          {project.phase && (
            <div className="absolute top-3 left-3">
              <Badge variant="yellow">{project.phase}</Badge>
            </div>
          )}
        </div>
        <div className="p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-brand-black truncate text-base">{project.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-brand-gray-400">{formatDateShort(project.createdAt)}</p>
              {project.projectLeaderName && (
                <p className="text-xs text-brand-gray-400">· {project.projectLeaderName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 bg-brand-gray-50 rounded-2xl px-3 py-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-brand-gray-400" />
            <span className="text-sm font-bold text-brand-gray-500">{project.imageCount}</span>
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
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phase: "", description: "", projectLeaderId: "", projectLeaderName: "" });
  const [search, setSearch] = useState("");
  const [filterPhase, setFilterPhase] = useState("");

  const load = async () => {
    try {
      const [data, userList] = await Promise.all([
        getProjects({ userId: user?.uid, role: user?.role }),
        user?.role === "admin" ? getUsers() : Promise.resolve([]),
      ]);
      setProjects(data);
      setUsers(userList);
    } catch {
      toast("Fehler beim Laden", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchPhase = !filterPhase || p.phase === filterPhase;
      return matchSearch && matchPhase;
    });
  }, [projects, search, filterPhase]);

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
        projectLeaderId: form.projectLeaderId || undefined,
        projectLeaderName: form.projectLeaderName || undefined,
      });
      toast("Projekt erstellt!", "success");
      setForm({ name: "", phase: "", description: "", projectLeaderId: "", projectLeaderName: "" });
      setShowCreate(false);
      load();
    } catch {
      toast("Projekt konnte nicht erstellt werden", "error");
    } finally {
      setCreating(false);
    }
  };

  const canCreate = user?.role === "admin";
  const phases = Array.from(new Set(projects.map((p) => p.phase).filter(Boolean))) as string[];

  return (
    <AppShell>
      <div className="px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-brand-black tracking-tight">Projekte</h1>
            <p className="text-sm text-brand-gray-400 mt-0.5">
              {filtered.length} {filtered.length !== projects.length ? `von ${projects.length} ` : ""}
              Projekt{projects.length !== 1 ? "e" : ""}
            </p>
          </div>
          {canCreate && (
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              Neu
            </Button>
          )}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-300" />
            <input
              type="text"
              placeholder="Projekt suchen..."
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
          {phases.length > 0 && (
            <div className="relative">
              <select
                value={filterPhase}
                onChange={(e) => setFilterPhase(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2.5 bg-white rounded-2xl text-sm border border-brand-gray-100 focus:outline-none focus:border-brand-yellow shadow-card text-brand-gray-500 font-medium"
              >
                <option value="">Alle</option>
                {phases.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-brand-gray-100 rounded-3xl flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-brand-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-brand-gray-500">
                {search || filterPhase ? "Keine Treffer" : "Keine Projekte"}
              </p>
              <p className="text-sm text-brand-gray-300 mt-1">
                {search || filterPhase ? "Filter anpassen" : canCreate ? "Erstelle dein erstes Projekt" : "Noch keine Projekte vorhanden"}
              </p>
            </div>
            {canCreate && !search && !filterPhase && (
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                Projekt erstellen
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Neues Projekt">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Projektname *"
            placeholder="z.B. 2026-01 Reusszopf Luzern"
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
          {users.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-brand-gray-600">Projektleiter</label>
              <select
                value={form.projectLeaderId}
                onChange={(e) => {
                  const selected = users.find((u) => u.uid === e.target.value);
                  setForm({
                    ...form,
                    projectLeaderId: e.target.value,
                    projectLeaderName: selected?.displayName || "",
                  });
                }}
                className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow border-none"
              >
                <option value="">Kein Projektleiter</option>
                {users
                  .filter((u) => u.role === "employee" || u.role === "admin")
                  .map((u) => (
                    <option key={u.uid} value={u.uid}>{u.displayName}</option>
                  ))}
              </select>
            </div>
          )}
          <Input
            label="Beschreibung (optional)"
            placeholder="Kurze Projektbeschreibung..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={creating} disabled={!form.name.trim()}>
              Erstellen
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
