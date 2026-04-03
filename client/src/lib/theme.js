export const THEME_OPTIONS = {
  DARK: 'dark',
  LIGHT: 'light',
};

const THEME_STORAGE_KEY = 'campusfound_theme';
const USER_THEME_STORAGE_PREFIX = 'campusfound_theme_user_';

export const normalizeTheme = (value) => (
  value === THEME_OPTIONS.LIGHT ? THEME_OPTIONS.LIGHT : THEME_OPTIONS.DARK
);

export const getUserThemeStorageKey = (userId) => `${USER_THEME_STORAGE_PREFIX}${userId}`;

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export const getStoredTheme = (userId) => {
  const storage = getStorage();
  if (!storage) {
    return THEME_OPTIONS.DARK;
  }

  const userTheme = userId ? storage.getItem(getUserThemeStorageKey(userId)) : null;
  const fallbackTheme = storage.getItem(THEME_STORAGE_KEY);
  return normalizeTheme(userTheme || fallbackTheme);
};

export const persistTheme = (theme, userId) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const normalizedTheme = normalizeTheme(theme);
  storage.setItem(THEME_STORAGE_KEY, normalizedTheme);

  if (userId) {
    storage.setItem(getUserThemeStorageKey(userId), normalizedTheme);
  }
};

export const applyThemeToRoot = (theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const normalizedTheme = normalizeTheme(theme);
  const nextThemeClass = `theme-${normalizedTheme}`;
  const rootTargets = [document.documentElement, document.body, document.getElementById('root')].filter(Boolean);

  rootTargets.forEach((element) => {
    element.classList.remove('theme-dark', 'theme-light');
    element.classList.add(nextThemeClass);
    element.setAttribute('data-theme', normalizedTheme);
  });
};
