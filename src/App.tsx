import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AiChat from './pages/AiChat';
import Imagine from './pages/Imagine';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/toaster';

// Layout wrapper for authenticated pages
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen bg-[#FAFAFA]">
      {children}
    </div>
  );
};

// Wrap protected routes with both ProtectedRoute and AuthLayout
const ProtectedPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute>
      <AuthLayout>
        {children}
      </AuthLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<ProtectedRoute><Login /></ProtectedRoute>} />

        {/* Protected routes with layout */}
        <Route path="/ai-chat" element={<ProtectedPage><AiChat /></ProtectedPage>} />
        <Route path="/imagine" element={<ProtectedPage><Imagine /></ProtectedPage>} />
        <Route path="/profile" element={<ProtectedPage><Profile /></ProtectedPage>} />

        {/* Redirect root to ai-chat */}
        <Route path="/" element={<Navigate to="/ai-chat" replace />} />

        {/* Catch all other routes and redirect to ai-chat */}
        <Route path="*" element={<Navigate to="/ai-chat" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;