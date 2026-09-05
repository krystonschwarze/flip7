"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  changeScore,
  completeRound,
  finished,
  initialState,
  MAX_PLAYERS,
  newGame,
  parseState,
  STORAGE_KEY,
  totals,
  validTarget,
  winners,
  type Game,
  type Player,
  type State,
} from "../game";
import { Brand, colorStyle, Icon, Modal } from "./ui";

import { ThemeSettings } from "./theme-settings";
import PeopleModal from "./people-modal";
import PlayerCards from "./player-cards";
import SortableLineup from "./sortable-lineup";
import ScoreEditor, { restoreEditor, type Editor } from "./score-editor";
import { emptyHand, type Hand } from "../scoring";

type Overlay = "people" | "target" | "menu" | "replace" | "help" | null;
const EDITOR_KEY = `${STORAGE_KEY}.input`;
const MODE_KEY = `${STORAGE_KEY}.mode`;

const subscribeHydration = () => () => {};

export default function Scoreboard() {
  const ready = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  return ready ? (
    <LoadedScoreboard />
  ) : (
    <main className="loading">
      <Brand />
      <p>Punkteblock wird geöffnet …</p>
    </main>
  );
}

function readSavedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const state = raw ? parseState(raw) : initialState();
    const mode =
      localStorage.getItem(MODE_KEY) === "cards"
        ? ("cards" as const)
        : ("manual" as const);
    const input = localStorage.getItem(EDITOR_KEY);
    let editor: Editor | null = null;
    if (input && state.game) {
      try {
        const draft = restoreEditor(JSON.parse(input), state.game);
        if (draft && (draft.round !== null || !finished(state.game)))
          editor = draft;
      } catch {
        editor = null;
      }
    }
    return { state, mode, editor, error: "" };
  } catch {
    return {
      state: initialState(),
      mode: "manual" as const,
      editor: null,
      error:
        "Dein Speicher konnte nicht gelesen werden. Neue Eingaben werden vorerst nicht dauerhaft gespeichert.",
    };
  }
}

