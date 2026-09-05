"use client";

import { useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import type { Player } from "../game";
import { colorStyle, Icon } from "./ui";

function SortablePerson({ player, index }: { player: Player; index: number }) {
  const { ref, handleRef, isDragging } = useSortable({ id: player.id, index });
  return (
    <div
      ref={ref}
      className={`person-row sortable-person ${isDragging ? "dragging" : ""}`}
      style={colorStyle(player.color)}
    >
      <span className="person-mark">{index + 1}</span>
      <span className="person-name" title={player.name}>
        {player.name}
      </span>
      <button
        ref={handleRef}
        className="icon-button drag-handle"
        aria-label={`${player.name} verschieben`}
      >
        <Icon name="grip" />
      </button>
    </div>
  );
}

export default function SortableLineup({
  players,
  onSave,
  onCancel,
}: {
  players: Player[];
  onSave: (ids: string[]) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(players);
  return (
    <div className="lineup-edit">
      <div className="lineup-edit-toolbar">
        <button className="button secondary" onClick={onCancel}>
          Abbrechen
        </button>
        <button
          className="button primary"
          onClick={() => onSave(draft.map((player) => player.id))}
        >
          <Icon name="check" size={20} />
          Fertig
        </button>
      </div>
      <p className="subtle">
        Am Griff ziehen und in die gewünschte Reihenfolge bringen.
      </p>
      <DragDropProvider
        onDragEnd={(event) => {
          if (!event.canceled) setDraft((items) => move(items, event));
        }}
      >
        <div className="lineup" aria-label="Spielerreihenfolge bearbeiten">
          {draft.map((player, index) => (
            <SortablePerson key={player.id} player={player} index={index} />
          ))}
        </div>
      </DragDropProvider>
    </div>
  );
}
