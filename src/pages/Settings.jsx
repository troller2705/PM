import React, { useState, useEffect } from 'react';
import { base44 } from 'api/base44Client';
import { useMutation } from '@tanstack/react-query';
import PageHeader from 'components/common/PageHeader';
import Avatar from 'components/common/Avatar';
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Switch } from "components/ui/switch";
import { Skeleton } from "components/ui/skeleton";
import { toast } from "sonner";
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
} from 'lucide-react';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    notification_email: true,
    notification_tasks: true,
    notification_mentions: true,
    notification_budget: false,
    theme: 'light',
  });

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      if (userData.settings) {
        setFormData(prev => ({ ...prev, ...userData.settings }));
      }
      setLoading(false);
    });
  }, []);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe({ settings: data }),
    onSuccess: () => {
      toast.success('Settings saved successfully');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      {/* Profile */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-slate-600" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={user?.full_name} email={user?.email} size="xl" />
            <div>
              <p className="text-lg font-semibold text-slate-900">{user?.full_name}</p>
              <p className="text-slate-500">{user?.email}</p>
              <p className="text-sm text-slate-400 capitalize">Role: {user?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-600" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Email Notifications</p>
              <p className="text-sm text-slate-500">Receive notifications via email</p>
            </div>
            <Switch 
              checked={formData.notification_email}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notification_email: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Task Updates</p>
              <p className="text-sm text-slate-500">Get notified when tasks are assigned or updated</p>
            </div>
            <Switch 
              checked={formData.notification_tasks}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notification_tasks: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Mentions</p>
              <p className="text-sm text-slate-500">Get notified when someone mentions you</p>
            </div>
            <Switch 
              checked={formData.notification_mentions}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notification_mentions: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Budget Alerts</p>
              <p className="text-sm text-slate-500">Receive alerts for budget thresholds</p>
            </div>
            <Switch 
              checked={formData.notification_budget}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notification_budget: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-600" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="font-medium text-slate-900">Account Status</p>
            <p className="text-sm text-slate-500 mt-1">Your account is secure and verified</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="font-medium text-slate-900">Last Login</p>
            <p className="text-sm text-slate-500 mt-1">
              {user?.created_date ? new Date(user.created_date).toLocaleString() : 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-slate-600" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Theme</p>
              <p className="text-sm text-slate-500">Select your preferred theme</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={formData.theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, theme: 'light' }))}
              >
                Light
              </Button>
              <Button 
                variant={formData.theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, theme: 'dark' }))}
              >
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}