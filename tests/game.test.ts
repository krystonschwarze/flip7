import test from "node:test";
import assert from "node:assert/strict";
import {
  changeScore,
  completeRound,
  finished,
  initialState,
  newGame,
  parseState,
  totals,
  winners,
} from "../src/game.ts";
const players = [
  { id: "a", name: "Alex", color: 0 },
  { id: "b", name: "Sam", color: 1 },
];

test("zero is entered, null is missing, and a partial round cannot finish", () => {
  const game = changeScore(newGame(players, 200), 0, 0, null);
  assert.deepEqual(game.draft, [0, null]);
  assert.throws(() => completeRound(game));
  assert.deepEqual(totals(game), [0, 0]);
});

test("the winner is determined after all scores, not by input order", () => {
  let game = newGame(players, 100);
  game = changeScore(game, 0, 110, null);
  assert.equal(finished(game), false);
  game = changeScore(game, 1, 120, null);
  assert.equal(finished(game), false);
  game = completeRound(game);
  assert.equal(finished(game), true);
  assert.deepEqual(
    winners(game).map((p) => p.name),
    ["Sam"],
  );
  assert.throws(() => completeRound(game));
});

test("scores accumulate, corrections recalculate, and a win can be undone by correction", () => {
  let game = completeRound({ ...newGame(players, 100), draft: [70, 50] });
  game = completeRound({ ...game, draft: [35, 40] });
  assert.deepEqual(totals(game), [105, 90]);
  game = changeScore(game, 0, 20, 1);
  assert.deepEqual(totals(game), [90, 90]);
  assert.equal(finished(game), false);
});

test("ties produce shared winners", () => {
  const game = completeRound({ ...newGame(players, 100), draft: [110, 110] });
  assert.deepEqual(
    winners(game).map((p) => p.name),
    ["Alex", "Sam"],
  );
});

test("renaming saved profiles cannot change a running game", () => {
  const profiles = structuredClone(players);
  const game = newGame(profiles, 200);
  profiles[0].name = "New name";
  assert.equal(game.players[0].name, "Alex");
});

test("invalid scores and targets are rejected", () => {
  for (const target of [0, -1, 1.5, 10000, NaN])
    assert.throws(() => newGame(players, target));
  for (const score of [-1, 1.5, 1000, NaN])
    assert.throws(() => changeScore(newGame(players, 200), 0, score, null));
  assert.throws(() => newGame(players.slice(0, 1), 200));
});

test("past corrections cannot leave rounds after the actual game end", () => {
  let game = completeRound({ ...newGame(players, 200), draft: [50, 60] });
  game = completeRound({ ...game, draft: [30, 20] });
  assert.throws(() => changeScore(game, 0, 210, 0));
});

test("storage round trips keep zero and missing input intact", () => {
  const state = {
    ...initialState(),
    profiles: players,
    selected: ["a", "b"],
    game: { ...newGame(players, 300), draft: [0, null] },
  };
  assert.deepEqual(parseState(JSON.stringify(state)), state);
  assert.throws(() => parseState("{broken"));
  assert.throws(() =>
    parseState(
      JSON.stringify({ ...state, game: { ...state.game, rounds: [[5]] } }),
    ),
  );
  assert.throws(() => parseState(JSON.stringify({ ...state, version: 2 })));
});

test("card calculation doubles only numbers and adds the Flip 7 bonus once", async () => {
  const { handScore, emptyHand } = await import("../src/scoring.ts");
  assert.equal(
    handScore({
      ...emptyHand(),
      numbers: [12, 8, 5],
      bonuses: [10],
      doubled: true,
    }),
    60,
  );
  assert.equal(
    handScore({
      ...emptyHand(),
      numbers: [6, 7, 8, 9, 10, 11, 12],
      bonuses: [2, 4, 6, 8, 10],
      doubled: true,
    }),
    171,
  );
  assert.equal(
    handScore({ ...emptyHand(), numbers: [0, 1, 2, 3, 4, 5, 6] }),
    36,
  );
  assert.equal(
    handScore({
      ...emptyHand(),
      numbers: [12, 10],
      bonuses: [8],
      doubled: true,
      bust: true,
    }),
    0,
  );
  assert.equal(handScore({ ...emptyHand(), bonuses: [10] }), 10);
  assert.throws(() => handScore({ ...emptyHand(), numbers: [7, 7] }));
  assert.throws(() =>
    handScore({ ...emptyHand(), numbers: [0, 1, 2, 3, 4, 5, 6, 7] }),
  );
});

test("card selections survive closing a round and can be replaced by a manual correction", async () => {
  const { emptyHand } = await import("../src/scoring.ts");
  const hand = { ...emptyHand(), numbers: [10, 12] };
  let game = changeScore(newGame(players, 200), 0, 22, null, hand);
  hand.numbers.push(5);
  game = completeRound(changeScore(game, 1, 0, null));
  assert.deepEqual(game.hands?.[0][0]?.numbers, [10, 12]);
  assert.deepEqual(
    parseState(JSON.stringify({ ...initialState(), game })).game?.hands,
    game.hands,
  );
  game = changeScore(game, 0, 30, 0);
  assert.equal(game.hands?.[0][0], null);
});