function LoadedScoreboard() {
  const [session] = useState(readSavedSession);
  const [state, setState] = useState<State>(session.state);
  const [screen, setScreen] = useState<"setup" | "game">(
    session.state.game ? "game" : "setup",
  );
  const [sorting, setSorting] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [editor, setEditor] = useState<Editor | null>(session.editor);
  const [notice, setNotice] = useState("");
  const [celebrating, setCelebrating] = useState(false);
  const [storageError, setStorageError] = useState(session.error);
  const storageBlocked = useRef(!!session.error);
  const inputMode = useRef<"manual" | "cards">(session.mode);
  const stateRef = useRef(state);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => setNotice("Offline-Nutzung ist gerade nicht verfügbar."));
    }
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const saved = parseState(event.newValue);
          stateRef.current = saved;
          setState(saved);
          setEditor(null);
          setNotice("Spielstand aus einem anderen Tab übernommen.");
        } catch {
          setNotice(
            "Der Spielstand aus dem anderen Tab konnte nicht gelesen werden.",
          );
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timeout);
  }, [notice]);

  function persist(next: State) {
    stateRef.current = next;
    setState(next);
    if (storageBlocked.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError(
        "Speichern auf diesem Gerät ist nicht möglich. Lass die App geöffnet, damit die Punkte erhalten bleiben.",
      );
    }
  }

  function updateEditor(next: Editor | null) {
    setEditor(next);
    if (storageBlocked.current) return;
    try {
      if (next) {
        localStorage.setItem(EDITOR_KEY, JSON.stringify(next));
        localStorage.setItem(MODE_KEY, next.mode);
        inputMode.current = next.mode;
      } else localStorage.removeItem(EDITOR_KEY);
    } catch {
      setStorageError("Die aktuelle Eingabe konnte nicht gespeichert werden.");
    }
  }

  function updateGame(next: Game) {
    const current = stateRef.current;
    persist({
      ...current,
      game: next,
      undo: current.game
        ? [...current.undo.slice(-49), structuredClone(current.game)]
        : [],
    });
  }

  const game = state.game;
  const done = game ? finished(game) : false;
  const winning = game ? winners(game) : [];
  const selected = state.selected
    .map((id) => state.profiles.find((player) => player.id === id))
    .filter((player): player is Player => !!player);
  const completedDraft = game?.draft.every((score) => score !== null) ?? false;

  function start(players = selected, target = state.target) {
    try {
      const next = newGame(players, target);
      persist({
        ...stateRef.current,
        game: next,
        undo: [],
        target,
        selected: players
          .map((player) => player.id)
          .filter((id) => stateRef.current.profiles.some((p) => p.id === id)),
      });
      updateEditor(null);
      setOverlay(null);
      setCelebrating(false);
      setScreen("game");
      window.scrollTo(0, 0);
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  function openScore(player: number, round: number | null = null) {
    if (!game) return;
    setNotice("");
    const hand =
      round === null
        ? game.draftHands?.[player]
        : game.hands?.[round]?.[player];
    const value =
      round === null ? game.draft[player] : game.rounds[round][player];
    updateEditor({
      gameId: game.id,
      player,
      round,
      roundCount: game.rounds.length,
      value: String(value ?? ""),
      mode: hand ? "cards" : value !== null ? "manual" : inputMode.current,
      hand: hand ?? emptyHand(),
    });
  }

  function saveScore(value: string, hand: Hand | null) {
    if (!editor || !game || value === "") return;
    try {
      const next = changeScore(
        game,
        editor.player,
        Number(value),
        editor.round,
        hand,
      );
      const missing = next.draft.findIndex((score) => score === null);
      if (editor.round === null && missing === -1) {
        const completed = completeRound(next);
        updateGame(completed);
        setCelebrating(finished(completed));
        updateEditor(null);
        setNotice(`Runde ${game.rounds.length + 1} gewertet.`);
        window.scrollTo({ top: 0 });
      } else {
        updateGame(next);
        setNotice("");
        if (editor.round === null)
          updateEditor({
            gameId: game.id,
            player: missing,
            round: null,
            roundCount: game.rounds.length,
            value: "",
            mode: inputMode.current,
            hand: emptyHand(),
          });
        else {
          updateEditor(null);
          setNotice("Punkte korrigiert.");
        }
      }
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  function undo() {
    const current = stateRef.current;
    const previous = current.undo.at(-1);
    if (!previous) return;
    persist({ ...current, game: previous, undo: current.undo.slice(0, -1) });
    updateEditor(null);
    setNotice("Letzte Aktion rückgängig gemacht.");
  }

  function togglePlayer(id: string) {
    const picked = state.selected.includes(id);
    if (!picked && state.selected.length >= MAX_PLAYERS) {
      setNotice("Bis zu 18 Personen können mitspielen.");
      return;
    }
    persist({
      ...state,
      selected: picked
        ? state.selected.filter((person) => person !== id)
        : [...state.selected, id],
    });
  }

  return (
    <div className="app-shell">
      {screen === "game" && game && (
        <header className="topbar in-game">
          <>
            <a
              href="#"
              className="back-link"
              aria-label="Zum Spielstart"
              onClick={(event) => {
                event.preventDefault();
                setScreen("setup");
              }}
            >
              <Icon name="back" />
              Pause
            </a>
            <span className="game-nav-title">
              {game.players.length} Personen
            </span>
            <span className="goal-ribbon">Ziel: {game.target}</span>
          </>
        </header>
      )}
      {storageError && (
        <div className="storage-error" role="alert">
          {storageError}
        </div>
      )}
      {screen === "setup" || !game ? (
        <main key="setup" className="setup screen-enter">
          <div className="setup-intro">
            <Brand />
            <p>Karten auf den Tisch. Wir zählen mit.</p>
          </div>
          <section
            className="paper setup-paper"
            aria-labelledby="setup-heading"
          >
            <div className="section-heading">
              <h1 id="setup-heading">Wer spielt mit?</h1>
              <div className="setup-tools">
                <span className="count-tag">{selected.length} / 18</span>
                <button
                  className="icon-button"
                  aria-label="Einstellungen öffnen"
                  onClick={() => setOverlay("menu")}
                >
                  <Icon name="settings" />
                </button>
              </div>
            </div>
            <p className="subtle">Eure Namen bleiben fürs nächste Mal.</p>
            {sorting ? (
              <SortableLineup
                players={selected}
                onCancel={() => setSorting(false)}
                onSave={(ids) => {
                  persist({ ...stateRef.current, selected: ids });
                  setSorting(false);
                }}
              />
            ) : (
              <>
                <div className="lineup">
                  {selected.map((player, index) => (
                    <div
                      className="person-row"
                      key={player.id}
                      style={colorStyle(player.color)}
                    >
                      <span className="person-mark">{index + 1}</span>
                      <span className="person-name" title={player.name}>
                        {player.name}
                      </span>
                      <button
                        className="icon-button"
                        aria-label={`${player.name} aus der Runde entfernen`}
                        onClick={() => togglePlayer(player.id)}
                      >
                        <Icon name="close" size={18} />
                      </button>
                    </div>
                  ))}
                  {selected.length === 0 && (
                    <div className="lineup-empty">
                      <span className="empty-person">1</span>
                      <span className="empty-person">2</span>
                      <p>Zu zweit oder in großer Runde.</p>
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="lineup-actions">
              <button
                className="add-person"
                disabled={sorting}
                onClick={() => setOverlay("people")}
              >
                <Icon name="plus" size={19} />
                {state.profiles.length
                  ? "Personen auswählen"
                  : "Namen hinzufügen"}
              </button>
              {!sorting && selected.length > 1 && (
                <button
                  className="icon-button outlined lineup-edit-button"
                  aria-label="Reihenfolge ändern"
                  title="Reihenfolge ändern"
                  onClick={() => setSorting(true)}
                >
                  <Icon name="sort" size={22} />
                </button>
              )}
            </div>
            <div className="section-divider" />
            <div className="section-heading">
              <h2>Wie weit spielt ihr?</h2>
              <span className="tiny-label">Punktziel</span>
            </div>
            <div className="target-options">
              {[100, 200, 300].map((target) => (
                <button
                  key={target}
                  className={`target-option ${state.target === target ? "selected" : ""}`}
                  aria-pressed={state.target === target}
                  onClick={() => persist({ ...state, target })}
                >
                  {target}
                  {target === 200 && <span>Klassisch</span>}
                </button>
              ))}
              <button
                className={`target-option custom ${![100, 200, 300].includes(state.target) ? "selected" : ""}`}
                onClick={() => setOverlay("target")}
                aria-label="Eigenes Punktziel"
              >
                {[100, 200, 300].includes(state.target) ? (
                  <Icon name="edit" />
                ) : (
                  state.target
                )}
                <span>Eigenes</span>
              </button>
            </div>
            <p className="target-note">Die letzte Runde zählt für alle.</p>
            <div className="setup-actions">
              <button
                className="button primary"
                disabled={selected.length < 2 || sorting}
                onClick={() =>
                  game && !done ? setOverlay("replace") : start()
                }
              >
                Los geht’s <Icon name="arrow" />
              </button>
              {selected.length < 2 && (
                <span className="start-hint">
                  Wähle mindestens zwei Personen.
                </span>
              )}
              {game && (
                <button
                  className="resume-button"
                  onClick={() => setScreen("game")}
                >
                  <Icon name={done ? "crown" : "cards"} size={19} />
                  {done
                    ? "Letztes Ergebnis ansehen"
                    : `Partie fortsetzen · Runde ${game.rounds.length + 1}`}
                </button>
              )}
            </div>
          </section>
          <footer className="setup-footer">
            <Icon name="lock" size={14} />
            Nur auf deinem Gerät. Einfach spielen.
          </footer>
        </main>
      ) : (
        <main
          key="game"
          className={`game screen-enter ${done ? "game-finished" : ""}`}
        >
          <div className="round-heading">
            <div>
              <h1>
                {done
                  ? winning.length > 1
                    ? "Gleichstand!"
                    : `${winning[0].name} gewinnt!`
                  : `Runde ${game.rounds.length + 1}`}
              </h1>
            </div>
            {done ? (
              <span className="winner-seal">
                <Icon name="crown" size={32} />
              </span>
            ) : (
              <span className="round-deco" aria-hidden="true">
                ✦
              </span>
            )}
          </div>
          <PlayerCards game={game} onSelect={openScore} />
          {done && (
            <p className="finish-note">
              {game.rounds.length}{" "}
              {game.rounds.length === 1 ? "Runde" : "Runden"} gespielt.{" "}
              {winning.length > 1
                ? "Den Sieg teilt ihr euch."
                : "Zeit für eine Revanche?"}
            </p>
          )}
          {!done && (
            <div className="round-status">
              <span>
                {completedDraft
                  ? "Alle Punkte drin. Bereit?"
                  : `${game.draft.filter((value) => value !== null).length} von ${game.players.length} eingetragen`}
              </span>
              <button
                className="text-button"
                disabled={!state.undo.length}
                onClick={undo}
              >
                <Icon name="undo" size={16} />
                Rückgängig
              </button>
            </div>
          )}
          <section
            className="paper rounds-paper"
            aria-labelledby="rounds-heading"
          >
            <div className="section-heading">
              <h2 id="rounds-heading">Euer Rundenverlauf</h2>
              <Icon name="cards" size={20} />
            </div>
            {game.rounds.length === 0 &&
            !game.draft.some((value) => value !== null) ? (
              <div className="empty-rounds">
                <div className="mini-cards" aria-hidden="true">
                  <i>0</i>
                  <i>7</i>
                </div>
                <p>Alles noch offen.</p>
                <span>Nach der ersten Runde stehen hier eure Punkte.</span>
              </div>
            ) : (
              <div
                className="table-scroll"
                tabIndex={game.players.length > 3 ? 0 : undefined}
                aria-label="Rundenpunkte"
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Runde</th>
                      {game.players.map((player) => (
                        <th
                          key={player.id}
                          scope="col"
                          style={colorStyle(player.color)}
                        >
                          <span>{player.name}</span>
                          <strong className="table-total">
                            {totals(game)[game.players.indexOf(player)]}
                            <small>gesamt</small>
                          </strong>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!done && (
                      <tr className="current-round">
                        <th scope="row">
                          {game.rounds.length + 1}
                          <span>Aktuell</span>
                        </th>
                        {game.players.map((player, index) => (
                          <td key={player.id}>
                            <button
                              onClick={() => openScore(index)}
                              aria-label={`Runde ${game.rounds.length + 1}, ${player.name}: ${game.draft[index] ?? "offen"}`}
                            >
                              {game.draft[index] ?? (
                                <Icon name="plus" size={16} />
                              )}
                            </button>
                          </td>
                        ))}
                      </tr>
                    )}
                    {game.rounds
                      .map((round, index) => ({ round, index }))
                      .reverse()
                      .map(({ round, index }) => (
                        <tr key={index}>
                          <th scope="row">{index + 1}</th>
                          {round.map((score, person) => (
                            <td key={person}>
                              <button
                                className={score === 0 ? "zero-score" : ""}
                                onClick={() => openScore(person, index)}
                                aria-label={`Runde ${index + 1}, ${game.players[person].name}: ${score} Punkte bearbeiten`}
                              >
                                {score}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            {game.rounds.length > 0 && (
              <p className="table-hint">
                Zum Korrigieren auf eine Punktzahl tippen.
              </p>
            )}
          </section>
          <div className="game-actions">
            <button
              className="button primary"
              onClick={() => {
                if (done) start(game.players, game.target);
                else if (completedDraft) {
                  const completed = completeRound(game);
                  updateGame(completed);
                  setCelebrating(finished(completed));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else
                  openScore(game.draft.findIndex((value) => value === null));
              }}
            >
              {done ? (
                <>
                  <Icon name="repeat" />
                  Revanche
                </>
              ) : completedDraft ? (
                <>
                  Runde abschließen
                  <Icon name="check" />
                </>
              ) : (
                <>
                  Punkte eintragen
                  <Icon name="plus" />
                </>
              )}
            </button>
            {done && (
              <div className="finish-actions">
                <button
                  className="text-button"
                  onClick={() => setScreen("setup")}
                >
                  Neue Besetzung
                </button>
                <button
                  className="text-button"
                  disabled={!state.undo.length}
                  onClick={undo}
                >
                  <Icon name="undo" size={16} />
                  Rückgängig
                </button>
              </div>
            )}
          </div>
        </main>
      )}
      {overlay === "people" && (
        <PeopleModal
          state={state}
          onClose={() => setOverlay(null)}
          onChange={persist}
        />
      )}
      {overlay === "target" && (
        <TargetModal
          target={state.target}
          onClose={() => setOverlay(null)}
          onSave={(target) => {
            persist({ ...state, target });
            setOverlay(null);
          }}
        />
      )}
      {overlay === "menu" && (
        <Modal title="Einstellungen" onClose={() => setOverlay(null)}>
          <div className="menu-list">
            <button onClick={() => setOverlay("people")}>
              <Icon name="edit" />
              <span>Gespeicherte Namen</span>
              <Icon name="arrow" size={18} />
            </button>
            <button onClick={() => setOverlay("help")}>
              <Icon name="plus" />
              <span>So funktioniert’s</span>
              <Icon name="arrow" size={18} />
            </button>
          </div>
          <ThemeSettings />
          <p className="local-note">
            <Icon name="lock" size={17} />
            Namen und Spielstand bleiben auf diesem Gerät.
          </p>
        </Modal>
      )}
      {overlay === "help" && (
        <Modal title="Einfach mitzählen." onClose={() => setOverlay(null)}>
          <div className="help-copy">
            <p>
              Wählt pro Person die fertige Punktzahl oder tippt unter „Karten“
              eure Zahlen- und Bonuskarten an. Die App rechnet mit ×2 und
              Flip-7-Bonus zusammen.
            </p>
            <p>
              <strong>Die Nullkarte:</strong> Sie bringt keine Punkte, zählt
              aber als eigene Zahl für die sieben verschiedenen Zahlenkarten.
              Sieben verschiedene Zahlen geben 15 Bonuspunkte.
            </p>
            <p className="dialog-copy">
              <strong>Verzockt?</strong> Setzt die Punkte auf 0. Bestätigt
              anschließend mit „Weiter zu“ oder bei der letzten Person mit
              „Runde abschließen“.
            </p>
            <p>
              Erreicht jemand das Punktziel, gewinnt der höchste Gesamtstand.
              Bei gleichem Höchststand teilt ihr euch den Sieg.
            </p>
            <p>
              <strong>Auf dem iPhone:</strong> In Safari „Teilen“ und dann „Zum
              Home-Bildschirm“ wählen.
            </p>
          </div>
        </Modal>
      )}
      {overlay === "replace" && (
        <Modal title="Neue Partie starten?" onClose={() => setOverlay(null)}>
          <p className="dialog-copy">
            Die laufende Partie wird ersetzt. Eure gespeicherten Namen bleiben
            erhalten.
          </p>
          <button className="button primary" onClick={() => start()}>
            Neue Partie starten
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setOverlay(null);
              setScreen("game");
            }}
          >
            Laufende Partie fortsetzen
          </button>
        </Modal>
      )}
      {celebrating && game && done && (
        <Modal
          title="Partie entschieden!"
          className="winner-sheet"
          onClose={() => setCelebrating(false)}
        >
          <div className="victory-art" aria-hidden="true">
            <span>✦</span>
            <div className="victory-medallion">
              <Icon name="crown" size={72} />
            </div>
            <span>✦</span>
          </div>
          <div
            className={`victory-name ${winning.length > 1 ? "shared-victory" : ""}`}
          >
            {winning.map((p) => (
              <p key={p.id}>{p.name}</p>
            ))}
          </div>
          <p className="victory-subtitle">
            {winning.length > 1
              ? "Ihr teilt euch den Sieg!"
              : "Du hast gewonnen!"}
          </p>
          <div className="victory-score">
            {Math.max(...totals(game))}
            <span>
              Punkte in {game.rounds.length}{" "}
              {game.rounds.length === 1 ? "Runde" : "Runden"}
            </span>
          </div>
          <button
            className="button primary"
            onClick={() => setCelebrating(false)}
          >
            Zum Ergebnis
            <Icon name="arrow" />
          </button>
        </Modal>
      )}
      {editor && game && (
        <ScoreEditor
          editor={editor}
          game={game}
          onChange={updateEditor}
          onClose={() => updateEditor(null)}
          onSave={saveScore}
          error={notice}
        />
      )}
      <div
        className={`notice ${notice ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice}
      </div>
    </div>
  );
}

function TargetModal({
  target,
  onClose,
  onSave,
}: {
  target: number;
  onClose: () => void;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState(String(target));
  const [error, setError] = useState("");
  return (
    <Modal title="Euer Punktziel" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!/^\d+$/.test(value) || !validTarget(Number(value))) {
            setError("Wähle eine ganze Zahl von 1 bis 9999.");
            return;
          }
          onSave(Number(value));
        }}
      >
        <label className="field-label" htmlFor="target">
          Bis wie viele Punkte spielt ihr?
        </label>
        <input
          id="target"
          className="target-input"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          enterKeyHint="done"
        />
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <p className="dialog-copy">
          Das Ziel darf überschritten werden. Die letzte Runde wird für alle
          gewertet.
        </p>
        <button type="submit" className="button primary">
          Punktziel übernehmen
          <Icon name="check" />
        </button>
      </form>
    </Modal>
  );
}
