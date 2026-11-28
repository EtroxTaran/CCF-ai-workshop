import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "laptop", width: 1280, height: 720 },
  { name: "beamer", width: 1920, height: 1080 },
];

const ROUTES = [
  { name: "app", hash: "#/" },
  { name: "hub", hash: "#/hub" },
  { name: "beamer", hash: "#/beamer" },
  { name: "methods", hash: "#/methods" },
  { name: "stages", hash: "#/stages" },
  { name: "paths", hash: "#/paths" },
  { name: "module-l2", hash: "#/m/context-engineering-projekt" },
];

async function waitForRouteReady(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.locator("#root")).not.toContainText(/wird geladen/i, { timeout: 10_000 });
  await page.locator("main, header").first().waitFor({ state: "visible", timeout: 8000 });
}

test.describe("Subpath (/CCF-ai-workshop/), responsive layouts, zero console/network errors, and axe-core a11y", () => {
  test("loads /CCF-ai-workshop/ routes cleanly with zero runtime/network errors", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("v7-ccf-tour-seen-v1", "1"));
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedResponses: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("response", (res) => {
      if (res.status() >= 400) failedResponses.push(`${res.status()} ${res.url()}`);
    });

    for (const r of ROUTES) {
      await waitForRouteReady(page, `/CCF-ai-workshop/${r.hash}`);
    }

    expect(consoleErrors, `Console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
    expect(pageErrors, `Page errors: ${pageErrors.join(" | ")}`).toEqual([]);
    expect(failedResponses, `Failed HTTP responses: ${failedResponses.join(" | ")}`).toEqual([]);
  });

  for (const vp of VIEWPORTS) {
    test(`no horizontal overflow at ${vp.name} (${vp.width}x${vp.height}) across all 7 routes`, async ({
      page,
    }) => {
      await page.addInitScript(() => localStorage.setItem("v7-ccf-tour-seen-v1", "1"));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const r of ROUTES) {
        await waitForRouteReady(page, `/${r.hash}`);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        );
        expect(
          overflow,
          `Horizontal overflow on ${r.hash} @ ${vp.width}x${vp.height}: ${overflow}px`
        ).toBeLessThanOrEqual(2);
      }

      if (vp.name === "mobile") {
        // M1-HUB-13 & M1-HUB-02: Hub progressbar has numeric aria-valuenow & mobile header fits cleanly
        await waitForRouteReady(page, "/#/hub");
        const firstBar = page.getByRole("progressbar").first();
        await expect(firstBar).toHaveAttribute("aria-valuenow", /^\d+$/);
        const headerOverflow = await page.evaluate(() => {
          const h = document.querySelector("header");
          return h ? h.scrollHeight - h.clientHeight : 0;
        });
        expect(headerOverflow).toBeLessThanOrEqual(2);
      }
    });
  }

  for (const r of ROUTES) {
    test(`axe-core accessibility check on ${r.hash} reports zero critical or serious violations`, async ({
      page,
    }) => {
      await page.addInitScript(() => localStorage.setItem("v7-ccf-tour-seen-v1", "1"));
      await waitForRouteReady(page, `/${r.hash}`);
      const results = await new AxeBuilder({ page }).analyze();
      const blockers = results.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact || "")
      );
      expect(
        blockers.map(
          (v) =>
            `${v.impact}: ${v.id} (${v.help}) [${v.nodes.map((n) => n.html.slice(0, 120)).join(" ; ")}]`
        ),
        `A11y violations on ${r.hash}`
      ).toEqual([]);
    });
  }
});
