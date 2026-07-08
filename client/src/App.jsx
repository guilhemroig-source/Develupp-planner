import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Lightbulb,
  FileText,
  Video,
  Scissors,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Youtube,
  Linkedin,
  Music2,
  Trash2,
  Sparkles,
  ChevronRight as ArrowStage,
} from "lucide-react";

// ---------- Content model ----------

const PILLARS = [
  {
    id: "coulisses",
    label: "Coulisses",
    color: "indigo",
    ideas: [
      "Time-lapse : d'une maquette Figma à un site en ligne",
      "Une journée type dans notre agence, caméra à l'épaule",
      "On répond en direct à un bug trouvé en prod",
      "Le debrief d'équipe du lundi matin, sans filtre",
      "Notre setup de travail : écrans, outils, café",
    ],
  },
  {
    id: "avant-apres",
    label: "Avant / Après",
    color: "teal",
    ideas: [
      "Refonte express : le site d'un client, avant/après en 5 secondes",
      "Ce commerçant avait un site de 2014... voici la suite",
      "De 3 pages statiques à une vraie boutique en ligne",
      "Le contraste : ancien menu illisible vs nouvelle interface",
      "Un logo fait maison vs une identité travaillée : le match",
    ],
  },
  {
    id: "tips",
    label: "Tips & Astuces",
    color: "amber",
    ideas: [
      "3 signes que ton site fait fuir tes visiteurs en 5 secondes",
      "Pourquoi un site à 200€ finit toujours par coûter plus cher",
      "Le test à faire pour savoir si ton site est trop lent",
      "Ce que Google regarde vraiment avant de te classer",
      "Le bouton \"Contact\" que personne ne trouve : comment l'éviter",
    ],
  },
  {
    id: "etudes-cas",
    label: "Études de cas",
    color: "rose",
    ideas: [
      "Comment ce client est passé de 2 à 15 demandes de devis par mois",
      "La refonte qui a fait doubler le temps passé sur le site",
      "Ce qu'on a changé pour qu'un client arrête de perdre des ventes en ligne",
      "Le brief initial vs le résultat final, expliqué",
      "3 chiffres qui montrent l'impact d'une bonne refonte",
    ],
  },
  {
    id: "mythes",
    label: "Mythes & Réalités",
    color: "violet",
    ideas: [
      "Non, l'IA ne remplace pas un développeur (pas encore)",
      "Le no-code peut-il vraiment remplacer du sur-mesure ?",
      "\"Un site ça se fait en un week-end\" : vrai ou faux ?",
      "Pourquoi \"juste ajouter un bouton\" n'est jamais \"juste\"",
      "Le mythe du site qui se réfère tout seul sur Google",
    ],
  },
  {
    id: "stack",
    label: "Stack & Outils",
    color: "cyan",
    ideas: [
      "Notre stack technique expliquée en 60 secondes",
      "3 outils qu'on utilise tous les jours en agence",
      "Comment on organise un projet du brief à la mise en ligne",
      "Ce qu'on regarde avant de choisir une techno pour un client",
      "L'outil qui nous fait gagner 2h par semaine",
    ],
  },
  {
    id: "equipe",
    label: "Équipe & Culture",
    color: "orange",
    ideas: [
      "Pourquoi on a lancé Develupp",
      "Les coulisses d'un rendez-vous client, de A à Z",
      "Ce qu'on aime (et ce qu'on déteste) dans ce métier",
      "Une erreur qu'on a faite et ce qu'on en a appris",
      "Le portrait rapide de l'équipe Develupp",
    ],
  },
];

const STAGES = [
  { id: "idea", label: "Idée", icon: Lightbulb },
  { id: "draft", label: "Script", icon: FileText },
  { id: "shoot", label: "Tournage", icon: Video },
  { id: "edit", label: "Montage", icon: Scissors },
  { id: "published", label: "Publié", icon: CheckCircle2 },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Music2 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "youtube", label: "YouTube", icon: Youtube },
];

