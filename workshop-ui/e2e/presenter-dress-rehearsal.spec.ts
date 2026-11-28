import { test, expect } from "@playwright/test";

test.describe("Presenter Dress Rehearsal (#/beamer)", () => {
  test("supports Daylight/Dark toggle, Gong M muted invariant, Speaker Notes (P), Cheat-Sheet (?), Overlay timeSlot + Duration scaling, Demo mutation (Q4), QR toggle, and inline module switch", async ({
    page,
  }) => {
    await page.goto("/#/beamer", { waitUntil: "networkidle" });

    // Gong muted by default
    const muteBtn = page.getByRole("button", { name: /Stumm \(M\)|Gong aktiv \(M\)/i });
    await expect(muteBtn).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("m");
    await expect(muteBtn).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("m");
    await expect(muteBtn).toHaveAttribute("aria-pressed", "false");

    // Theme toggle (T)
    const themeBtn = page.getByRole("button", { name: /(Tageslicht|Dunkel)-Modus \(T\)/i });
    const initialAria = await themeBtn.getAttribute("aria-label");
    await page.keyboard.press("t");
    expect(await themeBtn.getAttribute("aria-label")).not.toBe(initialAria);
    await page.keyboard.press("t");

    // Speaker Notes toggle (P)
    await page.keyboard.press("p");
    await expect(page.getByTestId("beamer-speaker-notes")).toBeVisible();
    await page.keyboard.press("p");
    await expect(page.getByTestId("beamer-speaker-notes")).toBeHidden();

    // Shortcut Cheat-Sheet (?)
    await page.keyboard.press("?");
    await expect(page.getByTestId("beamer-shortcuts-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("beamer-shortcuts-dialog")).toBeHidden();

    // Session Overlay: update timeSlot and apply 30 Min. preset scaling
    await page.getByRole("button", { name: "Session-Overlay anpassen" }).click();
    const timeSlotInput = page.locator('label:has-text("Zeitfenster") input');
    await timeSlotInput.fill("14:30–15:15");
    await page.getByRole("button", { name: "30 Min." }).click();
    await expect(page.getByRole("button", { name: "30 Min." })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Übernehmen" }).click();
    await expect(page.getByText("14:30–15:15").first()).toBeVisible();

    // M1-BEAMER-12: Wall-clock uses standard colon format (HH:MM Uhr), not HH.MM Uhr
    const footerClockText = await page.locator("footer").innerText();
    expect(footerClockText).toMatch(/\d{2}:\d{2}\s+Uhr/);
    expect(footerClockText).not.toMatch(/\d{2}\.\d{2}\s+Uhr/);

    // Phase navigation (ArrowRight -> 2/4) & Demo Subtab hotkey (Shift+Digit2 -> Demo Tab "4 Prompt-Methoden")
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText(/^2\/\d+$/).first()).toBeVisible();
    await page.keyboard.press("Shift+Digit2");
    await expect(page.getByRole("tab", { name: /4 Prompt-Methoden/i })).toHaveAttribute("aria-selected", "true");

    // Switch back to Demo Subtab 1 ("Stufe 1 → 2 → 3"), select Frage 4, and step progressive reveal (n/Space) twice -> reveals 38 Zähne
    await page.keyboard.press("Shift+Digit1");
    await page.getByRole("button", { name: /Frage 4/i }).first().click();
    await page.keyboard.press("n");
    await page.keyboard.press("n");
    await expect(page.getByText(/38 Zähne/i).first()).toBeVisible();

    // Inline module switch to L2 Kernbank -> wait for L2 mount, open Demo tab, select Q4 -> 2 Stunden <-> 4 Stunden
    const modSelect = page.locator("select").first();
    if (await modSelect.isVisible()) {
      await modSelect.selectOption("context-engineering-projekt");
      await expect(page.getByText(/Context Engineering · Projekt/i).first()).toBeVisible({ timeout: 10_000 });
      await page.getByRole("button", { name: /2\s*Demo/i }).click();
      await page.getByRole("button", { name: /Frage 4|Q4/i }).first().click();
      await page.keyboard.press("n");
      await page.keyboard.press("n");
      await expect(page.getByText(/2 Stunden|4 Stunden/i).first()).toBeVisible({ timeout: 10_000 });

      // M1-BEAMER-02: L2 Phase 2 Stage cues must have zero L1 wildlife leakage
      await page.getByRole("button", { name: /1\s*Stage/i }).click();
      await page.keyboard.press("ArrowRight");
      const l2Phase2Text = await page.locator("main").innerText();
      expect(l2Phase2Text).not.toMatch(/stufe-1-chaos|Schneeleopard|38 Zähne/i);

      // M1-BEAMER-08: MCP-Fluss 'Paket senden' displays visible response output
      await page.getByRole("button", { name: /2\s*Demo/i }).click();
      await page.getByRole("tab", { name: /MCP-Fluss/i }).click();
      await page.getByRole("button", { name: /Paket senden/i }).click();
      await expect(page.getByTestId("mcp-packet-response")).toBeVisible();
    }

    // Switch to QR Join tab (3 QR Join) -> verify single hash URL & Online/LAN toggle
    await page.getByRole("button", { name: /3\s*QR Join/i }).click();
    await expect(page.getByText(/https:\/\/etroxtaran\.github\.io\/CCF-ai-workshop\//)).toBeVisible();
    const bodyText = await page.locator("main").innerText();
    expect(bodyText).not.toMatch(/\/#\/.*#\/?/);

    await page.getByRole("button", { name: "Lokal / Offline-LAN" }).click();
    await expect(page.getByText(/http:\/\/127\.0\.0\.1:\d+|http:\/\/localhost/i)).toBeVisible();
  });
});
