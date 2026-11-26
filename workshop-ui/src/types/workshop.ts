export type ToolMode = "web" | "desktop" | "agent";
export type WorkshopStepId = "start" | "methods" | "stages" | "paths";
export type BeamerMode = "stage" | "demo" | "qr" | "outro";
export type ModuleLevel = "L1" | "L2" | "L3";

export interface CategoryTaxonomyItem {
  id: string;
  label: string;
  plural: string;
  subdir?: string;
  color: string;
  radius?: number;
}

export interface ModuleTaxonomy {
  categories: CategoryTaxonomyItem[];
  groupFieldLabel?: string;
  graphAnchors?: Record<string, [number, number]>;
  ragWalkSteps?: { slug: string; note: string }[];
  defaultSelectedSlug?: string;
  walkLabel?: string;
}

export interface EventOverlaySpec {
  unitLabel?: string;
  timeSlot?: string;
  outroBanner?: string;
  organizerNote?: string;
  roomHint?: string;
}

export interface AudioGuideScriptSpec {
  title: string;
  durationLabel: string;
  transcript: string;
  tts?: string;
}

export interface GuardrailDebugChallengeSpec {
  title: string;
  subtitle: string;
  brokenRule: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    reason: string;
  }[];
  fixedRule: string;
}

export interface AnimaticSpecs {
  heroBeforeAfter?: {
    trapQuestion: string;
    unfilteredLabel: string;
    unfilteredAnswer: string;
    unfilteredTag: string;
    guardedLabel: string;
    guardedAnswer: string;
    guardedTag: string;
    factsAnswer: string;
    factsTag: string;
  };
  guardrailShield?: {
    claimText: string;
    stages: {
      id: string;
      stageLabel: string;
      subtitle: string;
      blocked: boolean;
      responseText: string;
      badge: string;
    }[];
  };
  contextWindow?: {
    rawLabel: string;
    indexLabel: string;
    articleCountLabel: string;
  };
  mcpPacket?: {
    sampleQuery: string;
    sampleWikilinks: string[];
    searchToolName?: string;
    verifyToolName?: string;
  };
  toolHotspots?: {
    webExampleAnswer: string;
    desktopFolderExample: string;
    desktopSkillsLabel: string;
    agentTrapSample: string;
  };
  demoScenarios?: Record<
    string,
    {
      tabLabel: string;
      label: string;
      question: string;
      stages: {
        num: string;
        variant: "chaos" | "harness" | "vault";
        title: string;
        folder: string;
        statusBadge: string;
        badgeVar: "danger" | "warning" | "success";
        stripe: string;
        output: string;
        highlightNote: string;
        isGood: boolean;
      }[];
    }
  >;
  outroPrompts?: {
    num: string;
    title: string;
    prompt: string;
  }[];
  outroTakeaways?: {
    title: string;
    detail: string;
  }[];
}

export interface LabPresetsSpec {
  defaultQuery: string;
  searchPresets: string[];
  verifyDefaultClaim: string;
  verifyTrapClaim: string;
}

export interface StagePackSpecItem {
  id: string;
  filename: string;
  title: string;
  subtitle: string;
  slugs: string[];
}

export interface WorkshopMeta {
  moduleId?: string;
  level?: ModuleLevel;
  title: string;
  subtitle: string;
  presenter: string;
  cluster: string;
  domainLabel?: string;
  timeSlot: string;
  articleCount: number;
  complianceNote: string;
  pagesUrl: string;
  repoUrl: string;
  zipUrl?: string;
}

export interface WorkshopStepSpec {
  id: WorkshopStepId;
  num: string;
  label: string;
  short: string;
  phaseGroup: "aha-kern" | "praxis-pfad";
  phaseLabel: string;
}

export interface ToolModeSpec {
  id: ToolMode;
  label: string;
  shortLabel: string;
  badge: string;
  summary: string;
  examples: string[];
  workflowHint: string;
  noInstallRequired: boolean;
}

export interface OpenCodeHelpSpec {
  title: string;
  summary: string;
  steps: string[];
  commandSnippet: string;
  note: string;
}

export interface PhaseItem {
  id: string;
  number: number;
  phaseGroup: "aha-kern" | "praxis-pfad";
  timeRange: string;
  durationMin: number;
  title: string;
  subtitle: string;
  beamerHeadline: string;
  modeCues: Record<ToolMode, string>;
  activeQuestionId: string;
  keyTakeaway: string;
}

export interface PromptMethod {
  id: string;
  name: string;
  badge: string;
  bestFor: string;
  strength: string;
  risk: string;
  components: string[];
  prompt: string;
  unstructuredComparison: {
    label: string;
    excerpt: string;
    issues: string[];
  };
  structuredComparison: {
    label: string;
    excerpt: string;
    highlights: string[];
    formatTag: string;
  };
  expectedSnippet: string;
}