const COLOR_MAP = {
  indigo: {
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    left: "border-l-indigo-500",
    ring: "ring-indigo-500",
    solid: "bg-indigo-600 hover:bg-indigo-700",
  },
  teal: {
    dot: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    left: "border-l-teal-500",
    ring: "ring-teal-500",
    solid: "bg-teal-600 hover:bg-teal-700",
  },
  amber: {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    left: "border-l-amber-500",
    ring: "ring-amber-500",
    solid: "bg-amber-500 hover:bg-amber-600",
  },
  rose: {
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    left: "border-l-rose-500",
    ring: "ring-rose-500",
    solid: "bg-rose-600 hover:bg-rose-700",
  },
  violet: {
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    left: "border-l-violet-500",
    ring: "ring-violet-500",
    solid: "bg-violet-600 hover:bg-violet-700",
  },
  cyan: {
    dot: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    left: "border-l-cyan-500",
    ring: "ring-cyan-500",
    solid: "bg-cyan-600 hover:bg-cyan-700",
  },
  orange: {
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    left: "border-l-orange-500",
    ring: "ring-orange-500",
    solid: "bg-orange-600 hover:bg-orange-700",
  },
  slate: {
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    left: "border-l-slate-400",
    ring: "ring-slate-400",
    solid: "bg-slate-700 hover:bg-slate-800",
  },
};

const STAGE_BADGE = {
  idea: "bg-slate-100 text-slate-600 border-slate-200",
  draft: "bg-indigo-100 text-indigo-700 border-indigo-200",
  shoot: "bg-amber-100 text-amber-700 border-amber-200",
  edit: "bg-violet-100 text-violet-700 border-violet-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const HG_STATUS_STYLE = {
  queued: "bg-amber-100 text-amber-700",
  processing: "bg-amber-100 text-amber-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  succeeded: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  error: "bg-rose-100 text-rose-700",
};

function hgBadgeClass(status) {
  return HG_STATUS_STYLE[status] || "bg-slate-100 text-slate-500";
}

const PILLAR_VISUAL_HINTS = {
  coulisses:
    "ambiance coulisses d'agence tech : écrans de code, développeur au clavier, lumière naturelle de bureau",
  "avant-apres":
    "transition dynamique entre une ancienne interface datée et un site moderne épuré affiché à l'écran",
  tips: "gros plan sur une interface web moderne, curseur qui interagit avec l'écran, ambiance pédagogique claire",
  "etudes-cas":
    "écran affichant des statistiques de croissance qui montent, ambiance succès professionnel",
  mythes:
    "contraste visuel entre une idée reçue et la réalité, montage explicatif dynamique",
  stack:
    "montage d'icônes et de logos d'outils tech qui apparaissent à l'écran, ambiance moderne et énergique",
  equipe:
    "équipe qui travaille ensemble dans un espace de coworking lumineux, ambiance chaleureuse et professionnelle",
};

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function pillarOf(id) {
  return PILLARS.find((p) => p.id === id) || PILLARS[0];
}

function shortHash() {
  return Math.random().toString(16).slice(2, 8);
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyItem(date) {
  return {
    id: `${Date.now()}-${shortHash()}`,
    hash: shortHash(),
    title: "",
    pillarId: PILLARS[0].id,
    stage: "idea",
    date: date || null,
    platform: "instagram",
    notes: "",
    higgsfield: { prompt: "", jobId: null, status: null, videoUrl: null, error: null },
  };
}

function buildPromptForItem(item) {
  const pillar = pillarOf(item.pillarId);
  const hint = PILLAR_VISUAL_HINTS[pillar.id] || "";
  const parts = [
    "Vidéo verticale 9:16 pour Instagram/TikTok, identité visuelle agence tech moderne (bleu indigo, blanc, épuré).",
    hint ? hint + "." : "",
    item.title ? `Sujet : ${item.title}.` : "",
    item.notes ? `Détails : ${item.notes}.` : "",
    "Mouvement de caméra fluide, montage dynamique, 5 à 8 secondes.",
  ].filter(Boolean);
  return parts.join(" ");
}

// ---------- Backend API helper ----------

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 401) {
    const err = new Error("unauthorized");
    err.unauthorized = true;
    throw err;
  }
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    // no JSON body
  }
  if (!res.ok) {
    throw new Error(body?.error || `Erreur (${res.status})`);
  }
  return body;
}

// ---------- Login gate ----------

