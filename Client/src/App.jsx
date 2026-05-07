import { Toaster } from "./components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from './lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from './lib/AuthContext';
import UserNotRegisteredError from './components/UserNotRegisteredError';

// Layouts
import RootLayout from './layouts/RootLayout';
import ProjectLayout from './layouts/ProjectLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Login from './pages/Login';
import ProjectList from './pages/Projects';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Budget from './pages/Budget';
import AccessControl from './pages/AccessControl';
import Settings from './pages/Settings';
import Company from "./pages/Company.jsx";
import Admin from "./pages/Admin.jsx";

const AuthenticatedApp = () => {
    const { isLoadingAuth, isAuthenticated, authError } = useAuth();

    if (isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Allow access to login page even if auth fails
    if (authError && !window.location.pathname.startsWith('/login')) {
        if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
        window.location.href = '/login';
        return null;
    }

    return (
        <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* 1. Global Landing Space (No Sidebar) */}
            <Route path="/" element={<RootLayout />}>
                <Route index element={<ProjectList />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            {/* 2. Project Workspace (Project Sidebar) */}
            {/* The :projectId parameter allows your pages to fetch specific project data */}
            <Route path="/project/:projectId" element={<ProjectLayout />}>
                <Route index element={<Dashboard />} /> {/* Project Overview */}
                <Route path="tasks" element={<Tasks />} />
                <Route path="budget" element={<Budget />} />
                {/* TODO: Add Git, Resources, etc. here */}
            </Route>

            {/* 3. Admin Workspace (Admin Sidebar) */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/company" replace />} />
                <Route path="company" element={<Company />} />
                <Route path="access-control" element={<AccessControl />} />
                <Route path="admin" element={<Admin />} />
            </Route>

            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
                <Router>
                    <AuthenticatedApp />
                </Router>
                <Toaster />
            </QueryClientProvider>
        </AuthProvider>
    )
}