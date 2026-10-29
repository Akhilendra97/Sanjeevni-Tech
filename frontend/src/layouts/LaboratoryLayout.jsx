import React from "react";
import RoleLayout from "./RoleLayout";

export default function LaboratoryLayout({ children }) {
    return (
        <RoleLayout role="laboratory">
            {children}
        </RoleLayout>
    );
}
