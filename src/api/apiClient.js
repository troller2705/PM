const API_BASE = '/api';
const USE_MOCK_DATA = true; // Set to false when your Express backend is ready

// --- MOCK DATABASE ---
let MOCK_DB = {
  users: [
    { id: 'u1', full_name: 'Admin User', email: 'admin@example.com' },
    { id: 'u2', full_name: 'John Developer', email: 'john@example.com' }
  ],
  projects: [
    { id: 'p1', name: 'Frontend Migration' },
    { id: 'p2', name: 'Backend API V2' }
  ],
  roles: [
    { id: 'r1', name: 'Lead Developer', code: 'lead_dev', hierarchy_level: 10, parent_role_id: null, permission_ids: ['task.create', 'task.update', 'project.view'] },
    { id: 'r2', name: 'Developer', code: 'dev', hierarchy_level: 5, parent_role_id: 'r1', permission_ids: ['task.create', 'task.update'] }
  ],
  permissions: [
    { id: 'perm1', name: 'Create Task', code: 'task.create', category: 'task' },
    { id: 'perm2', name: 'Update Task', code: 'task.update', category: 'task' },
    { id: 'perm3', name: 'View Project', code: 'project.view', category: 'project' }
  ],
  projectAccess: [
    { id: 'pa1', project_id: 'p1', user_id: 'u2', access_level: 'contribute' }
  ],
  ldapGroups: [
    { id: 'g1', name: 'Engineering' },
    { id: 'g2', name: 'Contractors' }
  ],
  tasks: [
    { 
        id: 't1', title: 'Setup Authentication API', description: 'Implement JWT auth', 
        project_id: 'p2', status: 'in_progress', task_type: 'feature', priority: 'high', 
        assignee_id: 'u2', due_date: '2026-03-10', estimated_hours: 8,
        pull_requests: [{ id: 'pr1', title: 'feat/add-auth-flow', url: '#', status: 'open' }]
    },
    { 
        id: 't2', title: 'Fix Navigation Bug', description: 'Menu overlaps on mobile', 
        project_id: 'p1', status: 'todo', task_type: 'bug', priority: 'medium', 
        assignee_id: null, due_date: null, estimated_hours: 2,
        pull_requests: []
    },
    { 
        id: 't3', title: 'Phase 1: Foundation', project_id: 'p1', 
        task_type: 'epic', start: new Date(2026, 2, 1), end: new Date(2026, 2, 15), progress: 100 
    },
    { 
        id: 't4', title: 'API Design', project_id: 'p1', parent: 't3',
        task_type: 'task', start: new Date(2026, 2, 1), duration: 5, progress: 100 
    },
    { 
        id: 't5', title: 'Database Schema', project_id: 'p1', parent: 't3',
        task_type: 'task', start: new Date(2026, 2, 6), duration: 4, progress: 50,
        links: [{ source: 't4', type: '0' }] // Type 0 = Finish-to-Start (Depends on API Design)
    },
    { 
        id: 't6', title: 'Critical Feature Implementation', project_id: 'p1',
        task_type: 'feature', start: new Date(2026, 2, 10), duration: 10, progress: 0,
        links: [{ source: 't5', type: '0' }] // Depends on DB Schema
    }
  ],
  gitIntegrations: [
    { id: 'gi1', name: 'Company GitHub', provider: 'github', organization: 'my-org', status: 'active', settings: { auto_link_commits: true }, last_sync: new Date().toISOString() }
  ],
  repositories: [
    { id: 'repo1', name: 'frontend-app', full_name: 'my-org/frontend-app', integration_id: 'gi1', project_id: 'p1', default_branch: 'main', is_private: true, language: 'JavaScript' },
    { id: 'repo2', name: 'backend-services', full_name: 'my-org/backend-services', integration_id: 'gi1', project_id: 'p2', default_branch: 'develop', is_private: true, language: 'Node' }
  ],
  budgets: [
    { id: 'b1', name: 'Q1 Platform Dev', fiscal_year: 2026, total_amount: 150000, status: 'active' }
  ],
  expenses: [
    { id: 'e1', description: 'AWS Hosting', amount: 1500, status: 'paid', date: '2026-03-01', is_billable: false, category_id: 'c1' },
    { id: 'e2', description: 'Contractor Development', amount: 4500, status: 'paid', date: '2026-03-05', is_billable: true, category_id: 'c2' }
  ],
  budgetCategories: [
    { id: 'c1', name: 'Infrastructure', code: 'INFRA', color: '#3b82f6' },
    { id: 'c2', name: 'Labor', code: 'LABOR', color: '#10b981' }
  ],
  departments: [
    { id: 'd1', name: 'Engineering' }
  ],
  rateCards: [
    { id: 'rc1', role_id: 'r1', hourly_rate: 150, currency: 'USD' },
    { id: 'rc2', role_id: 'r2', hourly_rate: 85, currency: 'USD' }
  ],
};

