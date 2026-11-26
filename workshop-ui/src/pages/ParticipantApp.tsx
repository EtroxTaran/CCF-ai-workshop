import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  FolderArchive,
  FolderOpen,
  Globe,
  HelpCircle,
  Layers,
  LayoutGrid,
  Monitor,
  Network,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { ArchitectureLayerStack } from "@/components/ArchitectureLayerStack";
import { CopyButton } from "@/components/CopyButton";
import { ObsidianKnowledgeGraph } from "@/components/ObsidianKnowledgeGraph";
import { PromptMethodComparator } from "@/components/PromptMethodComparator";
import { StageArtifactsSheet } from "@/components/StageArtifactsSheet";
import { StageBackdrop } from "@/components/StageBackdrop";
import { StageMiniDiagram } from "@/components/StageMiniDiagram";
import { Virtual7Logo } from "@/components/Virtual7Logo";
import { AudioGuideChip } from "@/components/guidance/AudioGuideChip";
import { ByouRuleBuilder } from "@/components/guidance/ByouRuleBuilder";
import { GlossaryTip } from "@/components/guidance/GlossaryTip";
import { GuardrailDebugChallenge } from "@/components/guidance/GuardrailDebugChallenge";
import { GuardrailShieldAnimatic } from "@/components/guidance/GuardrailShieldAnimatic";
import { HeroBeforeAfterAnimatic } from "@/components/guidance/HeroBeforeAfterAnimatic";
import {
  HelpFaqSheet,
  REPO_ZIP_URL,
  WEB_CHAT_LINKS,
} from "@/components/guidance/HelpFaqSheet";
import { McpPacketAnimatic } from "@/components/guidance/McpPacketAnimatic";
import {
  ONBOARDING_STORAGE_KEY,
  OnboardingTour,
} from "@/components/guidance/OnboardingTour";
import { ToolHotspotGuide } from "@/components/guidance/ToolHotspotGuide";
import { Stage3AgentWalkPlayer } from "@/components/guidance/WalkthroughPlayers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  buildAllArticlesMarkdown,
  downloadMarkdownFile,
} from "@/lib/exportCorpusMd";
import {
  DEFAULT_MODULE_ID,
  fetchModuleData,
  fetchModuleSearchIndex,
  moduleStorageKeys,
} from "@/lib/moduleLoader";
import { offlineSearchVault, offlineVerifyClaim } from "@/lib/offlineSearch";
import type {
  CorpusSearchIndex,
  EvidenceMatch,
  ToolMode,
  VerifyClaimResult,
  WorkshopDataset,
  WorkshopStepId,
} from "@/types/workshop";

const VALID_STEPS = new Set<WorkshopStepId>(["start", "methods", "stages", "paths"]);
const VALID_MODES = new Set<ToolMode>(["web", "desktop", "agent"]);

interface PersistedUiState {
  step: WorkshopStepId;
  toolMode: ToolMode;
  checked: Record<string, boolean>;
  reflections: Record<string, boolean>;
  showAllQuestions: boolean;
  activeStageIdx: number;
}

