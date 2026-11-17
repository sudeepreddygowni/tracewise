import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './store/useProjectStore';
import { AuthProvider } from './store/useAuthStore';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { StudioPage } from './pages/StudioPage';
import { ComparePage } from './pages/ComparePage';
import { BuildGuidePage } from './pages/BuildGuidePage';
import { PitchLabPage } from './pages/PitchLabPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CommunityPage } from './pages/CommunityPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { LearnPage } from './pages/LearnPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ProjectProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Layout Routes (Persistent Navbar and ScrollManager) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/community/post/:postId" element={<PostDetailPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:conversationId" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:handle" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Dedicated Workspace Routes (Fullscreen engineering canvases) */}
            <Route path="/app" element={<DashboardPage />} />
            <Route path="/app/studio/:projectId" element={<StudioPage />} />
            <Route path="/app/compare/:projectId" element={<ComparePage />} />
            <Route path="/app/build/:projectId" element={<BuildGuidePage />} />
            <Route path="/app/pitch/:projectId" element={<PitchLabPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ProjectProvider>
  );
}
