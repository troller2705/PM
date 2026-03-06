import AccessControl from './pages/AccessControl';
import Admin from './pages/Admin';
import Budget from './pages/Budget';
import Company from './pages/Company';
import Dashboard from './pages/Dashboard';
import GitIntegrations from './pages/GitIntegrations';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import Resources from './pages/Resources';
import ScenarioPlanner from './pages/ScenarioPlanner';
import Settings from './pages/Settings';
import TaskDetail from './pages/TaskDetail';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Templates from './pages/Templates';
import Workflows from './pages/Workflows';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccessControl": AccessControl,
    "Admin": Admin,
    "Budget": Budget,
    "Company": Company,
    "Dashboard": Dashboard,
    "GitIntegrations": GitIntegrations,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "Reports": Reports,
    "Resources": Resources,
    "ScenarioPlanner": ScenarioPlanner,
    "Settings": Settings,
    "TaskDetail": TaskDetail,
    "Tasks": Tasks,
    "Team": Team,
    "Templates": Templates,
    "Workflows": Workflows,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};