// --- MOCK INTERCEPTOR ---
async function mockFetch(endpoint, options) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const method = options.method || 'GET';
  const collectionMatch = endpoint.match(/^\/([a-zA-Z-]+)(?:\/(.+))?$/);
  
  if (!collectionMatch) throw new Error('Mock API: Invalid endpoint');
  
  // Convert kebab-case to camelCase for DB lookup (e.g., 'git-integrations' -> 'gitIntegrations')
  const collectionName = collectionMatch[1].replace(/-([a-z])/g, g => g[1].toUpperCase());
  const id = collectionMatch[2];

  // Special Auth Route
  if (endpoint === '/auth/me') return { user: MOCK_DB.users[0] };
  if (endpoint === '/auth/login') return { token: 'mock-token-123', user: MOCK_DB.users[0] };

  const collection = MOCK_DB[collectionName];
  if (!collection) throw new Error(`Mock API: Collection ${collectionName} not found`);

  if (method === 'GET') {
    return id ? collection.find(item => item.id === id) : collection;
  }
  
  if (method === 'POST') {
    const newItem = { id: Math.random().toString(36).substring(7), ...JSON.parse(options.body) };
    MOCK_DB[collectionName] = [...collection, newItem];
    return newItem;
  }
  
  if (method === 'PUT') {
    const updateData = JSON.parse(options.body);
    MOCK_DB[collectionName] = collection.map(item => item.id === id ? { ...item, ...updateData } : item);
    return MOCK_DB[collectionName].find(item => item.id === id);
  }
  
  if (method === 'DELETE') {
    MOCK_DB[collectionName] = collection.filter(item => item.id !== id);
    return null; // Equivalent to 204 No Content
  }
}

// --- ACTUAL FETCH LOGIC ---
async function fetchAPI(endpoint, options = {}) {
  if (USE_MOCK_DATA) {
    return mockFetch(endpoint, options);
  }

  const headers = { 
    'Content-Type': 'application/json', 
    ...(options.headers || {}) 
  };
  
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(errorBody || 'API request failed');
  }
  
  if (res.status === 204) return null;
  return res.json();
}

// --- DB EXPORTS ---
export const db = {
  auth: {
    me: () => fetchAPI('/auth/me'),
    login: (credentials) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  },
  roles: {
    list: () => fetchAPI('/roles'),
    create: (data) => fetchAPI('/roles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/roles/${id}`, { method: 'DELETE' }),
  },
  permissions: {
    list: () => fetchAPI('/permissions'),
    create: (data) => fetchAPI('/permissions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/permissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/permissions/${id}`, { method: 'DELETE' }),
  },
  projectAccess: {
    list: () => fetchAPI('/project-access'),
    create: (data) => fetchAPI('/project-access', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/project-access/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/project-access/${id}`, { method: 'DELETE' }),
  },
  projects: { list: () => fetchAPI('/projects') },
  users: { list: () => fetchAPI('/users') },
  ldapGroups: { list: () => fetchAPI('/ldap-groups') },
  tasks: {
    list: () => fetchAPI('/tasks'),
    create: (data) => fetchAPI('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/tasks/${id}`, { method: 'DELETE' }),
  },
  gitIntegrations: {
    list: () => fetchAPI('/git-integrations'),
    create: (data) => fetchAPI('/git-integrations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/git-integrations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/git-integrations/${id}`, { method: 'DELETE' }),
  },
  repositories: {
    list: () => fetchAPI('/repositories'),
    create: (data) => fetchAPI('/repositories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/repositories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/repositories/${id}`, { method: 'DELETE' }),
  },
  budgets: {
    list: () => fetchAPI('/budgets'),
    create: (data) => fetchAPI('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/budgets/${id}`, { method: 'DELETE' }),
  },
  expenses: {
    list: () => fetchAPI('/expenses'),
    create: (data) => fetchAPI('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/expenses/${id}`, { method: 'DELETE' }),
  },
  budgetCategories: {
    list: () => fetchAPI('/budget-categories'),
    create: (data) => fetchAPI('/budget-categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/budget-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/budget-categories/${id}`, { method: 'DELETE' }),
  },
  rateCards: {
    list: () => fetchAPI('/rate-cards'),
    create: (data) => fetchAPI('/rate-cards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/rate-cards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/rate-cards/${id}`, { method: 'DELETE' }),
  },
  departments: { list: () => fetchAPI('/departments') },
};