const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

export const getStoredToken = () => (
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
);

export const setAuthTokens = ({ token, refreshToken }, rememberMe = true) => {
  const primaryStorage = rememberMe ? localStorage : sessionStorage;
  const secondaryStorage = rememberMe ? sessionStorage : localStorage;

  secondaryStorage.removeItem(TOKEN_KEY);
  secondaryStorage.removeItem(REFRESH_TOKEN_KEY);

  primaryStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    primaryStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    primaryStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const clearAuthTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getRememberedEmail = () => localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';

export const setRememberedEmail = (email, rememberMe) => {
  if (rememberMe) {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }
};
