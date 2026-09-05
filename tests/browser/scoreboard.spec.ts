import { test, expect, type Page } from "@playwright/test";
import http from "node:http";
import type { AddressInfo } from "node:net";

async function setup(page: Page, url = "/") {
  await page.goto(url);
  await page.getByRole("button", { name: "Namen hinzufügen" }).click();
  for (const name of ["Alex", "Sam"]) {
    await page.getByLabel("Neue Person", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Name hinzufügen", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Auswahl übernehmen", exact: true })
    .click();
}
async function enter(page: Page, score: number) {
  const dialog = page.getByRole("dialog");
  for (const digit of String(score))
    await dialog.getByRole("button", { name: digit, exact: true }).click();
  await dialog
    .getByRole("button", {
      name: /Weiter zu|Runde abschließen|Änderung speichern/,
    })
    .click();
}

test("a complete mobile game, undo, correction, persistence and rematch", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await setup(page);
  await page.getByRole("button", { name: "100", exact: true }).click();
  await page.getByRole("button", { name: "Los geht’s" }).click();
  await page
    .getByRole("button", { name: "Punkte eintragen", exact: true })
    .click();
  await enter(page, 60);
  await page.getByRole("button", { name: "Verzockt", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Runde abschließen", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Runde 2", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Punkte eintragen", exact: true })
    .click();
  await enter(page, 50);
  await expect(page.getByRole("heading", { name: /gewinnt/ })).toHaveCount(0);
  await enter(page, 120);
  await expect(
    page.getByRole("dialog", { name: "Partie entschieden!" }),
  ).toBeVisible();
  await page.getByRole("dialog").screenshot({
    path: `artifacts/winner-${page.viewportSize()!.width}.png`,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Zum Ergebnis" }).click();
  await expect(
    page.getByRole("heading", { name: "Sam gewinnt!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Runde 2", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Punkte eintragen", exact: true })
    .click();
  await enter(page, 120);
  await page.getByRole("button", { name: "Zum Ergebnis" }).click();
  await page
    .getByRole("button", { name: "Runde 2, Sam: 120 Punkte bearbeiten" })
    .click();
  await page
    .getByRole("button", { name: "Letzte Ziffer löschen" })
    .click({ clickCount: 3 });
  await enter(page, 20);
  await expect(
    page.getByRole("heading", { name: "Alex gewinnt!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Revanche", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Runde 1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Alex, 0 Punkte, Punkte eintragen" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("name presets, custom target, unfinished keypad and narrow layouts", async ({
  page,
}, testInfo) => {
  await setup(page);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-setup.png`,
    fullPage: false,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Eigenes Punktziel" }).click();
  await page.getByLabel("Bis wie viele Punkte spielt ihr?").fill("250");
  await page.getByRole("button", { name: "Punktziel übernehmen" }).click();
  await page.getByRole("button", { name: "Los geht’s" }).click();
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-game.png`,
    fullPage: false,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Punkte eintragen", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "4", exact: true })
    .click();
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#score-value")).toHaveText("4");
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-keypad.png`,
    fullPage: false,
    animations: "disabled",
  });
  const width = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(width.content).toBeLessThanOrEqual(width.viewport);
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await page.getByRole("link", { name: "Zum Spielstart" }).click();
  await page.getByRole("button", { name: "Einstellungen öffnen" }).click();
  await page.getByRole("button", { name: "Gespeicherte Namen" }).click();
  await page.getByRole("button", { name: "Alex bearbeiten" }).click();
  await page.getByLabel("Name bearbeiten", { exact: true }).fill("Alexa");
  await page
    .getByRole("button", { name: "Name speichern", exact: true })
    .click();
  await page.getByRole("button", { name: "Sam löschen", exact: true }).click();
  await page
    .getByRole("button", { name: "Namen löschen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Auswahl übernehmen", exact: true })
    .click();
  await page.getByRole("button", { name: /Partie fortsetzen/ }).click();
  await expect(
    page.getByRole("button", { name: "Alex, 0 Punkte, Punkte eintragen" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sam, 0 Punkte, Punkte eintragen" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Zum Spielstart" }).click();
  await expect(page.locator(".person-name")).toHaveText(["Alexa"]);
  await page.reload();
  await page.getByRole("link", { name: "Zum Spielstart" }).click();
  await expect(page.locator(".person-name")).toHaveText(["Alexa"]);
});

test("production opens offline after caching and keeps the game", async ({
  page,
}) => {
  const proxy = http.createServer((request, response) => {
    const upstream = http.request(
      {
        hostname: "127.0.0.1",
        port: 3107,
        path: request.url,
        method: request.method,
        headers: request.headers,
      },
      (result) => {
        response.writeHead(result.statusCode ?? 502, result.headers);
        result.pipe(response);
      },
    );
    upstream.on("error", () => response.destroy());
    request.pipe(upstream);
  });
  await new Promise<void>((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
  try {
    await setup(page, url);
    await page.getByRole("button", { name: "Los geht’s" }).click();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBeTruthy();
    proxy.closeAllConnections();
    await new Promise<void>((resolve) => proxy.close(() => resolve()));
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Runde 1", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Punkte eintragen", exact: true })
      .click();
    await enter(page, 42);
    await enter(page, 33);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Alex, 42 Punkte, Punkte eintragen" }),
    ).toBeVisible();
  } finally {
    proxy.closeAllConnections();
    proxy.close();
  }
});

test("card input computes bonuses, persists the hand and completes directly in the sheet", async ({
  page,
}, testInfo) => {
  await setup(page);
  await page.getByRole("button", { name: "Los geht’s" }).click();
  await page
    .getByRole("button", { name: "Punkte eintragen", exact: true })
    .click();
  await page.getByRole("button", { name: "Karten", exact: true }).click();
  for (const n of [0, 1, 2, 3, 4, 5, 6])
    await page.getByRole("button", { name: `Karte ${n}`, exact: true }).click();
  await page.getByRole("button", { name: "Zahlen verdoppeln" }).click();
  await page.getByRole("button", { name: "Bonus +10", exact: true }).click();
  await expect(page.locator("#score-value")).toHaveText("67");
  await expect(
    page.getByRole("button", { name: "Karte 7", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.locator("#score-value")).toHaveText("67");
  await expect(
    page.getByRole("button", { name: "Karte 0", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-card-input.png`,
    animations: "disabled",
  });
  const submit = page.getByRole("button", { name: "Weiter zu Sam" });
  const box = await submit.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await submit.click();
  await expect(
    page.getByRole("heading", { name: "Sam", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".editor-totals > span").first().locator("strong"),
  ).toHaveText("67");
  await page.reload();
  await expect(
    page.locator(".editor-totals > span").first().locator("strong"),
  ).toHaveText("67");
  await page.getByRole("button", { name: "Karte 12", exact: true }).click();
  await page
    .getByRole("button", { name: "Runde abschließen", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Runde 2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Alex, 67 Punkte, Punkte eintragen",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Runde 1, Alex: 67 Punkte bearbeiten" })
    .click();
  await expect(
    page.getByRole("button", { name: "Karte 0", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Punkte", exact: true }).click();
  await expect(page.locator("#score-value")).toHaveText("67");
  await page.getByRole("button", { name: "Änderung speichern" }).click();
});

test("names have explicit add, stable inline editing and consistent delete actions", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Namen hinzufügen" }).click();
  await expect(
    page.getByRole("button", { name: "Name hinzufügen", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Neue Person", { exact: true }).fill("Alex");
  await expect(
    page.getByRole("button", { name: "Auswahl übernehmen" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Name hinzufügen", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Auswahl übernehmen" }),
  ).toBeEnabled();
  const before = await page.locator(".saved-person").boundingBox();
  await page.getByRole("button", { name: "Alex bearbeiten" }).click();
  const during = await page.locator(".saved-person").boundingBox();
  expect(Math.abs(before!.height - during!.height)).toBeLessThanOrEqual(2);
  await page.getByRole("button", { name: "Bearbeiten abbrechen" }).click();
  await page.getByRole("button", { name: "Alex löschen", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Namen löschen", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Alex bearbeiten" }),
  ).toBeVisible();
});

test("settings open as a sheet, sheets drag closed and multiple players scroll sideways", async ({
  page,
}, testInfo) => {
  await setup(page);
  await page.getByRole("button", { name: "Einstellungen öffnen" }).click();
  const menu = await page.getByRole("dialog").boundingBox();
  expect(menu!.y).toBeGreaterThan(100);
  await expect(
    page.getByRole("button", { name: "Dialog nach unten schließen" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Gespeicherte Namen" }).click();
  await page.getByRole("dialog").evaluate(async (el) => {
    await Promise.all(
      el.getAnimations().map((animation) => animation.finished.catch(() => {})),
    );
  });
  const handle = await page
    .getByRole("button", { name: "Dialog nach unten schließen" })
    .boundingBox();
  await page.mouse.move(
    handle!.x + handle!.width / 2,
    handle!.y + handle!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handle!.x + handle!.width / 2,
    handle!.y + handle!.height / 2 + 110,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Personen auswählen" }).click();
  for (const name of ["Kim", "Jo", "Robin", "Charlie"]) {
    await page.getByLabel("Neue Person", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Name hinzufügen", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Auswahl übernehmen" }).click();
  await page.getByRole("button", { name: "Los geht’s" }).click();
  await expect(
    page.getByRole("button", { name: "Einstellungen öffnen" }),
  ).toHaveCount(0);
  const cards = page.locator(".score-cards");
  const box = await cards.boundingBox();
  if (page.viewportSize()!.width < 650) {
    expect(box!.x).toBeCloseTo(0, 0);
    expect(box!.width).toBeCloseTo(page.viewportSize()!.width, 0);
  }
  expect(
    await cards.evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBeTruthy();
  const rounds = await page
    .getByRole("heading", { name: "Euer Rundenverlauf" })
    .boundingBox();
  expect(rounds!.y + rounds!.height).toBeLessThan(
    page.viewportSize()!.height - 70,
  );
  await page.getByRole("button", { name: "Weitere Personen" }).click();
  await expect
    .poll(() => cards.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(50);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-carousel.png`,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Punkte eintragen", exact: true })
    .click();
  await enter(page, 42);
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  const positions = await page.locator(".table-scroll").evaluate(async (el) => {
    const results: number[][] = [];
    for (const left of [0, 8, 50, 200, el.scrollWidth, 0]) {
      el.scrollLeft = left;
      await new Promise(requestAnimationFrame);
      const edge = el.getBoundingClientRect().left;
      results.push(
        [...el.querySelectorAll("th:first-child")].map(
          (cell) => cell.getBoundingClientRect().left - edge,
        ),
      );
    }
    return results;
  });
  for (const position of positions) {
    position.forEach((left) => expect(Math.abs(left)).toBeLessThan(1));
  }
  await page.locator(".table-scroll").evaluate((el) => {
    el.scrollLeft = 130;
  });
  await page.locator(".rounds-paper").scrollIntoViewIfNeeded();
  await page.locator(".rounds-paper").screenshot({
    path: `artifacts/${testInfo.project.name}-scrolled-table.png`,
    animations: "disabled",
  });
});

test("saving a name does not replay the sheet entrance, reduced motion stays still", async ({
  page,
}, testInfo) => {
  await setup(page);
  await page.getByRole("button", { name: "Personen auswählen" }).click();
  await page.getByRole("button", { name: "Alex bearbeiten" }).click();
  await page.getByRole("button", { name: "Name speichern" }).click();
  expect(
    await page.getByRole("dialog").evaluate((el) => el.getAnimations().length),
  ).toBe(0);
  await page.getByRole("button", { name: "Auswahl übernehmen" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Personen auswählen" }).click();
  await page.getByLabel("Neue Person", { exact: true }).fill("Kk");
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-names.png`,
    caret: "initial",
  });
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe("none");
});

test("long names keep the score action visible and table totals aligned", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("flip7.scoreboard.v1")!);
    state.profiles[0].name = "Maximilian-Mustermannxxx";
    state.profiles[1].name = "AlexandravonMustermannxx";
    localStorage.setItem("flip7.scoreboard.v1", JSON.stringify(state));
  });
  await page.reload();
  await page.getByRole("button", { name: "Los geht’s" }).click();
  await page
    .getByRole("button", { name: "Punkte eintragen", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "9", exact: true })
    .click({ clickCount: 3 });
  const footer = await page.locator(".editor-footer").boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  );
  await page.getByRole("button", { name: "Karten", exact: true }).click();
  const cardFooter = await page.locator(".editor-footer").boundingBox();
  expect(cardFooter!.y + cardFooter!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  );
  await page.getByRole("button", { name: "Karte 12", exact: true }).click();
  await page.getByRole("button", { name: /Weiter zu/ }).click();
  await page.getByRole("button", { name: "Karte 10", exact: true }).click();
  await page
    .getByRole("button", { name: "Runde abschließen", exact: true })
    .click();
  const tops = await page
    .locator(".table-total")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
  expect(Math.abs(tops[0] - tops[1])).toBeLessThan(1);
});

test("player order persists and determines the score entry sequence", async ({
  page,
}) => {
  await setup(page);
  await page.getByRole("button", { name: "Reihenfolge ändern" }).click();
  const handle = page.getByRole("button", { name: "Sam verschieben" });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");
  await expect(page.locator(".lineup .person-name")).toHaveText([
    "Sam",
    "Alex",
  ]);
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await page.reload();
  await expect(page.locator(".lineup .person-name")).toHaveText([
    "Sam",
    "Alex",
  ]);
  await page.getByRole("button", { name: "Los geht’s" }).click();
  await page
    .getByRole("button", { name: "Punkte eintragen", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Sam", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Weiter zu Alex" }),
  ).toBeVisible();
});

test("players can be dragged and an edit can be canceled", async ({ page }) => {
  await setup(page);
  await page.getByRole("button", { name: "Reihenfolge ändern" }).click();
  const source = page.getByRole("button", { name: "Sam verschieben" });
  await source.scrollIntoViewIfNeeded();
  const start = await source.boundingBox();
  const target = await page.locator(".sortable-person").first().boundingBox();
  await page.mouse.move(
    start!.x + start!.width / 2,
    start!.y + start!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    start!.x + start!.width / 2,
    start!.y + start!.height / 2 - 12,
    { steps: 4 },
  );
  await page.mouse.move(
    start!.x + start!.width / 2,
    target!.y + target!.height / 2,
    { steps: 20 },
  );
  await expect
    .poll(async () => {
      const position = await page
        .locator(".sortable-person")
        .filter({ hasText: "Alex" })
        .boundingBox();
      return position!.y;
    })
    .toBeGreaterThan(target!.y + target!.height / 2);
  await page.mouse.up();
  await expect(page.locator(".lineup .person-name")).toHaveText([
    "Sam",
    "Alex",
  ]);
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(page.locator(".lineup .person-name")).toHaveText([
    "Alex",
    "Sam",
  ]);
  await page.reload();
  await expect(page.locator(".lineup .person-name")).toHaveText([
    "Alex",
    "Sam",
  ]);
});

test("score action stays docked during the screen entrance", async ({
  page,
}) => {
  await setup(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const deviations = await page.evaluate(async () => {
    const start = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Los geht’s"),
    );
    start!.click();
    const deviations: number[] = [];
    const began = performance.now();
    await new Promise<void>((resolve) => {
      function sample() {
        const action = document.querySelector(".game-actions");
        if (action)
          deviations.push(
            Math.abs(
              action.getBoundingClientRect().bottom - window.innerHeight,
            ),
          );
        if (performance.now() - began < 450) requestAnimationFrame(sample);
        else resolve();
      }
      requestAnimationFrame(sample);
    });
    return deviations;
  });
  expect(deviations.length).toBeGreaterThan(2);
  expect(Math.max(...deviations)).toBeLessThan(1);
});
