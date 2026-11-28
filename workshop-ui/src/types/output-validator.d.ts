declare module "@shared/output-validator.mjs" {
  import type { GoalId } from "@/types/workshop";

  export type RulebookFormat = "agents-md" | "custom-instructions" | "ide-rules";

  export interface ModuleValidationContext {
    validSlugs: string[];
    trapForbiddenTerms?: string[];
    expectedFactToken?: string;
    expectedFactAliases?: string[];
    acceptedFactTokens?: string[];
    expectedFactDisplayLabel?: string;
    samplePrimarySlug?: string;
    sampleSecondarySlug?: string;
    moduleId?: string;
  }

  export type OutputValidationContext = ModuleValidationContext;

  export interface ValidationCheckItem {
    id: string;
    label: string;
    passed: boolean;
    detail: string;
    fixPrompt: string;
    required?: boolean;
  }

  export type OutputValidationCheck = ValidationCheckItem;

  export interface OutputValidationResult {
    goalId: GoalId | "rulebook";
    passed: boolean;
    score: number;
    maxScore: number;
    summary: string;
    nextStepTip: string;
    checks: ValidationCheckItem[];
  }

  export function extractCitedSlugs(text: string): string[];

  export function validateParticipantOutput(
    goalId: GoalId,
    rawText: string,
    ctx?: ModuleValidationContext
  ): OutputValidationResult;

  export function validateRulebook(
    ruleText: string,
    negativeTest: string,
    options?: { format?: RulebookFormat }
  ): OutputValidationResult;

  export function getValidatorSample(
    goalId: GoalId,
    kind?: "fail" | "pass",
    ctx?: ModuleValidationContext
  ): string;
}
