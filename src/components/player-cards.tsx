"use client";

import { useRef, useState } from "react";
import { totals, winners, finished, type Game } from "../game";
import AnimatedNumber from "./animated-number";
import { colorStyle, Icon } from "./ui";

export default function PlayerCards({
  game,
  onSelect,
}: {
  game: Game;
  onSelect: (index: number) => void;
}) {
  const scores = totals(game);
  const done = finished(game);
  const winning = winners(game);
  const carousel = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = game.players.length > 2;
  function scrollTo(next: number) {
    const el = carousel.current;
    const item = el?.children[next] as HTMLElement | undefined;
    if (el && item)
      el.scrollTo({
        left: item.offsetLeft - (el.children[0] as HTMLElement).offsetLeft,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }
  return (
    <section className="player-overview" aria-label="Spielstände">
      <div
        ref={carousel}
        className={`score-cards ${many ? "many-players" : ""}`}
        tabIndex={many ? 0 : undefined}
        aria-label={many ? "Spielerkarten, seitlich wischen" : undefined}
        onKeyDown={(event) => {
          if (!many || event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollTo(Math.min(index + 1, game.players.length - 2));
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollTo(Math.max(0, index - 1));
          }
        }}
        onScroll={() => {
          const el = carousel.current;
          if (!el || !many) return;
          const first = el.children[0] as HTMLElement;
          const second = el.children[1] as HTMLElement;
          setIndex(
            Math.round(el.scrollLeft / (second.offsetLeft - first.offsetLeft)),
          );
        }}
      >
        {game.players.map((player, i) => (
          <button
            key={player.id}
            className={`score-card ${done && winning.some((p) => p.id === player.id) ? "winning" : ""}`}
            style={colorStyle(player.color)}
            disabled={done}
            onClick={() => onSelect(i)}
            aria-label={`${player.name}, ${scores[i]} Punkte${done ? "" : ", Punkte eintragen"}`}
          >
            <span className="card-corner" aria-hidden="true">
              {i + 1}
            </span>
            <span className="card-flourish" aria-hidden="true">
              ✦
            </span>
            <span className="card-sun card-sun-left" aria-hidden="true" />
            <span className="score-name">{player.name}</span>
            <span
              className="score-number"
              data-digits={String(scores[i]).length}
            >
              <AnimatedNumber value={scores[i]} />
            </span>
            <span className="score-unit">Punkte</span>
            <span
              className="score-progress"
              role="progressbar"
              aria-label={`${player.name}: Fortschritt zum Punktziel`}
              aria-valuenow={Math.min(scores[i], game.target)}
              aria-valuemin={0}
              aria-valuemax={game.target}
            >
              <i
                style={{
                  width: `${Math.min(100, (scores[i] / game.target) * 100)}%`,
                }}
              />
            </span>
            <span
              className={`card-bottom ${!done && game.draft[i] !== null ? "entered" : ""}`}
            >
              {done ? (
                winning.some((p) => p.id === player.id) ? (
                  <>
                    <Icon name="crown" size={20} />
                    Gewonnen
                  </>
                ) : (
                  `${Math.max(...scores) - scores[i]} Abstand`
                )
              ) : game.draft[i] === null ? (
                <>
                  <Icon name="plus" size={20} />
                  Eintragen
                </>
              ) : (
                <>
                  <Icon name="check" size={20} />
                  {game.draft[i]} eingetragen
                </>
              )}
            </span>
          </button>
        ))}
      </div>
      {many && (
        <div className="carousel-navigation">
          <button
            className="icon-button"
            disabled={index === 0}
            aria-label="Vorherige Personen"
            onClick={() => scrollTo(Math.max(0, index - 1))}
          >
            <Icon name="back" />
          </button>
          <span>
            Personen {index + 1} bis {Math.min(index + 2, game.players.length)}{" "}
            von {game.players.length}
          </span>
          <button
            className="icon-button"
            disabled={index >= game.players.length - 2}
            aria-label="Weitere Personen"
            onClick={() =>
              scrollTo(Math.min(index + 1, game.players.length - 2))
            }
          >
            <Icon name="next" />
          </button>
        </div>
      )}
    </section>
  );
}
