import { isHand, type Hand } from "./scoring.ts";
export type Player = { id: string; name: string; color: number };
export type Game = {
  id: string;
  players: Player[];
  target: number;
  rounds: number[][];
  draft: (number | null)[];
  startedAt: string;
  hands?: (Hand | null)[][];
  draftHands?: (Hand | null)[];
};
export type State = {
  version: 1;
  profiles: Player[];
  selected: string[];
  target: number;
  game: Game | null;
  undo: Game[];
};

export const STORAGE_KEY = "flip7.scoreboard.v1";
export const MAX_PLAYERS = 18;
export const createId = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
export const validScore = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 999;
export const validTarget = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 9999;
export const totals = (game: Game): number[] =>
  game.players.map((_, index) =>
    game.rounds.reduce((sum, round) => sum + round[index], 0),
  );
export const finished = (game: Game): boolean =>
  totals(game).some((score) => score >= game.target);
export const winners = (game: Game): Player[] => {
  if (!finished(game)) return [];
  const scores = totals(game);
  const highest = Math.max(...scores);
  return game.players.filter((_, index) => scores[index] === highest);
};

export function newGame(players: Player[], target: number): Game {
  if (
    players.length < 2 ||
    players.length > MAX_PLAYERS ||
    !validTarget(target)
  )
    throw new Error(
      "Wähle mindestens zwei Personen und ein gültiges Punktziel.",
    );
  return {
    id: createId(),
    players: structuredClone(players),
    target,
    rounds: [],
    draft: players.map(() => null),
    startedAt: new Date().toISOString(),
  };
}

export function completeRound(game: Game): Game {
  if (finished(game) || !game.draft.every(validScore))
    throw new Error("Trage zuerst die Punkte für alle ein.");
  return {
    ...game,
    rounds: [...game.rounds, game.draft as number[]],
    hands: [
      ...(game.hands ?? game.rounds.map(() => game.players.map(() => null))),
      game.draftHands ?? game.players.map(() => null),
    ],
    draftHands: game.players.map(() => null),
    draft: game.players.map(() => null),
  };
}

export function changeScore(
  game: Game,
  player: number,
  value: number,
  round: number | null,
  hand: Hand | null = null,
): Game {
  if (!validScore(value) || !game.players[player])
    throw new Error("Bitte gib eine ganze Zahl von 0 bis 999 ein.");
  if (hand && !isHand(hand))
    throw new Error("Diese Kartenauswahl ist ungültig.");
  const next = structuredClone(game);
  if (round === null) {
    if (finished(game)) throw new Error("Diese Partie ist bereits beendet.");
    next.draft[player] = value;
    next.draftHands ??= next.players.map(() => null);
    next.draftHands[player] = hand ? structuredClone(hand) : null;
  } else {
    if (!next.rounds[round]) throw new Error("Diese Runde existiert nicht.");
    next.rounds[round][player] = value;
    next.hands ??= next.rounds.map(() => next.players.map(() => null));
    next.hands[round][player] = hand ? structuredClone(hand) : null;
    const running = next.players.map(() => 0);
    next.rounds.forEach((scores, index) => {
      scores.forEach((score, person) => {
        running[person] += score;
      });
      if (
        index < next.rounds.length - 1 &&
        running.some((score) => score >= next.target)
      ) {
        throw new Error(
          `Damit wäre die Partie schon in Runde ${index + 1} beendet. Mache zuerst die späteren Runden rückgängig.`,
        );
      }
    });
    if (finished(next)) next.draft = next.players.map(() => null);
  }
  return next;
}

export function initialState(): State {
  return {
    version: 1,
    profiles: [],
    selected: [],
    target: 200,
    game: null,
    undo: [],
  };
}

function isPlayer(value: unknown): value is Player {
  if (!value || typeof value !== "object") return false;
  const p = value as Player;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    p.name.length <= 24 &&
    Number.isInteger(p.color) &&
    p.color >= 0 &&
    p.color < 6
  );
}

function isGame(value: unknown): value is Game {
  if (!value || typeof value !== "object") return false;
  const g = value as Game;
  return (
    typeof g.id === "string" &&
    typeof g.startedAt === "string" &&
    validTarget(g.target) &&
    Array.isArray(g.players) &&
    g.players.length >= 2 &&
    g.players.length <= MAX_PLAYERS &&
    g.players.every(isPlayer) &&
    Array.isArray(g.rounds) &&
    g.rounds.every(
      (round) =>
        Array.isArray(round) &&
        round.length === g.players.length &&
        round.every(validScore),
    ) &&
    Array.isArray(g.draft) &&
    g.draft.length === g.players.length &&
    g.draft.every((score) => score === null || validScore(score)) &&
    (g.draftHands === undefined ||
      (Array.isArray(g.draftHands) &&
        g.draftHands.length === g.players.length &&
        g.draftHands.every((h) => h === null || isHand(h)))) &&
    (g.hands === undefined ||
      (Array.isArray(g.hands) &&
        g.hands.length === g.rounds.length &&
        g.hands.every(
          (row) =>
            Array.isArray(row) &&
            row.length === g.players.length &&
            row.every((h) => h === null || isHand(h)),
        )))
  );
}

export function parseState(raw: string): State {
  const s = JSON.parse(raw) as State;
  if (
    !s ||
    s.version !== 1 ||
    !Array.isArray(s.profiles) ||
    !s.profiles.every(isPlayer) ||
    !Array.isArray(s.selected) ||
    !s.selected.every((id) => typeof id === "string") ||
    !validTarget(s.target) ||
    (s.game !== null && !isGame(s.game)) ||
    !Array.isArray(s.undo) ||
    !s.undo.every(isGame)
  ) {
    throw new Error("Der gespeicherte Spielstand konnte nicht gelesen werden.");
  }
  s.selected = [...new Set(s.selected)]
    .filter((id) => s.profiles.some((p) => p.id === id))
    .slice(0, MAX_PLAYERS);
  return s;
}
