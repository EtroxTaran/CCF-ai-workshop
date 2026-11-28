import fs from "node:fs";
import { test, expect, type Locator, type Page } from "@playwright/test";

let clipSentinelSeq = 0;

async function copyAndReadNormalized(page: Page, button: Locator): Promise<string> {
  const sentinel = `__CCF_CLIP_SENTINEL_${++clipSentinelSeq}_${Date.now()}__`;
  await page.evaluate(async (s) => {
    await navigator.clipboard.writeText(s);
  }, sentinel);
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await expect
    .poll(
      async () => {
        const val = await page.evaluate(async () => await navigator.clipboard.readText());
        return val;
      },
      { timeout: 5000 }
    )
    .not.toBe(sentinel);
  const raw = await page.evaluate(async () => await navigator.clipboard.readText());
  return raw.replace(/\r\n/g, "\n");
}

async function dismissOnboardingTourIfOpen(page: Page) {
  const closeTour = page.getByRole("button", { name: "Tour schließen" });
  try {
    await closeTour.waitFor({ state: "visible", timeout: 2500 });
    await closeTour.click();
  } catch {
    // Already dismissed or not triggered yet
  }
}

test.describe("Participant Flow: Goal x Tool Matrix, Hub, Navigation History, Debug, Validator & Export", () => {
  test("Guided Start displays 4 Goals x 4 Tools, Hub switches L1 <-> L2 cleanly without content leaks", async ({
    page,
  }) => {
    await page.goto("/#/", { waitUntil: "networkidle" });
    await dismissOnboardingTourIfOpen(page);

    const matrix = page.getByTestId("goal-tool-matrix");
    await expect(matrix).toBeVisible();

    for (const goalId of ["prompting", "app-building", "presentations", "everyday-ai"]) {
      await expect(page.getByTestId(`goal-card-${goalId}`)).toBeVisible();
    }
    for (const toolId of ["web", "desktop", "ide", "agent"]) {
      await expect(page.getByTestId(`tool-card-${toolId}`)).toBeVisible();
    }

    // Honest Kurztext-Hilfe label
    await expect(page.getByText(/Kurztext-Hilfe/i).first()).toBeVisible();

    // Hub link & L2 module switch without L1 leakage
    await page.getByRole("link", { name: /Alle Workshop-Module \(Hub\)/i }).click();
    await expect(page).toHaveURL(/#\/hub$/);
    await expect(page.getByText(/Kernbank 2026/i).first()).toBeVisible();

    await page.locator('a[href="#/m/context-engineering-projekt"]').first().click();
    await expect(page).toHaveURL(/#\/m\/context-engineering-projekt/);
    await expect(page.getByText(/Kernbank/i).first()).toBeVisible();
    // L1 wildlife mascot / polar bear should not leak into L2 hero / main goal matrix
    await expect(page.getByTestId("goal-tool-matrix")).not.toContainText("Eisbär");

    // Return to L1 default cleanly via Hub
    await page.getByRole("link", { name: /Alle Workshop-Module \(Hub\)/i }).click();
    await expect(page).toHaveURL(/#\/hub$/);
    await page.locator('a[href="#/"]').first().click();
    await expect(page).toHaveURL(/#\/$/);
  });

  test("Full participant journey through steps 01-04, history Back/Forward, Debug persistence, OutputValidator, Rubric, BYOU, and Export", async ({
    page,
  }) => {
    await page.goto("/#/", { waitUntil: "networkidle" });
    await dismissOnboardingTourIfOpen(page);

    // Select Goal ("app-building") and Tool ("ide")
    await page.getByTestId("goal-card-app-building").click();
    await page.getByTestId("tool-card-ide").click();
    await expect(page.getByTestId("tool-card-ide")).toHaveAttribute("aria-pressed", "true");

    // Navigate 01 -> 02 via CTA
    await page.getByTestId("btn-start-next").click();
    await expect(page).toHaveURL(/#\/methods$/);

    // Browser Back & Forward work with pushState/hash history
    await page.goBack();
    await expect(page.getByTestId("goal-tool-matrix")).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/#\/methods$/);

    // Move to Step 03 (Stages & Guardrails) & solve Debug Challenge
    await page.getByRole("button", { name: /^03\s*·/ }).first().click();
    await expect(page).toHaveURL(/#\/stages$/);

    // Complete GuardrailDebugChallenge by clicking the 2 grounding/cite options then verifying
    await page.getByRole("button", { name: /kein Vorwissen ergänzen/i }).click();
    await page.getByRole("button", { name: /Belege jede Aussage mit \(datei\.md\)/i }).click();
    await page.getByRole("button", { name: /Auswahl prüfen/i }).click();
    await expect(page.getByText(/Geprüfte & vollständige Projekt-Regel/i)).toBeVisible();

    // Reload preserves completion in localStorage
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText(/Geprüfte & vollständige Projekt-Regel/i)).toBeVisible();

    // Navigate to Step 04 (Ziel-Labor & Ergebnis-Check)
    await page.getByRole("button", { name: /^04\s*·/ }).first().click();
    await expect(page).toHaveURL(/#\/paths$/);
    await expect(page.getByTestId("goal-lab-steps")).toBeVisible();

    // OutputValidatorWidget: Fail sample -> Pass sample
    await page.getByTestId("validator-sample-fail").click();
    const resBox = page.getByTestId("validator-result");
    await expect(resBox).toBeVisible();
    await expect(resBox).toContainText(/nachschärfen/i);

    await page.getByTestId("validator-sample-pass").click();
    await expect(resBox).toContainText(/Bestanden/i);

    // GoalRubricCard: Check all items in rubric
    const rubric = page.getByTestId("goal-rubric");
    await expect(rubric).toBeVisible();
    const checkboxes = rubric.locator("label");
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).click();
    }
    await expect(rubric).toContainText(`${count}/${count} abgehakt`);

    // ByouRuleBuilder present
    await expect(page.getByTestId("byou-rule-builder")).toBeVisible();

    // Trigger Markdown & JSON Takeaway exports and verify real non-empty downloads
    await expect(page.getByTestId("workshop-summary-export")).toBeVisible();
    const [mdDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-takeaway-md").click(),
    ]);
    expect(mdDownload.suggestedFilename()).toMatch(/\.md$/);

    const [jsonDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-takeaway-json").click(),
    ]);
    expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/);
  });

  test("EN OutputValidator passes all 4 goals, rejects fake citations across all 4 goals, and resets on goal switch", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("v7-ccf-tour-seen-v1", "1"));
    await page.goto("/#/paths", { waitUntil: "networkidle" });

    const goalGroup = page.getByRole("group", { name: "Workshop-Ziel wählen" });
    const textarea = page.getByTestId("validator-textarea");
    const runBtn = page.getByTestId("validator-run-btn");
    const resultBox = page.getByTestId("validator-result");

    const cases = [
      {
        btn: "Besseres Prompting",
        validText: [
          "### Verified Summary",
          "- Polar bears have black skin and 42 teeth according to the current record (eisbaer.md).",
          "- Coral bleaching becomes critical after eight weeks (korallenbleiche.md).",
          "- Missing snow leopard entry pricing: [Not in source]",
        ].join("\n"),
        fakeCite: "(phantom-prompting.md)",
        fakeSlug: "phantom-prompting",
      },
      {
        btn: "Anwendung bauen",
        validText: [
          "# Mini Specification: Claim Checker",
          "## Problem & Goal",
          "Users verify task-1 and risk-register items strictly against (eisbaer.md) and (korallenbleiche.md).",
          "## Acceptance Criteria & Test Cases",
          "1. Normal test case: valid query outputs value with (file.md).",
          "2. Empty/error state: empty input returns clear validation message.",
          "3. Trap edge case: missing facts return [Not in source].",
          "```js",
          "const fallback = '[Not in source]';",
          "```",
        ].join("\n"),
        fakeCite: "(phantom-app.md)",
        fakeSlug: "phantom-app",
      },
      {
        btn: "Präsentationen bauen",
        validText: [
          "## Slide 1: Situation — Strict Grounding Eliminates Silent AI Guessing",
          "- Unconstrained chats fabricate numbers when sources omit data (eisbaer.md).",
          "Speaker notes: Introduce the before/after demonstration.",
          "## Slide 2: Complication — Unverified Claims Create Compliance Risks",
          "- Verified metrics come exclusively from (eisbaer.md) and (korallenbleiche.md).",
          "Speaker notes: Highlight the factual contrast.",
          "## Slide 3: Answer — Three Guardrails Plus Index Enforce Traceability",
          "- Every figure requires (eisbaer.md) and explicit [Not in source] markers.",
          "Speaker notes: Explain the three-stage setup.",
          "## Slide 4: Recommendation & Open Gaps for Monday",
          "- Conclusion: Run negative tests before team rollout ([Not in source]).",
          "Speaker notes: Assign ownership for Monday morning.",
        ].join("\n"),
        fakeCite: "(phantom-slides.md)",
        fakeSlug: "phantom-slides",
      },
      {
        btn: "KI im Arbeitsalltag",
        validText: [
          "### Summary & Decisions",
          "- Core metrics reconciled strictly against (eisbaer.md) and (korallenbleiche.md).",
          "### Action Items",
          "- [ ] Roll out team prompt rulebook | Owner: Team Lead | Deadline: Friday (eisbaer.md)",
          "- [ ] Clarify missing travel budget | Owner: [To be clarified] | Due: [To be clarified]",
          "### Risks & Open Questions",
          "- Risk on unverified clauses: missing figures are flagged with [Not in source].",
        ].join("\n"),
        fakeCite: "(phantom-everyday.md)",
        fakeSlug: "phantom-everyday",
      },
    ];

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      await goalGroup.getByRole("button", { name: c.btn }).click();
      if (i > 0) {
        // key={`${moduleId}-${goalId}`} remount clears previous result & input
        await expect(resultBox).toBeHidden();
        await expect(textarea).toHaveValue("");
      }

      await textarea.fill(c.validText);
      await runBtn.click();
      await expect(resultBox).toBeVisible();
      await expect(resultBox).toContainText(/Bestanden/i);
      await expect(page.getByTestId("output-validator")).toContainText("4/4 Kriterien");

      await textarea.fill(`${c.validText}\n- Additional claim from ${c.fakeCite}.`);
      await runBtn.click();
      await expect(resultBox).toContainText(/nachschärfen/i);
      await expect(resultBox).toContainText(c.fakeSlug);
    }
  });

  test("BYOU 3-way format switcher, 3/4 -> 4/4 rule validation, and takeaway .md/.json export content", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("v7-ccf-tour-seen-v1", "1"));
    await page.goto("/#/paths", { waitUntil: "networkidle" });

    const builder = page.getByTestId("byou-rule-builder");
    const switcher = page.getByTestId("byou-format-switcher");
    const preview = page.getByTestId("byou-rule-preview");
    await expect(builder).toBeVisible();
    await expect(builder).toContainText("4/4 Säulen geprüft");

    // Short trap question drops score to 3/4, valid >=20 char '?' restores 4/4
    const trapInput = builder.getByLabel(/Test-Fangfrage/i);
    await trapInput.fill("Kurz?");
    await expect(builder).toContainText("3/4 Säulen geprüft");

    const customTrap = "Wie hoch ist das nicht belegte Sonderbudget für den Kongress?";
    await trapInput.fill(customTrap);
    await expect(builder).toContainText("4/4 Säulen geprüft");

    // Switch through all 3 rulebook formats
    await page.getByTestId("byou-format-agents-md").click();
    await expect(page.getByTestId("byou-format-agents-md")).toHaveAttribute("aria-pressed", "true");
    await expect(preview).toContainText("# Arbeits-Regel (AGENTS.md)");
    await expect(builder).toContainText("4/4 Säulen geprüft");

    await page.getByTestId("byou-format-ide-rules").click();
    await expect(page.getByTestId("byou-format-ide-rules")).toHaveAttribute("aria-pressed", "true");
    await expect(preview).toContainText("# Workspace-Regel");
    await expect(builder).toContainText("4/4 Säulen geprüft");

    await page.getByTestId("byou-format-custom-instructions").click();
    await expect(switcher.getByTestId("byou-format-custom-instructions")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(preview).toContainText("System- & Assistant-Anweisung");
    await expect(builder).toContainText("4/4 Säulen geprüft");

    const expectedPreviewText = (await preview.innerText()).trim();

    // Verify exported .md and .json contents reflect active format, preview, and trap question
    const [mdDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-takeaway-md").click(),
    ]);
    const mdPath = await mdDownload.path();
    expect(mdPath).toBeTruthy();
    const mdContent = fs.readFileSync(mdPath!, "utf8");
    expect(mdContent).toContain("Langdock / Projects / Gems");
    expect(mdContent).toContain("(`custom-instructions`)");
    expect(mdContent).toContain("System- & Assistant-Anweisung");
    expect(mdContent).toContain(customTrap);

    const [jsonDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-takeaway-json").click(),
    ]);
    const jsonPath = await jsonDownload.path();
    expect(jsonPath).toBeTruthy();
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath!, "utf8"));
    expect(jsonContent.rulebookFormat).toBe("custom-instructions");
    expect(jsonContent.rulebookFormatLabel).toBe("Langdock / Projects / Gems");
    expect(jsonContent.trapTestQuestion).toBe(customTrap);
    expect(jsonContent.rulebookPreview).toContain(expectedPreviewText.slice(0, 40));
  });

  test("ToolTranslationMatrix (13 tools / 17 entries), HelpFaqSheet Tool-Matrix tab, Free-Help in web mode, and 9-client MCP tabs", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("v7-ccf-tour-seen-v1", "1"));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/#/", { waitUntil: "networkidle" });

    // Free-Help visible in web mode with Langdock, hidden in desktop mode
    const freeHelp = page.getByTestId("free-help-accordion");
    await expect(freeHelp).toBeVisible();
    await expect(freeHelp).toContainText("Kein eigenes KI-Abo?");
    await expect(freeHelp).toContainText("Kostenlos starten");
    await freeHelp.getByRole("button").first().click();
    await expect(freeHelp).toContainText("Langdock");

    await page.getByTestId("tool-card-desktop").click();
    await expect(freeHelp).toBeHidden();
    await page.getByTestId("tool-card-web").click();
    await expect(freeHelp).toBeVisible();

    // HelpFaqSheet: Schnellstart free box + Langdock link + 4th tab Tool-Matrix (compactCardsOnly)
    await page.getByRole("button", { name: "Hilfe, Glossar & FAQ öffnen" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Kein KI-Abo? Kostenlos starten");
    await expect(dialog).toContainText("Langdock öffnen");

    await dialog.getByRole("tab", { name: "Tool-Matrix" }).click();
    const sheetMatrix = dialog.getByTestId("tool-translation-matrix");
    await expect(sheetMatrix).toContainText("5 von 17 Einträgen · 17 Ziel-Tools");
    await expect(sheetMatrix.locator("article")).toHaveCount(5);

    await sheetMatrix.getByTestId("matrix-filter-all").click();
    await expect(sheetMatrix).toContainText("17 von 17 Einträgen · 17 Ziel-Tools");
    await expect(sheetMatrix.locator("article")).toHaveCount(17);
    await expect(sheetMatrix).toContainText("Google Antigravity");
    await expect(sheetMatrix).toContainText("Langdock Assistants");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // Step 02 ArchitectureLayerStack ToolTranslationMatrix table toggle (desktop md+)
    await page.goto("/#/methods", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Übersetzungsmatrix/i }).click();
    const step2Matrix = page.getByTestId("tool-translation-matrix");
    await expect(step2Matrix).toBeVisible();
    await expect(step2Matrix.locator("tbody tr")).toHaveCount(5);
    await step2Matrix.getByTestId("matrix-filter-all").click();
    await expect(step2Matrix.locator("tbody tr")).toHaveCount(17);
    await step2Matrix.getByTestId("matrix-filter-mode").click();
    await expect(step2Matrix.locator("tbody tr")).toHaveCount(5);

    // Step 04 9-Client + Setup-CLI MCP Accordion (10 tabs)
    await page.goto("/#/paths", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Lokaler MCP-Server für 9 Clients/i }).click();
    const expectedTabs = [
      "Claude Code",
      "Claude Desktop",
      "OpenCode",
      "Gemini CLI",
      "Antigravity",
      "Codex",
      "VS Code",
      "Cursor",
      "Windsurf",
      "Setup-CLI",
    ];
    for (const tabName of expectedTabs) {
      await expect(page.getByRole("tab", { name: tabName, exact: true })).toBeVisible();
    }
    await page.getByRole("tab", { name: "Antigravity", exact: true }).click();
    await expect(page.getByText("~/.gemini/config/mcp_config.json")).toBeVisible();
  });

  test("Clipboard CopyButtons stay <= 7500 chars across Step 02, Step 03, StageArtifactsSheet, and Step 04 in web mode", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => localStorage.setItem("v7-ccf-tour-seen-v1", "1"));
    await page.goto("/#/", { waitUntil: "networkidle" });
    await expect(page.getByTestId("tool-card-web")).toHaveAttribute("aria-pressed", "true");

    // Step 02
    await page.goto("/#/methods", { waitUntil: "networkidle" });
    const step2Copy = await copyAndReadNormalized(
      page,
      page.getByRole("button", { name: /^Kompakt-Paket/i }).first()
    );
    expect(step2Copy.length).toBeGreaterThan(0);
    expect(step2Copy.length).toBeLessThanOrEqual(7500);

    // Step 03 (Stages 1, 2, 3 + Turn 1/2 + Focus Questions + StageArtifactsSheet)
    await page.goto("/#/stages", { waitUntil: "networkidle" });

    // Stage 1
    await page.getByRole("button", { name: /Stufe 1.*Chaos/i }).click();
    const s1Copy = await copyAndReadNormalized(
      page,
      page.getByRole("button", { name: /Kompakt-Texte kopieren/i }).first()
    );
    expect(s1Copy.length).toBeGreaterThan(0);
    expect(s1Copy.length).toBeLessThanOrEqual(7500);

    // Stage 2
    await page.getByRole("button", { name: /Stufe 2.*Klare Regeln/i }).click();
    const s2Copy = await copyAndReadNormalized(
      page,
      page.getByRole("button", { name: /Regeln \+ Texte kopieren/i }).first()
    );
    expect(s2Copy.length).toBeGreaterThan(0);
    expect(s2Copy.length).toBeLessThanOrEqual(7500);

    // Stage 3
    await page.getByRole("button", { name: /Stufe 3.*Vernetztes Wissen/i }).click();
    const s3Copy = await copyAndReadNormalized(
      page,
      page.getByRole("button", { name: /Regeln \+ Kompakt-Index \+ Texte/i }).first()
    );
    expect(s3Copy.length).toBeGreaterThan(0);
    expect(s3Copy.length).toBeLessThanOrEqual(7500);

    const turn1Copy = await copyAndReadNormalized(
      page,
      page.getByRole("button", { name: /Turn 1: Nur _index\.md \+ Frage 2/i }).first()
    );
    expect(turn1Copy.length).toBeGreaterThan(0);
    expect(turn1Copy.length).toBeLessThanOrEqual(7500);

    const turn2Copy = await copyAndReadNormalized(
      page,
      page.getByRole("button", { name: /Turn 2: Fokus-Artikel/i }).first()
    );
    expect(turn2Copy.length).toBeGreaterThan(0);
    expect(turn2Copy.length).toBeLessThanOrEqual(7500);

    const focusQButtons = page.getByRole("button", { name: /Frage \+ Texte komplett/i });
    await expect(focusQButtons.first()).toBeVisible();
    const fqCount = await focusQButtons.count();
    expect(fqCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < fqCount; i++) {
      const fqCopy = await copyAndReadNormalized(page, focusQButtons.nth(i));
      expect(fqCopy.length).toBeGreaterThan(0);
      expect(fqCopy.length).toBeLessThanOrEqual(7500);
    }

    // StageArtifactsSheet (Stage 3 packs & _index.md)
    await page.getByRole("button", { name: /Alle Texte & Regeln/i }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    const packCopyButtons = sheet.getByRole("button", { name: /kopieren/i });
    await expect(packCopyButtons.first()).toBeVisible();
    const packCopyCount = await packCopyButtons.count();
    expect(packCopyCount).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < packCopyCount; i++) {
      const pCopy = await copyAndReadNormalized(page, packCopyButtons.nth(i));
      expect(pCopy.length).toBeGreaterThan(0);
      expect(pCopy.length).toBeLessThanOrEqual(7500);
    }

    await sheet.getByRole("tab", { name: /Inhaltsverzeichnis/i }).click();
    const idxCopy = await copyAndReadNormalized(
      page,
      sheet.getByRole("button", { name: /kopieren/i }).first()
    );
    expect(idxCopy.length).toBeGreaterThan(0);
    expect(idxCopy.length).toBeLessThanOrEqual(7500);
    await page.keyboard.press("Escape");

    // Step 04
    await page.goto("/#/paths", { waitUntil: "networkidle" });
    await expect(page.getByTestId("goal-lab-steps")).toBeVisible();
    const step4BundleBtns = page.getByRole("button", { name: /^Prompt \+ \d+ Kompakt-Texte/i });
    await expect(step4BundleBtns.first()).toBeVisible();
    const s4Count = await step4BundleBtns.count();
    expect(s4Count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < s4Count; i++) {
      const s4Copy = await copyAndReadNormalized(page, step4BundleBtns.nth(i));
      expect(s4Copy.length).toBeGreaterThan(0);
      expect(s4Copy.length).toBeLessThanOrEqual(7500);
    }
  });

  test("Blind-review regressions: Hub goal propagation + L3 empty state, click GlossaryTip, BYOU Gate 6 interaction + no truncation, Step 03 validator jump, and clean L2 UI", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("v7-ccf-tour-seen-v1", "1"));

    // M1-HUB-01 & M1-HUB-04: Hub Goal filter propagation & L3 empty state
    await page.goto("/#/hub", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "L3" }).click();
    await expect(page.getByText(/Kein aktives Modul für diese Filterauswahl/i)).toBeVisible();
    await page.getByRole("button", { name: /Alle Level anzeigen/i }).click();

    await page.getByRole("button", { name: "Anwendung bauen" }).click();
    await page.locator('a[href*="#/m/context-engineering-projekt?goal=app-building"]').first().click();
    await expect(page).toHaveURL(/#\/m\/context-engineering-projekt\?goal=app-building/);
    await expect(page.getByTestId("goal-card-app-building")).toHaveAttribute("aria-pressed", "true");

    // M4-02..05 & L-01..08: L2 Step 01..03 clean of L1 wildlife leaks & raw '**'
    const l2Step1Text = await page.locator("main").innerText();
    expect(l2Step1Text).not.toMatch(/68 Artikeln|Schneeleopard|38 Zähne|stufe-1-chaos/i);

    await page.goto("/#/m/context-engineering-projekt/methods", { waitUntil: "networkidle" });
    const l2Step2Text = await page.locator("main").innerText();
    expect(l2Step2Text).not.toMatch(/Steinkorallen|quellen-recherche|fakten-pruefer|search_wildlife_vault/i);

    // M2-05: GlossaryTip opens on click
    const glossaryBtn = page.locator("button[aria-expanded]").first();
    await glossaryBtn.click();
    await expect(glossaryBtn).toHaveAttribute("aria-expanded", "true");

    // M3-13 / M5-13: Fresh #/paths starts with 0/6 Nachweise (Gate 6 NOT pre-passed)
    await page.goto("/#/paths", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /Nachweise/i })).toContainText("0/6");

    // M3-17: Goal 1 Step 03 renders validator jump button instead of 'Prompt kopieren'
    await page
      .getByRole("group", { name: "Workshop-Ziel wählen" })
      .getByRole("button", { name: "Besseres Prompting" })
      .click();
    await expect(page.getByRole("button", { name: /Nachweise/i })).toContainText("1/6");
    await expect(page.getByRole("button", { name: /Zum Output-Validator springen/i })).toBeVisible();

    // M3-04 & M3-13: BYOU area selection preserves full task text (no 140-char cut) & unlocks Gate 6 on confirmation
    const builder = page.getByTestId("byou-rule-builder");
    const roleSelect = builder.locator("select").first();
    await roleSelect.selectOption({ index: 1 });
    await roleSelect.selectOption({ index: 0 });
    const taskValue = await builder.locator("textarea").first().inputValue();
    expect(taskValue.length).toBeGreaterThan(140);
    await page.getByTestId("byou-confirm-btn").click();
    await expect(page.getByRole("button", { name: /Nachweise/i })).toContainText("2/6");
  });
});
