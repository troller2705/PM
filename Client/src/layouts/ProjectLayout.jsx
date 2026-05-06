import React, { useState } from 'react';
import { Link, Outlet, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '../api/apiClient';
import { useAuth } from '../lib/AuthContext';
import Avatar from '../components/common/Avatar';
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import {
    LayoutDashboard, ListTodo, DollarSign, GitBranch,
    CalendarRange, ArrowLeft, Settings, Shield
} from 'lucide-react';

export default function ProjectLayout() {
    const { projectId } = useParams(); // Grabs the ID from /project/123/tasks
    const location = useLocation();
    const { user } = useAuth();

    const { data: project, isLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => db.projects.get(projectId), // Assumes your apiClient has a .get() method
    });

    // Navigation scoped ONLY to this project
    const projectNav = [
        { name: 'Overview', href: `/project/${projectId}`, icon: LayoutDashboard },
        { name: 'Tasks & Boards', href: `/project/${projectId}/tasks`, icon: ListTodo },
        { name: 'Git & Commits', href: `/project/${projectId}/git`, icon: GitBranch },
        { name: 'Budget & Spend', href: `/project/${projectId}/budget`, icon: DollarSign },
        { name: 'Resources', href: `/project/${projectId}/resources`, icon: CalendarRange },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Project Sidebar */}
            <aside className="w-64 fixed left-0 top-0 bottom-0 flex-col bg-slate-950 border-r border-slate-800 hidden lg:flex text-slate-300">

                {/* Back to Home Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <Link to="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" /> Back to Projects
                    </Link>
                    {isLoading ? (
                        <div className="h-7 w-3/4 bg-slate-800 animate-pulse rounded mb-1"></div>
                    ) : (
                        <h2 className="text-lg font-bold text-white truncate" title={project?.name}>
                            {project?.name || "Project Workspace"}
                        </h2>
                    )}
                    <p className="text-xs text-slate-500 font-mono mt-1">ID: {projectId}</p>
                </div>

                {/* Project Links */}
                <nav className="flex-1 py-4 space-y-1 px-2">
                    {projectNav.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link key={item.name} to={item.href} className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}>
                                <item.icon className="h-5 w-5" />
                                <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin Link at the bottom (Only if user is admin) */}
                {user?.role === 'admin' && (
                    <div className="p-4 border-t border-slate-800">
                        <Link to="/admin" onClick={() => sessionStorage.setItem('adminReturnUrl', location.pathname)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-500 hover:bg-slate-800 transition-colors">
                            <Shield className="h-5 w-5" />
                            <span className="font-medium text-sm">Admin Space</span>
                        </Link>
                    </div>
                )}
            </aside>

            {/* Main Workspace Content */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
                    {/* Outlet is where the child route (Tasks, Budget, etc) gets rendered */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
}