export interface ArchitectureLayer {
  layer: string;
  analogy: string;
  persistence: string;
  authority: string;
  example: string;
}

export interface TestQuestion {
  id: string;
  number: number;
  type: string;
  question: string;
  targetDocs: string[];
  whatToWatch: string;
  solutionSummary: string;
  focusStages: string[];
  isTrap?: boolean;
  webChatPrompt?: string;
  webChatWatch?: string;
  webChatSolution?: string;
  manipulationCheck?: {
    targetFile: string;
    originalValue: string;
    mutatedValue: string;
    expectedCitation: string;
    excerptTemplate?: string;
  };
}

export interface StageSkill {
  name: string;
  content: string;
}

export interface StageModeNote {
  headline: string;
  steps: string[];
  commandOrAction: string;
}

export interface StageSpec {
  id: string;
  folder: string;
  title: string;
  badge: string;
  beginnerBadge: string;
  summary: string;
  beginnerSummary: string;
  agentsMd: string;
  indexMd?: string;
  skills: StageSkill[];
  modeNotes: Record<ToolMode, StageModeNote>;
  focusQuestionIds: string[];
  sourceTags: string[];
}

export interface ExpressPackage {
  id: string;
  title: string;
  description: string;
  charCount: number;
  promptHeaderTemplate: string;
  sources: string[];
  content: string;
}

export interface PraxisPathModeVariant {
  label: string;
  prompt: string;
  deliverableHint: string;
}

export interface PraxisPathSpec {
  id: string;
  number: number;
  title: string;
  tag: string;
  durationMin: number;
  bestForRoles: string[];
  description: string;
  includesInBrowserLab?: boolean;
  promptsByMode: Record<ToolMode, PraxisPathModeVariant>;
}

export interface TransferBridgeRole {
  id: string;
  title: string;
  roles: string;
  workshopPattern: string;
  ccfUseCase: string;
  guardrailRule: string;
  starterPrompt: string;
}

export interface StarterArticle {
  slug: string;
  title: string;
  category: string;
  habitat: string;
  group?: string;
  content: string;
}

export interface VaultArticle {
  slug: string;
  title: string;
  category: string;
  habitat: string;
  group?: string;
  status: string;
  tags: string[];
  summary: string;
  related: string[];
  source_file: string;
  key_points: string[];
}

export interface McpConfigSet {
  claudeCode: string;
  openCode: string;
  geminiCli: string;
  codex: string;
  vscode: string;
  cursor: string;
  setupCommand: string;
  applyUserCommand: string;
}

export interface ChecklistItemSpec {
  id: string;
  stepId: WorkshopStepId;
  label: string;
}

export interface ReflectionPillSpec {
  id: string;
  label: string;
  hint: string;
}

export interface WorkshopDataset {
  meta: WorkshopMeta;
  moduleId?: string;
  level?: ModuleLevel;
  durationPresets?: number[];
  taxonomy?: ModuleTaxonomy;
  eventOverlay?: EventOverlaySpec;
  audioGuides?: Record<string, AudioGuideScriptSpec>;
  guardrailDebugChallenge?: GuardrailDebugChallengeSpec;
  animatics?: AnimaticSpecs;
  labPresets?: LabPresetsSpec;
  stagePackSpecs?: { packs: StagePackSpecItem[] };
  checklistItems?: ChecklistItemSpec[];
  reflectionPills?: ReflectionPillSpec[];
  steps: WorkshopStepSpec[];
  toolModes: ToolModeSpec[];
  openCodeHelp: OpenCodeHelpSpec;
  phases: PhaseItem[];
  promptComparisonTask: string;
  promptMethods: PromptMethod[];
  architectureLayers: ArchitectureLayer[];
  chatRulesTemplate: string;
  testQuestions: TestQuestion[];
  stages: StageSpec[];
  expressPackages: ExpressPackage[];
  praxisPaths: PraxisPathSpec[];
  transferBridge: TransferBridgeRole[];
  starterArticles: StarterArticle[];
  vaultArticles: VaultArticle[];
  mcpConfigs: McpConfigSet;
}

export interface ModuleCatalogEntry {
  id: string;
  title: string;
  subtitle: string;
  level: ModuleLevel;
  badge: string;
  domainLabel: string;
  durationPresets: number[];
  articleCount: number;
  tags: string[];
  isDefault?: boolean;
  mcpSupported?: boolean;
}

export interface ModuleCatalog {
  generatedAt: string;
  defaultModuleId: string;
  modules: ModuleCatalogEntry[];
}

export interface EvidenceMatch {
  slug: string;
  title: string;
  wikilink: string;
  rel_path: string;
  source_file: string;
  snippet: string;
  matched_tokens?: string[];
  score: number;
}

export interface VerifyClaimResult {
  status: "belegt" | "teilweise" | "nicht_belegt";
  label: string;
  evidence: EvidenceMatch[];
}

export type CorpusSearchIndex = Record<string, string>;
