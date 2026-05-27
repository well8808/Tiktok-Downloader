import { test, expect } from "@playwright/test";

test("batch page renders URL list input", async ({ page }) => {
  await page.goto("/batch");
  await expect(
    page.getByRole("heading", { name: "Cole as URLs" }),
  ).toBeVisible();
  await expect(page.getByText("Uma por linha. Até 100 por vez.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Iniciar fila" }),
  ).toBeVisible();
});

test("URL counter updates as URLs are pasted", async ({ page }) => {
  await page.goto("/batch");
  const textarea = page.getByPlaceholder("https://www.tiktok.com/...");
  await textarea.fill(
    "https://tiktok.com/@a/video/1\nhttps://tiktok.com/@b/video/2\nhttps://tiktok.com/@c/video/3",
  );
  await expect(page.getByText("3 URLs detectadas")).toBeVisible();
});
