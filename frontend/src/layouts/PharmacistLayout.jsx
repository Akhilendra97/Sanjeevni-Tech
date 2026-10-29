import React from "react";
import RoleLayout from "./RoleLayout";

export default function PharmacistLayout({ children }) {
    return (
        <RoleLayout role="pharmacist">
            {children}
        </RoleLayout>
    );
}
