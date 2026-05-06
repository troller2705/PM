import React from 'react';
import { Link, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { cn } from "../lib/utils";
import { Users, Shield, Settings, ArrowLeft, Building2 } from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();
    const { user } = useAuth();
    const navigate = useNavigate()

    // Route Guard: Kick non-admins back to the landing page
    if (user && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    const handleExitAdmin = () => {
        // Grab the saved URL, default to root if it somehow doesn't exist
        const returnUrl = sessionStorage.getItem('adminReturnUrl') || '/';
        // Clean up the memory
        sessionStorage.removeItem('adminReturnUrl');
        // Send them back!
        navigate(returnUrl);
    };

    const adminNav = [
        { name: 'Company Details', href: '/admin/company', icon: Building2 },
        { name: 'Access Control', href: '/admin/access-control', icon: Shield },
        { name: 'System Settings', href: '/admin/admin', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex" style={{maxWidth: "100dvw"}}>
            {/* Admin Sidebar */}
            <aside className="w-64 fixed left-0 top-0 bottom-0 flex flex-col bg-slate-950 border-r border-slate-800 hidden lg:flex text-slate-300">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <button
                        onClick={handleExitAdmin}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" /> Exit Admin
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-amber-500/20 text-amber-500">
                            <Shield className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Admin Console</h2>
                    </div>
                </div>

                {/* Links */}
                <nav className="flex-1 py-4 space-y-1 px-3">
                    {adminNav.map((item) => {
                        const isActive = location.pathname.includes(item.href);
                        return (
                            <Link key={item.name} to={item.href} className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm",
                                isActive
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                            )}>
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Workspace Content */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                <main className="flex-1 p-8 w-full mx-auto" style={{maxWidth: '80dvw'}}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}