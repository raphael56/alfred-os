"use client";

import { useEffect, useState } from "react";
import { getCrons, createCron, toggleCron, deleteCron, type AlfredCron } from "@/lib/alfred";

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function AlfredCronsPage() {
  const [crons, setCrons] = useState<AlfredCron[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", schedule: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    getCrons()
      .then(setCrons)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.schedule || !form.description) return;
    setSaving(true);
    try {
      await createCron(form);
      setForm({ name: "", schedule: "", description: "" });
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await toggleCron(id, !enabled);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce cron ?")) return;
    try {
      await deleteCron(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crons</h1>
          <p className="text-gray-500 text-sm mt-0.5">Jobs récurrents d'Alfred</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Nouveau cron
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-purple-500/30 bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-medium text-purple-300">Nouveau cron</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nom (ex: daily_report)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500 placeholder-gray-600"
              required
            />
            <input
              type="text"
              placeholder="Schedule (ex: daily 09:00, every 30m)"
              value={form.schedule}
              onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500 placeholder-gray-600"
              required
            />
          </div>
          <textarea
            placeholder="Description de la tâche à exécuter"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500 placeholder-gray-600 resize-none"
            required
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-300 px-4 py-2 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-gray-500 text-sm">Chargement...</p>}

      <div className="space-y-3">
        {crons.length === 0 && !loading && (
          <p className="text-gray-600 text-sm">Aucun cron configuré.</p>
        )}
        {crons.map((c) => (
          <div key={c.id} className={`rounded-xl border bg-gray-900 p-5 transition-colors ${c.enabled ? "border-purple-500/20" : "border-gray-800 opacity-60"}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-100 text-sm">{c.name}</span>
                  <code className="text-xs bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded">{c.schedule}</code>
                  {!c.enabled && <span className="text-xs text-gray-600">désactivé</span>}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-1">
                  <span>Exécutions: {c.run_count}</span>
                  <span>Dernier run: {fmt(c.last_run)}</span>
                  <span>Prochain: {fmt(c.next_run)}</span>
                  {c.last_status && (
                    <span className={c.last_status === "ok" ? "text-green-500" : "text-red-500"}>
                      Statut: {c.last_status}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(c.id, c.enabled)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    c.enabled
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-purple-600/20 hover:bg-purple-600/40 text-purple-300"
                  }`}
                >
                  {c.enabled ? "Désactiver" : "Activer"}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs text-red-500/70 hover:text-red-400 px-2 py-1.5 transition-colors"
                >
                  Suppr.
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