function parseHashStep(moduleId: string): WorkshopStepId | null {
  if (typeof window === "undefined") return null;
  const rawHash = window.location.hash;
  if (!rawHash || rawHash === "#" || rawHash === "#/") return null;
  if (/^#\/(?:hub|beamer)(?:[/?#]|$)/.test(rawHash)) return null;
  const modMatch = rawHash.match(/^#\/m\/([^/]+)(?:\/([^/?#]+))?/);
  if (modMatch) {
    const sub = modMatch[2] as WorkshopStepId | undefined;
    if (modMatch[2] === "beamer") return null;
    return sub && VALID_STEPS.has(sub) ? sub : "start";
  }
  if (moduleId === DEFAULT_MODULE_ID) {
    const normalized = rawHash.replace(/^#\/?/, "") as WorkshopStepId;
    return VALID_STEPS.has(normalized) ? normalized : null;
  }
  return null;
}

function readInitialUiState(moduleId: string, stagesCount: number): PersistedUiState {
  const { storageKey, sessionKey } = moduleStorageKeys(moduleId);
  const defaults: PersistedUiState = {
    step: "start",
    toolMode: "web",
    checked: {},
    reflections: {},
    showAllQuestions: false,
    activeStageIdx: 0,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (VALID_MODES.has(parsed.toolMode)) defaults.toolMode = parsed.toolMode;
      if (parsed.checked && typeof parsed.checked === "object") defaults.checked = parsed.checked;
      if (parsed.reflections && typeof parsed.reflections === "object") {
        defaults.reflections = parsed.reflections;
      }
      if (typeof parsed.showAllQuestions === "boolean") {
        defaults.showAllQuestions = parsed.showAllQuestions;
      }
    }
    const sessionSaved = sessionStorage.getItem(sessionKey);
    if (sessionSaved) {
      const parsedSession = JSON.parse(sessionSaved);
      if (
        typeof parsedSession.step === "string" &&
        VALID_STEPS.has(parsedSession.step as WorkshopStepId)
      ) {
        defaults.step = parsedSession.step as WorkshopStepId;
      }
      if (
        typeof parsedSession.activeStageIdx === "number" &&
        parsedSession.activeStageIdx >= 0 &&
        parsedSession.activeStageIdx < stagesCount
      ) {
        defaults.activeStageIdx = parsedSession.activeStageIdx;
      }
    }
  } catch {
    // ignore storage errors
  }
  const hashStep = parseHashStep(moduleId);
  if (hashStep) {
    defaults.step = hashStep;
  }
  return defaults;
}

function renderInlineCode(text: string) {
  const parts = String(text || "").split(/(`[^`]+`)/g);
  return parts.map((part, idx) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={idx} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

function parseWikilink(raw: string, fallbackSlug: string, fallbackTitle?: string) {
  const m = String(raw || "").match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  if (m) return { slug: m[1], title: m[2] || fallbackTitle || m[1] };
  return { slug: fallbackSlug, title: fallbackTitle || fallbackSlug };
}

const STEP_ICONS: Record<WorkshopStepId, typeof Compass> = {
  start: Compass,
  methods: Layers,
  stages: BookOpen,
  paths: Sparkles,
};

const MODE_ICONS: Record<ToolMode, typeof Globe> = {
  web: Globe,
  desktop: FolderOpen,
  agent: Terminal,
};

const CHECKLIST_ITEMS: { id: string; stepId: WorkshopStepId; label: string }[] = [
  { id: "chk-setup", stepId: "start", label: "Werkzeug-Hilfe (Web-Chat, Desktop & Ordner oder Code-Agent) gewählt" },
  { id: "chk-methods", stepId: "methods", label: "Prompt-Methoden (Zero-Shot vs. CO-STAR/Few-Shot/RISEN) verglichen" },
  { id: "chk-rules", stepId: "methods", label: "Steuerungs-Ebenen & Kontext-Tank getestet" },
  { id: "chk-stages", stepId: "stages", label: "3-Stufen-Experiment inkl. Fangfrage & Quellen-Treue getestet" },
  { id: "chk-reflect", stepId: "stages", label: "Eigene Beobachtung per Reflexions-Pill festgehalten" },
  { id: "chk-path", stepId: "paths", label: "Praxis-Pfad oder Wissensbasis-Faktenprüfer ausprobiert" },
  { id: "chk-transfer", stepId: "paths", label: "Transfer-Brücke für die eigene Rolle angesehen" },
];

const REFLECTION_PILLS: { id: string; label: string; hint: string }[] = [
  {
    id: "ref-guessed",
    label: "KI hat geraten",
    hint: "In Stufe 1 ohne Regeln hat das Modell fehlende Fakten einfach ergänzt.",
  },
  {
    id: "ref-rejected",
    label: "Regel hat abgelehnt",
    hint: "In Stufe 2/3 hat der Guardrail die Fangfrage sauber abgefangen.",
  },
  {
    id: "ref-linked",
    label: "Belege sauber verknüpft",
    hint: "In Stufe 3 wurden Querverweise und Dateinamen transparent mitgeliefert.",
  },
];

export function ParticipantApp({ moduleId = DEFAULT_MODULE_ID }: { moduleId?: string }) {
  const [data, setData] = useState<WorkshopDataset | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [corpusIndex, setCorpusIndex] = useState<CorpusSearchIndex | null>(null);
  const indexPromiseRef = useRef<Promise<CorpusSearchIndex> | null>(null);

  const ensureCorpusIndex = useMemo(
    () => async () => {
      if (corpusIndex) return corpusIndex;
      if (!indexPromiseRef.current) {
        indexPromiseRef.current = fetchModuleSearchIndex(moduleId).then((loaded) => {
          setCorpusIndex(loaded);
          return loaded;
        });
      }
      return indexPromiseRef.current;
    },
    [corpusIndex, moduleId]
  );

  useEffect(() => {
    let active = true;
    setData(null);
    setLoadError(null);
    setCorpusIndex(null);
    indexPromiseRef.current = null;
    fetchModuleData(moduleId)
      .then((loaded) => {
        if (active) setData(loaded);
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Modul konnte nicht geladen werden.");
        }
      });
    return () => {
      active = false;
    };
  }, [moduleId]);

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <p className="text-lg font-bold text-destructive">{loadError}</p>
        <a
          href="#/hub"
          className="inline-flex h-9 items-center rounded-lg border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Zur Modul-Übersicht (Hub)
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Workshop-Modul wird geladen…
      </div>
    );
  }

  return (
    <ParticipantAppInner
      data={data}
      moduleId={moduleId}
      corpusIndex={corpusIndex}
      ensureCorpusIndex={ensureCorpusIndex}
    />
  );
}

function ParticipantAppInner({
  data,
  moduleId,
  corpusIndex,
  ensureCorpusIndex,
}: {
  data: WorkshopDataset;
  moduleId: string;
  corpusIndex: CorpusSearchIndex | null;
  ensureCorpusIndex: () => Promise<CorpusSearchIndex>;
}) {
  const prefersReduced = useReducedMotion();
  const { storageKey, sessionKey } = useMemo(() => moduleStorageKeys(moduleId), [moduleId]);
  const checklistItems = useMemo(
    () => data.checklistItems || CHECKLIST_ITEMS,
    [data.checklistItems]
  );
  const reflectionPills = useMemo(
    () => data.reflectionPills || REFLECTION_PILLS,
    [data.reflectionPills]
  );

  const [initialState] = useState<PersistedUiState>(() =>
    readInitialUiState(moduleId, data.stages.length)
  );
  const [step, setStep] = useState<WorkshopStepId>(initialState.step);
  const [toolMode, setToolMode] = useState<ToolMode>(initialState.toolMode);
  const [checked, setChecked] = useState<Record<string, boolean>>(initialState.checked);
  const [reflections, setReflections] = useState<Record<string, boolean>>(initialState.reflections);
  const [showAllQuestions, setShowAllQuestions] = useState<boolean>(
    initialState.showAllQuestions
  );
  const [activeStageIdx, setActiveStageIdx] = useState<number>(initialState.activeStageIdx);

  const [checklistOpen, setChecklistOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [showGraphEarly, setShowGraphEarly] = useState(false);
  const [graphSelectedSlug, setGraphSelectedSlug] = useState<string | undefined>(undefined);
  const [q4SimulatedMutated, setQ4SimulatedMutated] = useState(true);
  const [revealQ4Answer, setRevealQ4Answer] = useState(false);
  const [durationPreset, setDurationPreset] = useState<"self" | number>(
    () => data.durationPresets?.[0] ?? 45
  );
  const [activePathId, setActivePathId] = useState<string>(data.praxisPaths[0]?.id || "pfad-recherche");

  // Step 04 In-Browser Corpus Search & Claim Verifier state
  const [labTab, setLabTab] = useState<"search" | "verify">("search");
  const [mcpQuery, setMcpQuery] = useState(
    data.labPresets?.defaultQuery ||
      data.labPresets?.searchPresets?.[0] ||
      "Anemonenfische Seeanemonen Symbiose"
  );
  const [mcpResults, setMcpResults] = useState<EvidenceMatch[] | null>(null);
  const [verifyClaim, setVerifyClaim] = useState(
    data.labPresets?.verifyDefaultClaim ||
      "Eisbärentalg enthält kein Squalen und verhindert dadurch das Gefrieren des Fells."
  );
  const [verifyOutput, setVerifyOutput] = useState<VerifyClaimResult | null>(null);
  const [mcpActiveHop, setMcpActiveHop] = useState<number>(0);

  // Persist state in localStorage + sessionStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ toolMode, checked, reflections, showAllQuestions })
      );
      sessionStorage.setItem(sessionKey, JSON.stringify({ step, activeStageIdx }));
    } catch {
      // ignore storage errors
    }
  }, [storageKey, sessionKey, toolMode, checked, reflections, showAllQuestions, step, activeStageIdx]);

  // First-visit OnboardingTour auto-open
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    if (step !== "start") return;
    const t = window.setTimeout(() => setTourOpen(true), 450);
    return () => window.clearTimeout(t);
  }, [step]);

  // Hash synchronization
  useEffect(() => {
    function onHashChange() {
      const rawHash = window.location.hash;
      if (/^#\/(?:hub|(?:m\/[^/]+\/)?beamer)(?:[/?#]|$)/.test(rawHash)) return;
      if (moduleId === DEFAULT_MODULE_ID && (!rawHash || rawHash === "#" || rawHash === "#/")) {
        setStep("start");
        return;
      }
      const parsed = parseHashStep(moduleId);
      if (parsed) setStep(parsed);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [moduleId]);

  const methodsExpressPack = useMemo(
    () =>
      data.expressPackages.find((p) => p.id === "methods") || data.expressPackages[0],
    [data.expressPackages]
  );
  const stagesExpressPack = useMemo(
    () =>
      data.expressPackages.find((p) => p.id === "stages-arctic-reef") ||
      data.expressPackages[1] ||
      data.expressPackages[0],
    [data.expressPackages]
  );

  const stagePacks = useMemo(() => {
    const formatArticle = (a: (typeof data.starterArticles)[number]) =>
      `=== ${a.title} (${a.slug}.md) ===\n${a.content}\n[Quelle: ${a.slug}.md]`;
    const pick = (slugs: string[]) =>
      data.starterArticles
        .filter((a) => slugs.includes(a.slug))
        .map(formatArticle)
        .join("\n\n");
    const customPacks = (data.stagePackSpecs?.packs || []).map((item) => ({
      item,
      content: pick(item.slugs),
    }));
    return {
      arctic:
        customPacks[0]?.content ||
        pick(["eisbaer", "arktis", "ringelrobbe", "klimawandel"]),
      reef:
        customPacks[1]?.content ||
        pick([
          "anemonenfische",
          "seeanemonen",
          "symbiose",
          "steinkorallen",
          "korallenbleiche",
          "korallenriff",
        ]),
      customPacks,
      all12: data.starterArticles.map(formatArticle).join("\n\n"),
    };
  }, [data.stagePackSpecs?.packs, data.starterArticles]);

  const completedCount = useMemo(
    () => checklistItems.filter((item) => checked[item.id]).length,
    [checklistItems, checked]
  );
  const progressPct = Math.round((completedCount / checklistItems.length) * 100);

  function markChecked(id: string) {
    setChecked((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }

  function toggleCheck(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleReflection(id: string) {
    setReflections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (Object.values(next).some(Boolean)) {
        markChecked("chk-reflect");
      }
      return next;
    });
  }

  function goToStep(next: WorkshopStepId) {
    // Never clobber activeStageIdx when navigating between steps
    setStep(next);
    if (
      typeof window !== "undefined" &&
      !/^#\/(?:m\/[^/]+\/)?beamer(?:[/?#]|$)/.test(window.location.hash) &&
      !window.location.pathname.startsWith("/beamer")
    ) {
      const targetHash =
        moduleId === DEFAULT_MODULE_ID
          ? next === "start"
            ? "#/"
            : `#/${next}`
          : next === "start"
            ? `#/m/${moduleId}`
            : `#/m/${moduleId}/${next}`;
      window.history.replaceState(null, "", targetHash);
    }
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  }

  function resetProgress() {
    try {
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(sessionKey);
    } catch {
      // ignore
    }
    setToolMode("web");
    setChecked({});
    setReflections({});
    setShowAllQuestions(false);
    setActiveStageIdx(0);
    setShowGraphEarly(false);
    setStep("start");
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/beamer")
    ) {
      window.history.replaceState(
        null,
        "",
        moduleId === DEFAULT_MODULE_ID ? "#/" : `#/m/${moduleId}`
      );
    }
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  }

  function animatePipelinePulse() {
    if (prefersReduced) {
      setMcpActiveHop(4);
      return;
    }
    setMcpActiveHop(1);
    window.setTimeout(() => setMcpActiveHop(2), 160);
    window.setTimeout(() => setMcpActiveHop(3), 320);
    window.setTimeout(() => setMcpActiveHop(4), 480);
    window.setTimeout(() => setMcpActiveHop(0), 1500);
  }

  async function runOfflineSearch(customQuery?: string) {
    const q = (customQuery ?? mcpQuery).trim();
    if (customQuery !== undefined) setMcpQuery(customQuery);
    setLabTab("search");
    markChecked("chk-path");
    animatePipelinePulse();
    const idx = await ensureCorpusIndex();
    setMcpResults(offlineSearchVault(q, data.vaultArticles, data.starterArticles, 5, idx));
  }

  async function runOfflineVerify(customClaim?: string) {
    const c = (customClaim ?? verifyClaim).trim();
    if (customClaim !== undefined) setVerifyClaim(customClaim);
    setLabTab("verify");
    markChecked("chk-path");
    animatePipelinePulse();
    const idx = await ensureCorpusIndex();
    setVerifyOutput(offlineVerifyClaim(c, data.vaultArticles, data.starterArticles, idx));
  }

  const currentStage = data.stages[activeStageIdx] || data.stages[0];
  const currentModeNote = currentStage.modeNotes[toolMode];
  const currentToolModeSpec =
    data.toolModes.find((m) => m.id === toolMode) || data.toolModes[0];
  const stepIndex = data.steps.findIndex((s) => s.id === step);
  const prevStep = stepIndex > 0 ? data.steps[stepIndex - 1] : null;
  const nextStep = stepIndex < data.steps.length - 1 ? data.steps[stepIndex + 1] : null;

  const visibleQuestions = useMemo(() => {
    if (showAllQuestions) return data.testQuestions;
    const byId = new Map(data.testQuestions.map((q) => [q.id, q]));
    const focused = currentStage.focusQuestionIds
      .map((id) => byId.get(id))
      .filter((q): q is (typeof data.testQuestions)[number] => Boolean(q));
    return focused.length > 0 ? focused : data.testQuestions.slice(0, 2);
  }, [showAllQuestions, currentStage]);

  const compactStage3Index = useMemo(() => {
    const raw = data.stages[2]?.indexMd || "";
    if (!raw) return "";
    const focusSlugs = data.starterArticles.map((a) => a.slug.toLowerCase());
    const keepLines = raw.split("\n").filter((line) => {
      const low = line.toLowerCase();
      return (
        line.startsWith("#") ||
        focusSlugs.some((slug) => low.includes(slug)) ||
        low.includes("arktis") ||
        low.includes("korallen")
      );
    });
    return (keepLines.length > 0 ? keepLines.join("\n") : raw).slice(0, 2200);
  }, [data.stages, data.starterArticles]);

  const isSelfPaced = durationPreset === "self";
  const durationLabel = isSelfPaced ? "Selbstlernen" : `${durationPreset} Min.`;

  const stageWebCopyPayload = useMemo(() => {
    if (currentStage.id === "stufe-1") {
      return `HINTERGRUNDTEXTE EINLESEN:\nLies die folgenden ${data.starterArticles.length} Fokus-Artikel still ein und antworte vorerst NUR mit: „Texte bereit — stelle deine erste Frage.“\n\n---\n\n${stagesExpressPack.content}`;
    }
    if (currentStage.id === "stufe-2") {
      return `REGELN & TEXTE EINLESEN:\nMerke dir zuerst diese verbindlichen Hausregeln und lies danach die Artikel still ein. Antworte vorerst NUR mit: „Regeln aktiv & Texte bereit — stelle deine erste Frage.“\n\n${data.chatRulesTemplate}\n\n---\n\n${stagesExpressPack.content}`;
    }
    return `WISSENSNETZ-REGELN, KOMPAKT-INDEX & TEXTE:\nMerke dir die Regeln und die Verknüpfungen im Kompakt-Index und lies die Artikel still ein. Antworte vorerst NUR mit: „Wissensnetz aktiv — stelle deine erste Frage.“\n\n${data.chatRulesTemplate}\n\n---\n\n${compactStage3Index}\n\n---\n\n${stagesExpressPack.content}`;
  }, [
    currentStage,
    data.chatRulesTemplate,
    data.starterArticles.length,
    stagesExpressPack,
    compactStage3Index,
  ]);

  const activePraxisPath =
    data.praxisPaths.find((p) => p.id === activePathId) || data.praxisPaths[0];
  const q4Spec = data.testQuestions.find((q) => q.id === "q4") || data.testQuestions[3];

  const ahaSteps = data.steps.filter((s) => s.phaseGroup === "aha-kern");
  const praxisSteps = data.steps.filter((s) => s.phaseGroup === "praxis-pfad");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Slim Single-Row Sticky Header (56px) */}
      <header className="sticky top-0 z-40 h-14 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between gap-1 px-2 sm:gap-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-1.5 lg:gap-2">
            <Virtual7Logo compact className="shrink-0 lg:hidden" />
            <Virtual7Logo className="hidden h-7 lg:block" />
            <Separator orientation="vertical" className="hidden h-5 lg:block" />
            <span className="truncate whitespace-nowrap font-display text-sm font-bold tracking-tight">
              <span className="hidden sm:inline lg:hidden">{data.meta.cluster}</span>
              <span className="hidden lg:inline">{data.meta.title}</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* 3-way Werkzeug-Hilfe Switch */}
            <div
              data-tour="tool-mode"
              role="group"
              aria-label="Werkzeug-Hilfe"
              className="inline-flex rounded-lg border bg-muted p-0.5 text-xs"
            >
              {data.toolModes.map((mode) => {
                const isActive = toolMode === mode.id;
                const shortTiny =
                  mode.id === "web" ? "Web" : mode.id === "desktop" ? "Ordner" : "Agent";
                return (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setToolMode(mode.id);
                      markChecked("chk-setup");
                    }}
                    title={`${mode.label} (${mode.badge})`}
                    className={`min-h-[34px] rounded-md px-1.5 py-1 font-medium transition-colors sm:min-h-[36px] sm:px-2.5 ${
                      isActive
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="md:hidden">{shortTiny}</span>
                    <span className="hidden md:inline">{mode.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Hub Switcher */}
            <a
              href="#/hub"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:h-9 sm:w-auto sm:gap-1.5 sm:px-2.5"
              title="Alle Workshop-Module (Hub)"
              aria-label="Alle Workshop-Module (Hub)"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-brand-ink" />
              <span className="hidden lg:inline">Module</span>
            </a>

            {/* Hilfe, Glossar & FAQ Drawer */}
            <HelpFaqSheet
              open={helpOpen}
              onOpenChange={setHelpOpen}
              onStartTour={() => {
                setHelpOpen(false);
                setTourOpen(true);
              }}
              starterArticles={data.starterArticles}
              vaultArticles={data.vaultArticles}
              corpusIndex={corpusIndex ?? undefined}
              onLoadCorpusIndex={ensureCorpusIndex}
              moduleTitle={data.meta.title}
            />

            {/* Checklist Drawer Trigger */}
            <Sheet open={checklistOpen} onOpenChange={setChecklistOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-tour="checklist-trigger"
                  className="num-tabular h-8 gap-1 px-1.5 text-xs sm:h-9 sm:gap-1.5 sm:px-2.5"
                  aria-label={`Fortschritt & Checkliste öffnen (${completedCount} von ${checklistItems.length})`}
                  title="Fortschritt & Checkliste öffnen"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-ink" />
                  <span>
                    <span className="hidden sm:inline">To-do </span>
                    {completedCount}/{checklistItems.length}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Dein Fortschritt ({progressPct}%)</SheetTitle>
                  <SheetDescription>
                    Hake Erkenntnisse direkt ab oder springe per Klick zum passenden Schritt.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-5 space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>Abschlussgrad</span>
                      <span className="num-tabular font-mono text-brand-ink">{progressPct} %</span>
                    </div>
                    <Progress value={progressPct} />
                  </div>

                  <div className="space-y-2">
                    {checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-2 rounded-xl border p-3 text-sm hover:bg-muted/40"
                      >
                        <label className="flex flex-1 cursor-pointer items-start gap-3">
                          <Checkbox
                            checked={!!checked[item.id]}
                            onCheckedChange={() => toggleCheck(item.id)}
                            className="mt-0.5"
                          />
                          <span
                            className={
                              checked[item.id] ? "line-through text-muted-foreground" : ""
                            }
                          >
                            {item.label}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            goToStep(item.stepId);
                            setChecklistOpen(false);
                          }}
                          className="shrink-0 rounded-md border bg-card px-2 py-1 font-mono text-[11px] font-semibold text-brand-ink hover:bg-secondary"
                        >
                          Öffnen →
                        </button>
                      </div>
                    ))}
                  </div>

                  <Separator />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-muted-foreground"
                    onClick={resetProgress}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Fortschritt zurücksetzen</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Trainer-Bühne Link (#/beamer) */}
            <a
              href={moduleId === DEFAULT_MODULE_ID ? "#/beamer" : `#/m/${moduleId}/beamer`}
              data-tour="beamer-link"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:h-9 sm:w-9"
              title="Zur Trainer-Bühne (#/beamer)"
              aria-label="Zur Trainer-Bühne wechseln"
            >
              <Monitor className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Responsive Shell: Left Step-Rail (lg+) + Guided Canvas */}
      <div className="mx-auto flex max-w-[1320px]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[264px] shrink-0 flex-col justify-between border-r px-4 py-8 lg:flex">
          <nav
            data-tour="step-nav"
            aria-label="Workshop-Schritte"
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                15 Min. gemeinsamer Aha-Kern
              </div>
              {ahaSteps.map((s) => {
                const Icon = STEP_ICONS[s.id];
                const isActive = s.id === step;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(s.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-left text-sm transition-all ${
                      isActive
                        ? "border-l-primary bg-secondary/70 font-semibold text-foreground"
                        : "border-l-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-brand-ink" : ""}`} />
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                30 Min. freier Praxis-Pfad
              </div>
              {praxisSteps.map((s) => {
                const Icon = STEP_ICONS[s.id];
                const isActive = s.id === step;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(s.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-left text-sm transition-all ${
                      isActive
                        ? "border-l-primary bg-secondary/70 font-semibold text-foreground"
                        : "border-l-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-brand-ink" : ""}`} />
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="space-y-2 rounded-xl border bg-card p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">Werkzeug-Hilfe</span>
              <Badge variant="secondary" className="text-[10px]">
                {currentToolModeSpec.shortLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>{data.vaultArticles.length} öffentliche Artikel</span>
            </div>
          </div>
        </aside>

        {/* Focused Editorial Content Canvas */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-[940px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: prefersReduced ? 0 : 0.16 }}
                className="space-y-9"
              >
                {/* STEP 01: EINSTIEG & WERKZEUG-HILFE */}
                {step === "start" && (
                  <div className="space-y-8">
                    {/* Signature virtual7 Dark Keynote Hero + HeroBeforeAfterAnimatic */}
                    <section className="stage-atmosphere relative overflow-hidden rounded-3xl border border-[#232B20] bg-[#0B0F0A] p-5 text-[#F2F4EE] shadow-xl sm:p-8">
                      <StageBackdrop className="absolute -right-24 -top-20 h-[400px] w-[400px] opacity-65" />
                      <div className="relative z-10 grid gap-6 lg:grid-cols-12 lg:items-center">
                        <div className="space-y-4 lg:col-span-7">
                          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#A9C23F]/35 bg-[#A9C23F]/15 px-3 py-1 text-xs font-semibold text-[#A9C23F]">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {data.meta.level || "L1"} · {durationLabel} ·{" "}
                              <span className="whitespace-nowrap">100&nbsp;% öffentliche Daten</span>
                            </span>
                          </div>

                          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Vom ungefilterten Chat zum{" "}
                            <span className="text-[#A9C23F]">verlässlichen KI-System.</span>
                          </h1>

                          <p className="editorial-measure text-sm leading-relaxed text-[#D3DACD] sm:text-base">
                            {data.meta.subtitle ||
                              "Erlebe in 4 klaren Schritten, wie aus vagen Antworten belegte Ergebnisse werden."}
                          </p>

                          <div className="grid grid-cols-2 gap-2.5 pt-1 sm:grid-cols-4">
                            {[
                              {
                                val: durationLabel,
                                lbl: isSelfPaced ? "Eigenes Tempo" : "Zeit-Format",
                              },
                              {
                                val: `${data.starterArticles.length}`,
                                lbl: "Fokus-Artikel",
                              },
                              {
                                val: `${data.vaultArticles.length}`,
                                lbl: "Öffentliche Artikel",
                              },
                              { val: "0", lbl: "Vertrauliche Daten" },
                            ].map((kpi) => (
                              <div
                                key={kpi.lbl}
                                className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
                              >
                                <div className="num-tabular font-display text-lg font-extrabold text-[#A9C23F] sm:text-xl">
                                  {kpi.val}
                                </div>
                                <div className="mt-0.5 text-[11px] leading-snug text-[#9FA998]">
                                  {kpi.lbl}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="lg:col-span-5">
                          <HeroBeforeAfterAnimatic
                            spec={data.animatics?.heroBeforeAfter}
                            articleCount={data.vaultArticles.length}
                          />
                        </div>
                      </div>
                    </section>

                    <AudioGuideChip clipId="step-01" audioGuides={data.audioGuides} />

                    {/* 3-Way Werkzeug-Hilfe Selector */}
                    <section className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          <span>
                            1 · Werkzeug-Hilfe wählen (passt Klick-, Ordner- &amp; Prompt-Hinweise
                            an)
                          </span>
                          <GlossaryTip id="prompt" label="Prompt?" />
                          {toolMode !== "agent" && <GlossaryTip id="markdown" label=".md-Datei?" />}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            markChecked("chk-setup");
                            goToStep("methods");
                          }}
                        >
                          <span>Weiter zu Schritt 02: Prompt-Methoden</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        {data.toolModes.map((mode) => {
                          const Icon = MODE_ICONS[mode.id];
                          const isActive = toolMode === mode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => {
                                setToolMode(mode.id);
                                markChecked("chk-setup");
                              }}
                              className={`flex flex-col justify-between gap-3 rounded-2xl border p-5 text-left transition-all ${
                                isActive
                                  ? "border-primary bg-secondary/45 ring-1 ring-primary"
                                  : "bg-card hover:bg-muted/40"
                              }`}
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="flex items-center gap-2 font-display text-base font-bold">
                                    <Icon className="h-4 w-4 shrink-0 text-brand-ink" />
                                    <span>{mode.label}</span>
                                  </span>
                                  {isActive ? (
                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                      <Check className="h-3.5 w-3.5" />
                                    </span>
                                  ) : (
                                    <Badge variant="outline" className="shrink-0 text-[10px]">
                                      {mode.badge}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                  {mode.summary}
                                </p>
                              </div>

                              <div className="space-y-2 border-t pt-2.5 text-[11px]">
                                <div className="flex flex-wrap gap-1">
                                  {mode.examples.map((ex) => (
                                    <span
                                      key={ex}
                                      className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground"
                                    >
                                      {ex}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-muted-foreground">{mode.workflowHint}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {/* Mode-Specific Quick Start (2nd Tab Links / ZIP Download / CLI Quickstart) */}
                    {toolMode === "web" && (
                      <section className="rounded-2xl border border-brand-lime/40 bg-secondary/25 p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                              Schritt 1b · Kostenlosen KI-Chat im 2. Browser-Tab öffnen
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Lasse diese Workshop-Seite offen und öffne genau einen Chat im zweiten
                              Tab (kostenloser Account genügt):
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {WEB_CHAT_LINKS.map((chat) => (
                            <a
                              key={chat.name}
                              href={chat.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2.5 text-xs transition-colors hover:border-brand-lime hover:bg-secondary/40"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground">{chat.name}</div>
                                <div className="text-[11px] text-muted-foreground">{chat.note}</div>
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-brand-ink" />
                            </a>
                          ))}
                        </div>
                      </section>
                    )}

                    {toolMode === "desktop" && (
                      <section className="rounded-2xl border border-brand-lime/40 bg-secondary/25 p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                              <span>Ohne Code starten · Workshop-Ordner als ZIP</span>
                              <GlossaryTip id="git-zip" label="Git vs. ZIP?" />
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              <strong className="text-foreground">Claude Cowork:</strong> ZIP
                              herunterladen, entpacken (Windows: Rechtsklick → „Alle extrahieren…“)
                              und danach z. B. <code>stufe-2-skills-guardrails/</code> als Ordner
                              öffnen.{" "}
                              <strong className="text-foreground">
                                ChatGPT / Claude.ai Projects:
                              </strong>{" "}
                              Lade die Komplettdatei (<code>.md</code>) ins Projekt hoch und kopiere
                              die Chat-Regeln in die Projekt-Anweisungen.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={REPO_ZIP_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                            >
                              <FolderArchive className="h-3.5 w-3.5" />
                              <span>Alle Ordner (.zip)</span>
                            </a>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const idx = await ensureCorpusIndex();
                                downloadMarkdownFile(
                                  `alle-${data.vaultArticles.length}-artikel-wissensbasis.md`,
                                  buildAllArticlesMarkdown(data.vaultArticles, idx, data.meta.title),
                                  `Alle ${data.vaultArticles.length} Artikel (.md) heruntergeladen`
                                );
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Alle {data.vaultArticles.length} Artikel (.md)</span>
                            </Button>
                          </div>
                        </div>
                      </section>
                    )}

                    {toolMode !== "agent" && (
                      <section className="rounded-2xl border bg-card p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                              <FileText className="h-3.5 w-3.5" />
                              <span>Was ist eigentlich eine .md-Datei?</span>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              <code>.md</code> steht für <strong className="text-foreground">Markdown</strong>{" "}
                              — ganz normaler Text mit <code>#</code>-Überschriften. Du musst die
                              Datei auf deinem PC <strong className="text-foreground">nicht öffnen</strong>:
                              Klicke in ChatGPT oder Claude auf <strong>„+“</strong> / Büroklammer (📎)
                              und lade sie direkt hoch — oder nutze einfach unsere{" "}
                              <strong className="text-foreground">„Kompakt-Paket kopieren“</strong>
                              -Buttons.
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setHelpOpen(true)}
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            <span>Alle Begriffe &amp; FAQ öffnen</span>
                          </Button>
                        </div>
                        <AudioGuideChip clipId="what-is-markdown" audioGuides={data.audioGuides} />
                      </section>
                    )}

                    {/* Collapsible OpenCode + Multi-CLI Setup (Code-Agent Mode only) */}
                    {toolMode === "agent" && (
                      <Accordion
                        type="single"
                        collapsible
                        className="rounded-2xl border bg-card px-5"
                      >
                        <AccordionItem value="opencode" className="border-none">
                          <AccordionTrigger className="font-display text-sm font-semibold">
                            {data.openCodeHelp.title}
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pb-4 text-xs leading-relaxed">
                            <p className="text-muted-foreground">{data.openCodeHelp.summary}</p>
                            <ol className="list-decimal space-y-1.5 pl-4 text-foreground">
                              {data.openCodeHelp.steps.map((st, i) => (
                                <li key={i}>{renderInlineCode(st)}</li>
                              ))}
                            </ol>
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 p-3">
                              <code className="font-mono text-xs text-foreground">
                                {data.openCodeHelp.commandSnippet}
                              </code>
                              <CopyButton
                                text={data.openCodeHelp.commandSnippet}
                                label="Befehl kopieren"
                              />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 p-3">
                              <code className="wrap-safe font-mono text-xs text-foreground">
                                {data.mcpConfigs.setupCommand}
                              </code>
                              <CopyButton
                                text={data.mcpConfigs.setupCommand}
                                label="MCP-Setup kopieren"
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {data.openCodeHelp.note}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {/* Mode-Specific ToolHotspotGuide */}
                    <ToolHotspotGuide
                      toolMode={toolMode}
                      spec={data.animatics?.toolHotspots}
                      articleCount={data.vaultArticles.length}
                    />

                    {/* Duration Preset Switcher + 4-Phase Schedule Accordion */}
                    <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5">
                      <AccordionItem value="schedule" className="border-none">
                        <AccordionTrigger className="font-display text-sm font-semibold">
                          Ablaufplan ansehen ({data.phases.length} Phasen ·{" "}
                          {isSelfPaced
                            ? "Eigenes Tempo (ohne Uhrzeit)"
                            : `${durationLabel} (${data.meta.timeSlot})`}
                          )
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pb-3">
                          <div className="flex flex-wrap items-center gap-1.5 border-b pb-3">
                            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Zeit-Format:
                            </span>
                            {(["self", ...(data.durationPresets || [45, 60, 90])] as const).map(
                              (preset) => {
                                const active = preset === durationPreset;
                                const label =
                                  preset === "self" ? "Selbstlernen" : `${preset} Min.`;
                                return (
                                  <button
                                    key={String(preset)}
                                    type="button"
                                    onClick={() => setDurationPreset(preset)}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                                      active
                                        ? "border-brand-lime bg-secondary/70 font-semibold text-foreground"
                                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              }
                            )}
                          </div>

                          <div className="divide-y">
                            {data.phases.map((p) => (
                              <div
                                key={p.id}
                                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-3">
                                    {!isSelfPaced && (
                                      <span className="num-tabular font-mono text-xs font-semibold text-brand-ink">
                                        {p.timeRange}
                                      </span>
                                    )}
                                    <span className="text-sm font-semibold">
                                      {p.number}. {p.title}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {p.modeCues[toolMode]}
                                  </div>
                                </div>
                                <Badge variant="outline" className="w-fit shrink-0 text-[11px]">
                                  {p.durationMin} Min.
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {/* STEP 02: AHA-KERN 1 — PROMPT-METHODEN & STEUERUNGSEBENEN */}
                {step === "methods" && (
                  <div className="space-y-12">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                        <span>Schritt 02 · Aha-Kern 1 (ca. 7 Min.)</span>
                        <GlossaryTip id="costar" label="CO-STAR?" />
                        <GlossaryTip id="guardrails" label="Guardrails?" />
                      </div>
                      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Prompt-Methoden &amp; Steuerungs-Ebenen
                      </h1>
                      <p className="editorial-measure text-sm leading-relaxed text-muted-foreground">
                        Vergleiche, wie exakt dieselbe Frage durch Methodik (Zero-Shot, CO-STAR,
                        Few-Shot, RISEN + CoT) völlig unterschiedliche Ergebnisse erzwingt — und
                        warum System-Regeln im Kontext-Fenster überleben.
                      </p>
                      <AudioGuideChip clipId="step-02" audioGuides={data.audioGuides} />
                    </div>

                    <PromptMethodComparator
                      task={data.promptComparisonTask}
                      methods={data.promptMethods}
                      toolMode={toolMode}
                      expressPackage={methodsExpressPack}
                      onCopyPrompt={() => markChecked("chk-methods")}
                    />

                    <Separator />

                    <ArchitectureLayerStack
                      layers={data.architectureLayers}
                      chatRulesTemplate={data.chatRulesTemplate}
                      toolMode={toolMode}
                      agentsMdTemplate={data.stages[1]?.agentsMd}
                      contextWindowSpec={data.animatics?.contextWindow}
                      onCopyTemplate={() => markChecked("chk-rules")}
                    />
                  </div>
                )}

                {/* STEP 03: AHA-KERN 2 — 3 STUFEN & WISSEN */}
                {step === "stages" && (
                  <div className="space-y-9">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                        <span>Schritt 03 · Aha-Kern 2 (ca. 8 Min.)</span>
                        <GlossaryTip id="guardrails" label="Guardrails?" />
                        <GlossaryTip id="wissensbasis" label="Wissensbasis?" />
                        <GlossaryTip id="rag" label="Markdown-RAG?" />
                      </div>
                      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Stufe 1 → Stufe 2 → Stufe 3
                      </h1>
                      <p className="editorial-measure text-sm leading-relaxed text-muted-foreground">
                        Erlebe an denselben Testfragen den Sprung von ungefiltertem Raten (Stufe 1)
                        über verbindliche Regeln (Stufe 2) hin zum verknüpften Wissensnetz (Stufe 3).
                      </p>
                      <AudioGuideChip clipId="step-03" audioGuides={data.audioGuides} />
                    </div>

                    {/* 3-Stage Selector Cards */}
                    <div className="grid gap-3 md:grid-cols-3">
                      {data.stages.map((st, idx) => {
                        const isActive = idx === activeStageIdx;
                        const dotColor =
                          idx === 0
                            ? "bg-rose-500"
                            : idx === 1
                              ? "bg-amber-500"
                              : "bg-brand-lime";
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setActiveStageIdx(idx)}
                            className={`card-elevated flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
                              isActive
                                ? "border-primary bg-secondary/45 ring-1 ring-primary"
                                : "bg-card hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-2 font-display text-sm font-bold">
                                <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                                {st.title.split(" · ")[0]}
                              </span>
                              <Badge variant="outline" className="text-[11px]">
                                {toolMode !== "agent" ? st.beginnerBadge : st.badge}
                              </Badge>
                            </div>
                            <StageMiniDiagram
                              variant={idx === 0 ? "chaos" : idx === 1 ? "harness" : "vault"}
                            />
                            <div className="text-xs font-semibold text-foreground">
                              {st.title.split(" · ")[1]}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {toolMode !== "agent" ? st.beginnerSummary : st.summary}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Mode-Aware Execution Strip (wraps cleanly at <= 1280px!) */}
                    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink">
                            {currentModeNote.headline}
                          </span>
                          <Badge variant="secondary" className="text-[11px]">
                            {currentToolModeSpec.label}
                          </Badge>
                        </div>

                        <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {currentModeNote.steps.map((s, i) => (
                            <li key={i}>{renderInlineCode(s)}</li>
                          ))}
                        </ol>

                        {/* (datei.md) Source Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                          <span className="font-medium text-muted-foreground">Fokus-Dateien:</span>
                          {currentStage.sourceTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-brand-ink"
                            >
                              ({tag})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                        {toolMode === "web" ? (
                          <>
                            <CopyButton
                              text={stageWebCopyPayload}
                              label={
                                currentStage.id === "stufe-1"
                                  ? "Kompakt-Texte kopieren (~5.900 Z.)"
                                  : currentStage.id === "stufe-2"
                                    ? "Regeln + Texte kopieren (~6.700 Z.)"
                                    : "Regeln + Kompakt-Index + Texte (~8.000 Z.)"
                              }
                              variant="default"
                              onCopy={() => markChecked("chk-stages")}
                            />
                            {currentStage.id === "stufe-2" && (
                              <CopyButton
                                text={data.chatRulesTemplate}
                                label="Nur Chat-Regeln"
                                variant="secondary"
                                onCopy={() => markChecked("chk-stages")}
                              />
                            )}
                            {currentStage.id === "stufe-3" && currentStage.indexMd && (
                              <>
                                <CopyButton
                                  text={`${data.chatRulesTemplate}\n\n---\n\n${compactStage3Index}\n\n---\n\nAUFGABE (Turn 1 · nur Index):\nWelche 1-2 Dateien aus _index.md sollten wir zuerst lesen für folgende Frage? Nenne NUR die Dateinamen:\n${data.testQuestions[1]?.question || ""}`}
                                  label="Turn 1: Nur _index.md + Frage 2"
                                  variant="secondary"
                                  onCopy={() => markChecked("chk-stages")}
                                />
                                <CopyButton
                                  text={`HIER SIND DIE ANGEFORDERTEN ARTIKEL:\n\n${stagePacks.reef || stagePacks.all12}`}
                                  label="Turn 2: Fokus-Artikel"
                                  variant="secondary"
                                  onCopy={() => markChecked("chk-stages")}
                                />
                              </>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                downloadMarkdownFile(
                                  `fokus-korpus-${data.starterArticles.length}-artikel.md`,
                                  stagePacks.all12,
                                  `${data.starterArticles.length} Fokus-Artikel (.md) heruntergeladen`
                                );
                                markChecked("chk-stages");
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>{data.starterArticles.length} Fokus-Artikel (.md)</span>
                            </Button>
                          </>
                        ) : toolMode === "desktop" ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/50 px-2.5 py-1.5 font-mono text-xs font-semibold text-foreground">
                              <FolderOpen className="h-3.5 w-3.5 text-brand-ink" />
                              <span>Ordner öffnen: {currentStage.folder}/</span>
                            </span>
                            <a
                              href={REPO_ZIP_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-2.5 text-xs font-medium hover:bg-muted"
                            >
                              <FolderArchive className="h-3.5 w-3.5 text-brand-ink" />
                              <span>ZIP laden</span>
                            </a>
                            <CopyButton
                              text={data.chatRulesTemplate}
                              label="Regeln kopieren (Projects)"
                              variant="default"
                              onCopy={() => markChecked("chk-stages")}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const idx = await ensureCorpusIndex();
                                downloadMarkdownFile(
                                  `alle-${data.vaultArticles.length}-artikel-wissensbasis.md`,
                                  buildAllArticlesMarkdown(data.vaultArticles, idx, data.meta.title),
                                  `Alle ${data.vaultArticles.length} Artikel (.md) heruntergeladen`
                                );
                                markChecked("chk-stages");
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Alle {data.vaultArticles.length} (.md)</span>
                            </Button>
                          </>
                        ) : (
                          <CopyButton
                            text={currentModeNote.commandOrAction}
                            label={currentModeNote.commandOrAction}
                            variant="default"
                            onCopy={() => markChecked("chk-stages")}
                          />
                        )}

                        <StageArtifactsSheet
                          stage={currentStage}
                          expressArcticReef={stagesExpressPack}
                          arcticPack={stagePacks.arctic}
                          reefPack={stagePacks.reef}
                          all12Pack={stagePacks.all12}
                          customPacks={stagePacks.customPacks}
                          vaultArticles={data.vaultArticles}
                          corpusIndex={corpusIndex ?? undefined}
                          onLoadCorpusIndex={ensureCorpusIndex}
                          moduleTitle={data.meta.title}
                          toolMode={toolMode}
                        />
                      </div>
                    </div>

                    {/* Guardrail Shield Animatic + Guardrail Debug Challenge + Hidden-by-Default Q4 Preview */}
                    <GuardrailShieldAnimatic
                      activeStageIdx={activeStageIdx}
                      onSelectStage={setActiveStageIdx}
                      spec={data.animatics?.guardrailShield}
                      articleCount={data.vaultArticles.length}
                    />

                    {data.guardrailDebugChallenge && (
                      <GuardrailDebugChallenge
                        challenge={data.guardrailDebugChallenge}
                        onSolved={() => markChecked("chk-stages")}
                      />
                    )}

                    {q4Spec?.manipulationCheck && (() => {
                      const mc = q4Spec.manipulationCheck;
                      const activeVal = q4SimulatedMutated ? mc.mutatedValue : mc.originalValue;
                      const excerptParts = mc.excerptTemplate
                        ? mc.excerptTemplate.split("{{VALUE}}")
                        : null;
                      return (
                        <div className="rounded-2xl border bg-card p-5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                                Live-Vorschau · Frage {q4Spec.number} („{mc.mutatedValue}“ statt „
                                {mc.originalValue}“)
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Testet, ob Regeln dein lokales Dokument stärker gewichten als das
                                Trainingswissen der KI.
                              </p>
                            </div>
                            <div className="inline-flex rounded-lg border bg-muted p-0.5 text-xs">
                              <button
                                type="button"
                                onClick={() => setQ4SimulatedMutated(true)}
                                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                                  q4SimulatedMutated
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground"
                                }`}
                              >
                                Test-Änderung: {mc.mutatedValue}
                              </button>
                              <button
                                type="button"
                                onClick={() => setQ4SimulatedMutated(false)}
                                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                                  !q4SimulatedMutated
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground"
                                }`}
                              >
                                Original: {mc.originalValue}
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 text-xs">
                            <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
                              <div className="font-mono text-[11px] font-semibold text-muted-foreground">
                                Ausschnitt ({mc.targetFile})
                              </div>
                              <p className="text-foreground">
                                {excerptParts && excerptParts.length >= 2 ? (
                                  <>
                                    {excerptParts[0]}
                                    <strong className="rounded bg-brand-lime/35 px-1 text-foreground">
                                      {activeVal}
                                    </strong>
                                    {excerptParts.slice(1).join(activeVal)}
                                  </>
                                ) : (
                                  <>
                                    „Wie die meisten Bären besitzen Eisbären{" "}
                                    <strong className="rounded bg-brand-lime/35 px-1 text-foreground">
                                      {activeVal}
                                    </strong>
                                    , und wie alle Bären sind sie Sohlengänger.“
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl border border-[#A9C23F]/50 bg-secondary/35 p-3 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-mono text-[11px] font-semibold text-brand-ink">
                                  Erwartete Antwort mit Guardrail (Stufe 2/3)
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={() => setRevealQ4Answer((v) => !v)}
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>
                                    {revealQ4Answer ? "Verbergen" : "Antwort-Vergleich aufdecken"}
                                  </span>
                                </Button>
                              </div>
                              {revealQ4Answer ? (
                                <>
                                  <p className="text-foreground">
                                    „Laut dem vorliegenden Dokument ({mc.targetFile}) gilt der Wert{" "}
                                    <strong>{activeVal}</strong>{" "}
                                    <code>{mc.expectedCitation}</code>.“
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {toolMode === "web" ? (
                                      "Im Web-Chat ändert die Testfrage unten den Wert nur für diesen Chat — du musst keine Datei anfassen."
                                    ) : (
                                      <>
                                        Bei lokalem Dateitest danach wieder auf{" "}
                                        <code>{mc.originalValue}</code> zurücksetzen!
                                      </>
                                    )}
                                  </p>
                                </>
                              ) : (
                                <p className="text-[11px] italic text-muted-foreground">
                                  Vermute zuerst selbst: Übernimmt die KI „{activeVal}“ aus der
                                  Datei oder rät sie ihren Trainingswert „{mc.originalValue}“? Danach
                                  aufdecken.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Focus Test Questions (2 per stage + toggle for all 4) */}
                    <section className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="font-display text-lg font-bold">
                            {showAllQuestions
                              ? "Alle 4 Testfragen"
                              : `2 Fokus-Fragen für ${currentStage.title.split(" · ")[0]}`}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Stelle die Fragen nacheinander und vergleiche, wie sich die Antwort pro
                            Stufe verändert.
                          </p>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAllQuestions((s) => !s)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>
                            {showAllQuestions
                              ? "Auf 2 Fokus-Fragen eingrenzen"
                              : "Alle 4 Fragen anzeigen"}
                          </span>
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {visibleQuestions.map((q) => {
                          const useWebText = toolMode === "web" && Boolean(q.webChatPrompt);
                          const displayQuestion = useWebText ? q.webChatPrompt! : q.question;
                          const displayWatch =
                            toolMode === "web" && q.webChatWatch ? q.webChatWatch : q.whatToWatch;
                          const displaySolution =
                            toolMode === "web" && q.webChatSolution
                              ? q.webChatSolution
                              : q.solutionSummary;

                          const relevantTexts =
                            q.number === 1
                              ? stagePacks.arctic
                              : q.number === 2
                                ? stagePacks.reef
                                : stagesExpressPack.content;
                          const standaloneBundle =
                            activeStageIdx >= 1
                              ? `${data.chatRulesTemplate}\n\n---\n\nAUFGABE / TESTFRAGE:\n${displayQuestion}\n\n---\nPASSENDE ARTIKEL:\n\n${relevantTexts}`
                              : `AUFGABE / TESTFRAGE:\n${displayQuestion}\n\n---\nPASSENDE ARTIKEL:\n\n${relevantTexts}`;

                          return (
                            <div
                              key={q.id}
                              className={`flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 ${
                                q.isTrap ? "border-l-4 border-l-rose-500" : ""
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="flex min-w-0 items-baseline gap-2">
                                    <span className="num-tabular shrink-0 font-mono text-xs font-bold text-brand-ink">
                                      0{q.number}
                                    </span>
                                    <span className="text-xs font-semibold leading-snug text-muted-foreground">
                                      {q.type}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {toolMode === "web" && !useWebText && (
                                      <CopyButton
                                        text={standaloneBundle}
                                        label="Frage + Texte komplett"
                                        toastMessage={`Frage ${q.number} + passende Texte (Stufe ${activeStageIdx + 1}) kopiert`}
                                        variant="default"
                                        className="shrink-0"
                                        onCopy={() => markChecked("chk-stages")}
                                      />
                                    )}
                                    <CopyButton
                                      text={displayQuestion}
                                      label={
                                        toolMode === "web"
                                          ? useWebText
                                            ? "Frage + 38-Zähne-Text"
                                            : "Nur Frage"
                                          : "Kopieren"
                                      }
                                      variant={
                                        toolMode === "web" && !useWebText ? "outline" : "default"
                                      }
                                      className="shrink-0"
                                      onCopy={() => markChecked("chk-stages")}
                                    />
                                  </div>
                                </div>

                                <p className="text-[15px] font-medium leading-snug text-foreground">
                                  {renderInlineCode(displayQuestion)}
                                </p>

                                <p className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                                  <strong className="text-foreground">Worauf achten: </strong>
                                  {renderInlineCode(displayWatch)}
                                </p>
                              </div>

                              <div className="border-t pt-3">
                                <Accordion type="single" collapsible>
                                  <AccordionItem value="sol" className="border-none">
                                    <AccordionTrigger className="py-1 text-xs font-medium text-brand-ink">
                                      Verifizierte Lösung (nach dem Testen öffnen)
                                    </AccordionTrigger>
                                    <AccordionContent className="rounded-xl bg-secondary/40 p-3 text-xs leading-relaxed text-foreground">
                                      {renderInlineCode(displaySolution)}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Active 1-Click Self-Reflection Pills */}
                    <section className="rounded-2xl border bg-card p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                            Kurze Selbst-Reflexion (1 Klick)
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Was hast du gerade bei deinem KI-Test beobachtet?
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[11px]">
                          {Object.values(reflections).filter(Boolean).length}/3 markiert
                        </Badge>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-3">
                        {reflectionPills.map((pill) => {
                          const active = Boolean(reflections[pill.id]);
                          return (
                            <button
                              key={pill.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => toggleReflection(pill.id)}
                              className={`flex flex-col gap-1 rounded-xl border p-3.5 text-left transition-all ${
                                active
                                  ? "border-brand-lime bg-secondary/60 ring-1 ring-brand-lime"
                                  : "bg-muted/25 hover:bg-muted/50"
                              }`}
                            >
                              <span className="flex items-center justify-between gap-2 text-xs font-bold text-foreground">
                                <span>{pill.label}</span>
                                {active && <Check className="h-3.5 w-3.5 text-brand-ink" />}
                              </span>
                              <span className="text-[11px] leading-snug text-muted-foreground">
                                {pill.hint}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {/* Natural Stufe 3 Reveal: Stage3AgentWalkPlayer + ObsidianKnowledgeGraph */}
                    {activeStageIdx === 2 || showGraphEarly ? (
                      <section className="space-y-4">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                          <div className="space-y-1">
                            <h2 className="font-display text-lg font-bold">
                              Warum Stufe 3 gewinnt: Inhaltsverzeichnis &amp; Wissens-Graph
                            </h2>
                            <p className="editorial-measure text-sm text-muted-foreground">
                              Statt alle {data.vaultArticles.length} Artikel in den Chat zu laden,
                              folgt das System dem <code>_index.md</code> und seinen{" "}
                              <code>[[Wikilinks]]</code> gezielt zum Ziel.
                            </p>
                          </div>
                          {activeStageIdx !== 2 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowGraphEarly(false)}
                            >
                              Graph einklappen
                            </Button>
                          )}
                        </div>

                        <Stage3AgentWalkPlayer
                          steps={data.taxonomy?.ragWalkSteps}
                          walkLabel={data.taxonomy?.walkLabel}
                          articleCount={data.vaultArticles.length}
                          onSelectSlug={(slug) => setGraphSelectedSlug(slug)}
                        />
                        <ObsidianKnowledgeGraph
                          articles={data.vaultArticles}
                          vaultIndexMarkdown={data.stages[2]?.indexMd}
                          taxonomy={data.taxonomy}
                          externalSelectedSlug={graphSelectedSlug}
                        />
                      </section>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed bg-muted/25 p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Network className="h-4 w-4 text-brand-ink" />
                            <span>
                              Vorschau auf Stufe 3: Interaktiver {data.vaultArticles.length}
                              -Artikel-Wissens-Graph
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Öffnet sich automatisch bei Stufe 3 — oder jederzeit per Klick aufrufen.
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowGraphEarly(true)}
                        >
                          Graph jetzt ansehen
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 04: PRAXIS-PFADE & CCF-TRANSFER-BRÜCKE */}
                {step === "paths" && (
                  <div className="space-y-10">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                        <span>Schritt 04 · 30 Min. freier Praxis-Pfad &amp; Transfer-Brücke</span>
                        <GlossaryTip id="wikilinks" label="[[Wikilinks]]?" />
                        {toolMode === "agent" && <GlossaryTip id="mcp" label="MCP?" />}
                      </div>
                      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Wähle deinen Praxis-Pfad
                      </h1>
                      <p className="editorial-measure text-sm leading-relaxed text-muted-foreground">
                        Wähle frei eines von drei Praxis-Zielen — die Prompts passen sich automatisch
                        an deine Werkzeug-Hilfe (<strong>{currentToolModeSpec.label}</strong>) an.
                      </p>
                      <AudioGuideChip clipId="step-04" audioGuides={data.audioGuides} />
                    </div>

                    {/* 3 Praxis-Pfad Selector Cards */}
                    <div className="grid gap-3 md:grid-cols-3">
                      {data.praxisPaths.map((p) => {
                        const isActive = p.id === activePraxisPath.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setActivePathId(p.id);
                              markChecked("chk-path");
                            }}
                            className={`card-elevated flex flex-col justify-between gap-2 rounded-2xl border p-4 text-left transition-all ${
                              isActive
                                ? "border-primary bg-secondary/45 ring-1 ring-primary"
                                : "bg-card hover:bg-muted/40"
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-bold text-brand-ink">
                                  Pfad 0{p.number} · {p.durationMin} Min.
                                </span>
                                {isActive && (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                              <div className="font-display text-sm font-bold text-foreground">
                                {p.title.replace(/^Praxis-Pfad \d+ · /, "")}
                              </div>
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                {p.description}
                              </p>
                            </div>
                            <div className="text-[11px] font-medium text-brand-ink">{p.tag}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Praxis-Pfad Detail Card */}
                    {(() => {
                      const modePrompt = activePraxisPath.promptsByMode[toolMode];
                      const webBundledPrompt = `${modePrompt.prompt}\n\n---\nALLE ${data.starterArticles.length} FOKUS-ARTIKEL (.md):\n\n${stagePacks.all12}`;
                      return (
                        <div className="rounded-2xl border bg-card p-5 space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="lime">{activePraxisPath.tag}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  Empfohlen für: {activePraxisPath.bestForRoles.join(", ")}
                                </span>
                              </div>
                              <h2 className="font-display text-xl font-bold text-foreground">
                                {activePraxisPath.title}
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                {activePraxisPath.description}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {toolMode === "web" ? (
                                <>
                                  <CopyButton
                                    text={webBundledPrompt}
                                    label={`Prompt + ${data.starterArticles.length} Artikel kopieren`}
                                    toastMessage={`${activePraxisPath.title}: Prompt (oben) + ${data.starterArticles.length} Artikel kopiert`}
                                    variant="default"
                                    onCopy={() => markChecked("chk-path")}
                                  />
                                  <CopyButton
                                    text={modePrompt.prompt}
                                    label="Nur Prompt"
                                    variant="outline"
                                    onCopy={() => markChecked("chk-path")}
                                  />
                                </>
                              ) : (
                                <CopyButton
                                  text={modePrompt.prompt}
                                  label={modePrompt.label}
                                  variant="default"
                                  onCopy={() => markChecked("chk-path")}
                                />
                              )}
                              {toolMode !== "agent" && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    downloadMarkdownFile(
                                      `fokus-korpus-${data.starterArticles.length}-artikel.md`,
                                      stagePacks.all12,
                                      `${data.starterArticles.length} Fokus-Artikel (.md) heruntergeladen`
                                    );
                                    markChecked("chk-path");
                                  }}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>{data.starterArticles.length} Artikel (.md)</span>
                                </Button>
                              )}
                            </div>
                          </div>

                          <pre className="whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
                            {modePrompt.prompt}
                          </pre>

                          {toolMode === "web" && activePraxisPath.id !== "pfad-recherche" && (
                            <div className="rounded-xl border border-brand-lime/50 bg-secondary/25 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
                              <div className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                                <span>Wo erscheint die fertige Vorschau / Mini-App?</span>
                                <GlossaryTip id="artifacts-canvas" label="Was ist Artifacts / Canvas?" />
                              </div>
                              <p className="mt-1">
                                <strong>Claude.ai:</strong> Erscheint automatisch rechts als eigenes
                                „Artifacts“-Fenster (ggf. in den Einstellungen aktivieren).{" "}
                                <strong>ChatGPT:</strong> Klicke unter dem Eingabefeld auf{" "}
                                <strong>„+“ / Canvas</strong> — dann kannst du direkt klicken und
                                anpassen.
                              </p>
                            </div>
                          )}

                          <div className="rounded-xl border border-brand-lime/40 bg-secondary/35 px-3.5 py-2.5 text-xs">
                            <strong className="text-foreground">Ziel-Ergebnis: </strong>
                            <span className="text-muted-foreground">
                              {modePrompt.deliverableHint}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Path 1 Special: Built-in Corpus Search & Claim Verifier + McpPacketAnimatic + Multi-CLI */}
                    {activePraxisPath.includesInBrowserLab && (
                      <div className="space-y-6">
                        <McpPacketAnimatic
                          activeHop={mcpActiveHop}
                          mode={labTab}
                          toolMode={toolMode}
                          spec={data.animatics?.mcpPacket}
                          articleCount={data.vaultArticles.length}
                        />

                        {/* 100% Client-Side Corpus Search & Claim Verifier */}
                        <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                            <div>
                              <h3 className="font-display text-base font-bold text-foreground">
                                Live-Suche &amp; Faktenprüfer über alle {data.vaultArticles.length}{" "}
                                Artikel
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Läuft komplett hier im Browser — auch ohne eigenes KI-Konto oder
                                Installation.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const idx = await ensureCorpusIndex();
                                downloadMarkdownFile(
                                  `alle-${data.vaultArticles.length}-artikel-wissensbasis.md`,
                                  buildAllArticlesMarkdown(data.vaultArticles, idx, data.meta.title),
                                  `Alle ${data.vaultArticles.length} Artikel (.md) heruntergeladen`
                                );
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Alle {data.vaultArticles.length} Artikel (.md)</span>
                            </Button>
                          </div>

                          <Tabs
                            value={labTab}
                            onValueChange={(v) => setLabTab(v as "search" | "verify")}
                            className="space-y-4"
                          >
                            <TabsList className="grid h-auto w-full grid-cols-1 gap-1 p-1 sm:inline-flex sm:w-auto sm:flex-wrap">
                              <TabsTrigger
                                value="search"
                                className="justify-start gap-1.5 px-3 py-2 text-xs sm:text-sm"
                              >
                                <Wrench className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  Wissensbasis durchsuchen ({data.vaultArticles.length} Artikel)
                                </span>
                                {toolMode === "agent" && (
                                  <code className="hidden text-[11px] opacity-70 sm:inline">
                                    {data.animatics?.mcpPacket?.searchToolName ||
                                      "search_wildlife_vault"}
                                  </code>
                                )}
                              </TabsTrigger>
                              <TabsTrigger
                                value="verify"
                                className="justify-start gap-1.5 px-3 py-2 text-xs sm:text-sm"
                              >
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                                <span>Fakten prüfen</span>
                                {toolMode === "agent" && (
                                  <code className="hidden text-[11px] opacity-70 sm:inline">
                                    {data.animatics?.mcpPacket?.verifyToolName ||
                                      "verify_claim_against_corpus"}
                                  </code>
                                )}
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="search" className="space-y-4">
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                  value={mcpQuery}
                                  onChange={(e) => setMcpQuery(e.target.value)}
                                  placeholder="Suchbegriff eingeben…"
                                />
                                <Button
                                  type="button"
                                  onClick={() => runOfflineSearch()}
                                  className="shrink-0"
                                >
                                  {toolMode === "agent"
                                    ? "Tool ausführen"
                                    : "Wissensbasis durchsuchen"}
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {(
                                  data.labPresets?.searchPresets || [
                                    "Anemonenfische Symbiose",
                                    "Eisbär Talg Squalen",
                                    "Korallenbleiche Temperatur",
                                    "Alpenmurmeltier Winterschlaf",
                                    "Schneeleopard Nationalpark",
                                  ]
                                ).map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => runOfflineSearch(preset)}
                                    className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs hover:bg-secondary"
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>

                              {mcpResults && (
                                <div className="divide-y rounded-xl border bg-muted/20">
                                  {mcpResults.length === 0 && (
                                    <div className="p-4 text-xs text-muted-foreground">
                                      0 Treffer in den {data.vaultArticles.length} Artikeln
                                      gefunden.
                                    </div>
                                  )}
                                  {mcpResults.map((m) => {
                                    const parsed = parseWikilink(m.wikilink, m.slug, m.title);
                                    return (
                                      <div key={m.slug} className="space-y-1.5 p-3.5 text-xs">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-display text-sm font-bold text-foreground">
                                              {parsed.title}
                                            </span>
                                            <Badge
                                              variant="outline"
                                              className="font-mono text-[11px] text-brand-ink"
                                            >
                                              ({m.slug}.md)
                                            </Badge>
                                          </div>
                                          <Badge variant="outline">Relevanz {m.score}</Badge>
                                        </div>
                                        <p className="leading-relaxed text-foreground/90">
                                          {m.snippet}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="verify" className="space-y-4">
                              <Textarea
                                value={verifyClaim}
                                onChange={(e) => setVerifyClaim(e.target.value)}
                                placeholder={`Behauptung zum Prüfen gegen alle ${data.vaultArticles.length} Artikel eingeben…`}
                                aria-label="Behauptung gegen Wissensbasis prüfen"
                                rows={2}
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" onClick={() => runOfflineVerify()}>
                                  Behauptung prüfen
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    runOfflineVerify(
                                      data.labPresets?.verifyTrapClaim ||
                                        "Im Schweizerischen Nationalpark leben 45 Schneeleoparden und das Ticket kostet 25 Euro."
                                    )
                                  }
                                >
                                  Fangfrage testen
                                </Button>
                              </div>

                              {verifyOutput && (
                                <div className="space-y-3 rounded-xl border bg-muted/25 p-4 text-xs">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant={
                                        verifyOutput.status === "belegt"
                                          ? "success"
                                          : verifyOutput.status === "teilweise"
                                            ? "warning"
                                            : "danger"
                                      }
                                    >
                                      {verifyOutput.status.toUpperCase()}
                                    </Badge>
                                    <span className="font-medium">{verifyOutput.label}</span>
                                  </div>
                                  {verifyOutput.evidence.length === 0 && (
                                    <div className="rounded-lg border border-dashed bg-card p-3 text-muted-foreground">
                                      0 verlässliche Belege in den {data.vaultArticles.length}{" "}
                                      Artikeln – korrekte System-Reaktion: Behauptung nicht
                                      bestätigen.
                                    </div>
                                  )}
                                  {verifyOutput.evidence.map((ev) => {
                                    const parsed = parseWikilink(ev.wikilink, ev.slug, ev.title);
                                    return (
                                      <div
                                        key={ev.slug}
                                        className="space-y-1 rounded-lg border bg-card p-3"
                                      >
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-display text-sm font-bold text-foreground">
                                            {parsed.title}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className="font-mono text-[11px] text-brand-ink"
                                          >
                                            ({ev.slug}.md)
                                          </Badge>
                                        </div>
                                        <p className="leading-relaxed text-muted-foreground">
                                          {ev.snippet}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </div>

                        {/* Collapsible Code-Agent Multi-CLI MCP Configs */}
                        <Accordion
                          type="single"
                          collapsible
                          defaultValue={toolMode === "agent" ? "mcp-cfg" : undefined}
                          className="rounded-2xl border bg-card px-5"
                        >
                          <AccordionItem value="mcp-cfg" className="border-none">
                            <AccordionTrigger className="font-display text-sm font-semibold">
                              <span className="flex flex-wrap items-center gap-2 text-left">
                                <FileCode2 className="h-4 w-4 shrink-0 text-brand-ink" />
                                <span>
                                  Optional · nur Code-Agent: Lokaler MCP-Server für 6 Clients
                                </span>
                                {toolMode !== "agent" && (
                                  <Badge variant="outline" className="text-[10px]">
                                    Für Web-Chat nicht nötig
                                  </Badge>
                                )}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="min-w-0 space-y-3 pb-4">
                              <p className="text-xs text-muted-foreground">
                                Für Web-Chat &amp; Desktop genügt die Such-Box oben im Browser. Wenn
                                du lokal mit Terminal/IDE arbeitest, wähle deinen CLI-Client:
                              </p>
                              <Tabs defaultValue="claude" className="min-w-0">
                                <TabsList className="h-auto w-full flex-wrap justify-start gap-1 overflow-visible bg-muted p-1.5">
                                  <TabsTrigger value="claude" className="px-2.5 py-1 text-xs">
                                    Claude Code
                                  </TabsTrigger>
                                  <TabsTrigger value="opencode" className="px-2.5 py-1 text-xs">
                                    OpenCode
                                  </TabsTrigger>
                                  <TabsTrigger value="gemini" className="px-2.5 py-1 text-xs">
                                    Gemini CLI
                                  </TabsTrigger>
                                  <TabsTrigger value="codex" className="px-2.5 py-1 text-xs">
                                    Codex
                                  </TabsTrigger>
                                  <TabsTrigger value="vscode" className="px-2.5 py-1 text-xs">
                                    VS Code
                                  </TabsTrigger>
                                  <TabsTrigger value="cursor" className="px-2.5 py-1 text-xs">
                                    Cursor
                                  </TabsTrigger>
                                  <TabsTrigger value="setup" className="px-2.5 py-1 text-xs">
                                    Setup-CLI
                                  </TabsTrigger>
                                </TabsList>
                                {[
                                  {
                                    id: "claude",
                                    path: ".mcp.json (im Root & Stufe 3 vorkonfiguriert)",
                                    code: data.mcpConfigs.claudeCode,
                                  },
                                  {
                                    id: "opencode",
                                    path: "opencode.json (Projekt oder ~/.config/opencode/opencode.json)",
                                    code: data.mcpConfigs.openCode,
                                  },
                                  {
                                    id: "gemini",
                                    path: ".gemini/settings.json (oder ~/.gemini/settings.json)",
                                    code: data.mcpConfigs.geminiCli,
                                  },
                                  {
                                    id: "codex",
                                    path: ".codex/config.toml (oder ~/.codex/config.toml)",
                                    code: data.mcpConfigs.codex,
                                  },
                                  {
                                    id: "vscode",
                                    path: ".vscode/mcp.json",
                                    code: data.mcpConfigs.vscode,
                                  },
                                  {
                                    id: "cursor",
                                    path: ".cursor/mcp.json (oder ~/.cursor/mcp.json)",
                                    code: data.mcpConfigs.cursor,
                                  },
                                  {
                                    id: "setup",
                                    path: "Terminal (schreibt absolute Pfade sicher in User-Config)",
                                    code: data.mcpConfigs.setupCommand,
                                  },
                                ].map((cfg) => (
                                  <TabsContent
                                    key={cfg.id}
                                    value={cfg.id}
                                    className="min-w-0 space-y-2"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <code className="break-all text-[11px] text-muted-foreground">
                                        Zieldatei: {cfg.path}
                                      </code>
                                      <CopyButton text={cfg.code} label="Konfig kopieren" />
                                    </div>
                                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-3.5 font-mono text-xs">
                                      {cfg.code}
                                    </pre>
                                  </TabsContent>
                                ))}
                              </Tabs>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}

                    <Separator />

                    {/* BYOU Mini-Builder + Transfer-Brücke */}
                    <ByouRuleBuilder
                      rolePresets={data.transferBridge}
                      onCopyOutput={() => markChecked("chk-transfer")}
                    />

                    <section className="space-y-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                          Transfer-Brücke · In deinen Arbeitsalltag übertragen
                        </div>
                        <h2 className="font-display text-xl font-bold">
                          {data.transferBridge.length} Rollen-Vorlagen ({data.meta.cluster})
                        </h2>
                        <p className="editorial-measure text-sm text-muted-foreground">
                          Übertrage die drei Muster (CO-STAR/RISEN, verbindliche Regeln, verknüpfte
                          Wissensbasis) direkt auf deinen Arbeitsbereich — immer unter Einhaltung der
                          geltenden Datenschutz- und Compliance-Regeln.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {data.transferBridge.map((role) => (
                          <div
                            key={role.id}
                            className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-5"
                          >
                            <div className="space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-display text-base font-bold text-foreground">
                                  {role.title}
                                </h3>
                                <Badge variant="outline" className="text-[10px]">
                                  {role.workshopPattern}
                                </Badge>
                              </div>
                              <div className="text-xs font-medium text-brand-ink">{role.roles}</div>
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                <strong className="text-foreground">Praxis-Einsatz: </strong>
                                {role.ccfUseCase}
                              </p>
                              <div className="rounded-xl bg-muted/50 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                                <strong className="text-foreground">Guardrail: </strong>
                                {role.guardrailRule}
                              </div>
                              <pre className="whitespace-pre-wrap break-words rounded-xl border bg-muted/35 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                                {role.starterPrompt}
                              </pre>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t pt-3">
                              <CopyButton
                                text={role.starterPrompt}
                                label="Starter-Prompt kopieren"
                                variant="default"
                                onCopy={() => markChecked("chk-transfer")}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Completion Summary Card */}
                    <section className="rounded-2xl border border-brand-lime/45 bg-secondary/35 p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={completedCount >= 5 ? "success" : "outline"}>
                              {completedCount >= 5
                                ? "Stark — alle Kernmuster erlebt!"
                                : `Dein Stand: ${completedCount}/${checklistItems.length} Häkchen`}
                            </Badge>
                            <span className="num-tabular text-xs font-semibold text-brand-ink">
                              {progressPct}% abgeschlossen
                            </span>
                          </div>
                          <h2 className="font-display text-lg font-bold text-foreground">
                            Was du aus allen 4 Schritten mitnimmst
                          </h2>
                          <p className="editorial-measure text-sm text-muted-foreground">
                            Klare Prompt-Struktur, verbindliche Regeln gegen Raten und ein
                            vernetzter Index schlagen blindes Kopieren — in Web-Chats genauso wie in
                            Desktop-Ordnern und Code-Agenten.
                          </p>
                          <div className="max-w-md pt-1">
                            <Progress value={progressPct} />
                          </div>
                        </div>

                        <Button type="button" variant="outline" onClick={() => goToStep("start")}>
                          Zurück zum Einstieg
                        </Button>
                      </div>
                    </section>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Step Footer Navigation */}
            {step !== "start" && (
              <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
                {prevStep ? (
                  <Button type="button" variant="outline" onClick={() => goToStep(prevStep.id)}>
                    <ArrowLeft className="h-4 w-4" />
                    <span>Zurück: {prevStep.short}</span>
                  </Button>
                ) : (
                  <div />
                )}
                {nextStep ? (
                  <Button type="button" onClick={() => goToStep(nextStep.id)}>
                    <span>Weiter: {nextStep.short}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => goToStep("start")}>
                    Zurück zum Einstieg
                  </Button>
                )}
              </footer>
            )}
          </div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Step-Bar (4 Steps) */}
      <nav
        aria-label="Mobile Navigation"
        data-tour="step-nav-mobile"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {data.steps.map((s) => {
          const Icon = STEP_ICONS[s.id];
          const isActive = s.id === step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(s.id)}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? "text-brand-ink" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-lime" />
              )}
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{s.short}</span>
            </button>
          );
        })}
      </nav>

      {/* Lightweight 15-Second Onboarding Spotlight Tour */}
      <OnboardingTour open={tourOpen} onOpenChange={setTourOpen} onSelectStep={goToStep} />
    </div>
  );
}
