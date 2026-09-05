"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { totals, type Game } from "../game";
import { emptyHand, handScore, hasCards, isHand, type Hand } from "../scoring";
import { colorStyle, Icon, Modal } from "./ui";
import AnimatedNumber from "./animated-number";

export type Editor = {
  gameId: string;
  roundCount: number;
  player: number;
  round: number | null;
  value: string;
  mode: "manual" | "cards";
  hand: Hand;
};

export function restoreEditor(value: unknown, game: Game): Editor | null {
  if (!value || typeof value !== "object") return null;
  const e = value as Editor;
  if (
    e.gameId !== game.id ||
    (e.round === null &&
      e.roundCount !== undefined &&
      e.roundCount !== game.rounds.length) ||
    !Number.isInteger(e.player) ||
    !game.players[e.player] ||
    typeof e.value !== "string" ||
    !/^\d{0,3}$/.test(e.value) ||
    (e.round !== null && (!Number.isInteger(e.round) || !game.rounds[e.round]))
  )
    return null;
  return {
    ...e,
    roundCount: game.rounds.length,
    mode: e.mode === "cards" ? "cards" : "manual",
    hand: isHand(e.hand) ? e.hand : emptyHand(),
  };
}

export default function ScoreEditor({
  editor,
  game,
  onChange,
  onSave,
  onClose,
  error,
}: {
  editor: Editor;
  game: Game;
  onChange: (editor: Editor) => void;
  onSave: (value: string, hand: Hand | null) => void;
  onClose: () => void;
  error: string;
}) {
  const player = game.players[editor.player];
  const scores = totals(game);
  const value =
    editor.mode === "cards"
      ? hasCards(editor.hand)
        ? String(handScore(editor.hand))
        : ""
      : editor.value;
  const old =
    editor.round === null ? 0 : game.rounds[editor.round][editor.player];
  const total = scores[editor.player] - old + Number(value || 0);
  const nextPerson = game.players.find(
    (_, i) => i !== editor.player && game.draft[i] === null,
  );
  const label =
    editor.round !== null
      ? "Änderung speichern"
      : nextPerson
        ? `Weiter zu ${nextPerson.name}`
        : "Runde abschließen";
  const canSave = value !== "";
  const submit = () => {
    if (canSave) onSave(value, editor.mode === "cards" ? editor.hand : null);
  };
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = strip.current;
    const active = el?.children[editor.player] as HTMLElement | undefined;
    if (el && active) el.scrollLeft = active.offsetLeft - el.offsetLeft;
  }, [editor.player]);
  const keyboard = useEffectEvent((event: KeyboardEvent) => {
    const e = editor;
    const save = submit;
    const change = onChange;
    if (e.mode !== "manual") return;
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      change({
        ...e,
        value: (e.value === "0" ? event.key : e.value + event.key).slice(0, 3),
        hand: { ...e.hand, bust: false },
      });
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      change({
        ...e,
        value: e.value.slice(0, -1),
        hand: { ...e.hand, bust: false },
      });
    }
    if (
      event.key === "Enter" &&
      event.target instanceof HTMLElement &&
      event.target.tagName !== "BUTTON"
    ) {
      event.preventDefault();
      save();
    }
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => keyboard(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  function toggleNumber(number: number) {
    const selected = editor.hand.numbers.includes(number);
    if (!selected && editor.hand.numbers.length === 7) return;
    onChange({
      ...editor,
      hand: {
        ...editor.hand,
        bust: false,
        numbers: selected
          ? editor.hand.numbers.filter((n) => n !== number)
          : [...editor.hand.numbers, number],
      },
    });
  }
  const numberSum = editor.hand.numbers.reduce((sum, n) => sum + n, 0);
  const bonusSum = editor.hand.bonuses.reduce((sum, n) => sum + n, 0);
  return (
    <Modal
      title={player.name}
      onClose={onClose}
      className={`score-sheet ${editor.mode === "cards" ? "cards-mode" : ""}`}
    >
      <div className="score-editor-content">
        <div className="entry-context">
          <span>
            {editor.round === null
              ? `Runde ${game.rounds.length + 1}`
              : `Runde ${editor.round + 1} korrigieren`}
          </span>
          <span>
            {editor.player + 1} von {game.players.length}
          </span>
        </div>
        <div className="editor-totals" ref={strip}>
          {game.players.map((p, i) => (
            <span key={p.id} className={i === editor.player ? "active" : ""}>
              <span>{p.name}</span>
              <strong>
                <AnimatedNumber
                  value={
                    scores[i] +
                    (editor.round === null ? (game.draft[i] ?? 0) : 0)
                  }
                />
              </strong>
            </span>
          ))}
        </div>
        <div
          className={`input-mode ${editor.mode}`}
          role="group"
          aria-label="Eingabeart"
        >
          <button
            aria-pressed={editor.mode === "manual"}
            onClick={() =>
              onChange({
                ...editor,
                mode: "manual",
                value: editor.mode === "cards" ? value : editor.value,
              })
            }
          >
            <Icon name="number" />
            Punkte
          </button>
          <button
            aria-pressed={editor.mode === "cards"}
            onClick={() => onChange({ ...editor, mode: "cards" })}
          >
            <Icon name="cards" />
            Karten
          </button>
        </div>
        <div className="score-entry" style={colorStyle(player.color)}>
          <div>
            <output
              id="score-value"
              className={!value ? "empty-value" : ""}
              aria-label="Rundenpunkte"
              aria-live="polite"
            >
              {value || "0"}
            </output>
            <span>Punkte</span>
          </div>
          <span className="total-preview">
            {value
              ? `Danach ${total} insgesamt`
              : editor.mode === "cards"
                ? "Tippe deine Karten an."
                : "Fertige Rundensumme eingeben."}
          </span>
        </div>
        {editor.mode === "manual" ? (
          <div
            key={`${editor.player}-manual`}
            className="keypad mode-enter"
            aria-label="Zahlentastatur"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() =>
                  onChange({
                    ...editor,
                    value: (editor.value === "0"
                      ? String(n)
                      : editor.value + n
                    ).slice(0, 3),
                    hand: { ...editor.hand, bust: false },
                  })
                }
              >
                {n}
              </button>
            ))}
            <button
              className={`bust-key ${editor.hand.bust ? "selected" : ""}`}
              aria-label="Verzockt"
              aria-pressed={editor.hand.bust}
              onClick={() =>
                onChange({
                  ...editor,
                  value: editor.hand.bust ? "" : "0",
                  hand: { ...editor.hand, bust: !editor.hand.bust },
                })
              }
            >
              Verzockt
            </button>
            <button
              onClick={() =>
                onChange({
                  ...editor,
                  value: (editor.value === "0"
                    ? "0"
                    : editor.value + "0"
                  ).slice(0, 3),
                  hand: { ...editor.hand, bust: false },
                })
              }
            >
              0
            </button>
            <button
              aria-label="Letzte Ziffer löschen"
              onClick={() =>
                onChange({
                  ...editor,
                  value: editor.value.slice(0, -1),
                  hand: { ...editor.hand, bust: false },
                })
              }
            >
              <Icon name="backspace" size={26} />
            </button>
          </div>
        ) : (
          <div
            key={`${editor.player}-cards`}
            className="card-picker mode-enter"
          >
            <div className="picker-heading">
              <div className="picker-label">
                <span>Zahlenkarten</span>
                <span>{editor.hand.numbers.length} von 7</span>
              </div>
              <button
                className={`bust-toggle ${editor.hand.bust ? "selected" : ""}`}
                aria-label="Verzockt"
                aria-pressed={editor.hand.bust}
                onClick={() =>
                  onChange({
                    ...editor,
                    hand: { ...editor.hand, bust: !editor.hand.bust },
                  })
                }
              >
                Verzockt
              </button>
            </div>
            <div className="number-cards">
              {Array.from({ length: 13 }, (_, n) => (
                <button
                  className="pick-card"
                  key={n}
                  style={colorStyle(n % 6)}
                  aria-label={`Karte ${n}`}
                  aria-pressed={editor.hand.numbers.includes(n)}
                  disabled={
                    !editor.hand.numbers.includes(n) &&
                    editor.hand.numbers.length === 7
                  }
                  onClick={() => toggleNumber(n)}
                >
                  {n}
                  {editor.hand.numbers.includes(n) && (
                    <Icon name="check" size={14} />
                  )}
                </button>
              ))}
              <span
                className={`flip-bonus ${editor.hand.numbers.length === 7 ? "achieved" : ""}`}
              >
                {editor.hand.numbers.length === 7
                  ? "Flip 7! +15"
                  : "7 Karten: +15"}
              </span>
            </div>
            <div className="bonus-cards" role="group" aria-label="Bonuskarten">
              {[2, 4, 6, 8, 10].map((n) => (
                <button
                  key={n}
                  aria-label={`Bonus +${n}`}
                  aria-pressed={editor.hand.bonuses.includes(n)}
                  onClick={() =>
                    onChange({
                      ...editor,
                      hand: {
                        ...editor.hand,
                        bust: false,
                        bonuses: editor.hand.bonuses.includes(n)
                          ? editor.hand.bonuses.filter((b) => b !== n)
                          : [...editor.hand.bonuses, n],
                      },
                    })
                  }
                >
                  +{n}
                </button>
              ))}
              <button
                aria-label="Zahlen verdoppeln"
                aria-pressed={editor.hand.doubled}
                onClick={() =>
                  onChange({
                    ...editor,
                    hand: {
                      ...editor.hand,
                      bust: false,
                      doubled: !editor.hand.doubled,
                    },
                  })
                }
              >
                ×2
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="editor-footer">
        {editor.round === null && value !== "" && total >= game.target && (
          <p className="target-reached">
            <Icon name="crown" />
            Punktziel erreicht. Die Runde zählt noch für alle.
          </p>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        {editor.mode === "cards" && (
          <div
            className="picker-summary"
            title="Erst Zahlen verdoppeln, danach Pluskarten und Flip-7-Bonus addieren."
          >
            <span className="calculation-label">Berechnung</span>
            <span className="calculation-value">
              {editor.hand.bust
                ? "Diese Runde zählt 0."
                : `${numberSum}${editor.hand.doubled ? " × 2" : ""}${bonusSum ? ` + ${bonusSum}` : ""}${editor.hand.numbers.length === 7 ? " + 15" : ""} = ${value || 0}`}
            </span>
          </div>
        )}
        <button className="button primary" disabled={!canSave} onClick={submit}>
          <span>{label}</span>
          <Icon
            name={nextPerson && editor.round === null ? "arrow" : "check"}
          />
        </button>
      </div>
    </Modal>
  );
}
