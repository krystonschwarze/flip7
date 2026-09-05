"use client";

import { useRef, useState, type FormEvent } from "react";
import { createId, MAX_PLAYERS, type State } from "../game";
import { colorStyle, Icon, Modal } from "./ui";

export default function PeopleModal({
  state,
  onChange,
  onClose,
}: {
  state: State;
  onChange: (state: State) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const pending = name.trim().length > 0 || !!editing || !!deleting;
  function cleanName(value: string, id?: string) {
    const clean = value.trim().replace(/\s+/g, " ");
    if (!clean) {
      setError("Gib einen Namen ein.");
      return null;
    }
    if (
      state.profiles.some(
        (p) =>
          p.id !== id &&
          p.name.toLocaleLowerCase("de") === clean.toLocaleLowerCase("de"),
      )
    ) {
      setError("Diesen Namen gibt es schon.");
      return null;
    }
    return clean;
  }
  function add(event: FormEvent) {
    event.preventDefault();
    const clean = cleanName(name);
    if (!clean) return;
    const player = {
      id: createId(),
      name: clean,
      color: state.profiles.length % 6,
    };
    onChange({
      ...state,
      profiles: [...state.profiles, player],
      selected:
        state.selected.length < MAX_PLAYERS
          ? [...state.selected, player.id]
          : state.selected,
    });
    setName("");
    setError("");
    input.current?.focus();
  }
  function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const clean = cleanName(editing.name, editing.id);
    if (!clean) return;
    onChange({
      ...state,
      profiles: state.profiles.map((p) =>
        p.id === editing.id ? { ...p, name: clean } : p,
      ),
    });
    setEditing(null);
    setError("");
  }
  return (
    <Modal title="Eure Namen" onClose={onClose} className="people-sheet">
      <p className="subtle modal-intro">Auswählen, wer mitspielt.</p>
      <form className="name-form" onSubmit={add}>
        <label htmlFor="person-name">Neue Person</label>
        <div className="name-input-row">
          <input
            id="person-name"
            ref={input}
            placeholder="Name"
            value={name}
            disabled={!!editing || !!deleting}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            maxLength={24}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
          />
          <button
            className="button primary add-name-button"
            type="submit"
            disabled={!name.trim() || !!editing || !!deleting}
            aria-label="Name hinzufügen"
          >
            <Icon name="plus" />
            Hinzufügen
          </button>
        </div>
      </form>
      <div className="people-feedback" aria-live="polite">
        {error ||
          (name.trim()
            ? "Füge den Namen hinzu, bevor du fortfährst."
            : editing
              ? "Änderung speichern oder mit × abbrechen."
              : deleting
                ? "Nur der gespeicherte Name wird gelöscht."
                : "Die Namen bleiben fürs nächste Mal gespeichert.")}
      </div>
      <div className="saved-people">
        {state.profiles.map((player) => (
          <div
            className="saved-person"
            key={player.id}
            style={colorStyle(player.color)}
          >
            {editing?.id === player.id ? (
              <form className="inline-person-edit" onSubmit={saveEdit}>
                <input
                  aria-label="Name bearbeiten"
                  autoFocus
                  value={editing.name}
                  maxLength={24}
                  onChange={(event) => {
                    setEditing({ ...editing, name: event.target.value });
                    setError("");
                  }}
                  enterKeyHint="done"
                />
                <button
                  className="icon-button outlined primary"
                  type="submit"
                  disabled={!editing.name.trim()}
                  aria-label="Name speichern"
                >
                  <Icon name="check" />
                </button>
                <button
                  className="icon-button outlined"
                  type="button"
                  aria-label="Bearbeiten abbrechen"
                  onClick={() => {
                    setEditing(null);
                    setError("");
                  }}
                >
                  <Icon name="close" />
                </button>
              </form>
            ) : deleting === player.id ? (
              <div className="inline-person-delete">
                <strong>{player.name} löschen?</strong>
                <button
                  className="button compact secondary"
                  onClick={() => setDeleting(null)}
                >
                  Abbrechen
                </button>
                <button
                  className="button compact destructive"
                  aria-label="Namen löschen"
                  onClick={() => {
                    onChange({
                      ...state,
                      profiles: state.profiles.filter(
                        (p) => p.id !== player.id,
                      ),
                      selected: state.selected.filter((id) => id !== player.id),
                    });
                    setDeleting(null);
                  }}
                >
                  Löschen
                </button>
              </div>
            ) : (
              <>
                <button
                  className="person-select"
                  aria-pressed={state.selected.includes(player.id)}
                  disabled={!!editing || !!deleting}
                  onClick={() => {
                    const active = state.selected.includes(player.id);
                    if (!active && state.selected.length >= MAX_PLAYERS) {
                      setError("Bis zu 18 Personen können mitspielen.");
                      return;
                    }
                    onChange({
                      ...state,
                      selected: active
                        ? state.selected.filter((id) => id !== player.id)
                        : [...state.selected, player.id],
                    });
                  }}
                >
                  <span
                    className={`selection-box ${state.selected.includes(player.id) ? "checked" : ""}`}
                  >
                    {state.selected.includes(player.id) && (
                      <Icon name="check" size={20} />
                    )}
                  </span>
                  <span>{player.name}</span>
                </button>
                <button
                  className="icon-button"
                  disabled={!!editing || !!deleting || !!name.trim()}
                  aria-label={`${player.name} bearbeiten`}
                  onClick={() => {
                    setEditing({ id: player.id, name: player.name });
                    setError("");
                  }}
                >
                  <Icon name="edit" />
                </button>
                <button
                  className="icon-button"
                  disabled={!!editing || !!deleting || !!name.trim()}
                  aria-label={`${player.name} löschen`}
                  onClick={() => {
                    setDeleting(player.id);
                    setError("");
                  }}
                >
                  <Icon name="trash" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <button className="button primary" disabled={pending} onClick={onClose}>
        Auswahl übernehmen
        <Icon name="check" />
      </button>
    </Modal>
  );
}
