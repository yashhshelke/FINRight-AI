import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
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
import Transactions from './pages/dashboard/Transactions';
import HabitChallenges from './pages/dashboard/HabitChallenges';
import AICoach from './pages/dashboard/AICoach';
import Settings from './pages/dashboard/Settings';
import GoalsTracker from './pages/dashboard/GoalsTracker';
import SpendingInsights from './pages/dashboard/SpendingInsights';
import BudgetOptimizer from './pages/dashboard/BudgetOptimizer';
import Cards from './pages/dashboard/Cards';
import UPIAnalyser from './pages/dashboard/UPIAnalyser';
import FinancialEducation from './pages/dashboard/FinancialEducation';
import EmergencyRisk from './pages/dashboard/EmergencyRisk';
import IncomeSimulator from './pages/dashboard/IncomeSimulator';
import Documents from './pages/dashboard/Documents';
import DashboardSubscription from './pages/dashboard/Subscription';

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/how-it-works" element={<HowItWorks />} />
                        <Route path="/subscription" element={<Subscription />} />
                        <Route path="/login" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />

                        {/* Onboarding */}
                        <Route path="/onboarding" element={
                            <ProtectedRoute><Onboarding /></ProtectedRoute>
                        } />

                        {/* Dashboard — protected */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <ChatProvider>
                                    <DashboardLayout />
                                </ChatProvider>
                            </ProtectedRoute>
                        }>
                            <Route index element={<Overview />} />
                            <Route path="transactions" element={<Transactions />} />
                            <Route path="goals" element={<GoalsTracker />} />
                            <Route path="habits" element={<HabitChallenges />} />
                            <Route path="coach" element={<AICoach />} />
                            <Route path="spending" element={<SpendingInsights />} />
                            <Route path="budget" element={<BudgetOptimizer />} />
                            <Route path="cards" element={<Cards />} />
                            <Route path="upi" element={<UPIAnalyser />} />
                            <Route path="education" element={<FinancialEducation />} />
                            <Route path="emergency" element={<EmergencyRisk />} />
                            <Route path="simulator" element={<IncomeSimulator />} />
                            <Route path="documents" element={<Documents />} />
                            <Route path="plan" element={<DashboardSubscription />} />
                            <Route path="settings" element={<Settings />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}
