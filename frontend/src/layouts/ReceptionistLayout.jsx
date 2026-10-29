import React from "react";
import RoleLayout from "./RoleLayout";

export default function ReceptionistLayout({ children }) {
    return (
        <RoleLayout role="receptionist">
            {children}
        </RoleLayout>
    );
}
