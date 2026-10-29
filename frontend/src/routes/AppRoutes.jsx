import ReceptionistPatients from "../pages/receptionist/Patients";
import RegisterPatient from "../pages/receptionist/RegisterPatient";
import ReceptionistDischarges from "../pages/receptionist/Discharges";
import ReceptionistQueue from "../pages/receptionist/Queue";
import ReceptionistProfile from "../pages/receptionist/Profile";
import NurseProfile from "../pages/nurse/Profile";
import MedicationSchedule from "../pages/nurse/MedicationSchedule";
import CarePlans from "../pages/nurse/CarePlans";
import AssignedPatients from "../pages/nurse/AssignedPatients";
import Profile from "../pages/accountant/Profile";
import DoctorProfile from "../pages/doctor/Profile";
import Dispensing from "../pages/pharmacist/Dispensing";
import PharmacistProfile from "../pages/pharmacist/Profile";
import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Unauthorized from "../pages/auth/Unauthorized";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import RoleHomeRedirect from "./RoleHomeRedirect";

import AdminLayout from "../layouts/AdminLayout";
import RoleLayout from "../layouts/RoleLayout";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminModulePage from "../pages/admin/AdminModulePage";
import Wards from "../pages/admin/Wards";
import Beds from "../pages/admin/Beds";
import AuditLogs from "../pages/admin/AuditLogs";
import Analytics from "../pages/admin/Analytics";

import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorDutySchedule from "../pages/doctor/DutySchedule";
import DoctorSurgery from "../pages/doctor/Surgery";
import Patients from "../pages/doctor/Patients";
import Appointments from "../pages/doctor/Appointments";
import MedicalRecords from "../pages/doctor/MedicalRecords";
import DoctorPrescriptions from "../pages/doctor/Prescriptions";
import DoctorLabReports from "../pages/doctor/LabReports";
import DoctorRadiologyReports from "../pages/doctor/RadiologyReports";
import NurseDashboard from "../pages/nurse/Dashboard";

import NursingNotes from "../pages/nurse/NursingNotes";
import Vitals from "../pages/nurse/Vitals";
import PatientDashboard from "../pages/patient/Dashboard";
import PatientAppointments from "../pages/patient/Appointments";
import PatientBills from "../pages/patient/Bills";
import PatientDocuments from "../pages/patient/Documents";
import PatientInsurance from "../pages/patient/Insurance";
import PatientLabReports from "../pages/patient/LabReports";
import PatientMedicalHistory from "../pages/patient/MedicalHistory";
import PatientPayments from "../pages/patient/Payments";
import PatientPrescriptions from "../pages/patient/Prescriptions";
import PatientProfile from "../pages/patient/Profile";
import PatientRadiologyReports from "../pages/patient/RadiologyReports";
import ReceptionistDashboard from "../pages/receptionist/Dashboard";
import LaboratoryDashboard from "../pages/laboratory/Dashboard";
import LaboratorySamples from "../pages/laboratory/Samples";
import LaboratoryTestRequests from "../pages/laboratory/TestRequests";
import LaboratoryTestResults from "../pages/laboratory/TestResults";
import LaboratoryReports from "../pages/laboratory/Reports";
import LaboratoryProfile from "../pages/laboratory/Profile";
import PharmacistDashboard from "../pages/pharmacist/Dashboard";
import Medicines from "../pages/pharmacist/Medicines";
import Prescriptions from "../pages/pharmacist/Prescriptions";
import Inventory from "../pages/pharmacist/Inventory";
import Suppliers from "../pages/pharmacist/Suppliers";
import PurchaseOrders from "../pages/pharmacist/PurchaseOrders";
import StockReceiving from "../pages/pharmacist/StockReceiving";
import AccountantDashboard from "../pages/accountant/Dashboard";
import Revenue from "../pages/accountant/Revenue";
import Payments from "../pages/accountant/Payments";

import Invoices from "../pages/accountant/Invoices";
import Bills from "../pages/accountant/Bills";

import RoleDashboard from "../pages/common/RoleDashboard";
import RoleModulePage from "../pages/common/RoleModulePage";
import StaffWorkspace from "../pages/staff/StaffWorkspace";
import AdminStaffDutyRoster from "../pages/staff/AdminStaffDutyRoster";
import InsuranceClaims from "../pages/accountant/InsuranceClaims";

