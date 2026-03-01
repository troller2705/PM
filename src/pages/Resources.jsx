import React, { useState } from 'react';
import { base44 } from 'api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from 'components/common/PageHeader';
import StatCard from 'components/common/StatCard';
import Avatar from 'components/common/Avatar';
import SearchInput from 'components/common/SearchInput';
import WorkloadHeatmap from 'components/resources/WorkloadHeatmap';
import SkillMatrix from 'components/resources/SkillMatrix';
import AvailabilityTimeline from 'components/resources/AvailabilityTimeline';
import ForecastPanel from 'components/resources/ForecastPanel';
import BottleneckAlert from 'components/resources/BottleneckAlert';
import ResourceProfileModal from 'components/resources/ResourceProfileModal';
import { Button } from 'components/ui/button';
import { Card, CardContent } from 'components/ui/card';
import { Badge } from 'components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Skeleton } from 'components/ui/skeleton';
import {
  Users, Activity, LayoutGrid, Layers, TrendingUp, AlertTriangle, Pencil
} from 'lucide-react';
import { cn } from 'lib/utils';

const STATUS_COLORS = {
  available:           'bg-emerald-100 text-emerald-700',
  partially_available: 'bg-amber-100 text-amber-700',
  fully_allocated:     'bg-red-100 text-red-700',
  on_leave:            'bg-slate-100 text-slate-500',
};

export default function Resources() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [profileModal, setProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'], queryFn: () => base44.entities.User.list(),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-created_date', 500),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'], queryFn: () => base44.entities.Project.list(),
  });
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['resourceProfiles'], queryFn: () => base44.entities.ResourceProfile.list(),
  });
  const { data: forecasts = [] } = useQuery({
    queryKey: ['forecasts'], queryFn: () => base44.entities.ResourceForecast.list('-created_date'),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'], queryFn: () => base44.entities.Department.list(),
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      const existing = profiles.find(p => p.user_id === data.user_id);
      if (existing) return base44.entities.ResourceProfile.update(existing.id, data);
      return base44.entities.ResourceProfile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceProfiles'] });
      setProfileModal(false);
    },
  });

  const openProfile = (user) => { setSelectedUser(user); setProfileModal(true); };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = usersLoading || profilesLoading;

  // Summary stats
  const available = profiles.filter(p => p.status === 'available').length;
  const fullyAllocated = profiles.filter(p => p.status === 'fully_allocated').length;
  const onLeave = profiles.filter(p => p.status === 'on_leave').length;
  const openForecasts = forecasts.filter(f => f.status === 'open').length;

  // Workload stats per user (for overview cards)
  const getUserWorkload = (userId) => {
    const profile = profiles.find(p => p.user_id === userId);
    const capacity = profile?.availability_hours_per_week || 40;
    const active = tasks.filter(t =>
      t.assignee_id === userId &&
      ['in_progress', 'review', 'testing', 'todo'].includes(t.status)
    );
    const hrs = active.reduce((s, t) => s + (t.estimated_hours || 8), 0);
    const pct = capacity > 0 ? Math.round((hrs / capacity) * 100) : 0;
    return { pct, hrs, capacity, taskCount: active.length };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Planning"
        subtitle="Visualize team availability, workload, and skill sets"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Team Members" value={users.length} icon={Users} subtitle={`${profiles.length} profiles configured`} />
        <StatCard title="Available" value={available} icon={Activity} subtitle="ready to assign" />
        <StatCard title="Fully Allocated" value={fullyAllocated} icon={TrendingUp} />
        <StatCard title="Open Forecasts" value={openForecasts} icon={AlertTriangle} subtitle="resource requests" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutGrid className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="workload" className="gap-2">
              <Activity className="h-4 w-4" /> Workload
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2">
              <Layers className="h-4 w-4" /> Skills
            </TabsTrigger>
            <TabsTrigger value="availability" className="gap-2">
              <Users className="h-4 w-4" /> Availability
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Forecast
            </TabsTrigger>
          </TabsList>
          <SearchInput value={search} onChange={setSearch} placeholder="Search members…" className="w-full sm:w-60" />
        </div>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Member cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading
                ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)
                : filteredUsers.map(user => {
                    const profile = profiles.find(p => p.user_id === user.id);
                    const wl = getUserWorkload(user.id);
                    const skills = profile?.skills?.slice(0, 4) || [];
                    const status = profile?.status || 'available';

                    return (
                      <Card key={user.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={user.full_name} email={user.email} />
                              <div>
                                <p className="font-semibold text-slate-900 leading-tight">{user.full_name}</p>
                                <p className="text-xs text-slate-500">{profile?.title || user.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge className={cn("text-xs border-0", STATUS_COLORS[status])}>
                                {status.replace(/_/g, ' ')}
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openProfile(user)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Workload bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Workload</span>
                              <span className={wl.pct > 100 ? 'text-red-600 font-medium' : ''}>{wl.pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div
                                className={cn(
                                  "h-1.5 rounded-full transition-all",
                                  wl.pct > 100 ? 'bg-red-500' : wl.pct > 75 ? 'bg-amber-400' : 'bg-emerald-500'
                                )}
                                style={{ width: `${Math.min(wl.pct, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{wl.taskCount} active tasks · {wl.hrs}h / {wl.capacity}h/wk</p>
                          </div>

                          {/* Skills */}
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {skills.map(s => (
                                <Badge key={s.name} variant="secondary" className="text-xs">{s.name}</Badge>
                              ))}
                              {(profile?.skills?.length || 0) > 4 && (
                                <Badge variant="outline" className="text-xs">+{profile.skills.length - 4}</Badge>
                              )}
                            </div>
                          )}
                          {skills.length === 0 && (
                            <button
                              className="text-xs text-violet-500 hover:underline"
                              onClick={() => openProfile(user)}
                            >
                              + Add skills & profile
                            </button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <BottleneckAlert users={users} tasks={tasks} profiles={profiles} forecasts={forecasts} />
            </div>
          </div>
        </TabsContent>

        {/* ── WORKLOAD ── */}
        <TabsContent value="workload" className="mt-4">
          {isLoading
            ? <Skeleton className="h-80" />
            : <WorkloadHeatmap users={filteredUsers} tasks={tasks} profiles={profiles} />
          }
        </TabsContent>

        {/* ── SKILLS ── */}
        <TabsContent value="skills" className="mt-4">
          {isLoading
            ? <Skeleton className="h-80" />
            : <SkillMatrix users={filteredUsers} profiles={profiles} />
          }
        </TabsContent>

        {/* ── AVAILABILITY ── */}
        <TabsContent value="availability" className="mt-4">
          {isLoading
            ? <Skeleton className="h-80" />
            : <AvailabilityTimeline users={filteredUsers} profiles={profiles} forecasts={forecasts} projects={projects} />
          }
        </TabsContent>

        {/* ── FORECAST ── */}
        <TabsContent value="forecast" className="mt-4">
          <ForecastPanel forecasts={forecasts} projects={projects} users={users} profiles={profiles} />
        </TabsContent>
      </Tabs>

      {/* Profile Modal */}
      {selectedUser && (
        <ResourceProfileModal
          open={profileModal}
          onOpenChange={setProfileModal}
          user={selectedUser}
          profile={profiles.find(p => p.user_id === selectedUser.id)}
          departments={departments}
          onSave={saveProfileMutation.mutate}
        />
      )}
    </div>
  );
}