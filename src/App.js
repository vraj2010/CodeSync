import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthProvider from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

function App() {
    return (
        <AuthProvider>
            <div>
                <Toaster
                    position="top-center"
                    toastOptions={{
                        success: {
                            theme: {
                                primary: '#4aed88',
                            },
                            style: {
                                background: 'rgba(40, 42, 54, 0.95)',
                                color: '#e5e7eb',
                                border: '1px solid rgba(74, 237, 136, 0.3)',
                            },
                        },
                        error: {
                            style: {
                                background: 'rgba(40, 42, 54, 0.95)',
                                color: '#e5e7eb',
                                border: '1px solid rgba(255, 77, 77, 0.3)',
                            },
                        },
                        style: {
                            background: 'rgba(40, 42, 54, 0.95)',
                            color: '#e5e7eb',
                            backdropFilter: 'blur(10px)',
                        },
                    }}
                ></Toaster>
            </div>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/sign-in/*" element={<SignInPage />} />
                    <Route path="/sign-up/*" element={<SignUpPage />} />

                    {/* Protected routes - require authentication */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/editor/:roomId"
                        element={
                            <ProtectedRoute>
                                <EditorPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
