/**
 * Tracewise Canonical Project Schema
 * Version 1.0
 */

export const SCHEMA_VERSION = 1;

/**
 * Creates a unique identifier
 */
export function generateId(prefix = 'tw') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Creates an empty blank Arduino Uno project
 */
export function createBlankProject(title = 'Untitled Circuit') {
  const id = generateId('proj');
  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    title,
    description: 'Fresh circuit with Arduino Uno R3',
    boardId: 'uno-main',
    components: [
      {
        id: 'uno-main',
        type: 'arduino-uno',
        name: 'Arduino Uno R3',
        x: 80,
        y: 120,
        props: { model: 'Uno R3', voltage: '5V' }
      },
      {
        id: 'bb-main',
        type: 'breadboard-half',
        name: 'Half Breadboard',
        x: 480,
        y: 120,
        props: { rows: 30 }
      }
    ],
    connections: [],
    firmware: {
      language: 'arduino-cpp',
      mainFile: 'sketch.ino',
      files: [
        {
          path: 'sketch.ino',
          content: `// Tracewise Arduino C++ Sketch
// Board: Arduino Uno R3

void setup() {
  // Initialize pin modes
  Serial.begin(9600);
  Serial.println("Tracewise Studio Ready");
}

void loop() {
  // Put your main code here, to run repeatedly:
}
`
        }
      ]
    },
    version: {
      id: 'v1.0',
      label: 'Initial Draft',
      parentId: null,
      createdAt: new Date().toISOString()
    },
    history: [],
    validationResults: [],
    visibility: 'private',
    updatedAt: new Date().toISOString()
  };
}

/**
 * Forks an existing project into an independent project
 * Original project is untouched.
 */
export function forkProject(sourceProject, newTitle) {
  const newId = generateId('proj');
  const snapshotId = generateId('snap');
  
  // Create snapshot of original project
  const sourceSnapshot = {
    snapshotId,
    projectId: sourceProject.id,
    versionId: sourceProject.version?.id || 'v1.0',
    title: sourceProject.title,
    components: JSON.parse(JSON.stringify(sourceProject.components)),
    connections: JSON.parse(JSON.stringify(sourceProject.connections)),
    firmware: JSON.parse(JSON.stringify(sourceProject.firmware)),
    savedAt: new Date().toISOString()
  };

  return {
    ...JSON.parse(JSON.stringify(sourceProject)),
    id: newId,
    title: newTitle || `${sourceProject.title} (Remix)`,
    version: {
      id: 'v1.1-remix',
      label: `Fork of ${sourceProject.title}`,
      parentId: sourceProject.id,
      parentVersionId: sourceProject.version?.id || 'v1.0',
      createdAt: new Date().toISOString()
    },
    history: [
      ...(sourceProject.history || []),
      sourceSnapshot
    ],
    updatedAt: new Date().toISOString()
  };
}

/**
 * Saves a version snapshot
 */
export function createSnapshot(project, label = 'Version checkpoint') {
  return {
    snapshotId: generateId('snap'),
    projectId: project.id,
    versionId: project.version?.id || 'v1',
    label,
    components: JSON.parse(JSON.stringify(project.components)),
    connections: JSON.parse(JSON.stringify(project.connections)),
    firmware: JSON.parse(JSON.stringify(project.firmware)),
    savedAt: new Date().toISOString()
  };
}
