import React from 'react';
import {Outlet, Link, useLocation} from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Avatar from '../components/common/Avatar';
import { Gamepad2, LogOut, Settings, Shield } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export default function RootLayout() {
    const { user, logout } = useAuth();
    const location = useLocation()

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
                        <Gamepad2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
            CrossClaw
          </span>
                </Link>

                <div className="flex items-center gap-4">
                    {user?.role === 'admin' && (
                        <Link to="/admin" onClick={() => sessionStorage.setItem('adminReturnUrl', location.pathname)} className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors mr-2">
                            <Shield className="h-4 w-4" />
                            Admin Console
                        </Link>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none rounded-full ring-offset-2 focus:ring-2 focus:ring-violet-500 transition-all">
                            <Avatar name={user?.full_name} email={user?.email} size="sm" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                                <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                                <LogOut className="mr-2 h-4 w-4" /> Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
    );
}