import axios from "axios";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";


const api = axios.create({
    baseURL: API_BASE,

    headers: {
        "Content-Type": "application/json",
    },
});


/*
 * ----------------------------------------------------
 * REQUEST
 * ----------------------------------------------------
 */

api.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem(
                "access_token"
            );


        if (token) {

            config.headers =
                config.headers || {};

            config.headers.Authorization =
                `Bearer ${token}`;
        }


        return config;
    },

    (error) =>
        Promise.reject(error)
);


/*
 * ----------------------------------------------------
 * RESPONSE
 *
 * A 401 means the existing session is invalid.
 * Do not redirect from here.
 *
 * Routing responsibility belongs to AuthContext /
 * ProtectedRoute.
 * ----------------------------------------------------
 */

api.interceptors.response.use(

    (response) =>
        response,

    (error) => {

        if (
            error.response?.status === 401
        ) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user"
            );
        }


        return Promise.reject(error);
    }
);


export default api;
