export const THEME_KEY = "flip7.theme.v1";
export type ThemePreference = "system" | "light" | "dark";

export function parseTheme(value: string | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export const themeBootstrap = `(() => {
  let preference = 'system';
  try {
    const saved = localStorage.getItem('flip7.theme.v1');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {}
  const dark = preference === 'dark' || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#1c2528' : '#209b9d';
})();`;
