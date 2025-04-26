const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const USER_EMAIL_KEY = 'user_email';

export const storeAuthData = (token: string, userId: string, email: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_ID_KEY, userId);
  localStorage.setItem(USER_EMAIL_KEY, email);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUserId = (): string | null => {
  return localStorage.getItem(USER_ID_KEY);
};

export const getUserEmail = (): string | null => {
  return localStorage.getItem(USER_EMAIL_KEY);
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
