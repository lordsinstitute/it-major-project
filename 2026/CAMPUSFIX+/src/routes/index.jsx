import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import RoleRoute from './RoleRoute';
import { ROLES } from '../constants/roles';

// Public Marketing & Information Routes
import Home from '../pages/public/Home';
import Features from '../pages/public/Features';
import HowItWorks from '../pages/public/HowItWorks';
import About from '../pages/public/About';
import Technology from '../pages/public/Technology';
import Roadmap from '../pages/public/Roadmap';
import ModulesOverview from '../pages/modules/ModulesOverview';
import ModulePage from '../pages/modules/ModulePage';
import Research from '../pages/public/Research';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import AccessDenied from '../pages/public/AccessDenied';
import NotFound from '../pages/public/NotFound';
import DesignSystem from '../pages/system/DesignSystem';

// Student Portal Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentReport from '../pages/student/StudentReport';
import StudentComplaints from '../pages/student/StudentComplaints';
import StudentComplaintDetail from '../pages/student/StudentComplaintDetail';
import StudentNotificationsPlaceholder from '../pages/student/StudentNotificationsPlaceholder';
import StudentProfilePlaceholder from '../pages/student/StudentProfilePlaceholder';
import StudentSettingsPlaceholder from '../pages/student/StudentSettingsPlaceholder';

// Admin Portal Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminComplaints from '../pages/admin/AdminComplaints';
import AdminComplaintDetail from '../pages/admin/AdminComplaintDetail';
import AdminAssignments from '../pages/admin/AdminAssignments';
import AdminPriorities from '../pages/admin/AdminPriorities';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminHistory from '../pages/admin/AdminHistory';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminNotificationsPlaceholder from '../pages/admin/AdminNotificationsPlaceholder';
import AdminSettingsPlaceholder from '../pages/admin/AdminSettingsPlaceholder';

// Staff Portal Pages
import StaffDashboard from '../pages/staff/StaffDashboard';
import StaffTasks from '../pages/staff/StaffTasks';
import StaffTaskDetail from '../pages/staff/StaffTaskDetail';
import StaffHistory from '../pages/staff/StaffHistory';
import StaffNotificationsPlaceholder from '../pages/staff/StaffNotificationsPlaceholder';
import StaffProfilePlaceholder from '../pages/staff/StaffProfilePlaceholder';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages with PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/modules" element={<ModulesOverview />} />
        <Route path="/modules/:slug" element={<ModulePage />} />
        <Route path="/research" element={<Research />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/technology" element={<Technology />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />
      </Route>

      {/* Guarded Student Portal in DashboardLayout */}
      <Route element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route path="/student" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="report" element={<StudentReport />} />
          <Route path="complaints" element={<StudentComplaints />} />
          <Route path="complaints/:id" element={<StudentComplaintDetail />} />
          <Route path="notifications" element={<StudentNotificationsPlaceholder />} />
          <Route path="profile" element={<StudentProfilePlaceholder />} />
          <Route path="settings" element={<StudentSettingsPlaceholder />} />
        </Route>
      </Route>

      {/* Guarded Admin Portal in DashboardLayout */}
      <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="complaints/:id" element={<AdminComplaintDetail />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="priorities" element={<AdminPriorities />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="history" element={<AdminHistory />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="notifications" element={<AdminNotificationsPlaceholder />} />
          <Route path="settings" element={<AdminSettingsPlaceholder />} />
        </Route>
      </Route>

      {/* Guarded Staff Portal in DashboardLayout */}
      <Route element={<RoleRoute allowedRoles={[ROLES.STAFF]} />}>
        <Route path="/staff" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="tasks" element={<StaffTasks />} />
          <Route path="tasks/:id" element={<StaffTaskDetail />} />
          <Route path="history" element={<StaffHistory />} />
          <Route path="notifications" element={<StaffNotificationsPlaceholder />} />
          <Route path="profile" element={<StaffProfilePlaceholder />} />
        </Route>
      </Route>

      {/* Living Style Guide */}
      <Route path="/design-system" element={<DesignSystem />} />

      {/* 404 Catch-All */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
