import React from "react";
import RoleLayout from "./RoleLayout";

export default function AccountantLayout({ children }) {
    return (
        <RoleLayout role="accountant">
            {children}
        </RoleLayout>
    );
}
