import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import SignUp from "./pages/SignUp.tsx";
import SelectProfession from "./pages/SelectProfession.tsx";
import ProfilePicture from "./pages/ProfilePicture.tsx";
import Profile from "./pages/Profile.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProcedurePreferences from "./pages/ProcedurePreferences.tsx";
import SharedPreferenceCard from "./pages/SharedPreferenceCard.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminDoctors from "./pages/admin/AdminDoctors.tsx";
import AdminPrefCards from "./pages/admin/AdminPrefCards.tsx";
import AdminNotifications from "./pages/admin/AdminNotifications.tsx";
import AdminSupplyLibrary from "./pages/admin/AdminSupplyLibrary.tsx";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs.tsx";
import AdminDoctorDetail from "./pages/admin/AdminDoctorDetail.tsx";
import AdminEditPrefCard from "./pages/admin/AdminEditPrefCard.tsx";
import AdminPendingChanges from "./pages/admin/AdminPendingChanges.tsx";
import AdminUserDetail from "./pages/admin/AdminUserDetail.tsx";
import Settings from "./pages/Settings.tsx";
import ClinicalStaffDashboard from "./pages/ClinicalStaffDashboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/select-profession" element={<SelectProfession />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile-picture" element={<ProfilePicture />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/procedure/:procedureId/preferences" element={<ProcedurePreferences />} />
            <Route path="/shared/procedure/:procedureId" element={<SharedPreferenceCard />} />
            
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
            <Route path="/admin/doctors" element={<AdminDoctors />} />
            <Route path="/admin/preference-cards" element={<AdminPrefCards />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/supply-library" element={<AdminSupplyLibrary />} />
            <Route path="/admin/activity-logs" element={<AdminActivityLogs />} />
            <Route path="/admin/doctors/:userId" element={<AdminDoctorDetail />} />
            <Route path="/admin/doctors/:userId/procedure/:procedureId" element={<AdminEditPrefCard />} />
            <Route path="/admin/doctors/:userId/pending" element={<AdminPendingChanges />} />
            <Route path="/clinical-dashboard" element={<ClinicalStaffDashboard />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
