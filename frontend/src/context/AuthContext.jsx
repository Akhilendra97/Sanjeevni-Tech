import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getCurrentUser,
    loginRequest,
} from "../services/authApi";

const AuthContext = createContext(null);

const TOKEN_KEY = "access_token";
const USER_KEY = "user";

function normalizeUser(currentUser) {
    if (!currentUser) {
        return null;
    }

    return {
        ...currentUser,
        user_id:
            currentUser?.user_id ??
            currentUser?.id ??
            null,
        role:
            currentUser?.role
                ?.toString()
                ?.trim()
                ?.toLowerCase() ?? null,
    };
}

function clearStoredSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {

    const [user, setUser] = useState(() => {
        try {
            const savedUser =
                localStorage.getItem(USER_KEY);

            return savedUser
                ? JSON.parse(savedUser)
                : null;
        } catch {
            return null;
        }
    });

    const [accessToken, setAccessToken] = useState(
        () => localStorage.getItem(TOKEN_KEY)
    );

    const [loading, setLoading] = useState(true);


    /*
     * ----------------------------------------------------
     * LOGOUT
     * ----------------------------------------------------
     */

    const logout = useCallback(() => {

        clearStoredSession();

        setAccessToken(null);
        setUser(null);

    }, []);


    /*
     * ----------------------------------------------------
     * LOGIN
     *
     * Important:
     * 1. Get token
     * 2. Verify token through /auth/me
     * 3. Only then persist authenticated session
     * ----------------------------------------------------
     */

    const login = useCallback(
        async (usernameOrEmail, password) => {

            const cleanUsername =
                usernameOrEmail?.trim();

            if (!cleanUsername) {
                throw new Error(
                    "Please enter your username."
                );
            }

            if (!password) {
                throw new Error(
                    "Please enter your password."
                );
            }


            const tokenResponse =
                await loginRequest(
                    cleanUsername,
                    password
                );


            const token =
                tokenResponse?.access_token;


            if (!token) {
                throw new Error(
                    "Login succeeded but no access token was returned."
                );
            }


            /*
             * Verify the token before changing React auth state.
             */

            let currentUser;

            try {
                currentUser =
                    await getCurrentUser(token);
            } catch (error) {

                clearStoredSession();

                throw new Error(
                    "Authentication verification failed. Please try again."
                );
            }


            const normalizedUser =
                normalizeUser(currentUser);


            if (
                !normalizedUser ||
                !normalizedUser.user_id ||
                !normalizedUser.role
            ) {

                clearStoredSession();

                throw new Error(
                    "The server returned an invalid user session."
                );
            }


            /*
             * Atomic session commit.
             */

            localStorage.setItem(
                TOKEN_KEY,
                token
            );

            localStorage.setItem(
                USER_KEY,
                JSON.stringify(normalizedUser)
            );

            setAccessToken(token);
            setUser(normalizedUser);


            return normalizedUser;
        },
        []
    );


    /*
     * ----------------------------------------------------
     * RESTORE SESSION
     *
     * Runs once when the application starts.
     * ----------------------------------------------------
     */

    useEffect(() => {

        let mounted = true;

        const restoreSession = async () => {

            const token =
                localStorage.getItem(TOKEN_KEY);


            if (!token) {

                if (mounted) {
                    setAccessToken(null);
                    setUser(null);
                    setLoading(false);
                }

                return;
            }


            try {

                const currentUser =
                    await getCurrentUser(token);


                if (!mounted) {
                    return;
                }


                const normalizedUser =
                    normalizeUser(currentUser);


                if (
                    !normalizedUser ||
                    !normalizedUser.user_id ||
                    !normalizedUser.role
                ) {
                    throw new Error(
                        "Invalid restored user."
                    );
                }


                setAccessToken(token);
                setUser(normalizedUser);


                localStorage.setItem(
                    USER_KEY,
                    JSON.stringify(normalizedUser)
                );

            } catch {

                if (mounted) {

                    clearStoredSession();

                    setAccessToken(null);
                    setUser(null);
                }

            } finally {

                if (mounted) {
                    setLoading(false);
                }
            }
        };


        restoreSession();


        return () => {
            mounted = false;
        };

    }, []);


    /*
     * ----------------------------------------------------
     * AUTH VALUE
     * ----------------------------------------------------
     */

    const isAuthenticated =
        Boolean(
            accessToken &&
            user &&
            user.user_id &&
            user.role
        );


    const value = useMemo(
        () => ({
            user,
            accessToken,
            loading,
            isAuthenticated,
            login,
            logout,
        }),
        [
            user,
            accessToken,
            loading,
            isAuthenticated,
            login,
            logout,
        ]
    );


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {

    const context =
        useContext(AuthContext);


    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }


    return context;
}


export default AuthContext;
