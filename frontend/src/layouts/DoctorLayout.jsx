import React from "react";
import RoleLayout from "./RoleLayout";

export default function DoctorLayout({ children }) {
    return (
        <RoleLayout role="doctor">
            {children}
        </RoleLayout>
    );
}
