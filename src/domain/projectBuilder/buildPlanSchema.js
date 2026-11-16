/**
 * Tracewise Project Builder — Build Plan Schema & Validator
 * Enforces typed, catalog-grounded project specifications.
 */

import { COMPONENT_CATALOG, getComponentDefinition } from '../../data/componentCatalog.js';

/**
 * Validates a project build plan against the strict Tracewise Component Catalog.
 * Rejects unknown component types, invalid pins, and malformed wiring.
 */
export function validateBuildPlan(plan) {
  const errors = [];
  const warnings = [];

  if (!plan) {
    return { valid: false, errors: ['Build plan is empty or undefined.'], warnings: [] };
  }

  // 1. Title & Target Board
  if (!plan.title || typeof plan.title !== 'string') {
    errors.push('Build plan requires a valid string title.');
  }

  if (plan.targetBoard !== 'uno-main' && plan.targetBoard !== 'arduino-uno') {
    errors.push(`Target board "${plan.targetBoard}" is invalid. Tracewise currently supports 'uno-main' (Arduino Uno R3).`);
  }

  // 2. Component Instances
  if (!Array.isArray(plan.components) || plan.components.length === 0) {
    errors.push('Build plan must contain at least one component instance.');
  }

  const componentIds = new Set();
  const componentMap = new Map();

  (plan.components || []).forEach((comp, idx) => {
    if (!comp.id || typeof comp.id !== 'string') {
      errors.push(`Component at index ${idx} is missing a unique string ID.`);
      return;
    }

    if (componentIds.has(comp.id)) {
      errors.push(`Duplicate component ID "${comp.id}" detected in build plan.`);
    }
    componentIds.add(comp.id);
    componentMap.set(comp.id, comp);

    // Verify component type exists in catalog
    const def = getComponentDefinition(comp.type);
    if (!def) {
      errors.push(`Component type "${comp.type}" for "${comp.id}" is not in COMPONENT_CATALOG. Unknown hardware cannot be built.`);
    }

    // Verify coordinates
    if (typeof comp.x !== 'number' || typeof comp.y !== 'number') {
      warnings.push(`Component "${comp.id}" has invalid coordinates (x: ${comp.x}, y: ${comp.y}). Default coordinates will be applied.`);
    }
  });

  // 3. Wiring Connections
  if (!Array.isArray(plan.connections)) {
    errors.push('Build plan connections must be an array.');
  } else {
    const wireIds = new Set();

    plan.connections.forEach((wire, idx) => {
      if (!wire.id) {
        errors.push(`Wire at index ${idx} is missing a unique ID.`);
      } else if (wireIds.has(wire.id)) {
        errors.push(`Duplicate wire ID "${wire.id}" in build plan.`);
      }
      wireIds.add(wire.id);

      const fromComp = componentMap.get(wire.from?.componentId);
      const toComp = componentMap.get(wire.to?.componentId);

      if (!fromComp) {
        errors.push(`Wire "${wire.id}" from.componentId "${wire.from?.componentId}" does not exist in build plan components.`);
        return;
      }
      if (!toComp) {
        errors.push(`Wire "${wire.id}" to.componentId "${wire.to?.componentId}" does not exist in build plan components.`);
        return;
      }

      // Check genuine catalog pin endpoints
      const fromDef = getComponentDefinition(fromComp.type);
      const toDef = getComponentDefinition(toComp.type);

      const fromPinValid = fromDef?.pins?.some(p => p.id === wire.from?.pinId);
      const toPinValid = toDef?.pins?.some(p => p.id === wire.to?.pinId);

      if (!fromPinValid) {
        errors.push(`Invalid endpoint: Pin "${wire.from?.pinId}" does not exist on ${fromComp.type} ("${fromComp.id}").`);
      }
      if (!toPinValid) {
        errors.push(`Invalid endpoint: Pin "${wire.to?.pinId}" does not exist on ${toComp.type} ("${toComp.id}").`);
      }
    });
  }

  // 4. Firmware
  if (!plan.firmware || !Array.isArray(plan.firmware.files) || plan.firmware.files.length === 0) {
    errors.push('Build plan must provide Arduino C++ firmware files.');
  } else {
    const mainFile = plan.firmware.files[0];
    if (!mainFile.content || mainFile.content.trim().length === 0) {
      errors.push('Build plan firmware sketch.ino is empty.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
