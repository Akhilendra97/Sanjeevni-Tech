import React from "react";
import RoleLayout from "./RoleLayout";

export default function NurseLayout({ children }) {
    return (
        <RoleLayout role="nurse">
            {children}
        </RoleLayout>
    );
}
