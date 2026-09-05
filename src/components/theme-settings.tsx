"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { parseTheme, THEME_KEY, type ThemePreference } from "../theme";

const themeEvent = "flip7-theme-change";

function applyTheme(preference: ThemePreference) {
  const dark = preference === "dark";
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#1c2528" : "#209b9d");
  window.dispatchEvent(new Event(themeEvent));
}

function getPreference() {
  return parseTheme(document.documentElement.dataset.themePreference ?? null);
}

function subscribe(listener: () => void) {
  window.addEventListener(themeEvent, listener);
  return () => window.removeEventListener(themeEvent, listener);
}

export function ThemeSync() {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null)
        applyTheme(parseTheme(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    applyTheme(getPreference());
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return null;
}

export function ThemeSettings() {
  const preference = useSyncExternalStore(
    subscribe,
    getPreference,
    () => "light" as const,
  );
  const [saveError, setSaveError] = useState(false);
  function choose(next: ThemePreference) {
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }
  return (
    <fieldset className="theme-settings">
      <legend>Darstellung</legend>
      <div className="theme-options">
        {(
          [
            ["light", "Hell"],
            ["dark", "Dunkel"],
          ] as const
        ).map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => choose(value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <p className="theme-hint" role={saveError ? "status" : undefined}>
        {saveError
          ? "Nur für dieses Fenster. Die Auswahl konnte nicht gespeichert werden."
          : "Deine Auswahl bleibt auf diesem Gerät gespeichert."}
      </p>
    </fieldset>
  );
}
