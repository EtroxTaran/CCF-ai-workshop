export type ToolMode = "web" | "desktop" | "agent";
export type WorkshopStepId = "start" | "methods" | "stages" | "paths";
export type BeamerMode = "stage" | "demo" | "qr" | "outro";

export interface WorkshopMeta {
  title: string;
  subtitle: string;
  presenter: string;
  cluster: string;
  timeSlot: string;
  articleCount: number;
  complianceNote: string;
  pagesUrl: string;
  repoUrl: string;
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
  id: "methods" | "stages-arctic-reef";
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
  id: "pfad-recherche" | "pfad-praesentation" | "pfad-app";
  number: 1 | 2 | 3;
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
  category: "lebensraum" | "tierart" | "konzept";
  habitat: string;
  content: string;
}

export interface VaultArticle {
  slug: string;
  title: string;
  category: "lebensraum" | "tierart" | "konzept";
  habitat: string;
  status: string;
  tags: string[];
  summary: string;
  related: string[];
  source_file: string;
  key_points: string[];
}

export interface McpConfigSet {
  claudeCode: string;
  geminiCli: string;
  codex: string;
  vscodeCursor: string;
  setupCommand: string;
}

export interface WorkshopDataset {
  meta: WorkshopMeta;
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
