import { test, expect } from "@playwright/test";

test("loads single page with URL input", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Cole um link do TikTok")).toBeVisible();
  await expect(page.getByText("tiktok.com/@autor/video/...")).toBeVisible();
});

test("shows error for invalid URL", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("https://...").fill("https://youtube.com/foo");
  await page.getByPlaceholder("https://...").press("Enter");
  await expect(page.getByText(/não parece ser do TikTok/i)).toBeVisible({
    timeout: 10_000,
  });
});

test("sidebar navigation works", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Batch").click();
  await expect(page).toHaveURL("/batch");
  await expect(page.getByText("Cole as URLs")).toBeVisible();
  await page.getByLabel("Histórico").click();
  await expect(page).toHaveURL("/history");
  await page.getByLabel("Configurações").click();
  await expect(page).toHaveURL("/settings");
  await expect(
    page.getByRole("heading", { name: "Configurações" }),
  ).toBeVisible();
});
