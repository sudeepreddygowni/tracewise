/**
 * Tracewise Version Comparison Engine
 * Computes deterministic diffs across circuit graph, wires, and firmware
 */

import { validateCircuit } from './circuitRules';

/**
 * Compares two project snapshots/versions
 */
export function compareProjects(original, current) {
  if (!original || !current) {
    return null;
  }

  // 1. Component differences
  const origCompMap = new Map((original.components || []).map(c => [c.id, c]));
  const currCompMap = new Map((current.components || []).map(c => [c.id, c]));

  const addedComponents = [];
  const removedComponents = [];
  const modifiedComponents = [];

  currCompMap.forEach((comp, id) => {
    if (!origCompMap.has(id)) {
      addedComponents.push(comp);
    } else {
      const origComp = origCompMap.get(id);
      const propsChanged = JSON.stringify(comp.props) !== JSON.stringify(origComp.props);
      const posChanged = Math.abs(comp.x - origComp.x) > 10 || Math.abs(comp.y - origComp.y) > 10;
      if (propsChanged || posChanged) {
        modifiedComponents.push({
          current: comp,
          original: origComp,
          posChanged,
          propsChanged
        });
      }
    }
  });

  origCompMap.forEach((comp, id) => {
    if (!currCompMap.has(id)) {
      removedComponents.push(comp);
    }
  });

  // 2. Wire differences
  const origWireKey = w => `${w.from?.componentId}:${w.from?.pinId}->${w.to?.componentId}:${w.to?.pinId}`;
  const currWireKey = w => `${w.from?.componentId}:${w.from?.pinId}->${w.to?.componentId}:${w.to?.pinId}`;

  const origWires = new Set((original.connections || []).map(origWireKey));
  const currWires = new Set((current.connections || []).map(currWireKey));

  const addedWires = (current.connections || []).filter(w => !origWires.has(currWireKey(w)));
  const removedWires = (original.connections || []).filter(w => !currWires.has(origWireKey(w)));

  // 3. Firmware differences (line-by-line diff)
  const origLines = (original.firmware?.files?.[0]?.content || '').split('\n');
  const currLines = (current.firmware?.files?.[0]?.content || '').split('\n');

  const firmwareDiff = [];
  const maxLines = Math.max(origLines.length, currLines.length);

  let i = 0, j = 0;
  while (i < origLines.length || j < currLines.length) {
    const origL = origLines[i];
    const currL = currLines[j];

    if (origL === currL) {
      firmwareDiff.push({ type: 'unchanged', text: origL, origLine: i + 1, currLine: j + 1 });
      i++;
      j++;
    } else if (origL !== undefined && !currLines.includes(origL)) {
      firmwareDiff.push({ type: 'removed', text: origL, origLine: i + 1 });
      i++;
    } else if (currL !== undefined && !origLines.includes(currL)) {
      firmwareDiff.push({ type: 'added', text: currL, currLine: j + 1 });
      j++;
    } else {
      // Line modified
      if (origL !== undefined) {
        firmwareDiff.push({ type: 'removed', text: origL, origLine: i + 1 });
        i++;
      }
      if (currL !== undefined) {
        firmwareDiff.push({ type: 'added', text: currL, currLine: j + 1 });
        j++;
      }
    }
  }

  // 4. Validation comparison
  const origValidation = validateCircuit(original);
  const currValidation = validateCircuit(current);

  const newErrors = currValidation.checks.filter(
    cc => cc.status === 'FAILED' && !origValidation.checks.some(oc => oc.id === cc.id && oc.status === 'FAILED')
  );

  const fixedErrors = origValidation.checks.filter(
    oc => oc.status === 'FAILED' && currValidation.checks.some(cc => cc.id === oc.id && cc.status === 'PASSED')
  );

  return {
    originalVersion: original.version?.label || 'Baseline',
    currentVersion: current.version?.label || 'Modified',
    summary: {
      addedComponentsCount: addedComponents.length,
      removedComponentsCount: removedComponents.length,
      addedWiresCount: addedWires.length,
      removedWiresCount: removedWires.length,
      codeLinesChanged: firmwareDiff.filter(l => l.type !== 'unchanged').length,
      hasNewErrors: newErrors.length > 0
    },
    components: {
      added: addedComponents,
      removed: removedComponents,
      modified: modifiedComponents
    },
    wires: {
      added: addedWires,
      removed: removedWires
    },
    firmwareDiff,
    validation: {
      originalStatus: origValidation.overallStatus,
      currentStatus: currValidation.overallStatus,
      newErrors,
      fixedErrors,
      currentChecks: currValidation.checks
    }
  };
}
