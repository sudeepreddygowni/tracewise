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
 * Project Type Enums
 */
export const PROJECT_TYPES = {
  SIMULATED_CIRCUIT: 'simulated_circuit',
  DOCUMENTED_PHYSICAL_PROJECT: 'documented_physical_project'
};

export function isPhysicalProject(project) {
  return project?.project_type === PROJECT_TYPES.DOCUMENTED_PHYSICAL_PROJECT;
}

/**
 * Creates a documented physical project (e.g. for science fair submissions)
 * without requiring circuit simulation.
 */
export function createDocumentedPhysicalProject(data = {}) {
  const id = data.id || generateId('proj-phys');
  const title = (data.title || 'Untitled Physical Project').trim();
  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    project_type: PROJECT_TYPES.DOCUMENTED_PHYSICAL_PROJECT,
    title,
    name: title,
    description: data.description || '',
    category: data.category || 'robotics',
    hardwarePlatform: data.hardwarePlatform || 'ESP32',
    projectStatus: data.projectStatus || 'working_prototype',
    problemSolved: data.problemSolved || '',
    targetAudience: data.targetAudience || '',
    componentsList: Array.isArray(data.componentsList) ? data.componentsList : [],
    workingPrinciple: data.workingPrinciple || '',
    codeSummary: data.codeSummary || '',
    challengesFaced: data.challengesFaced || '',
    testingEvidence: data.testingEvidence || '',
    demonstrationPlan: data.demonstrationPlan || '',
    futureImprovements: data.futureImprovements || '',
    mediaAttachments: Array.isArray(data.mediaAttachments) ? data.mediaAttachments : [],
    sourceFiles: Array.isArray(data.sourceFiles) ? data.sourceFiles : [],
    links: Array.isArray(data.links) ? data.links : [],
    linkedSimulationId: data.linkedSimulationId || null,
    presentationBrief: data.presentationBrief || {
      elevatorPitch: '',
      fullPresentation: '',
      judgeQA: []
    },
    version: {
      id: 'v1.0',
      label: 'Initial Documentation',
      createdAt: new Date().toISOString()
    },
    history: [],
    visibility: data.visibility || 'private',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
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
