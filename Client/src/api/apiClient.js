const API_BASE = 'http://localhost:5001/api';
const USE_MOCK_DATA = false; // Set to false when Express backend is ready

// --- MOCK DATABASE SCHEMAS ALIGNED WITH GITHUB ENTITIES ---
let MOCK_DB = {
  users: [
    { id: 'u1', full_name: 'Admin User', email: 'admin@example.com', role_ids: ['r1'] }, // Correctly assign role ID
    { id: 'u2', full_name: 'John Developer', email: 'john@example.com' },
    { id: 'u3', full_name: 'Sarah Designer', email: 'sarah@example.com' }
  ],
  departments: [
    { id: 'd1', name: 'Engineering' },
    { id: 'd2', name: 'Art & Design' }
  ],
  projects: [
    { 
      id: 'p1', name: 'Tinyverse', code: 'TVRSE', description: 'Top-down puzzle game', 
      status: 'production', priority: 'high', project_type: 'game', lead_id: 'u1', 
      department_id: 'd1', team_member_ids: ['u1', 'u2', 'u3'], start_date: '2026-01-01', 
      target_date: '2026-12-31', git_repos: []
    }
  ],
  milestones: [
    { id: 'm1', name: 'Alpha Release', project_id: 'p1', description: 'Core loop playable',start_date: '2026-03-01', due_date: '2026-06-01', status: 'pending', deliverables: ['Build v0.1'] }
  ],
  sprints: [
    { id: 's1', name: 'Sprint 1 - Foundation', project_id: 'p1', goal: 'Setup player movement', start_date: '2026-03-01', end_date: '2026-03-14', status: 'active', velocity: 0, capacity: 40 }
  ],
  tasks: [
    { 
      id: 't1', title: 'Setup Authentication API', description: 'Implement JWT auth', 
      project_id: 'p1', sprint_id: 's1', milestone_id: 'm1', status: 'in_progress', 
      priority: 'high', task_type: 'feature', assignee_id: 'u2', reporter_id: 'u1', 
      estimated_hours: 8, logged_hours: 4, start_date: '2026-03-06', due_date: '2026-03-10', parent_task_id: 't3',
      labels: ['backend', 'security'], git_branch: 'feat/auth', git_commits: [], order: 1
    },
    { 
      id: 't2', title: 'Player Movement Controller', description: 'C# Unity movement script', 
      project_id: 'p1', sprint_id: 's1', status: 'todo', priority: 'critical', 
      task_type: 'task', assignee_id: 'u2', reporter_id: 'u1', estimated_hours: 12, 
      logged_hours: 0, start_date: '2026-03-11', due_date: '2026-03-15', parent_task_id: 't3', labels: ['unity', 'core'], order: 2
    },
    {
      id: 't3', title: 'Game Epic', description: 'All game tasks', 
      project_id: 'p1', status: 'in_progress', priority: 'medium', 
      task_type: 'epic', estimated_hours: 100, logged_hours: 4, parent_task_id: null
    }
  ],
  taskDependencies: [
    { task_id: 't2', depends_on_task_id: 't1', dependency_type: 'finish_to_start' }
  ],
  timeLogs: [
    { id: 'log1', task_id: 't1', project_id: 'p1', user_id: 'u2', hours: 4, date: '2026-03-05', description: 'Initial setup of JWT tokens', billable: true, applied_hourly_rate: 85 }
  ],
  resourceProfiles: [
    { 
      id: 'rp1', user_id: 'u2', title: 'Unity Developer', skills: [{name: 'C#', level: 'advanced'}], 
      availability_hours_per_week: 40, department_id: 'd1', cost_per_hour: 85, status: 'available' 
    }
  ],
  repositories: [
    { id: 'repo1', name: 'tinyverse-client', full_name: 'troller2705/tinyverse-client', integration_id: 'git1', project_id: 'p1', url: 'https://github.com', default_branch: 'main', is_private: true, language: 'C#' }
  ],
  budgets: [
    { id: 'b1', name: 'Q1 Development', fiscal_year: 2026, project_id: 'p1', department_id: 'd1', total_amount: 5000000, status: 'active' }
  ],
  budgetCategories: [
    { id: 'c1', name: 'Infrastructure', code: 'INFRA' },
    { id: 'c2', name: 'Contractors', code: 'LABOR' }
  ],
  expenses: [
    { id: 'e1', description: 'AWS Hosting', amount: 1500, budget_id: 'b1', category_id: 'c1', project_id: 'p1', vendor: 'Amazon', date: '2026-03-01', status: 'paid', payment_method: 'credit_card' }
  ],
  roles: [
    { id: 'r1', name: 'Admin', code: 'admin', permission_ids: ['perm1', 'perm2'] }
  ],
  gitIntegrations: [
    { id: 'git1', name: 'GitHub Sync', provider: 'github' }
  ],
  resourceForecasts: [
    { id: 'rf1', project_id: 'p1', role_id: 'r1', required_hours: 40, start_date: '2026-04-01', end_date: '2026-04-30', status: 'open' }
  ],
  savedReports: [
    { id: 'sr1', name: 'Weekly Progress', description: 'Weekly dev sync', report_type: 'project_progress', schedule: 'weekly', is_pinned: true, email_recipients: ['admin@example.com'] }
  ],
  ldapGroups: [
    { id: 'g1', name: 'Developers', cn: 'cn=developers', group_type: 'department', status: 'active', member_ids: ['u2'] }
  ],
  permissions: [
    { id: 'perm1', name: 'Create Tasks', code: 'task.create', category: 'task', description: 'Allows creating new tasks' },
    { id: 'perm2', name: 'View Financials', code: 'finance.view', category: 'finance', description: 'Allows viewing budget and spend metrics' }
  ],
  projectAccess: [
    { id: 'pa1', project_id: 'p1', user_id: 'u2', access_level: 'contribute' }
  ],
  systemSettings: [
    { id: 'set1', key: 'MAINTENANCE_MODE', value: 'false', category: 'general', is_secret: false }
  ],
  auditLogs: [
    { id: 'al1', action: 'user_login', entity_type: 'User', entity_id: 'u1', user_id: 'u1', created_date: new Date().toISOString(), ip_address: '192.168.1.1' }
  ],
  workflowRules: [
    { id: 'wr1', name: 'Auto-Assign QA', description: 'Assign QA when status is ready_for_testing', is_active: true, trigger_event: 'status_change', trigger_condition: { to_status: 'ready_for_testing' }, action_type: 'assign_to_user', action_config: { user_id: 'u1' }, execution_count: 5 }
  ],
  approvalRequests: [
    { id: 'ar1', task_id: 't1', title: 'Approve Architecture', status: 'pending', requester_id: 'u2', approver_ids: ['u1'], created_date: '2026-04-01' }
  ],
  projectTemplates: [
    { id: 'pt1', name: 'Standard Software Dev', description: 'Agile dev setup', project_type: 'software', tags: ['agile', 'dev'], tasks: [{ ref_id: 'pt_t1', title: 'Setup Repo', task_type: 'task', estimated_hours: 2, labels: ['infra'] }], dependencies: [] }
  ]
};

