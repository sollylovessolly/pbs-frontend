import { test, expect } from "@playwright/test";

for (const width of [360, 1280]) {
  test(`station enquiry works at ${width}px without sending or booking automatically`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.route("**/api/**", (route) =>
      route.fulfill({
        json: route.request().url().includes("/reviews")
          ? {
              data: [],
              pagination: { page: 1, limit: 3, total: 0, totalPages: 0 },
            }
          : [],
      }),
    );
    await page.goto("/");
    const steps = page.getByRole("heading", {
      name: "How PolaroidsBySolly works",
    });
    const events = page.getByRole("heading", {
      name: "Looking to capture moments at your event?",
    });
    expect((await steps.boundingBox())!.y).toBeLessThan(
      (await events.boundingBox())!.y,
    );
    await page
      .locator("main section")
      .first()
      .getByRole("link", { name: "Book our Polaroid station", exact: true })
      .click();
    await expect(page).toHaveURL(/\/polaroid-station$/);
    await expect(
      page.getByRole("heading", { name: "Book our Polaroid station" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue to WhatsApp" }).click();
    await expect(
      page.getByRole("link", { name: "Send on WhatsApp" }),
    ).toHaveCount(0);
    await page.getByLabel("Your name").fill("QA Event Planner");
    await page.getByLabel("Event type").selectOption("Wedding");
    await page.getByLabel("Venue / city").fill("Lekki, Lagos");
    await page.getByLabel("Estimated guests").fill("120");
    await page.getByRole("button", { name: "Continue to WhatsApp" }).click();
    const link = page.getByRole("link", { name: "Send on WhatsApp" });
    const url = new URL((await link.getAttribute("href"))!);
    expect(url.hostname).toBe("wa.me");
    expect(url.searchParams.get("text")).toContain("Name: QA Event Planner");
    expect(url.searchParams.get("text")).toContain("Estimated guests: 120");
    expect(url.searchParams.get("text")).toContain("Date: Still deciding");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.getByLabel("Venue / city").fill("Ikeja, Lagos");
    await expect(link).toHaveCount(0);
    await page.getByRole("button", { name: "Continue to WhatsApp" }).click();
    expect(
      new URL((await link.getAttribute("href"))!).searchParams.get("text"),
    ).toContain("Ikeja, Lagos");
    await page.screenshot({
      path: `/tmp/pbs-station-${width}.png`,
      fullPage: true,
    });
  });
}
