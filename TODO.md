# Enterprise Engineering PM Suite - TODO List

This document tracks the progress of the features required for the Enterprise Project Management Suite.

## ✅ Completed / Partially Implemented

* **Governance**: Role Creation, Granular Permissions (Global/Project), Audit Logs, LDAP Configuration UI, Resource Rate Cards.
* **Engineering**: Git Integration UI (Multi-provider), Git Webhook Simulator, Commit Activity Heatmap (Mocked).
* **Financials**: Budget Baselines, Real-Time Burn Rate, Resource Rate Cards, Billable Time Logs.
* **Core PM**: Multiple Views (Gantt, Spreadsheet, List), Task Dependencies, Subtasks (Hierarchical), Custom Workflows & Rules, Milestone Tracking, Template Library, Time Tracking.
* **Automation**: Rule-Based Automations (Trigger/Action).

---

## ⏳ Pending / Remaining Features

### 1. Governance & Identity

- [ ]  Single Sign-On (SSO) Support (SAML 2.0 / OIDC)
- [ ]  External Stakeholder / Guest Roles
- [ ]  Multi-Factor Authentication (MFA)
- [ ]  Just-In-Time (JIT) Provisioning
- [x]  Role-Based Dashboard Views (Hide widgets based on RBAC)
- [ ]  Impersonation Mode for Admins
- [ ]  API Key Scoping
- [ ]  Auto-Cleanup for missing LDAP users

### 2. Engineering & Git Integration

- [ ]  Repository Mirroring (View code/commits in PM suite)
- [ ]  Pull/Merge Request Tracking & Status
- [ ]  Inline Code Snippets in Task Descriptions
- [ ]  Branch Management (Create branches from tasks)
- [ ]  Code Review Workflow Integration
- [ ]  Deployment Tracking (Dev/Staging/Prod environments)
- [ ]  Vulnerability Mapping (Link Git security alerts to PM tasks)
- [ ]  Release Notes Generator
- [ ]  Dependency Graph Visualization
- [ ]  CI/CD Pipeline Visibility
- [ ]  Git LFS Support

### 3. Financial & Budget Management

- []  Expense Logging UI (File attachments, categorizations)
- [ ]  Cost-to-Complete (CTC) Forecasting
- [ ]  Over-Budget Alerts (Notifications at 50%, 75%, 90%)
- [ ]  Multi-Currency Support (Live exchange rates)
- [ ]  Fixed-Price vs. T&M Billing Models
- [ ]  Profitability & ROI Analysis View
- [ ]  Purchase Order (PO) Tracking
- [ ]  Invoicing Engine (Generate PDFs based on logged time)
- [ ]  Labor Cost Capitalization (CapEx/OpEx Tax Categorization)
- [ ]  Financial "What-If" Scenario Logic
- [ ]  ERP/Accounting Integration (QuickBooks, Xero)

### 4. Core Project & Task Management

- [ ]  Critical Path Analysis on Gantt Chart
- [ ]  Automated Recurring Tasks
- [ ]  Rich Text Editing (Markdown/WYSIWYG)
- [ ]  File Versioning & Document Storage
- [ ]  Global Search (Command-K functionality)
- [ ]  Bulk / Mass Actions Execution

### 5. Collaboration & Reporting

- [ ]  Threaded Comments & @Mentions
- [ ]  Project Wiki / Knowledge Base
- [ ]  Real-Time Notifications (Push, Email, In-App)
- [ ]  Custom Dashboards (Drag-and-drop widgets)
- [ ]  Automated Stakeholder Reports (PDF Summaries via Email)
- [ ]  Time-Off Management (Sync with resource availability)
- [ ]  Risk Register
- [ ]  Meeting Management (Link notes to tasks)
- [ ]  Public Roadmap Links
- [ ]  AI Summarization (Daily Standups)
- [ ]  Activity Stream Feed
- [ ]  Email-to-Task Creation
- [ ]  Proofing & Annotations on Images/PDFs

### 6. Advanced Automation & Extensibility

- [ ]  Outbound Webhooks
- [ ]  Full REST API implementation
- [ ]  Custom Fields (Text, Dropdown, Formula)
- [ ]  SLA Tracking (Response & Resolution times)
- [ ]  Portfolio Management (Group projects)
- [ ]  Intake Form Builder
- [ ]  Universal Data Export (CSV, JSON)
- [ ]  White-Labeling Settings
- [ ]  Dark Mode Toggle UI

### 7. Compliance & Security

- [ ]  Data Residency Controls
- [ ]  SOC2/GDPR Compliance Tools (Data privacy/deletion)
- [ ]  Encrypted Attachments
- [ ]  IP Whitelisting
- [ ]  Strict Session Management (Force logout)
