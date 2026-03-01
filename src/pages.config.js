/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Budget from './pages/Budget';
import GitIntegrations from './pages/GitIntegrations';
import AccessControl from './pages/AccessControl';
import Admin from './pages/Admin';
import ProjectDetail from './pages/ProjectDetail';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Resources from './pages/Resources';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "Tasks": Tasks,
    "Team": Team,
    "Budget": Budget,
    "GitIntegrations": GitIntegrations,
    "AccessControl": AccessControl,
    "Admin": Admin,
    "ProjectDetail": ProjectDetail,
    "Settings": Settings,
    "Reports": Reports,
    "Resources": Resources,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};