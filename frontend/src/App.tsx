import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import Onboarding from './pages/Onboarding';
import DashboardLayout from './layouts/DashboardLayout';
import FAQ from './pages/FAQ';
import HowItWorks from './pages/HowItWorks';
import Subscription from './pages/Subscription';
import Overview from './pages/dashboard/Overview';
import HabitChallenges from './pages/dashboard/HabitChallenges';
import AICoach from './pages/dashboard/AICoach';
import Settings from './pages/dashboard/Settings';
import Transactions from './pages/dashboard/Transactions';

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/how-it-works" element={<HowItWorks />} />
                        <Route path="/subscription" element={<Subscription />} />
                        <Route path="/login" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/onboarding" element={
                            <ProtectedRoute><Onboarding /></ProtectedRoute>
                        } />

                        <Route path="/dashboard" element={
                            <ProtectedRoute><DashboardLayout /></ProtectedRoute>
                        }>
                            <Route index element={<Overview />} />
                            <Route path="transactions" element={<Transactions />} />
                            <Route path="habits" element={<HabitChallenges />} />
                            <Route path="coach" element={<AICoach />} />
                            <Route path="settings" element={<Settings />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}
