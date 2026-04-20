"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Image as ImageIcon, Search, X, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button, Modal, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { getProjects, createProject, getUsers } from "@/lib/db";
import { Project, AppUser } from "@/types";
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
          {project.projectNumber && (
            <div className="absolute top-3 left-3">
              <span className="bg-brand-black/70 text-white text-xs font-bold px-2 py-1 rounded-lg">
                #{project.projectNumber}
              </span>
            </div>
          )}
        </div>
        <div className="p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-brand-black truncate text-base">{project.name}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {project.location && (
                <p className="text-xs text-brand-gray-400">{project.location}</p>
              )}
              {project.location && project.projectLeaderName && (
                <span className="text-xs text-brand-gray-300">·</span>
              )}
              {project.projectLeaderName && (
                <p className="text-xs text-brand-gray-400">{project.projectLeaderName}</p>
              )}
              {!project.location && !project.projectLeaderName && (
                <p className="text-xs text-brand-gray-400">{formatDateShort(project.createdAt)}</p>
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

type SortMode = "name" | "number";
type SortDirection = "asc" | "desc";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ projectNumber: "", name: "", location: "", description: "", projectLeaderId: "", projectLeaderName: "" });
  const [search, setSearch] = useState("");
  const [filterLeader, setFilterLeader] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("number");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const defaultFilterApplied = useRef(false);

  const isManager = user?.role === "admin" || user?.role === "projektleiter";

  // Standardmässig auf die Projekte des eingeloggten Nutzers filtern.
  // Marketing-Rolle ausgenommen (hat typischerweise keine eigenen Projekte).
  // Der User kann den Filter jederzeit manuell ändern — danach bleibt die Auswahl bestehen.
  useEffect(() => {
    if (user && !defaultFilterApplied.current) {
      if (user.role !== "marketing") {
        setFilterLeader(user.uid);
      }
      defaultFilterApplied.current = true;
    }
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, userList] = await Promise.all([
        getProjects(),
        isManager ? getUsers() : Promise.resolve([]),
      ]);
      setProjects(data);
      setUsers(userList as AppUser[]);
    } catch {
      toast("Fehler beim Laden", "error");
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  // Load once auth is ready
  useEffect(() => { if (!authLoading && user) load(); }, [user, authLoading]);

  // Reload every time the page becomes visible (navigating back from detail)
  useEffect(() => {
    const onVisible = () => { if (!document.hidden && user && !authLoading) load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load, user, authLoading]);

  const leaders = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => {
      if (p.projectLeaderId && p.projectLeaderName) {
        map.set(p.projectLeaderId, p.projectLeaderName);
      }
    });
    return Array.from(map.entries()) as [string, string][];
  }, [projects]);

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.projectNumber && p.projectNumber.toLowerCase().includes(search.toLowerCase()));
      const matchLeader = !filterLeader || p.projectLeaderId === filterLeader;
      return matchSearch && matchLeader;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortMode === "number") {
        const na = a.projectNumber || "";
        const nb = b.projectNumber || "";
        cmp = na.localeCompare(nb, undefined, { numeric: true });
      } else {
        cmp = a.name.localeCompare(b.name);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return list;
  }, [projects, search, filterLeader, sortMode, sortDirection]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !user) return;
    setCreating(true);
    try {
      await createProject({
        projectNumber: form.projectNumber || undefined,
        name: form.name.trim(),
        location: form.location || undefined,
        description: form.description || undefined,
        userId: user.uid,
        userName: user.displayName,
        projectLeaderId: form.projectLeaderId || undefined,
        projectLeaderName: form.projectLeaderName || undefined,
      });
      toast("Projekt erstellt!", "success");
      setForm({ projectNumber: "", name: "", location: "", description: "", projectLeaderId: "", projectLeaderName: "" });
      setShowCreate(false);
      load();
    } catch {
      toast("Projekt konnte nicht erstellt werden", "error");
    } finally {
      setCreating(false);
    }
  };

  const canCreate = isManager;

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

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-300" />
          <input
            type="text"
            placeholder="Name oder Projektnummer suchen..."
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

        {/* Filter + Sort row */}
        <div className="flex gap-2 mb-4">
          {/* Projektleiter filter — always visible, options from users list (managers) or project data (all) */}
          <div className="relative flex-1">
            <select
              value={filterLeader}
              onChange={(e) => setFilterLeader(e.target.value)}
              style={{ WebkitAppearance: "none", MozAppearance: "none", appearance: "none", backgroundImage: "none" }}
              className="w-full appearance-none pl-3 pr-7 py-2.5 bg-white rounded-2xl text-sm border border-brand-gray-100 focus:outline-none focus:border-brand-yellow shadow-card text-brand-gray-500 font-medium"
            >
              <option value="">Alle Leiter</option>
              {(users.length > 0 ? users.map((u) => ({ uid: u.uid, displayName: u.displayName })) : leaders.map(([id, name]) => ({ uid: id, displayName: name }))).map((u) => (
                <option key={u.uid} value={u.uid}>{u.displayName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              style={{ WebkitAppearance: "none", MozAppearance: "none", appearance: "none", backgroundImage: "none" }}
              className="appearance-none pl-3 pr-7 py-2.5 bg-white rounded-2xl text-sm border border-brand-gray-100 focus:outline-none focus:border-brand-yellow shadow-card text-brand-gray-500 font-medium"
            >
              <option value="number">Nr.</option>
              <option value="name">A–Z</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray-400 pointer-events-none" />
          </div>

          {/* Sortierrichtung */}
          <button
            type="button"
            onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
            aria-label={sortDirection === "asc" ? "Aufsteigend — zu absteigend wechseln" : "Absteigend — zu aufsteigend wechseln"}
            title={sortDirection === "asc" ? "Aufsteigend" : "Absteigend"}
            className="px-3 py-2.5 bg-white rounded-2xl text-sm border border-brand-gray-100 focus:outline-none focus:border-brand-yellow shadow-card text-brand-gray-500 font-medium flex items-center justify-center active:scale-95 transition-transform"
          >
            {sortDirection === "asc" ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-brand-gray-100 rounded-3xl flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-brand-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-brand-gray-500">
                {search
                  ? "Keine Treffer"
                  : filterLeader && filterLeader === user?.uid
                    ? "Keine eigenen Projekte"
                    : filterLeader
                      ? "Keine Treffer"
                      : "Keine Projekte"}
              </p>
              <p className="text-sm text-brand-gray-300 mt-1">
                {canCreate && !search && !filterLeader
                  ? "Erstelle dein erstes Projekt"
                  : filterLeader && filterLeader === user?.uid
                    ? "Alle Projekte anzeigen?"
                    : "Filter anpassen"}
              </p>
            </div>
            {canCreate && !search && !filterLeader && (
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                Projekt erstellen
              </Button>
            )}
            {filterLeader && filterLeader === user?.uid && (
              <Button variant="ghost" onClick={() => setFilterLeader("")}>
                Alle Projekte anzeigen
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Neues Projekt">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Projektnummer"
            placeholder="z.B. 2026-01"
            value={form.projectNumber}
            onChange={(e) => setForm({ ...form, projectNumber: e.target.value })}
            autoFocus
          />
          <Input
            label="Projektname *"
            placeholder="z.B. Reusszopf Luzern"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Ort"
            placeholder="z.B. Luzern"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
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
                className="w-full px-4 py-3 bg-brand-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              >
                <option value="">Kein Projektleiter</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>{u.displayName}</option>
                ))}
              </select>
            </div>
          )}
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
