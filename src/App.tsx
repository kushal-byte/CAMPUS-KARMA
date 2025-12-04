import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Marketplace from "./pages/marketplace/Marketplace";
import NewListing from "./pages/marketplace/NewListing";
import ListingDetail from "./pages/marketplace/ListingDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/events/EventDetail";
import LinkedIn from "./pages/LinkedIn";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import EventAttendance from "./pages/admin/EventAttendance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><AppLayout><Marketplace /></AppLayout></ProtectedRoute>} />
            <Route path="/marketplace/new" element={<ProtectedRoute><AppLayout><NewListing /></AppLayout></ProtectedRoute>} />
            <Route path="/marketplace/:id" element={<ProtectedRoute><AppLayout><ListingDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><AppLayout><Events /></AppLayout></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><AppLayout><EventDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/linkedin" element={<ProtectedRoute><AppLayout><LinkedIn /></AppLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/events/:eventId" element={<ProtectedRoute requireAdmin><AppLayout><EventAttendance /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;