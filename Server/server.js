import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import milestoneRoutes from './routes/milestoneRoutes.js';
import sprintRoutes from './routes/sprintRoutes.js';
import taskDependencyRoutes from './routes/taskDependencyRoutes.js';
import resourceProfileRoutes from './routes/resourceProfileRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import projectAccessRoutes from './routes/projectAccessRoutes.js';
import systemSettingsRoutes from './routes/systemSettingsRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import ldapGroupRoutes from './routes/ldapGroupRoutes.js';
import workflowRuleRoutes from './routes/workflowRuleRoutes.js';
import approvalRequestRoutes from './routes/approvalRequestRoutes.js';
import projectTemplateRoutes from './routes/projectTemplateRoutes.js'; // Import template routes
import webhookRoutes from './routes/webhookRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB().catch(console.error);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('DevOps API Server is running!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/task-dependencies', taskDependencyRoutes);
app.use('/api/resource-profiles', resourceProfileRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/project-access', projectAccessRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/ldap-groups', ldapGroupRoutes);
app.use('/api/workflow-rules', workflowRuleRoutes);
app.use('/api/approval-requests', approvalRequestRoutes);
app.use('/api/project-templates', projectTemplateRoutes); // Use template routes
app.use('/api/webhooks', webhookRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});