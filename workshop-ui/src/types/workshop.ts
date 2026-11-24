export interface WorkshopMeta {
  title: string;
  subtitle: string;
  presenter: string;
  cluster: string;
  timeSlot: string;
  articleCount: number;
  complianceNote: string;
}

export interface PhaseItem {
  id: string;
  number: number;
  timeRange: string;
  durationMin: number;
  title: string;
  subtitle: string;
  beamerHeadline: string;
  trackACue: string;
  trackBCue: string;
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
}

export interface StageSkill {
  name: string;
  content: string;
}

export interface StageSpec {
  id: string;
  folder: string;
  title: string;
  badge: string;
  summary: string;
  agentsMd: string;
  indexMd?: string;
  skills: StageSkill[];
  trackBPrompt: string;
}

export interface MissionSpec {
  id: string;
  title: string;
  tag: string;
  description: string;
  prompt: string;
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

export interface WorkshopDataset {
  meta: WorkshopMeta;
  phases: PhaseItem[];
  promptComparisonTask: string;
  promptMethods: PromptMethod[];
  architectureLayers: ArchitectureLayer[];
  trackAPrimingTemplate: string;
  testQuestions: TestQuestion[];
  stages: StageSpec[];
  missions: MissionSpec[];
  starterArticles: StarterArticle[];
  vaultArticles: VaultArticle[];
  mcpConfigs: {
    claudeCode: string;
    geminiCli: string;
    codex: string;
    vscodeCursor: string;
    cliCommand: string;
  };
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

export interface SubmissionEvaluation {
  status: "belegt" | "teilweise" | "nicht_belegt";
  statusLabel: string;
  matchedRatio: number;
  isLikelyTrap: boolean;
  answerHasCitation: boolean;
  answerHasGuardrailRefusal: boolean;
  evidence: EvidenceMatch[];
  llmProvider?: string | null;
  llmComment?: string | null;
}

export interface SubmissionItem {
  id: string;
  created_at: string;
  team: string;
  track: string;
  stage: string;
  method: string;
  question: string;
  ai_answer: string;
  source: string;
  pinned?: boolean;
  discussed?: boolean;
  sample?: boolean;
  evaluation: SubmissionEvaluation;
}

export interface ServerHealth {
  ok: boolean;
  articleCount: number;
  lanUrls: string[];
  port: number;
  llmMode: string;
  githubRepo: string;
  githubLabel: string;
  gitAutoPull: boolean;
  joinUrl: string;
}

export interface StageState {
  phaseIdx: number;
  running: boolean;
  secondsLeft: number;
  updatedAt: number;
  beamerActive: boolean;
  connectedClients: number;
}
