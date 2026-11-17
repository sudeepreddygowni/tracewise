import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getAllProjects,
  getProjectById,
  saveProject as storageSaveProject,
  deleteProject as storageDeleteProject,
  forkAndSaveProject,
  convertAndSaveProject,
  getPreferences,
  savePreferences as storageSavePreferences
} from '../services/projectStorage';
import {
  createBlankProject,
  createDocumentedPhysicalProject,
  convertPhysicalToEditableProject,
  createObstacleAvoidingCarProject,
  isPhysicalProject,
  hasEditableCircuit,
  generateId
} from '../domain/projectSchema';
import { validateCircuit } from '../domain/circuitRules';
import { compileBuildPlan } from '../domain/projectBuilder/catalogCompiler';
import { planProjectFromPrompt } from '../domain/projectBuilder/projectPlanner';
import { applyProjectModification as applyMod } from '../domain/projectBuilder/projectModifier';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [validation, setValidation] = useState({ overallStatus: 'STRUCTURALLY_VALID', checks: [] });
  const [isSaved, setIsSaved] = useState(true);
  const [preferences, setPreferences] = useState(getPreferences());

  // Undo / Redo history
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  // Load projects on startup
  useEffect(() => {
    const list = getAllProjects();
    setProjects(list);
  }, []);

  // Update theme attribute on root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme || 'light');
  }, [preferences.theme]);

  // Whenever active project changes, re-run validation
  useEffect(() => {
    if (activeProject) {
      if (isPhysicalProject(activeProject)) {
        setValidation({
          overallStatus: 'PHYSICAL_PROJECT_DOCUMENTED',
          checks: [
            { id: 'documentation', pass: Boolean(activeProject.title && activeProject.description), message: 'Project documentation' },
            { id: 'components', pass: (activeProject.componentsList?.length || 0) > 0, message: 'Hardware components listed' },
            { id: 'presentation', pass: Boolean(activeProject.problemSolved || activeProject.workingPrinciple), message: 'Presentation facts available' }
          ]
        });
      } else {
        const res = validateCircuit(activeProject);
        setValidation(res);
      }
    }
  }, [activeProject]);

  const loadProject = useCallback((id) => {
    const proj = getProjectById(id);
    if (proj) {
      setActiveProject(proj);
      historyRef.current = [JSON.parse(JSON.stringify(proj))];
      historyIndexRef.current = 0;
      setIsSaved(true);
      return proj;
    }
    return null;
  }, []);

  const pushHistory = (newProject) => {
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    if (nextHistory.length > 25) nextHistory.shift();
    nextHistory.push(JSON.parse(JSON.stringify(newProject)));
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
  };

  const updateActiveProject = useCallback((updater) => {
    setActiveProject(prev => {
      if (!prev) return prev;
      const updated = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
      pushHistory(withTimestamp);
      setIsSaved(false);
      return withTimestamp;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current];
      setActiveProject(JSON.parse(JSON.stringify(prev)));
      setIsSaved(false);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current];
      setActiveProject(JSON.parse(JSON.stringify(next)));
      setIsSaved(false);
    }
  }, []);

  const commitHistory = useCallback(() => {
    setActiveProject(prev => {
      if (!prev) return prev;
      pushHistory(prev);
      return prev;
    });
  }, []);

  const saveCurrent = useCallback(() => {
    if (!activeProject) return null;
    const saved = storageSaveProject(activeProject);
    setActiveProject(saved);
    setProjects(getAllProjects());
    setIsSaved(true);
    return saved;
  }, [activeProject]);

  const forkActive = useCallback((newTitle) => {
    if (!activeProject) return null;
    const forked = forkAndSaveProject(activeProject.id, newTitle);
    setProjects(getAllProjects());
    setActiveProject(forked);
    historyRef.current = [JSON.parse(JSON.stringify(forked))];
    historyIndexRef.current = 0;
    setIsSaved(true);
    return forked;
  }, [activeProject]);

  const createNewProject = useCallback((title) => {
    const blank = createBlankProject(title);
    storageSaveProject(blank);
    setProjects(getAllProjects());
    setActiveProject(blank);
    historyRef.current = [JSON.parse(JSON.stringify(blank))];
    historyIndexRef.current = 0;
    setIsSaved(true);
    return blank;
  }, []);

  const createPhysicalProject = useCallback((data) => {
    const physicalProj = createDocumentedPhysicalProject(data);
    const saved = storageSaveProject(physicalProj);
    setProjects(getAllProjects());
    setActiveProject(saved);
    historyRef.current = [JSON.parse(JSON.stringify(saved))];
    historyIndexRef.current = 0;
    setIsSaved(true);
    return saved;
  }, []);

  const convertToEditable = useCallback((projectId) => {
    const targetId = projectId || activeProject?.id;
    if (!targetId) return null;
    const converted = convertAndSaveProject(targetId);
    setProjects(getAllProjects());
    if (activeProject?.id === targetId || !activeProject) {
      setActiveProject(converted);
      historyRef.current = [JSON.parse(JSON.stringify(converted))];
      historyIndexRef.current = 0;
    }
    setIsSaved(true);
    return converted;
  }, [activeProject]);

  const updatePhysicalLayout = useCallback((updater) => {
    setActiveProject(prev => {
      if (!prev) return prev;
      const currentLayout = prev.physicalLayout || { enabled: true, chassis: {}, parts: [] };
      const nextLayout = typeof updater === 'function' ? updater(currentLayout) : { ...currentLayout, ...updater };
      const updated = {
        ...prev,
        physicalLayout: nextLayout,
        updatedAt: new Date().toISOString()
      };
      pushHistory(updated);
      setIsSaved(false);
      return updated;
    });
  }, []);

  const remixProject = useCallback((baseProject, customTitle) => {
    if (!baseProject) return null;
    const title = customTitle || `${baseProject.title || baseProject.name || 'Project'} (Remix)`;
    const newId = generateId('proj');
    const remixed = {
      ...baseProject,
      id: newId,
      title,
      name: title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: JSON.parse(JSON.stringify(baseProject.components || [])),
      connections: JSON.parse(JSON.stringify(baseProject.connections || [])),
      code: baseProject.code || '',
      version: { id: 'v1.0', label: 'Remix v1.0' }
    };
    storageSaveProject(remixed);
    setProjects(getAllProjects());
    setActiveProject(remixed);
    historyRef.current = [JSON.parse(JSON.stringify(remixed))];
    historyIndexRef.current = 0;
    setIsSaved(true);
    return remixed;
  }, []);

  const buildProjectFromPlan = useCallback((buildPlan) => {
    const compiled = compileBuildPlan(buildPlan);
    const saved = storageSaveProject(compiled.project);
    setProjects(getAllProjects());
    setActiveProject(saved);
    historyRef.current = [JSON.parse(JSON.stringify(saved))];
    historyIndexRef.current = 0;
    setIsSaved(true);
    return {
      project: saved,
      validation: compiled.validation,
      summary: compiled.summary
    };
  }, []);

  const applyModification = useCallback((modification) => {
    if (!activeProject || !modification) return null;
    const modified = applyMod(activeProject, modification);
    const saved = storageSaveProject(modified);
    setActiveProject(saved);
    pushHistory(saved);
    setProjects(getAllProjects());
    setIsSaved(true);
    return saved;
  }, [activeProject]);

  const generateProjectFromPrompt = useCallback((promptText) => {
    const result = planProjectFromPrompt(promptText, activeProject);
    if (result.status === 'BUILT' && result.project) {
      const saved = storageSaveProject(result.project);
      setProjects(getAllProjects());
      setActiveProject(saved);
      historyRef.current = [JSON.parse(JSON.stringify(saved))];
      historyIndexRef.current = 0;
      setIsSaved(true);
      return {
        ...result,
        project: saved
      };
    }
    return result;
  }, [activeProject]);

  const deleteProject = useCallback((id) => {
    storageDeleteProject(id);
    setProjects(getAllProjects());
    if (activeProject?.id === id) {
      setActiveProject(null);
    }
  }, [activeProject]);

  const addComponent = useCallback((typeDef, x = 300, y = 200, props = {}) => {
    updateActiveProject(prev => {
      const id = `${typeDef.type}-${generateId('c').slice(-4)}`;
      const newComp = {
        id,
        type: typeDef.type,
        name: typeDef.name,
        x,
        y,
        props: { ...(typeDef.defaultProps || {}), ...props }
      };
      return {
        ...prev,
        components: [...(prev.components || []), newComp]
      };
    });
  }, [updateActiveProject]);

  const removeComponent = useCallback((componentId) => {
    updateActiveProject(prev => {
      // Remove component and all connected wires
      const newComps = (prev.components || []).filter(c => c.id !== componentId);
      const newWires = (prev.connections || []).filter(
        w => w.from?.componentId !== componentId && w.to?.componentId !== componentId
      );
      return {
        ...prev,
        components: newComps,
        connections: newWires
      };
    });
  }, [updateActiveProject]);

  const moveComponent = useCallback((componentId, x, y) => {
    setActiveProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        components: (prev.components || []).map(c => 
          c.id === componentId ? { ...c, x, y } : c
        )
      };
    });
    setIsSaved(false);
  }, []);

  const addConnection = useCallback((from, to, color = '#2DC5E9', label = '') => {
    updateActiveProject(prev => {
      // Check if connection already exists between these two endpoints
      const exists = (prev.connections || []).some(
        w => (w.from?.componentId === from.componentId && w.from?.pinId === from.pinId &&
              w.to?.componentId === to.componentId && w.to?.pinId === to.pinId) ||
             (w.from?.componentId === to.componentId && w.from?.pinId === to.pinId &&
              w.to?.componentId === from.componentId && w.to?.pinId === from.pinId)
      );
      if (exists) return prev;

      const newWire = {
        id: `wire-${generateId('w').slice(-5)}`,
        from,
        to,
        color,
        label
      };
      return {
        ...prev,
        connections: [...(prev.connections || []), newWire]
      };
    });
  }, [updateActiveProject]);

  const removeConnection = useCallback((wireId) => {
    updateActiveProject(prev => ({
      ...prev,
      connections: (prev.connections || []).filter(w => w.id !== wireId)
    }));
  }, [updateActiveProject]);

  const updateFirmware = useCallback((content, filePath = null) => {
    updateActiveProject(prev => {
      const currentFirmware = prev.firmware || { language: 'arduino-cpp', files: [] };
      const files = [...(currentFirmware.files || [])];
      if (files.length > 0) {
        const targetIndex = filePath ? files.findIndex(f => f.path === filePath) : 0;
        const idx = targetIndex >= 0 ? targetIndex : 0;
        files[idx] = { ...files[idx], content };
      } else {
        files.push({ path: filePath || 'sketch.ino', content, language: 'arduino-cpp' });
      }
      return {
        ...prev,
        firmware: {
          ...currentFirmware,
          files
        }
      };
    });
  }, [updateActiveProject]);

  const updateFirmwareFiles = useCallback((filesUpdater) => {
    updateActiveProject(prev => {
      const currentFirmware = prev.firmware || { language: 'arduino-cpp', files: [] };
      const nextFiles = typeof filesUpdater === 'function' ? filesUpdater(currentFirmware.files || []) : filesUpdater;
      return {
        ...prev,
        firmware: {
          ...currentFirmware,
          files: nextFiles
        }
      };
    });
  }, [updateActiveProject]);

  const setPreferencesConfig = useCallback((newPrefs) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    storageSavePreferences(updated);
  }, [preferences]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        validation,
        isSaved,
        preferences,
        canUndo: historyIndexRef.current > 0,
        canRedo: historyIndexRef.current < historyRef.current.length - 1,
        loadProject,
        saveCurrent,
        forkActive,
        createNewProject,
        createPhysicalProject,
        convertToEditable,
        updatePhysicalLayout,
        hasEditableCircuit: hasEditableCircuit(activeProject),
        remixProject,
        buildProjectFromPlan,
        applyModification,
        generateProjectFromPrompt,
        deleteProject,
        updateActiveProject,
        addComponent,
        removeComponent,
        moveComponent,
        addConnection,
        removeConnection,
        updateFirmware,
        updateFirmwareFiles,
        undo,
        redo,
        commitHistory,
        setPreferences: setPreferencesConfig
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
