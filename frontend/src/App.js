import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Predict from "@/pages/Predict";
import History from "@/pages/History";
import Analytics from "@/pages/Analytics";
import Admin from "@/pages/Admin";
import Profile from "@/pages/Profile";
import Assistant from "@/pages/Assistant";
import NotFound from "@/pages/NotFound";
import PredictionDetail from "@/pages/PredictionDetail";
import AuthCallback from "@/pages/AuthCallback";

function AppRouter() {
  const location = useLocation();
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes("session_id=")) return <AuthCallback/>;
  return (
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
      <Route path="/predict" element={<ProtectedRoute><Predict/></ProtectedRoute>}/>
      <Route path="/predictions/:id" element={<ProtectedRoute><PredictionDetail/></ProtectedRoute>}/>
      <Route path="/history" element={<ProtectedRoute><History/></ProtectedRoute>}/>
      <Route path="/analytics" element={<ProtectedRoute><Analytics/></ProtectedRoute>}/>
      <Route path="/assistant" element={<ProtectedRoute><Assistant/></ProtectedRoute>}/>
      <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
      <Route path="/admin" element={<ProtectedRoute admin><Admin/></ProtectedRoute>}/>
      <Route path="*" element={<NotFound/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter/>
          <Toaster position="top-right"/>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
