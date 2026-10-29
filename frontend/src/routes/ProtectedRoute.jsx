import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export default function ProtectedRoute() {

    const {
        isAuthenticated,
        loading,
    } = useAuth();

    const location =
        useLocation();


    /*
     * Never redirect while the session is being restored.
     */

    if (loading) {

        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    background: "#06111d",
                    color: "#8eeaff",
                    fontFamily:
                        "Inter, system-ui, sans-serif",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                    }}
                >

                    <div
                        style={{
                            width: 44,
                            height: 44,
                            margin: "0 auto 16px",
                            borderRadius: "50%",
                            border:
                                "3px solid rgba(43,211,255,.18)",
                            borderTopColor:
                                "#2bd3ff",
                            animation:
                                "san-auth-spinner .75s linear infinite",
                        }}
                    />

                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: ".16em",
                            textTransform: "uppercase",
                        }}
                    >
                        Restoring secure session
                    </div>

                    <style>
                        {`
                            @keyframes san-auth-spinner {
                                to {
                                    transform: rotate(360deg);
                                }
                            }
                        `}
                    </style>

                </div>
            </div>
        );
    }


    /*
     * Only redirect after loading has finished.
     */

    if (!isAuthenticated) {

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location,
                }}
            />
        );
    }


    return <Outlet />;
}
