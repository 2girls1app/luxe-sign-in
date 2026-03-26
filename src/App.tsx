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
import OnboardingIntro from "./pages/OnboardingIntro.tsx";
import OnboardingQuestion from "./pages/OnboardingQuestion.tsx";
import Profile from "./pages/Profile.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import NotFound from "./pages/NotFound.tsx";

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
            <Route path="/onboarding-intro" element={<OnboardingIntro />} />
            <Route path="/onboarding-question" element={<OnboardingQuestion />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
