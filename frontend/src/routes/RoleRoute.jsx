import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export default function RoleRoute({
    allowedRoles = [],
}) {

    const {
        user,
        loading,
    } = useAuth();

    const location =
        useLocation();


    /*
     * Never perform a role decision while auth
     * restoration is still running.
     */

    if (loading) {
        return null;
    }


    if (!user) {

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


    const currentRole =
        user?.role
            ?.toString()
            ?.trim()
            ?.toLowerCase();


    const normalizedRoles =
        allowedRoles
            .map((role) =>
                role
                    ?.toString()
                    ?.trim()
                    ?.toLowerCase()
            )
            .filter(Boolean);


    if (
        normalizedRoles.length > 0 &&
        !normalizedRoles.includes(currentRole)
    ) {

        return (
            <Navigate
                to="/unauthorized"
                replace
            />
        );
    }


    return <Outlet />;
}
