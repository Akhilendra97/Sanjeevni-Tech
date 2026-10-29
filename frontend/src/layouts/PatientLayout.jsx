import React from "react";
import RoleLayout from "./RoleLayout";

export default function PatientLayout({ children }) {
    return (
        <RoleLayout role="patient">
            {children}
        </RoleLayout>
    );
}
