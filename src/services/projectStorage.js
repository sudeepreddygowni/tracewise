/**
 * Tracewise Local Storage & Persistence Service
 */

import { STARTER_PROJECTS } from '../data/starterProjects';
import { createBlankProject, forkProject } from '../domain/projectSchema';
import { supabase, isSupabaseConfigured } from './supabase.js';

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
 * Fetches private user projects from Supabase cloud storage (with RLS isolation)
 */
export async function fetchUserCloudProjects(userId) {
  if (!userId || !isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Fetch cloud projects note:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      ...row.project_data,
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    console.warn('Cloud project fetch exception:', err);
    return [];
  }
}

/**
 * Saves a project to Supabase Cloud for authenticated students (isolated per user)
 */
export async function saveUserCloudProject(project, userId) {
  if (!project || !userId || !isSupabaseConfigured() || !supabase) return null;
  try {
    const payload = {
      id: project.id,
      user_id: userId,
      title: project.title || 'Untitled Project',
      description: project.description || '',
      project_data: project,
      version: Number(project.version?.number || 1),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_projects')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Cloud project save note:', error.message);
      return null;
    }
    return payload;
  } catch (err) {
    console.warn('Cloud project save exception:', err);
    return null;
  }
}

/**
 * Deletes a project from Supabase Cloud
 */
export async function deleteUserCloudProject(projectId, userId) {
  if (!projectId || !userId || !isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase
      .from('user_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
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

    // Background cloud sync for authenticated users
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user?.id) {
          saveUserCloudProject(updatedProject, data.session.user.id);
        }
      }).catch(() => {});
    }

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

    // Background cloud deletion for authenticated users
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user?.id) {
          deleteUserCloudProject(id, data.session.user.id);
        }
      }).catch(() => {});
    }

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
