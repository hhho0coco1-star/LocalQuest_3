import { createSlice } from '@reduxjs/toolkit';

const AUTH_STORAGE_KEY = 'lq_auth';
const TOKEN_STORAGE_KEY = 'lq_access_token';

const safeRead = (storage, key) => {
    try {
        return storage.getItem(key);
    } catch (error) {
        return null;
    }
};

const safeWrite = (storage, key, value) => {
    try {
        storage.setItem(key, value);
    } catch (error) {
        // ignore storage write errors
    }
};

const safeRemove = (storage, key) => {
    try {
        storage.removeItem(key);
    } catch (error) {
        // ignore storage remove errors
    }
};

const readPersistedAuth = () => {
    try {
        const sessionRaw = safeRead(sessionStorage, AUTH_STORAGE_KEY);
        if (sessionRaw) {
            return JSON.parse(sessionRaw);
        }

        // Backward compatibility: migrate previously persisted localStorage auth.
        const legacyRaw = safeRead(localStorage, AUTH_STORAGE_KEY);
        if (!legacyRaw) return null;

        const legacyAuth = JSON.parse(legacyRaw);
        safeWrite(sessionStorage, AUTH_STORAGE_KEY, JSON.stringify(legacyAuth));

        const legacyToken = safeRead(localStorage, TOKEN_STORAGE_KEY);
        if (legacyToken) {
            safeWrite(sessionStorage, TOKEN_STORAGE_KEY, legacyToken);
        }

        safeRemove(localStorage, AUTH_STORAGE_KEY);
        safeRemove(localStorage, TOKEN_STORAGE_KEY);
        return legacyAuth;
    } catch (error) {
        return null;
    }
};

const persistedAuth = readPersistedAuth();

const initialState = persistedAuth ?? {
    isAuthenticated: false,
    accessToken: null,
    expiresIn: 0,
    user: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth: (state, action) => {
            const payload = action.payload;
            state.isAuthenticated = true;
            state.accessToken = payload.accessToken;
            state.expiresIn = payload.expiresIn ?? 0;
            state.user = payload.user ?? null;

            const nextAuth = {
                isAuthenticated: true,
                accessToken: state.accessToken,
                expiresIn: state.expiresIn,
                user: state.user
            };

            safeWrite(sessionStorage, AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
            if (state.accessToken) {
                safeWrite(sessionStorage, TOKEN_STORAGE_KEY, state.accessToken);
            }

            // Ensure stale local storage entries do not keep users logged in after closing a window.
            safeRemove(localStorage, AUTH_STORAGE_KEY);
            safeRemove(localStorage, TOKEN_STORAGE_KEY);
        },
        clearAuth: (state) => {
            state.isAuthenticated = false;
            state.accessToken = null;
            state.expiresIn = 0;
            state.user = null;

            safeRemove(sessionStorage, AUTH_STORAGE_KEY);
            safeRemove(sessionStorage, TOKEN_STORAGE_KEY);
            safeRemove(localStorage, AUTH_STORAGE_KEY);
            safeRemove(localStorage, TOKEN_STORAGE_KEY);
        },
        updateUserProfile: (state, action) => {
            if (!state.isAuthenticated || !state.user) {
                return;
            }

            const profilePatch = action.payload ?? {};
            state.user = {
                ...state.user,
                ...profilePatch
            };

            const nextAuth = {
                isAuthenticated: state.isAuthenticated,
                accessToken: state.accessToken,
                expiresIn: state.expiresIn,
                user: state.user
            };

            safeWrite(sessionStorage, AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
            if (state.accessToken) {
                safeWrite(sessionStorage, TOKEN_STORAGE_KEY, state.accessToken);
            }
        }
    }
});

export const { setAuth, clearAuth, updateUserProfile } = authSlice.actions;
export { AUTH_STORAGE_KEY, TOKEN_STORAGE_KEY };
export default authSlice.reducer;
