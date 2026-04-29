import { useState, useEffect, useCallback } from 'react';
import { db } from '@/api/apiClient';
import { hasPermission, hasAnyPermission, hasAllPermissions, getAccessLevelPermissions } from './permissions';

export function usePermissions() {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [projectAccess, setProjectAccess] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const currentUser = await db.auth.me();
        setUser(currentUser);

        // Admin users have all permissions
        if (currentUser.role === 'admin') {
          setPermissions(['*']);
          setLoading(false);
          return;
        }

        // Load roles and permissions
        const [rolesData, allAccessData, allPermissionsData] = await Promise.all([
          db.roles.list(),
          db.projectAccess.list(),
          db.permissions.list()
        ]);
        
        const accessData = allAccessData.filter(a => a.user_id === currentUser.id);

        setRoles(rolesData);
        setProjectAccess(accessData);

        // Collect all permissions from roles and project access
        const allPermissions = new Set();
        
        // Add permissions directly mapped to the user (e.g., from mock /auth/me payload)
        if (currentUser.permissions) {
           currentUser.permissions.forEach(p => allPermissions.add(p));
        }
        
        // Add permissions from user's assigned roles
        const userRoles = rolesData.filter(r => currentUser.role_ids?.includes(r.id));
        userRoles.forEach(role => {
          role.permission_ids?.forEach(permId => {
            // Find the actual permission code (e.g., 'finance.view') using the ID ('perm2')
            const permObj = allPermissionsData.find(p => p.id === permId);
            if (permObj) {
              allPermissions.add(permObj.code);
            }
          });
        });

        // Add permissions from project access
        accessData.forEach(access => {
          getAccessLevelPermissions(access.access_level).forEach(p => allPermissions.add(p));
          access.custom_permissions?.forEach(p => allPermissions.add(p));
        });

        setPermissions([...allPermissions]);
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, []);

  const can = useCallback((permission) => {
    return hasPermission(permissions, permission);
  }, [permissions]);

  const canAny = useCallback((requiredPermissions) => {
    return hasAnyPermission(permissions, requiredPermissions);
  }, [permissions]);

  const canAll = useCallback((requiredPermissions) => {
    return hasAllPermissions(permissions, requiredPermissions);
  }, [permissions]);

  const canAccessProject = useCallback((projectId, requiredLevel = 'view') => {
    if (permissions.includes('*')) return true;
    
    const access = projectAccess.find(a => a.project_id === projectId);
    if (!access) return false;

    const levelHierarchy = ['none', 'view', 'contribute', 'manage', 'admin'];
    const userLevel = levelHierarchy.indexOf(access.access_level);
    const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);
    
    return userLevel >= requiredLevelIndex;
  }, [permissions, projectAccess]);

  const isAdmin = user?.role === 'admin';

  return {
    user,
    permissions,
    roles,
    projectAccess,
    loading,
    can,
    canAny,
    canAll,
    canAccessProject,
    isAdmin,
  };
}