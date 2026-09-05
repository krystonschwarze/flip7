import { expect, test } from "@playwright/test";

test("theme defaults to light and remembers an explicit dark choice", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Einstellungen öffnen" }).click();
  await expect(page.getByRole("radio")).toHaveCount(2);
  await page.getByRole("radio", { name: "Dunkel", exact: true }).check();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#1c2528",
  );
  await page.getByRole("button", { name: "Einstellungen öffnen" }).click();
  await page.getByRole("radio", { name: "Hell", exact: true }).check();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.evaluate(() => localStorage.setItem("flip7.theme.v1", "system"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
