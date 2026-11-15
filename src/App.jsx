import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './store/useProjectStore';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { StudioPage } from './pages/StudioPage';
import { ComparePage } from './pages/ComparePage';
import { BuildGuidePage } from './pages/BuildGuidePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { LearnPage } from './pages/LearnPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/studio/:projectId" element={<StudioPage />} />
          <Route path="/app/compare/:projectId" element={<ComparePage />} />
          <Route path="/app/build/:projectId" element={<BuildGuidePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}
