import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { db } from './api/apiClient';
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import Avatar from './components/common/Avatar';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  GitBranch,
  DollarSign,
  Users,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Gamepad2,
  Menu,
  X,
  BarChart2,
  CalendarRange,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: 'Projects', icon: FolderKanban },
  { name: 'Tasks', href: 'Tasks', icon: ListTodo },
  { name: 'Git', href: 'GitIntegrations', icon: GitBranch },
  { name: 'Budget', href: 'Budget', icon: DollarSign },
  { name: 'Resources', href: 'Resources', icon: CalendarRange },
  { name: 'Reports', href: 'Reports', icon: BarChart2 },
  { name: 'Team', href: 'Team', icon: Users },
  { name: 'Access Control', href: 'AccessControl', icon: Shield },
  { name: 'Admin', href: 'Admin', icon: Settings, adminOnly: true },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';
  const filteredNav = navigation.filter(item => !item.adminOnly || isAdmin);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn(
        "flex items-center gap-3 px-4 py-6 border-b border-slate-800",
        collapsed && "justify-center px-2"
      )}>
        <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
          <Gamepad2 className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-white tracking-tight">
            CrossClaw Productions
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {filteredNav.map((item) => {
            const isActive = currentPageName === item.href;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-slate-800">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-800/50 transition-colors",
                collapsed && "justify-center"
              )}>
                <Avatar name={user.full_name} email={user.email} size="sm" />
                {!collapsed && (
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('Settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => base44.auth.logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">GameStudio</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-slate-800"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900">
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 bottom-0 flex-col bg-slate-900 transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-64"
      )}>
        <NavContent />
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>

      {/* Main content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-64",
        collapsed && "lg:ml-16",
        "pt-16 lg:pt-0"
      )}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}