export default function AppRoutes() {

    const module = (role, title, description, dashboardPath) => (
        <RoleModulePage
            role={role}
            title={title}
            description={description}
            dashboardPath={dashboardPath}
        />
    );

    return (
        <Routes>

            {/* =====================================================
                PUBLIC
            ===================================================== */}

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/unauthorized"
                element={<Unauthorized />}
            />


            {/* =====================================================
                AUTHENTICATED
            ===================================================== */}

            <Route element={<ProtectedRoute />}>

                {/* =================================================
                    ADMIN
                ================================================= */}

                <Route
                    element={
                        <RoleRoute allowedRoles={["admin"]} />
                    }
                >

                    <Route
                        path="/admin"
                        element={<AdminLayout />}
                    >

                        <Route
                            index
                            element={<AdminDashboard />}
                        />

                        <Route
                            path="departments"
                            element={
                                <AdminModulePage
                                    moduleKey="departments"
                                />
                            }
                        />

                        <Route
                            path="doctors"
                            element={
                                <AdminModulePage
                                    moduleKey="doctors"
                                />
                            }
                        />

                        <Route
                            path="nurses"
                            element={
                                <AdminModulePage
                                    moduleKey="nurses"
                                />
                            }
                        />

                        <Route
                            path="staff"
                            element={
                                <AdminModulePage
                                    moduleKey="staff"
                                />
                            }
                        />

                        <Route path="staff-duties" element={<AdminStaffDutyRoster />} />

                        <Route
                            path="users"
                            element={
                                <AdminModulePage
                                    moduleKey="users"
                                />
                            }
                        />

                        <Route path="wards" element={<Wards />} />
                        <Route path="beds" element={<Beds />} />

                        <Route
                            path="laboratory"
                            element={
                                <AdminModulePage
                                    moduleKey="laboratory"
                                />
                            }
                        />

                        <Route
                            path="analytics"
                            element={<Analytics />}
                        />

                        <Route
                            path="audit-logs"
                            element={<AuditLogs />}
                        />

                        <Route
                            path="hospital-settings"
                            element={
                                <AdminModulePage
                                    moduleKey="hospital-settings"
                                />
                            }
                        />

                    </Route>

                </Route>


                {/* =================================================
                    DOCTOR
                ================================================= */}

                <Route
                    element={
                        <RoleRoute allowedRoles={["doctor"]} />
                    }
                >

                    <Route
                        path="/doctor"
                        element={<RoleLayout role="doctor" />}
                    >

                        <Route
                            index
                            element={<DoctorDashboard />}
                        />

                        <Route
                            path="appointments"
                            element={<Appointments />}
                            />

                                                <Route
                            path="patients"
                            element={<Patients />}
                        />

                        <Route path="medical-records" element={<MedicalRecords />} />

                        <Route path="prescriptions" element={<DoctorPrescriptions />} />

                        <Route path="lab-reports" element={<DoctorLabReports />} />

                        <Route path="radiology-reports" element={<DoctorRadiologyReports />} />

                        <Route path="surgery" element={<DoctorSurgery />} />

                        <Route path="duty-schedule" element={<DoctorDutySchedule />} />

                        <Route path="profile" element={<DoctorProfile />} />

                    </Route>

                </Route>


                {/* =================================================
                    NURSE
                ================================================= */}

                <Route
                    element={
                        <RoleRoute allowedRoles={["nurse"]} />
                    }
                >

                    <Route
                        path="/nurse"
                        element={<RoleLayout role="nurse" />}
                    >

                        <Route
                            index
                            element={<NurseDashboard />}
                        />

                        <Route path="assigned-patients" element={<AssignedPatients />} />

                        <Route
                            path="vitals"
                            element={<Vitals />}
                        />

                        <Route path="medication-schedule" element={<MedicationSchedule />} />

                        <Route
                            path="nursing-notes"
                            element={<NursingNotes />}
                        />

                        <Route path="care-plans" element={<CarePlans />} />

                        <Route path="profile" element={<NurseProfile />} />

                    </Route>

                </Route>


                {/* =================================================
                    STAFF
                ================================================= */}

                <Route
                    element={
                        <RoleRoute allowedRoles={["staff"]} />
                    }
                >
                    <Route
                        path="/staff"
                        element={<RoleLayout role="staff" />}
                    >
                        <Route index element={<RoleDashboard role="staff" />} />
                        <Route path="profile" element={<StaffWorkspace mode="profile" />} />
                        <Route path="availability" element={<StaffWorkspace mode="availability" />} />
                    </Route>
                </Route>

                {/* =================================================
                    PATIENT
                ================================================= */}

                <Route
                    element={
                        <RoleRoute allowedRoles={["patient"]} />
                    }
                >

                    <Route
                        path="/patient"
                        element={<RoleLayout role="patient" />}
                    >
                        <Route index element={<PatientDashboard />} />
                        <Route path="appointments" element={<PatientAppointments />} />
                        <Route path="medical-history" element={<PatientMedicalHistory />} />
                        <Route path="prescriptions" element={<PatientPrescriptions />} />
                        <Route path="lab-reports" element={<PatientLabReports />} />
                        <Route path="radiology-reports" element={<PatientRadiologyReports />} />
                        <Route path="bills" element={<PatientBills />} />
                        <Route path="payments" element={<PatientPayments />} />
                        <Route path="documents" element={<PatientDocuments />} />
                        <Route path="insurance" element={<PatientInsurance />} />
                        <Route path="profile" element={<PatientProfile />} />
                    </Route>

                </Route>


                {/* =================================================
                    RECEPTIONIST
                ================================================= */}

                <Route
                    element={
                        <RoleRoute allowedRoles={["receptionist"]} />
                    }
                >

                    <Route
                        path="/receptionist"
                        element={<RoleLayout role="receptionist" />}
                    >

                        <Route
                            index
                            element={<ReceptionistDashboard />}
                        />

                        <Route path="patients" element={<ReceptionistPatients />} />

                        <Route path="register-patient" element={<RegisterPatient />} />

                        <Route
                            path="appointments"
                            element={module(
                                "Receptionist",
                                "Appointments",
                                "Manage front-desk appointments.",
                                "/receptionist"
                            )}
                        />

                        <Route
                            path="admissions"
                            element={module(
                                "Receptionist",
                                "Admissions",
                                "Manage patient admissions.",
                                "/receptionist"
                            )}
                        />

                        <Route path="discharges" element={<ReceptionistDischarges />} />

                        <Route path="queue" element={<ReceptionistQueue />} />

                        <Route path="profile" element={<ReceptionistProfile />} />

                    </Route>

                </Route>


                {/* =================================================
                    LABORATORY
                ================================================= */}

                <Route
                    element={
                        <RoleRoute allowedRoles={["laboratory"]} />
                    }
                >

                    <Route
                        path="/laboratory"
                        element={<RoleLayout role="laboratory" />}
                    >

                        <Route
                            index
                            element={<LaboratoryDashboard />}
                        />

                        <Route
                            path="samples" element={<LaboratorySamples />}
                        />

                        <Route
                            path="test-requests" element={<LaboratoryTestRequests />}
                        />

                        <Route
                            path="test-results" element={<LaboratoryTestResults />}
                        />

                        <Route
                            path="reports" element={<LaboratoryReports />}
                        />

                        <Route
                            path="profile"
element={<LaboratoryProfile />}
                        />

                    </Route>

                </Route>


                {/* =================================================
                    PHARMACIST
                ================================================= */}

                <Route
                    element={
                        <RoleRoute allowedRoles={["pharmacist"]} />
                    }
                >

                    <Route
                        path="/pharmacist"
                        element={<RoleLayout role="pharmacist" />}
                    >

                        <Route
                            index
                            element={<PharmacistDashboard />}
                        />

                        <Route
                            path="medicines"
                            element={<Medicines />}
                        />

                        <Route
                            path="inventory"
                            element={<Inventory />}
                        />

                        <Route
                            path="suppliers"
                            element={<Suppliers />}
                        />

                        <Route
                            path="purchase-orders"
                            element={<PurchaseOrders />}
                        />

                        <Route
                            path="stock-receiving"
                            element={<StockReceiving />}
                        />

                        <Route
    path="prescriptions"
    element={<Prescriptions />}
/>

                        <Route path="dispensing" element={<Dispensing />} />

                        <Route
                            path="profile"
                            element={<PharmacistProfile />}
                        />

                    </Route>

                </Route>


                {/* =================================================
                    ACCOUNTANT
                ================================================= */}

                <Route
                    element={
                        <RoleRoute allowedRoles={["accountant"]} />
                    }
                >

                    <Route
                        path="/accountant"
                        element={<RoleLayout role="accountant" />}
                    >

                        <Route
                            index
                            element={<AccountantDashboard />}
                        />

                        <Route
                            path="bills"
                            element={<Bills />}
                        />

                        <Route path="invoices" element={<Invoices />} />

                        <Route path="payments" element={<Payments />} />

                        <Route path="revenue" element={<Revenue />} />

                        <Route
                            path="insurance-claims"
                            element={<InsuranceClaims />}
                        />

                        <Route path="profile" element={<Profile />} />

                    </Route>

                </Route>

            </Route>


            {/* =====================================================
                ROOT
            ===================================================== */}

            <Route
                path="/"
                element={<RoleHomeRedirect />}
            />

            <Route
                path="*"
                element={<RoleHomeRedirect />}
            />

        </Routes>
    );
}

































