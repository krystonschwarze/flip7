export const THEME_KEY = "flip7.theme.v1";
export type ThemePreference = "light" | "dark";

export function parseTheme(value: string | null): ThemePreference {
  return value === "dark" ? "dark" : "light";
}

export const themeBootstrap = `(() => {
  let preference = 'light';
  try {
    const saved = localStorage.getItem('flip7.theme.v1');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {}
  const dark = preference === 'dark';
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();`;
