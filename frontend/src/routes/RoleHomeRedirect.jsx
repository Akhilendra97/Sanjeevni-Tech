import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
    admin: "/admin",
    doctor: "/doctor",
    nurse: "/nurse",
    patient: "/patient",
    receptionist: "/receptionist",
    staff: "/staff",
    laboratory: "/laboratory",
    pharmacist: "/pharmacist",
    accountant: "/accountant",
};

export default function RoleHomeRedirect() {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    const role = user?.role
        ?.toString()
        ?.trim()
        ?.toLowerCase();

    return (
        <Navigate
            to={ROLE_HOME[role] || "/unauthorized"}
            replace
        />
    );
}