// --- MOCK INTERCEPTOR ---
async function mockFetch(endpoint, options) {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network latency

  const method = options.method || 'GET';
  // Parses /api/collection-name or /api/collection-name/id
  const collectionMatch = endpoint.match(/^\/([a-zA-Z-]+)(?:\/(.+))?$/);
  
  if (!collectionMatch) throw new Error('Mock API: Invalid endpoint');
  
  // Convert kebab-case to camelCase (e.g., 'time-logs' -> 'timeLogs')
  const collectionName = collectionMatch[1].replace(/-([a-z])/g, g => g[1].toUpperCase());
  const id = collectionMatch[2];

  if (endpoint === '/auth/me') return MOCK_DB.users[0]; // Return the user object directly
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
    return null;
  }
}

// --- ACTUAL FETCH LOGIC ---
async function fetchAPI(endpoint, options = {}) {
  if (USE_MOCK_DATA) return mockFetch(endpoint, options);

  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
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

// --- DB EXPORTS CONFIGURED FOR REACT QUERY ---
// Factory function to quickly generate standard CRUD exports
const createEndpoints = (path) => ({
  list: () => fetchAPI(path),
  get: (id) => fetchAPI(`${path}/${id}`),
  create: (data) => fetchAPI(path, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`${path}/${id}`, { method: 'DELETE' }),
});

export const db = {
  auth: {
    me: () => fetchAPI('/auth/me'),
    login: (credentials) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  },
  users: createEndpoints('/users'),
  projects: createEndpoints('/projects'),
  tasks: createEndpoints('/tasks'),
  taskDependencies: createEndpoints('/task-dependencies'),
  milestones: createEndpoints('/milestones'),
  sprints: createEndpoints('/sprints'),
  timeLogs: createEndpoints('/time-logs'),
  resourceProfiles: createEndpoints('/resource-profiles'),
  repositories: createEndpoints('/repositories'),
  gitIntegrations: createEndpoints('/git-integrations'),
  budgets: createEndpoints('/budgets'),
  budgetCategories: createEndpoints('/budget-categories'),
  expenses: createEndpoints('/expenses'),
  departments: createEndpoints('/departments'),
  roles: createEndpoints('/roles'),
  resourceForecasts: createEndpoints('/resource-forecasts'),
  savedReports: createEndpoints('/saved-reports'),
  ldapGroups: createEndpoints('/ldap-groups'),
  permissions: createEndpoints('/permissions'),
  projectAccess: createEndpoints('/project-access'),
  systemSettings: createEndpoints('/system-settings'),
  auditLogs: createEndpoints('/audit-logs'),
  workflowRules: createEndpoints('/workflow-rules'),
  approvalRequests: createEndpoints('/approval-requests'),
  projectTemplates: createEndpoints('/project-templates'),
};