import { test, expect } from "@playwright/test";

test("settings page renders all sections", async ({ page }) => {
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Pasta de destino" }),
  ).toBeVisible();
  await expect(page.getByText("Remover metadados automaticamente")).toBeVisible();
  await expect(page.getByText("Sempre gerar MP3 junto")).toBeVisible();
  await expect(page.getByText("Engine de download")).toBeVisible();
});

test("toggling strip-metadata flips aria-checked", async ({ page }) => {
  await page.goto("/settings");
  const toggle = page.getByRole("switch", {
    name: /Remover metadados automaticamente/i,
  });
  const initial = await toggle.getAttribute("aria-checked");
  await toggle.click();
  const next = await toggle.getAttribute("aria-checked");
  expect(next).not.toBe(initial);
  await toggle.click();
});
