import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './store/useProjectStore';
import { AuthProvider } from './store/useAuthStore';
import { SimulationProvider } from './store/useSimulationStore';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { Analytics } from './services/analyticsService';

// Route-level code splitting for heavy workspaces and secondary application views
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const StudioPage = lazy(() => import('./pages/StudioPage').then(m => ({ default: m.StudioPage })));
const ComparePage = lazy(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })));
const BuildGuidePage = lazy(() => import('./pages/BuildGuidePage').then(m => ({ default: m.BuildGuidePage })));
const PitchLabPage = lazy(() => import('./pages/PitchLabPage').then(m => ({ default: m.PitchLabPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage').then(m => ({ default: m.PostDetailPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage').then(m => ({ default: m.EditProfilePage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const LearnPage = lazy(() => import('./pages/LearnPage').then(m => ({ default: m.LearnPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const NewExistingProjectPage = lazy(() => import('./pages/NewExistingProjectPage').then(m => ({ default: m.NewExistingProjectPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const PhotoReconstructionPage = lazy(() => import('./pages/PhotoReconstructionPage').then(m => ({ default: m.PhotoReconstructionPage })));

function RouteLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--tw-bg)',
        width: '100%'
      }}
      aria-label="Loading page"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid rgba(45, 197, 233, 0.2)',
            borderTopColor: 'var(--tw-brand)',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite'
          }}
        />
        <span style={{ fontSize: '0.84rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
          Loading Tracewise...
        </span>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    Analytics.appOpened();
  }, []);

  return (
    <ProjectProvider>
      <AuthProvider>
        <SimulationProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteLoadingFallback />}>
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
                <Route path="/app/reconstruct" element={<PhotoReconstructionPage />} />
                <Route path="/app/projects/new-existing" element={<NewExistingProjectPage />} />
                <Route path="/app/projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="/app/studio" element={<StudioPage />} />
                <Route path="/app/studio/:projectId" element={<StudioPage />} />
                <Route path="/app/compare/:projectId" element={<ComparePage />} />
                <Route path="/app/build/:projectId" element={<BuildGuidePage />} />
                <Route path="/app/pitch" element={<PitchLabPage />} />
                <Route path="/app/pitch/:projectId" element={<PitchLabPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SimulationProvider>
      </AuthProvider>
    </ProjectProvider>
  );
}
