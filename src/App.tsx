import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AddExperience from "./pages/AddExperience";
import ViewExperiences from "./pages/ViewExperiences";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import "react-quill/dist/quill.snow.css";
import EditExperience from "./pages/EditExperience";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/add-experience" element={<AddExperience />} />
          <Route path="/view-experiences" element={<ViewExperiences />} />
          <Route path="/edit-experience/:id" element={<EditExperience />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