function LoginScreen({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/login", { method: "POST", body: JSON.stringify({ password }) });
      onSuccess();
    } catch (e) {
      setError(e.message || "Mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-lg p-6 w-full max-w-sm">
        <h1 className="font-mono text-lg font-bold text-slate-900 mb-1">develupp / planning</h1>
        <p className="text-sm text-slate-400 mb-4">Accès protégé.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Mot de passe"
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
          autoFocus
        />
        {error && <p className="text-xs text-rose-500 mb-3">{error}</p>}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-md py-2 transition-colors"
        >
          {loading ? "Connexion…" : "Entrer"}
        </button>
      </div>
    </div>
  );
}

// ---------- Root ----------

export default function App() {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => setAuthed(res.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-mono text-sm">
        chargement…
      </div>
    );
  }
  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;
  return <DevelupContentPlanner />;
}

// ---------- Main app ----------

function DevelupContentPlanner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [hgConnected, setHgConnected] = useState(null);
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dayPanelDate, setDayPanelDate] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [generated, setGenerated] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/api/items");
        setItems(data);
      } catch (e) {
        setBanner({ type: "error", text: "Chargement échoué : " + e.message });
      } finally {
        setLoading(false);
      }
    })();

    apiFetch("/api/higgsfield/auth/status")
      .then((r) => setHgConnected(r.connected))
      .catch(() => setHgConnected(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get("higgsfield") === "connected") {
      setBanner({ type: "success", text: "Higgsfield est connecté." });
      setHgConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("higgsfield_error")) {
      setBanner({
        type: "error",
        text: `Connexion Higgsfield échouée : ${params.get("higgsfield_error")}`,
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function persistItem(item) {
    try {
      await apiFetch("/api/items", { method: "POST", body: JSON.stringify(item) });
    } catch (e) {
      setBanner({ type: "error", text: "Sauvegarde échouée : " + e.message });
    }
  }

  function saveItem(item) {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item];
    });
    setEditingItem(null);
    persistItem(item);
  }

  async function deleteItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setEditingItem(null);
    try {
      await apiFetch(`/api/items/${id}`, { method: "DELETE" });
    } catch (e) {
      setBanner({ type: "error", text: "Suppression échouée : " + e.message });
    }
  }

  function addGeneratedToBacklog(pillarId, text) {
    const item = emptyItem(null);
    item.title = text;
    item.pillarId = pillarId;
    item.stage = "idea";
    setItems((prev) => [...prev, item]);
    persistItem(item);
  }

  function generateIdea(pillar) {
    const pool = pillar.ideas;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && generated[pillar.id] === pick) {
      const rest = pool.filter((t) => t !== pick);
      pick = rest[Math.floor(Math.random() * rest.length)];
    }
    setGenerated((prev) => ({ ...prev, [pillar.id]: pick }));
  }

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.id] = items.filter((i) => i.stage === s.id).length;
    return acc;
  }, {});

  const backlogItems = items.filter((i) => !i.date).sort((a, b) => (a.title > b.title ? 1 : -1));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-t-lg px-4 py-2.5 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 font-mono text-xs text-slate-400">develupp — content-pipeline</span>
        </div>
        <div className="bg-white border-x border-b border-slate-200 rounded-b-lg px-4 sm:px-6 py-5 mb-4">
          <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Develupp <span className="text-indigo-600">/</span> planning contenu
          </h1>
          <p className="font-mono text-xs text-slate-400 mt-1">$ social --pillars=7 --branch=main</p>

          <div className="mt-5 flex items-center overflow-x-auto pb-1 gap-1">
            {STAGES.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${STAGE_BADGE[s.id]}`}>
                    <Icon size={13} />
                    <span>{s.label}</span>
                    <span className="font-mono font-semibold">{stageCounts[s.id]}</span>
                  </div>
                  {idx < STAGES.length - 1 && <ArrowStage size={14} className="text-slate-300 mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {banner && (
          <div
            className={`mb-4 rounded-md border px-3 py-2 text-xs font-mono ${
              banner.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            {banner.text}
          </div>
        )}

        {hgConnected === false && (
          <a
            href="/api/higgsfield/auth/start"
            className="mb-4 flex items-center justify-between gap-2 bg-indigo-50 border border-indigo-200 rounded-md px-3 py-2.5 text-xs text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <span>Higgsfield n'est pas encore connecté à cette app.</span>
            <span className="font-medium whitespace-nowrap">Connecter →</span>
          </a>
        )}

        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 rounded-t-lg font-mono text-sm font-medium border-t border-x transition-colors ${
              activeTab === "calendar"
                ? "bg-white border-slate-200 text-indigo-600"
                : "bg-slate-100 border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            calendrier.tsx
          </button>
          <button
            onClick={() => setActiveTab("ideas")}
            className={`px-4 py-2 rounded-t-lg font-mono text-sm font-medium border-t border-x transition-colors ${
              activeTab === "ideas"
                ? "bg-white border-slate-200 text-indigo-600"
                : "bg-slate-100 border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            idees.tsx
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-400 font-mono text-sm">
            chargement du pipeline…
          </div>
        ) : activeTab === "calendar" ? (
          <CalendarView
            items={items}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            onDayClick={(iso) => setDayPanelDate(iso)}
          />
        ) : (
          <IdeasView
            generated={generated}
            onGenerate={generateIdea}
            onAdd={addGeneratedToBacklog}
            backlogItems={backlogItems}
            onEditItem={(item) => setEditingItem(item)}
            onNewBacklogItem={() => setEditingItem(emptyItem(null))}
          />
        )}
      </div>

      {dayPanelDate && !editingItem && (
        <DayPanel
          dateISO={dayPanelDate}
          items={items.filter((i) => i.date === dayPanelDate)}
          onClose={() => setDayPanelDate(null)}
          onAdd={() => setEditingItem(emptyItem(dayPanelDate))}
          onEdit={(item) => setEditingItem(item)}
        />
      )}

      {editingItem && (
        <ItemModal
          item={editingItem}
          onCancel={() => setEditingItem(null)}
          onSave={saveItem}
          onDelete={deleteItem}
          isNew={!items.some((i) => i.id === editingItem.id)}
        />
      )}
    </div>
  );
}

// ---------- Calendar ----------

function CalendarView({ items, currentMonth, setCurrentMonth, onDayClick }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISODate(new Date());

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const itemsByDate = {};
  items.forEach((i) => {
    if (!i.date) return;
    if (!itemsByDate[i.date]) itemsByDate[i.date] = [];
    itemsByDate[i.date].push(i);
  });

  function shiftMonth(delta) {
    setCurrentMonth(new Date(year, month + delta, 1));
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200">
        <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" aria-label="Mois précédent">
          <ChevronLeft size={18} />
        </button>
        <div className="font-mono text-sm font-semibold text-slate-800">
          {MONTHS_FR[month]} {year}
        </div>
        <button onClick={() => shiftMonth(1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" aria-label="Mois suivant">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center text-[11px] font-mono font-medium text-slate-400 py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="min-h-[84px] sm:min-h-[104px] bg-slate-50 border-b border-r border-slate-100" />;
          }
          const iso = toISODate(new Date(year, month, day));
          const dayItems = itemsByDate[iso] || [];
          const isToday = iso === todayISO;
          return (
            <button
              key={idx}
              onClick={() => onDayClick(iso)}
              className="min-h-[84px] sm:min-h-[104px] border-b border-r border-slate-100 p-1.5 text-left hover:bg-indigo-50/50 transition-colors flex flex-col"
            >
              <span
                className={`text-xs font-mono w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? "bg-indigo-600 text-white font-semibold" : "text-slate-500"
                }`}
              >
                {day}
              </span>
              <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                {dayItems.slice(0, 2).map((it) => {
                  const c = COLOR_MAP[pillarOf(it.pillarId).color];
                  return (
                    <div key={it.id} className={`text-[10px] leading-tight border-l-2 ${c.left} bg-slate-50 px-1 py-0.5 truncate text-slate-600`}>
                      {it.title || "(sans titre)"}
                    </div>
                  );
                })}
                {dayItems.length > 2 && (
                  <div className="text-[10px] text-slate-400 font-mono px-1">
                    +{dayItems.length - 2} autre{dayItems.length - 2 > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Day panel ----------

function DayPanel({ dateISO, items, onClose, onAdd, onEdit }) {
  const d = new Date(dateISO + "T00:00:00");
  const label = `${d.getDate()} ${MONTHS_FR[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-2xl border border-slate-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="font-mono text-sm font-semibold text-slate-800 capitalize">{label}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-slate-400 font-mono py-4 text-center">rien de prévu ce jour-là.</p>
          )}
          {items.map((it) => (
            <CommitCard key={it.id} item={it} onClick={() => onEdit(it)} />
          ))}
        </div>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Ajouter un contenu
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Commit-style item card ----------

function CommitCard({ item, onClick }) {
  const pillar = pillarOf(item.pillarId);
  const c = COLOR_MAP[pillar.color];
  const stage = STAGES.find((s) => s.id === item.stage) || STAGES[0];
  const StageIcon = stage.icon;
  const platform = PLATFORMS.find((p) => p.id === item.platform);
  const PlatformIcon = platform ? platform.icon : Instagram;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border border-slate-200 border-l-4 ${c.left} rounded-md px-3 py-2.5 hover:bg-slate-50 transition-colors`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-slate-400">#{item.hash}</span>
        <span className={`flex items-center gap-1 text-[10px] font-medium rounded-full border px-2 py-0.5 ${STAGE_BADGE[item.stage]}`}>
          <StageIcon size={11} />
          {stage.label}
        </span>
      </div>
      <p className="text-sm text-slate-800 mt-1 leading-snug">{item.title || "(sans titre)"}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />
        <span className="text-[11px] text-slate-400">{pillar.label}</span>
        <PlatformIcon size={12} className="text-slate-400 ml-auto" />
      </div>
      {item.higgsfield?.jobId && (
        <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono rounded px-1.5 py-0.5 ${hgBadgeClass(item.higgsfield.status)}`}>
          <Sparkles size={10} /> higgsfield · {item.higgsfield.status || "…"}
        </div>
      )}
    </button>
  );
}

