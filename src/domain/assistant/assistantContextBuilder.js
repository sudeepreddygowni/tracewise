/**
 * Tracewise Assistant Architecture — Context Builder
 * Safely extracts minimized, structured context from the circuit graph, firmware, and validation state.
 */

export function buildAssistantContext(project, validation) {
  if (!project) return null;

  const components = (project.components || []).map(c => ({
    id: c.id,
    type: c.type,
    name: c.name || c.type,
    pins: c.pins || []
  }));

  const connections = (project.connections || []).map(w => ({
    id: w.id,
    from: `${w.from?.componentId}:${w.from?.pinId}`,
    to: `${w.to?.componentId}:${w.to?.pinId}`,
    color: w.color || 'blue'
  }));

  const firmwareContent = project.firmware?.files?.[0]?.content || '';
  
  // Extract declared pin constants using regex
  const pinMatches = [];
  const pinRegex = /(?:const\s+int|int|#define)\s+([A-Za-z0-9_]+)\s*=?\s*([0-9A-Za-z]+);?/g;
  let match;
  while ((match = pinRegex.exec(firmwareContent)) !== null) {
    pinMatches.push({ name: match[1], pin: match[2] });
  }

  return {
    projectId: project.id,
    title: project.title,
    version: project.version?.label || 'v1.0',
    components,
    connections,
    declaredPins: pinMatches,
    rawCode: firmwareContent,
    validationStatus: validation?.overallStatus || 'UNKNOWN',
    validationChecks: (validation?.checks || []).map(c => ({
      id: c.id,
      status: c.status,
      title: c.title,
      message: c.message
    }))
  };
}
