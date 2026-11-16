/**
 * Tracewise Project Builder — Catalog Compiler
 * Compiles a validated build plan into canonical Tracewise Project Schema.
 */

import { generateId, SCHEMA_VERSION } from '../projectSchema.js';
import { validateBuildPlan } from './buildPlanSchema.js';
import { validateCircuit } from '../circuitRules.js';

/**
 * Compiles a build plan into a fully persistent Tracewise project.
 */
export function compileBuildPlan(plan) {
  const planValidation = validateBuildPlan(plan);
  if (!planValidation.valid) {
    throw new Error(`Cannot compile invalid build plan: ${planValidation.errors.join(' ')}`);
  }

  const projectId = plan.id || generateId('proj');
  const now = new Date().toISOString();

  // Normalize component instances
  const components = plan.components.map((c, idx) => ({
    id: c.id,
    type: c.type,
    name: c.name || `${c.type}-${idx + 1}`,
    x: typeof c.x === 'number' ? c.x : 200 + (idx % 4) * 120,
    y: typeof c.y === 'number' ? c.y : 150 + Math.floor(idx / 4) * 120,
    props: { ...(c.props || {}) }
  }));

  // Normalize connections
  const connections = plan.connections.map((w, idx) => ({
    id: w.id || `wire-${generateId('w').slice(-5)}-${idx}`,
    from: {
      componentId: w.from.componentId,
      pinId: w.from.pinId
    },
    to: {
      componentId: w.to.componentId,
      pinId: w.to.pinId
    },
    color: w.color || '#2DC5E9',
    label: w.label || ''
  }));

  // Normalize firmware
  const firmware = {
    language: plan.firmware?.language || 'arduino-cpp',
    mainFile: plan.firmware?.mainFile || 'sketch.ino',
    files: (plan.firmware?.files || []).map(f => ({
      path: f.path || 'sketch.ino',
      content: f.content
    }))
  };

  const project = {
    schemaVersion: SCHEMA_VERSION,
    id: projectId,
    title: plan.title,
    description: plan.description || 'Custom circuit compiled by Tracewise Project Builder',
    boardId: 'uno-main',
    components,
    connections,
    firmware,
    version: {
      id: 'v1.0-built',
      label: 'Initial Generated Build',
      parentId: null,
      createdAt: now
    },
    history: [],
    validationResults: [],
    visibility: 'private',
    updatedAt: now
  };

  // Run initial circuit validation
  const circuitValidation = validateCircuit(project);
  project.validationResults = circuitValidation.checks || [];

  return {
    project,
    validation: circuitValidation,
    summary: {
      componentCount: components.length,
      connectionCount: connections.length,
      linesOfCode: (firmware.files[0]?.content || '').split('\n').length,
      validationStatus: circuitValidation.overallStatus
    }
  };
}
