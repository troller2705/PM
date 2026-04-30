// Permission utilities for granular access control

export const PERMISSIONS = {
    // Project permissions
    PROJECT_VIEW: 'project.view',
    PROJECT_CREATE: 'project.create',
    PROJECT_UPDATE: 'project.update',
    PROJECT_DELETE: 'project.delete',
    PROJECT_MANAGE_ACCESS: 'project.manage_access',
    
    // Task permissions
    TASK_VIEW: 'task.view',
    TASK_CREATE: 'task.create',
    TASK_UPDATE: 'task.update',
    TASK_DELETE: 'task.delete',
    TASK_ASSIGN: 'task.assign',
    
    // Budget permissions
    BUDGET_VIEW: 'budget.view',
    BUDGET_CREATE: 'budget.create',
    BUDGET_UPDATE: 'budget.update',
    BUDGET_DELETE: 'budget.delete',
    BUDGET_APPROVE: 'budget.approve',
    
    // Expense permissions
    EXPENSE_VIEW: 'expense.view',
    EXPENSE_CREATE: 'expense.create',
    EXPENSE_UPDATE: 'expense.update',
    EXPENSE_DELETE: 'expense.delete',
    EXPENSE_APPROVE: 'expense.approve',
    
    // User management
    USER_VIEW: 'user.view',
    USER_CREATE: 'user.create',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    USER_MANAGE_ROLES: 'user.manage_roles',
    
    // Admin permissions
    ADMIN_SETTINGS: 'admin.settings',
    ADMIN_AUDIT_LOG: 'admin.audit_log',
    ADMIN_LDAP: 'admin.ldap',
    ADMIN_GIT: 'admin.git',
    
    // Report permissions
    REPORT_VIEW: 'report.view',
    REPORT_EXPORT: 'report.export',
  };
  
  export const ACCESS_LEVELS = {
    NONE: 'none',
    VIEW: 'view',
    CONTRIBUTE: 'contribute',
    MANAGE: 'manage',
    ADMIN: 'admin',
  };
  
  export const ACCESS_LEVEL_PERMISSIONS = {
    none: [],
    view: [PERMISSIONS.PROJECT_VIEW, PERMISSIONS.TASK_VIEW],
    contribute: [
      PERMISSIONS.PROJECT_VIEW, PERMISSIONS.TASK_VIEW,
      PERMISSIONS.TASK_CREATE, PERMISSIONS.TASK_UPDATE,
    ],
    manage: [
      PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_UPDATE,
      PERMISSIONS.TASK_VIEW, PERMISSIONS.TASK_CREATE, 
      PERMISSIONS.TASK_UPDATE, PERMISSIONS.TASK_DELETE, PERMISSIONS.TASK_ASSIGN,
    ],
    admin: Object.values(PERMISSIONS).filter(p => p.startsWith('project.') || p.startsWith('task.')),
  };
  
  export function hasPermission(userPermissions, requiredPermission) {
    if (!userPermissions || !Array.isArray(userPermissions)) return false;
    return userPermissions.includes(requiredPermission) || userPermissions.includes('*');
  }
  
  export function hasAnyPermission(userPermissions, requiredPermissions) {
    return requiredPermissions.some(p => hasPermission(userPermissions, p));
  }
  
  export function hasAllPermissions(userPermissions, requiredPermissions) {
    return requiredPermissions.every(p => hasPermission(userPermissions, p));
  }
  
  export function getAccessLevelPermissions(accessLevel) {
    return ACCESS_LEVEL_PERMISSIONS[accessLevel] || [];
  }