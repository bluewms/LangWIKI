import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ShellLayout from './components/Layout/ShellLayout';
import DashboardPage from './pages/langwiki/Dashboard';
import QueryPage from './pages/langwiki/Query';
import EntityPage from './pages/langwiki/Entity';
import WorkspacePage from './pages/langwiki/Workspace';
import IngestPage from './pages/langwiki/Ingest';
import SchemaPage from './pages/langwiki/Schema';
import ProfilePage from './pages/langwiki/Profile';
import WorkspaceSettingsPage from './pages/langwiki/WorkspaceSettings';
import WorkspaceDocPage from './pages/langwiki/WorkspaceDoc';
import UserSettingsPage from './pages/langwiki/UserSettings';

export default function App() {
  return (
    <ShellLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/langwiki/dashboard" replace />} />

        <Route path="/langwiki/dashboard" element={<DashboardPage />} />
        <Route path="/langwiki/query" element={<QueryPage />} />
        <Route path="/langwiki/entity/:name" element={<EntityPage />} />

        <Route path="/langwiki/workspaces" element={<WorkspacePage />} />
        <Route path="/langwiki/workspace/:id" element={<Navigate to="query" replace />} />
        <Route path="/langwiki/workspace/:id/query" element={<QueryPage />} />
        <Route path="/langwiki/workspace/:id/doc" element={<WorkspaceDocPage />} />
        <Route path="/langwiki/workspace/:id/settings/:tab" element={<WorkspaceSettingsPage />} />
        <Route path="/langwiki/workspace/:id/settings" element={<Navigate to="manage" replace />} />

        <Route path="/langwiki/ingest" element={<IngestPage />} />
        <Route path="/langwiki/schema" element={<SchemaPage />} />
        <Route path="/langwiki/profile" element={<ProfilePage />} />

        <Route path="/langwiki/me/:tab" element={<UserSettingsPage />} />
        <Route path="/langwiki/me" element={<Navigate to="basic" replace />} />

        <Route path="*" element={<Navigate to="/langwiki/dashboard" replace />} />
      </Routes>
    </ShellLayout>
  );
}