// ---------- Ideas view ----------

function IdeasView({ generated, onGenerate, onAdd, backlogItems, onEditItem, onNewBacklogItem }) {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-3">
        {PILLARS.map((pillar) => {
          const c = COLOR_MAP[pillar.color];
          const idea = generated[pillar.id];
          return (
            <div key={pillar.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <h3 className="font-mono text-sm font-semibold text-slate-800">{pillar.label}</h3>
              </div>
              <p className="text-sm text-slate-600 min-h-[40px]">{idea || "Génère une idée pour ce pilier."}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onGenerate(pillar)}
                  className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Sparkles size={13} /> Générer
                </button>
                {idea && (
                  <button
                    onClick={() => onAdd(pillar.id, idea)}
                    className={`flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 text-white transition-colors ${c.solid}`}
                  >
                    <Plus size={13} /> Ajouter au backlog
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-mono text-sm font-semibold text-slate-800">
            Backlog <span className="text-slate-400 font-normal">({backlogItems.length})</span>
          </h3>
          <button onClick={onNewBacklogItem} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            <Plus size={14} /> Nouvelle idée
          </button>
        </div>
        <div className="p-4 space-y-2">
          {backlogItems.length === 0 && (
            <p className="text-sm text-slate-400 font-mono py-6 text-center">
              backlog vide — génère une idée ci-dessus ou ajoute la tienne.
            </p>
          )}
          {backlogItems.map((it) => (
            <CommitCard key={it.id} item={it} onClick={() => onEditItem(it)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Add / edit modal ----------

function ItemModal({ item, onCancel, onSave, onDelete, isNew }) {
  const [draft, setDraft] = useState(item);
  const [confirmLaunch, setConfirmLaunch] = useState(false);
  const [hgLoading, setHgLoading] = useState(false);

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function setHg(field, value) {
    setDraft((d) => ({ ...d, higgsfield: { ...(d.higgsfield || {}), [field]: value } }));
  }

  async function handleLaunch() {
    setHgLoading(true);
    try {
      // make sure the item exists server-side before referencing its id
      await apiFetch("/api/items", { method: "POST", body: JSON.stringify(draft) });
      const promptText = draft.higgsfield?.prompt || buildPromptForItem(draft);
      const result = await apiFetch("/api/higgsfield/generate", {
        method: "POST",
        body: JSON.stringify({ itemId: draft.id, prompt: promptText }),
      });
      if (result.error) {
        setHg("error", result.error);
      } else {
        setDraft((d) => ({
          ...d,
          higgsfield: { ...(d.higgsfield || {}), prompt: promptText, jobId: result.job_id, status: result.status, videoUrl: null, error: null },
        }));
      }
    } catch (e) {
      setHg("error", e.message || "Échec de la génération.");
    } finally {
      setHgLoading(false);
      setConfirmLaunch(false);
    }
  }

  async function handleCheckStatus() {
    setHgLoading(true);
    try {
      const result = await apiFetch("/api/higgsfield/status", {
        method: "POST",
        body: JSON.stringify({ itemId: draft.id, jobId: draft.higgsfield.jobId }),
      });
      if (result.error) {
        setHg("error", result.error);
      } else {
        setDraft((d) => ({
          ...d,
          higgsfield: { ...(d.higgsfield || {}), status: result.status, videoUrl: result.video_url || null, error: null },
        }));
      }
    } catch (e) {
      setHg("error", e.message || "Échec de la vérification.");
    } finally {
      setHgLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="font-mono text-sm font-semibold text-slate-800">{isNew ? "git commit -m" : `#${draft.hash}`}</h2>
          <button onClick={onCancel} className="p-1 rounded hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-slate-500 font-mono">Titre</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex: Time-lapse maquette → site en ligne"
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 font-mono">Pilier</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PILLARS.map((p) => {
                const c = COLOR_MAP[p.color];
                const active = draft.pillarId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => set("pillarId", p.id)}
                    className={`flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 transition-colors ${
                      active ? c.badge + " ring-1 " + c.ring : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 font-mono">Étape</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {STAGES.map((s) => {
                const Icon = s.icon;
                const active = draft.stage === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => set("stage", s.id)}
                    className={`flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 transition-colors ${
                      active ? STAGE_BADGE[s.id] + " ring-1 ring-current" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={12} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 font-mono">Plateforme</label>
              <select
                value={draft.platform}
                onChange={(e) => set("platform", e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 font-mono">Date</label>
              <input
                type="date"
                value={draft.date || ""}
                onChange={(e) => set("date", e.target.value || null)}
                className="mt-1 w-full border border-slate-200 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 font-mono">Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Script, angle, musique, call-to-action…"
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-500 font-mono flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-500" /> Génération Higgsfield
              </label>
              {draft.higgsfield?.jobId && (
                <span className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${hgBadgeClass(draft.higgsfield.status)}`}>
                  {draft.higgsfield.status || "…"}
                </span>
              )}
            </div>

            <textarea
              value={draft.higgsfield?.prompt || buildPromptForItem(draft)}
              onChange={(e) => setHg("prompt", e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            {!draft.higgsfield?.jobId ? (
              confirmLaunch ? (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-xs text-amber-800 mb-2">
                    Ça va lancer une génération réelle (kling3_0_turbo, 9:16) et consommer des crédits Higgsfield. Confirmer ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmLaunch(false)}
                      className="flex-1 text-xs py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleLaunch}
                      disabled={hgLoading}
                      className="flex-1 text-xs py-1.5 rounded bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium transition-colors"
                    >
                      {hgLoading ? "Lancement…" : "Confirmer et lancer"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmLaunch(true)}
                  disabled={!draft.title.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-medium border border-indigo-200 text-indigo-600 rounded-md py-2 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Sparkles size={13} /> Lancer sur Higgsfield
                </button>
              )
            ) : (
              <div className="mt-2 space-y-1.5">
                <p className="text-[11px] font-mono text-slate-400">job #{draft.higgsfield.jobId.slice(0, 8)}</p>
                {draft.higgsfield.videoUrl ? (
                  <>
                    <a
                      href={draft.higgsfield.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-2 transition-colors"
                    >
                      Voir / télécharger le clip
                    </a>
                    <p className="text-[11px] text-slate-400">Télécharge le clip pour l'intégrer à ton pipeline ffmpeg.</p>
                  </>
                ) : (
                  <button
                    onClick={handleCheckStatus}
                    disabled={hgLoading}
                    className="w-full text-xs font-medium border border-slate-200 rounded-md py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                  >
                    {hgLoading ? "Vérification…" : "Actualiser le statut"}
                  </button>
                )}
              </div>
            )}

            {draft.higgsfield?.error && <p className="mt-1.5 text-[11px] text-rose-500">{draft.higgsfield.error}</p>}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-2">
          {!isNew && (
            <button
              onClick={() => onDelete(draft.id)}
              className="p-2.5 rounded-md border border-slate-200 text-rose-500 hover:bg-rose-50 transition-colors"
              aria-label="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={!draft.title.trim()}
            className="flex-1 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
