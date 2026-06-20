import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import ChatbotPage from './pages/ChatbotPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import MapPage from './pages/MapPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                </>
              }
            />
            <Route
              path="/favorites"
              element={
                <>
                  <Navbar />
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                </>
              }
            />
            <Route
              path="/profile"
              element={
                <>
                  <Navbar />
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                </>
              }
            />
            <Route
              path="/chat"
              element={
                <>
                  <Navbar />
                  <ProtectedRoute>
                    <ChatbotPage />
                  </ProtectedRoute>
                </>
              }
            />
            <Route
              path="/restaurant/:id"
              element={
                <>
                  <Navbar />
                  <ProtectedRoute>
                    <RestaurantDetailPage />
                  </ProtectedRoute>
                </>
              }
            />
            <Route
              path="/map/:lat/:lng/:name"
              element={
                <ProtectedRoute>
                  <MapPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
