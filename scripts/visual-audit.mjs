import { webkit, chromium, devices } from "@playwright/test";
import fs from "node:fs/promises";
import sharp from "sharp";

const root = process.env.AUDIT_OUTPUT || "artifacts/visual-audit";
await fs.mkdir(root, { recursive: true });
const names = [
  "Maximilian-Mustermannxxx",
  "AlexandravonMustermannxx",
  ...Array.from({ length: 16 }, (_, i) => `Person ${i + 3}`),
];
const profiles = names.map((name, i) => ({
  id: `person${i}`,
  name,
  color: i % 6,
}));
function state(count = 2, rounds = [], target = 200) {
  const players = profiles.slice(0, count);
  return {
    version: 1,
    profiles,
    selected: players.map((p) => p.id),
    target,
    undo: [],
    game:
      rounds === null
        ? null
        : {
            id: "audit",
            players,
            target,
            rounds,
            draft: players.map(() => null),
            startedAt: "2026-09-05T10:00:00Z",
          },
  };
}
const empty = {
  version: 1,
  profiles: [],
  selected: [],
  target: 200,
  game: null,
  undo: [],
};
const scenarios = [
  ["start-empty", empty],
  ["start-two", state(2, null)],
  ["start-full", state(18, null)],
  ["start-custom", state(2, null, 9999)],
  [
    "score-five-digits",
    state(
      18,
      Array.from({ length: 11 }, () => Array(18).fill(999)),
      9999,
    ),
  ],
  [
    "settings",
    state(2, null),
    async (p) => p.getByRole("button", { name: "Menü öffnen" }).click(),
  ],
  [
    "help",
    state(2, null),
    async (p) => {
      await p.getByRole("button", { name: "Menü öffnen" }).click();
      await p.getByRole("button", { name: "So funktioniert’s" }).click();
    },
  ],
  [
    "target",
    state(2, null),
    async (p) => {
      await p.getByRole("button", { name: "Eigenes Punktziel" }).click();
      await p.locator("#target").fill("9999");
    },
  ],
  [
    "target-error",
    state(2, null),
    async (p) => {
      await p.getByRole("button", { name: "Eigenes Punktziel" }).click();
      await p.locator("#target").fill("0");
      await p.getByRole("button", { name: "Punktziel übernehmen" }).click();
    },
  ],
  [
    "people-empty",
    empty,
    async (p) => p.getByRole("button", { name: "Namen hinzufügen" }).click(),
  ],
  [
    "people-full",
    state(18, null),
    async (p) => p.getByRole("button", { name: "Personen auswählen" }).click(),
  ],
  [
    "people-pending",
    state(2, null),
    async (p) => {
      await p.getByRole("button", { name: "Personen auswählen" }).click();
      await p.locator("#person-name").fill("Ein neuer langer Name");
    },
  ],
  [
    "people-duplicate",
    state(2, null),
    async (p) => {
      await p.getByRole("button", { name: "Personen auswählen" }).click();
      await p.locator("#person-name").fill(names[0]);
      await p
        .getByRole("button", { name: "Name hinzufügen", exact: true })
        .click();
    },
  ],
  [
    "people-edit",
    state(2, null),
    async (p) => {
      await p.getByRole("button", { name: "Personen auswählen" }).click();
      await p
        .getByRole("button", { name: `${names[0]} bearbeiten`, exact: true })
        .click();
    },
  ],
  [
    "people-delete",
    state(2, null),
    async (p) => {
      await p.getByRole("button", { name: "Personen auswählen" }).click();
      await p
        .getByRole("button", { name: `${names[0]} löschen`, exact: true })
        .click();
    },
  ],
  ["game-two", state()],
  [
    "game-full",
    state(
      18,
      Array.from({ length: 12 }, () => Array(18).fill(7)),
    ),
  ],
  [
    "table-scrolled",
    state(
      18,
      Array.from({ length: 12 }, () => Array(18).fill(7)),
    ),
    async (p) => {
      await p.locator(".rounds-paper").scrollIntoViewIfNeeded();
      await p.locator(".table-scroll").evaluate((e) => {
        e.scrollLeft = 126;
        e.scrollTop = 90;
      });
    },
  ],
  [
    "score-manual",
    state(),
    async (p) => {
      await p
        .getByRole("button", { name: "Punkte eintragen", exact: true })
        .click();
      await p
        .getByRole("dialog")
        .getByRole("button", { name: "9", exact: true })
        .click({ clickCount: 3 });
    },
  ],
  [
    "score-cards",
    state(),
    async (p) => {
      await p
        .getByRole("button", { name: "Punkte eintragen", exact: true })
        .click();
      await p.getByRole("button", { name: "Karten", exact: true }).click();
      for (const n of [6, 7, 8, 9, 10, 11, 12])
        await p
          .getByRole("button", { name: `Karte ${n}`, exact: true })
          .click();
      await p.getByRole("button", { name: "Zahlen verdoppeln" }).click();
    },
  ],
  [
    "score-bust",
    state(),
    async (p) => {
      await p
        .getByRole("button", { name: "Punkte eintragen", exact: true })
        .click();
      await p.getByRole("button", { name: "Verzockt", exact: true }).click();
    },
  ],
  [
    "correction",
    state(2, [
      [90, 80],
      [70, 60],
    ]),
    async (p) =>
      p
        .getByRole("button", {
          name: `Runde 1, ${names[0]}: 90 Punkte bearbeiten`,
          exact: true,
        })
        .click(),
  ],
  [
    "replace",
    state(),
    async (p) => {
      await p.getByRole("link", { name: "Zum Spielstart" }).click();
      await p.getByRole("button", { name: "Los geht’s" }).click();
    },
  ],
  [
    "winner",
    state(2, [], 100),
    async (p) => {
      await p
        .getByRole("button", { name: "Punkte eintragen", exact: true })
        .click();
      for (const score of ["100", "100"]) {
        for (const n of score)
          await p
            .getByRole("dialog")
            .getByRole("button", { name: n, exact: true })
            .click();
        await p
          .getByRole("dialog")
          .getByRole("button", { name: /Weiter zu|Runde abschließen/ })
          .click();
      }
    },
  ],
  ["finished", state(2, [[100, 100]], 100)],
  [
    "storage-error",
    empty,
    async (p) => {
      await p.evaluate(() => {
        Storage.prototype.setItem = () => {
          throw new Error("blocked");
        };
      });
      await p.getByRole("button", { name: "100", exact: true }).click();
    },
  ],
];
const results = [];
for (const [label, options, engine] of [
  ["se", { ...devices["iPhone SE"] }, webkit],
  [
    "iphone",
    { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
    webkit,
  ],
  [
    "landscape",
    {
      ...devices["iPhone 13 landscape"],
      viewport: { width: 844, height: 390 },
    },
    webkit,
  ],
  [
    "keyboard-space",
    { ...devices["iPhone 13"], viewport: { width: 390, height: 400 } },
    webkit,
  ],
  ["desktop", { viewport: { width: 1280, height: 900 } }, chromium],
]) {
  if (
    process.env.AUDIT_VIEWS &&
    !process.env.AUDIT_VIEWS.split(",").includes(label)
  )
    continue;
  const browser = await engine.launch(
    engine === chromium ? { channel: "chrome" } : {},
  );
  const shots = [];
  for (const [name, seed, action] of scenarios) {
    if (
      process.env.AUDIT_SCENARIOS &&
      !process.env.AUDIT_SCENARIOS.split(",").includes(name)
    )
      continue;
    if (label === "keyboard-space" && !/people|target|score/.test(name))
      continue;
    const context = await browser.newContext({
      ...options,
      reducedMotion: "reduce",
    });
    await context.addInitScript(
      (seed) =>
        localStorage.setItem("flip7.scoreboard.v1", JSON.stringify(seed)),
      seed,
    );
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    try {
      await page.goto("http://localhost:3000");
      await page.locator(".setup,.game").waitFor();
      await action?.(page);
      await page.evaluate(() => document.fonts.ready);
      const dialog = page.getByRole("dialog");

      const geometry = await page.evaluate(() => {
        const root =
          document.querySelector("dialog[open]") ||
          document.querySelector("main");
        const scrollable = [...root.querySelectorAll("*")]
          .filter(
            (el) =>
              el.scrollWidth > el.clientWidth + 2 &&
              getComputedStyle(el).overflowX === "visible" &&
              el.clientWidth > 0,
          )
          .map((el) => ({
            tag: el.tagName,
            cls: el.className,
            width: el.clientWidth,
            content: el.scrollWidth,
          }));
        const footer = document.querySelector(".editor-footer");
        const button = footer?.getBoundingClientRect();
        return {
          footerClipped:
            !!button && (button.bottom > innerHeight + 1 || button.top < 0),
          pageOverflow: document.documentElement.scrollWidth > innerWidth,
          dialogOverflow:
            !!document.querySelector("dialog[open]") &&
            root.scrollWidth > root.clientWidth + 2,
          scrollable,
        };
      });
      const path = `${root}/${label}-${name}.png`;
      await page.screenshot({ path, animations: "disabled", fullPage: false });
      shots.push({ name, path });
      if (await dialog.count()) {
        await dialog.evaluate((el) => (el.scrollTop = el.scrollHeight));
        await page.screenshot({
          path: `${root}/${label}-${name}-bottom.png`,
          animations: "disabled",
        });
      } else if (
        await page.evaluate(
          () => document.documentElement.scrollHeight > innerHeight + 30,
        )
      ) {
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
        const end = `${root}/${label}-${name}-bottom.png`;
        await page.screenshot({ path: end, animations: "disabled" });
        shots.push({ name: `${name}-bottom`, path: end });
      }
      results.push({ label, name, ...geometry });
    } catch (error) {
      results.push({ label, name, error: String(error) });
    }
    await context.close();
  }
  for (let start = 0; start < shots.length; start += 8) {
    const batch = shots.slice(start, start + 8),
      tiles = [];
    for (let i = 0; i < batch.length; i++) {
      const meta = await sharp(batch[i].path).metadata();
      const cropWidth = Math.min(
        meta.width,
        560 * Math.min(options.deviceScaleFactor || 1, 3),
      );
      const png = await sharp(batch[i].path)
        .extract({
          left: Math.floor((meta.width - cropWidth) / 2),
          top: 0,
          width: cropWidth,
          height: meta.height,
        })
        .resize({ width: 320, height: 680, fit: "contain", background: "#ddd" })
        .extend({ top: 26, bottom: 0, left: 0, right: 0, background: "#fff" })
        .png()
        .toBuffer();
      const caption = Buffer.from(
        `<svg width="320" height="26"><text x="8" y="18" font-size="13" font-family="sans-serif">${batch[i].name}</text></svg>`,
      );
      const tile = await sharp(png)
        .composite([{ input: caption, top: 0, left: 0 }])
        .png()
        .toBuffer();
      tiles.push({
        input: tile,
        left: (i % 4) * 320,
        top: Math.floor(i / 4) * 706,
      });
    }
    await sharp({
      create: { width: 1280, height: 1412, channels: 3, background: "#ddd" },
    })
      .composite(tiles)
      .png()
      .toFile(`${root}/contact-${label}-${start / 8}.png`);
  }
  await browser.close();
  console.log(label, "done");
}
await fs.writeFile(`${root}/geometry.json`, JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    results.filter(
      (r) => r.error || r.pageOverflow || r.dialogOverflow || r.footerClipped,
    ),
  ),
);
