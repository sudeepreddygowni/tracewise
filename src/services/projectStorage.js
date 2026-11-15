/**
 * Tracewise Local Storage & Persistence Service
 */

import { STARTER_PROJECTS } from '../data/starterProjects';
import { createBlankProject, forkProject } from '../domain/projectSchema';

const STORAGE_KEY = 'tracewise_projects_v1';
const PREFERENCES_KEY = 'tracewise_preferences_v1';

/**
 * Initializes storage with starter projects if empty
 */
export function initStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STARTER_PROJECTS));
      return STARTER_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STARTER_PROJECTS));
      return STARTER_PROJECTS;
    }
    return parsed;
  } catch (err) {
    console.warn('LocalStorage unavailable, using in-memory starters:', err);
    return STARTER_PROJECTS;
  }
}

/**
 * Returns all saved projects
 */
export function getAllProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initStorage();
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return STARTER_PROJECTS;
  }
}

/**
 * Returns a single project by ID, checking starters as fallback
 */
export function getProjectById(id) {
  const all = getAllProjects();
  let found = all.find(p => p.id === id);
  if (!found) {
    found = STARTER_PROJECTS.find(p => p.id === id);
  }
  return found ? JSON.parse(JSON.stringify(found)) : null;
}

/**
 * Saves or updates a project in storage
 */
export function saveProject(project) {
  try {
    const all = getAllProjects();
    const index = all.findIndex(p => p.id === project.id);
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      all[index] = updatedProject;
    } else {
      all.unshift(updatedProject);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return updatedProject;
  } catch (err) {
    console.error('Failed to save project:', err);
    throw new Error('Local storage quota exceeded or unavailable.');
  }
}

/**
 * Deletes a project by ID
 */
export function deleteProject(id) {
  try {
    const all = getAllProjects();
    const filtered = all.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to delete project:', err);
    return false;
  }
}

/**
 * Creates and stores a new project fork
 */
export function forkAndSaveProject(sourceId, newTitle) {
  const source = getProjectById(sourceId);
  if (!source) throw new Error('Source project not found');

  const forked = forkProject(source, newTitle);
  saveProject(forked);
  return forked;
}

/**
 * Exports all projects as a JSON string
 */
export function exportProjectsJson() {
  const all = getAllProjects();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      projects: all
    },
    null,
    2
  );
}

/**
 * Imports projects from a JSON string
 */
export function importProjectsJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const projectsToImport = Array.isArray(parsed) ? parsed : parsed.projects;
    if (!Array.isArray(projectsToImport)) {
      throw new Error('Invalid project export format.');
    }

    const current = getAllProjects();
    const currentIds = new Set(current.map(p => p.id));

    projectsToImport.forEach(p => {
      if (p.id && p.title) {
        if (currentIds.has(p.id)) {
          // Re-id if already exists
          p.id = `${p.id}-imported-${Date.now().toString(36)}`;
        }
        current.unshift(p);
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current;
  } catch (err) {
    console.error('Import failed:', err);
    throw err;
  }
}

/**
 * Preferences storage
 */
export function getPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    return raw ? JSON.parse(raw) : { theme: 'light', reducedMotion: false };
  } catch {
    return { theme: 'light', reducedMotion: false };
  }
}

export function savePreferences(prefs) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn(e);
  }
}
