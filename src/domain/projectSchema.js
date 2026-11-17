/**
 * Tracewise Canonical Project Schema
 * Version 2.0 — Universal Modular Engineering Architecture
 * 
 * Supports:
 * - Simulated Circuits (Arduino / AVR8js)
 * - Documented Physical Projects (Science Fair / Hardware)
 * - Editable Converted Engineering Projects
 * - Reconstructed Photo Projects
 * - Physical Robotics / Car Layouts
 */

export const SCHEMA_VERSION = 2;

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
  DOCUMENTED_PHYSICAL_PROJECT: 'documented_physical_project',
  EDITABLE_ENGINEERING_PROJECT: 'editable_engineering_project',
  RECONSTRUCTED_PROJECT: 'reconstructed_project'
};

/**
 * Checks whether a project represents a physical hardware project
 * (as opposed to a purely simulated Arduino Uno starter circuit).
 */
export function isPhysicalProject(project) {
  if (!project) return false;
  return (
    project.project_type === PROJECT_TYPES.DOCUMENTED_PHYSICAL_PROJECT ||
    project.project_type === PROJECT_TYPES.EDITABLE_ENGINEERING_PROJECT ||
    project.project_type === PROJECT_TYPES.RECONSTRUCTED_PROJECT ||
    project.isPhysical === true ||
    (Boolean(project.documentation) && project.hardwarePlatform && project.hardwarePlatform !== 'Arduino Uno R3')
  );
}

/**
 * Checks if a project contains an editable circuit model
 */
export function hasEditableCircuit(project) {
  if (!project) return false;
  return (
    project.project_type === PROJECT_TYPES.SIMULATED_CIRCUIT ||
    project.project_type === PROJECT_TYPES.EDITABLE_ENGINEERING_PROJECT ||
    project.project_type === PROJECT_TYPES.RECONSTRUCTED_PROJECT ||
    (Array.isArray(project.components) && project.components.length > 0) ||
    Boolean(project.circuit?.components?.length)
  );
}

/**
 * Creates a documented physical project (e.g. for science fair submissions)
 * without requiring circuit simulation.
 */
export function createDocumentedPhysicalProject(data = {}) {
  const id = data.id || generateId('proj-phys');
  const title = (data.title || 'Untitled Physical Project').trim();
  const now = new Date().toISOString();

  const componentsList = Array.isArray(data.componentsList) ? data.componentsList : [];
  const mediaAttachments = Array.isArray(data.mediaAttachments) ? data.mediaAttachments : [];
  const sourceFiles = Array.isArray(data.sourceFiles) ? data.sourceFiles : [];

  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    project_type: PROJECT_TYPES.DOCUMENTED_PHYSICAL_PROJECT,
    isPhysical: true,
    hasEditableCircuit: false,
    title,
    name: title,
    description: data.description || '',
    category: data.category || 'robotics',
    hardwarePlatform: data.hardwarePlatform || 'ESP32',
    projectStatus: data.projectStatus || 'working_prototype',

    // Documentation fields (at root for 100% backward compatibility)
    problemSolved: data.problemSolved || '',
    targetAudience: data.targetAudience || '',
    componentsList,
    workingPrinciple: data.workingPrinciple || '',
    codeSummary: data.codeSummary || '',
    challengesFaced: data.challengesFaced || '',
    testingEvidence: data.testingEvidence || '',
    demonstrationPlan: data.demonstrationPlan || '',
    futureImprovements: data.futureImprovements || '',
    mediaAttachments,
    sourceFiles,
    links: Array.isArray(data.links) ? data.links : [],
    linkedSimulationId: data.linkedSimulationId || null,

    // Modular Representation
    identity: {
      id,
      title,
      category: data.category || 'robotics',
      status: data.projectStatus || 'working_prototype',
      hardwarePlatform: data.hardwarePlatform || 'ESP32',
      description: data.description || '',
      visibility: data.visibility || 'private',
      createdAt: data.createdAt || now,
      updatedAt: now
    },
    documentation: {
      problemSolved: data.problemSolved || '',
      targetAudience: data.targetAudience || '',
      workingPrinciple: data.workingPrinciple || '',
      challengesFaced: data.challengesFaced || '',
      testingEvidence: data.testingEvidence || '',
      demonstrationPlan: data.demonstrationPlan || '',
      futureImprovements: data.futureImprovements || '',
      mediaAttachments
    },
    bom: componentsList.map((item, idx) => ({
      id: item.id || `bom-${idx + 1}`,
      name: item.name || '',
      quantity: Number(item.quantity) || 1,
      purpose: item.purpose || '',
      partNumber: item.partNumber || '',
      category: item.category || 'Module',
      capabilityLevel: item.capabilityLevel || 'A'
    })),
    circuit: {
      components: [],
      connections: [],
      validationResults: []
    },
    physicalLayout: data.physicalLayout || null,
    firmware: {
      targetBoard: data.hardwarePlatform || 'ESP32',
      language: sourceFiles[0]?.name?.endsWith('.py') ? 'micropython' : 'arduino-cpp',
      mainFile: sourceFiles[0]?.name || (data.hardwarePlatform === 'ESP32' ? 'main.py' : 'sketch.ino'),
      files: sourceFiles.length > 0 ? sourceFiles.map(f => ({
        path: f.name || 'main.py',
        content: f.code || f.content || '',
        language: f.name?.endsWith('.py') ? 'python' : 'arduino-cpp'
      })) : []
    },
    simulation: {
      runtime: 'none',
      status: 'NOT_SUPPORTED',
      supportedDevices: [],
      unsupportedDevices: componentsList.map(c => c.name),
      limitations: ['Simulation runtime is not supported for physical target board in AVR engine']
    },
    presentationBrief: data.presentationBrief || {
      elevatorPitch: '',
      fullPresentation: '',
      judgeQA: []
    },
    pitchLab: data.pitchLab || {
      brief: {},
      pitches: {},
      judgeQA: [],
      rehearsal: {}
    },
    version: {
      id: 'v1.0',
      label: 'Initial Documentation',
      createdAt: now
    },
    history: [],
    visibility: data.visibility || 'private',
    createdAt: data.createdAt || now,
    updatedAt: now
  };
}

/**
 * Creates a blank simulated circuit project (e.g. Arduino Uno starter)
 */
export function createBlankProject(title = 'Untitled Circuit') {
  const id = generateId('proj');
  const now = new Date().toISOString();

  const components = [
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
  ];

  const connections = [];

  const defaultCode = `// Tracewise Arduino C++ Sketch
// Board: Arduino Uno R3

void setup() {
  // Initialize pin modes
  Serial.begin(9600);
  Serial.println("Tracewise Studio Ready");
}

void loop() {
  // Put your main code here, to run repeatedly:
}
`;

  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    project_type: PROJECT_TYPES.SIMULATED_CIRCUIT,
    isPhysical: false,
    hasEditableCircuit: true,
    title,
    description: 'Fresh circuit with Arduino Uno R3',
    boardId: 'uno-main',
    components,
    connections,
    firmware: {
      targetBoard: 'Arduino Uno R3',
      language: 'arduino-cpp',
      mainFile: 'sketch.ino',
      files: [
        {
          path: 'sketch.ino',
          content: defaultCode,
          language: 'arduino-cpp'
        }
      ]
    },
    // Modular Blocks
    identity: {
      id,
      title,
      category: 'electronics',
      status: 'draft',
      description: 'Fresh circuit with Arduino Uno R3',
      visibility: 'private',
      createdAt: now,
      updatedAt: now
    },
    documentation: {
      problemSolved: '',
      targetAudience: '',
      workingPrinciple: '',
      challengesFaced: '',
      testingEvidence: '',
      demonstrationPlan: '',
      futureImprovements: '',
      mediaAttachments: []
    },
    bom: [
      { id: 'bom-1', name: 'Arduino Uno R3', quantity: 1, purpose: 'Primary Microcontroller', capabilityLevel: 'E' },
      { id: 'bom-2', name: 'Half Breadboard', quantity: 1, purpose: 'Prototyping Grid', capabilityLevel: 'B' }
    ],
    circuit: {
      components,
      connections,
      validationResults: []
    },
    simulation: {
      runtime: 'avr8js',
      status: 'READY',
      supportedDevices: ['arduino-uno', 'breadboard-half'],
      unsupportedDevices: [],
      limitations: []
    },
    version: {
      id: 'v1.0',
      label: 'Initial Draft',
      parentId: null,
      createdAt: now
    },
    history: [],
    validationResults: [],
    visibility: 'private',
    updatedAt: now
  };
}

/**
 * Converts a documented physical project into an editable engineering project.
 * Preserves 100% of documentation, media, and Pitch Lab data without loss.
 */
export function convertPhysicalToEditableProject(project) {
  if (!project) return null;

  const now = new Date().toISOString();
  const bomItems = Array.isArray(project.componentsList) && project.componentsList.length > 0
    ? project.componentsList
    : (project.bom || []);

  // Map BOM items to schematic canvas components
  const canvasComponents = [];
  let currentX = 80;
  let currentY = 120;

  // 1. Controller placement
  const platform = (project.hardwarePlatform || project.identity?.hardwarePlatform || 'ESP32').toLowerCase();
  let mcuType = 'esp32-devkit';
  let mcuName = 'ESP32 NodeMCU';

  if (platform.includes('uno') || platform.includes('atmega') || platform.includes('arduino')) {
    mcuType = 'arduino-uno';
    mcuName = 'Arduino Uno R3';
  } else if (platform.includes('pico') || platform.includes('rp2040')) {
    mcuType = 'generic-module';
    mcuName = 'Raspberry Pi Pico';
  }

  canvasComponents.push({
    id: `mcu-${Date.now().toString(36).slice(-4)}`,
    type: mcuType,
    name: mcuName,
    x: currentX,
    y: currentY,
    props: { model: mcuName, voltage: mcuType === 'arduino-uno' ? '5V' : '3.3V' }
  });

  currentX += 360;

  // 2. Add Breadboard for component placement if not present
  canvasComponents.push({
    id: `bb-${Date.now().toString(36).slice(-4)}`,
    type: 'breadboard-half',
    name: 'Prototyping Breadboard',
    x: currentX,
    y: currentY,
    props: { rows: 30 }
  });

  currentX += 340;
  let accessoryY = 80;

  // 3. Map remaining BOM parts
  bomItems.forEach((item, idx) => {
    const rawName = (item.name || '').toLowerCase();
    // Skip if it's the MCU itself
    if (rawName.includes('esp32') || rawName.includes('arduino') || rawName.includes('uno')) {
      return;
    }

    let compType = 'generic-module';
    let compName = item.name || `Component ${idx + 1}`;
    let compProps = { purpose: item.purpose || '' };

    if (rawName.includes('ultrasonic') || rawName.includes('sonar') || rawName.includes('sr04')) {
      compType = 'ultrasonic-hcsr04';
      compName = 'HC-SR04 Ultrasonic Distance Sensor';
    } else if (rawName.includes('l298') || rawName.includes('motor driver')) {
      compType = 'motor-driver-l298n';
      compName = 'L298N Dual H-Bridge Driver';
    } else if (rawName.includes('motor') || rawName.includes('gear')) {
      compType = 'dc-motor';
      compName = item.name || 'TT DC Gear Motor';
    } else if (rawName.includes('led')) {
      compType = 'led-red';
      compName = item.name || 'Status LED';
    } else if (rawName.includes('resistor')) {
      compType = 'resistor';
      compName = item.name || 'Resistor';
      compProps = { resistance: '330Ω' };
    } else if (rawName.includes('potentiometer') || rawName.includes('pot')) {
      compType = 'potentiometer';
      compName = item.name || 'Potentiometer';
    } else if (rawName.includes('servo') || rawName.includes('sg90')) {
      compType = 'servo-motor';
      compName = item.name || 'Micro Servo SG90';
    } else if (rawName.includes('button') || rawName.includes('switch')) {
      compType = 'pushbutton';
      compName = item.name || 'Pushbutton';
    }

    canvasComponents.push({
      id: `part-${idx + 1}-${Date.now().toString(36).slice(-3)}`,
      type: compType,
      name: compName,
      x: Math.min(currentX, 900),
      y: accessoryY,
      props: compProps
    });

    accessoryY += 120;
    if (accessoryY > 400) {
      accessoryY = 80;
      currentX += 160;
    }
  });

  // Preserve existing firmware or generate starter
  const existingFiles = project.firmware?.files || [];
  let firmwareFiles = existingFiles;

  if (firmwareFiles.length === 0) {
    if (Array.isArray(project.sourceFiles) && project.sourceFiles.length > 0) {
      firmwareFiles = project.sourceFiles.map(sf => ({
        path: sf.name || 'main.py',
        content: sf.code || sf.content || '',
        language: sf.name?.endsWith('.py') ? 'python' : 'arduino-cpp'
      }));
    } else {
      const isPy = (project.hardwarePlatform || '').toLowerCase().includes('esp32') ||
                   (project.hardwarePlatform || '').toLowerCase().includes('pico') ||
                   (project.hardwarePlatform || '').toLowerCase().includes('python');
      firmwareFiles = [
        {
          path: isPy ? 'main.py' : 'sketch.ino',
          content: isPy
            ? `# Tracewise Physical Engineering Project
# Target Board: ${project.hardwarePlatform || 'ESP32'}
import time

def setup():
    print("Project initialized on ${project.hardwarePlatform || 'ESP32'}")

def loop():
    time.sleep(1)

setup()
while True:
    loop()
`
            : `// Tracewise Physical Engineering Project
// Target Board: ${project.hardwarePlatform || 'Microcontroller'}

void setup() {
  Serial.begin(115200);
  Serial.println("Project initialized");
}

void loop() {
  delay(1000);
}
`,
          language: isPy ? 'python' : 'arduino-cpp'
        }
      ];
    }
  }

  // Build snapshot for provenance
  const snapshot = {
    snapshotId: generateId('snap'),
    projectId: project.id,
    label: 'Converted to Editable Project',
    createdAt: now,
    originalType: project.project_type
  };

  const isCarOrRobotics = (project.category || '').toLowerCase().includes('robot') ||
                          (project.title || '').toLowerCase().includes('car') ||
                          (project.title || '').toLowerCase().includes('rover');

  const physicalLayout = project.physicalLayout || (isCarOrRobotics ? {
    enabled: true,
    chassis: { type: '2wd_robot_car', width: 220, length: 280, shape: 'rounded-rect' },
    parts: [
      { id: 'part-chassis', type: 'chassis', name: '2WD Acrylic Robot Chassis', x: 200, y: 150 },
      { id: 'part-sonar', type: 'ultrasonic-mount', name: 'Front HC-SR04 Mount', x: 200, y: 30 },
      { id: 'part-mcu', type: 'controller-mount', name: `${project.hardwarePlatform || 'ESP32'} Controller Bay`, x: 200, y: 130 },
      { id: 'part-driver', type: 'driver-mount', name: 'L298N H-Bridge Driver Bay', x: 200, y: 220 },
      { id: 'part-motor-left', type: 'dc-motor', name: 'Left TT Drive Motor', x: 70, y: 200 },
      { id: 'part-motor-right', type: 'dc-motor', name: 'Right TT Drive Motor', x: 330, y: 200 },
      { id: 'part-battery', type: 'battery-holder', name: '2x 18650 Battery Pack', x: 200, y: 290 }
    ]
  } : null);

  return {
    ...project,
    project_type: PROJECT_TYPES.EDITABLE_ENGINEERING_PROJECT,
    isPhysical: true,
    hasEditableCircuit: true,
    components: canvasComponents,
    connections: project.connections || [],
    circuit: {
      components: canvasComponents,
      connections: project.connections || [],
      validationResults: []
    },
    physicalLayout,
    firmware: {
      targetBoard: project.hardwarePlatform || 'ESP32',
      language: firmwareFiles[0]?.path?.endsWith('.py') ? 'micropython' : 'arduino-cpp',
      mainFile: firmwareFiles[0]?.path || 'main.py',
      files: firmwareFiles
    },
    simulation: {
      runtime: platform.includes('uno') ? 'avr8js' : 'none',
      status: platform.includes('uno') ? 'READY' : 'PARTIALLY_SUPPORTED',
      supportedDevices: canvasComponents.filter(c => ['arduino-uno', 'led-red', 'resistor', 'pushbutton', 'potentiometer', 'breadboard-half'].includes(c.type)).map(c => c.name),
      unsupportedDevices: canvasComponents.filter(c => !['arduino-uno', 'led-red', 'resistor', 'pushbutton', 'potentiometer', 'breadboard-half'].includes(c.type)).map(c => c.name),
      limitations: platform.includes('uno') ? [] : ['Simulation for non-AVR controllers is not executed in local AVR emulator']
    },
    history: [
      ...(project.history || []),
      snapshot
    ],
    updatedAt: now
  };
}

/**
 * Creates canonical Obstacle-Avoiding Robot Car project
 * featuring real BOM, physical assembly layout, multi-file code, and grounded Pitch Lab facts.
 */
export function createObstacleAvoidingCarProject() {
  const id = 'proj-obstacle-car-canonical';
  const now = new Date().toISOString();

  const title = 'Autonomous Obstacle-Avoiding Robot Car (ESP32)';
  const description = 'Self-navigating 2WD robotic vehicle with ultrasonic echolocation, dual H-Bridge motor control, and collision avoidance algorithms.';

  const bom = [
    { id: 'bom-esp32', name: 'ESP32 NodeMCU Development Board', quantity: 1, purpose: 'Primary controller & telemetry', partNumber: 'ESP32-WROOM-32D', capabilityLevel: 'C' },
    { id: 'bom-sonar', name: 'HC-SR04 Ultrasonic Distance Sensor', quantity: 1, purpose: 'Forward acoustic obstacle detection', partNumber: 'HC-SR04', capabilityLevel: 'C' },
    { id: 'bom-l298n', name: 'L298N Dual H-Bridge Motor Driver Module', quantity: 1, purpose: 'High-current DC motor drive', partNumber: 'L298N', capabilityLevel: 'C' },
    { id: 'bom-motors', name: 'TT DC Gearbox Motors with Rubber Wheels', quantity: 2, purpose: 'Differential drive propulsion (1:48 gear ratio)', partNumber: 'TT-130', capabilityLevel: 'C' },
    { id: 'bom-chassis', name: '2WD Acrylic Robot Car Chassis Kit', quantity: 1, purpose: 'Mechanical structural platform & omni caster', partNumber: '2WD-CH-01', capabilityLevel: 'B' },
    { id: 'bom-battery', name: '2x 18650 Li-ion Battery Pack (7.4V, 2200mAh)', quantity: 1, purpose: 'Motor drive & logic power supply', partNumber: '18650-2S', capabilityLevel: 'C' },
    { id: 'bom-switch', name: 'SPST Rocker Power Switch', quantity: 1, purpose: 'Main DC power isolation', partNumber: 'KCD1-101', capabilityLevel: 'C' },
    { id: 'bom-wires', name: 'Male-to-Female & Male-to-Male Jumper Wire Harness', quantity: 16, purpose: 'Inter-module signal & power wiring', partNumber: 'JW-MF-20', capabilityLevel: 'C' }
  ];

  const components = [
    {
      id: 'mcu-esp32',
      type: 'esp32-devkit',
      name: 'ESP32 NodeMCU',
      x: 100,
      y: 120,
      props: { model: 'ESP32 NodeMCU', voltage: '3.3V' }
    },
    {
      id: 'sonar-hcsr04',
      type: 'ultrasonic-hcsr04',
      name: 'HC-SR04 Distance Sensor',
      x: 480,
      y: 80,
      props: { minDistance: 2, maxDistance: 400 }
    },
    {
      id: 'driver-l298n',
      type: 'motor-driver-l298n',
      name: 'L298N Motor Driver',
      x: 480,
      y: 260,
      props: { currentLimit: '2A' }
    },
    {
      id: 'motor-left',
      type: 'dc-motor',
      name: 'Left TT Motor',
      x: 820,
      y: 200,
      props: { gearRatio: '1:48' }
    },
    {
      id: 'motor-right',
      type: 'dc-motor',
      name: 'Right TT Motor',
      x: 820,
      y: 340,
      props: { gearRatio: '1:48' }
    }
  ];

  const connections = [
    { id: 'w-trig', from: { componentId: 'mcu-esp32', pin: 'D5' }, to: { componentId: 'sonar-hcsr04', pin: 'TRIG' }, color: '#38bdf8', status: 'confirmed' },
    { id: 'w-echo', from: { componentId: 'mcu-esp32', pin: 'D18' }, to: { componentId: 'sonar-hcsr04', pin: 'ECHO' }, color: '#38bdf8', status: 'confirmed' },
    { id: 'w-in1', from: { componentId: 'mcu-esp32', pin: 'D19' }, to: { componentId: 'driver-l298n', pin: 'IN1' }, color: '#f59e0b', status: 'confirmed' },
    { id: 'w-in2', from: { componentId: 'mcu-esp32', pin: 'D21' }, to: { componentId: 'driver-l298n', pin: 'IN2' }, color: '#f59e0b', status: 'confirmed' },
    { id: 'w-in3', from: { componentId: 'mcu-esp32', pin: 'D22' }, to: { componentId: 'driver-l298n', pin: 'IN3' }, color: '#10b981', status: 'confirmed' },
    { id: 'w-in4', from: { componentId: 'mcu-esp32', pin: 'D23' }, to: { componentId: 'driver-l298n', pin: 'IN4' }, color: '#10b981', status: 'confirmed' },
    { id: 'w-out12', from: { componentId: 'driver-l298n', pin: 'OUT1' }, to: { componentId: 'motor-left', pin: 'POS' }, color: '#ef4444', status: 'confirmed' },
    { id: 'w-out34', from: { componentId: 'driver-l298n', pin: 'OUT3' }, to: { componentId: 'motor-right', pin: 'POS' }, color: '#ef4444', status: 'confirmed' }
  ];

  const pythonMainCode = `"""
Autonomous Obstacle-Avoiding Robot Car
Board: ESP32 NodeMCU | Runtime: MicroPython
"""
import time
from machine import Pin, time_pulse_us

# Ultrasonic HC-SR04 Pins
TRIG_PIN = 5
ECHO_PIN = 18

# L298N Motor Control Pins
IN1_PIN = 19
IN2_PIN = 21
IN3_PIN = 22
IN4_PIN = 23

trig = Pin(TRIG_PIN, Pin.OUT)
echo = Pin(ECHO_PIN, Pin.IN)

m_in1 = Pin(IN1_PIN, Pin.OUT)
m_in2 = Pin(IN2_PIN, Pin.OUT)
m_in3 = Pin(IN3_PIN, Pin.OUT)
m_in4 = Pin(IN4_PIN, Pin.OUT)

def measure_distance_cm():
    trig.value(0)
    time.sleep_us(5)
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)
    duration = time_pulse_us(echo, 1, 30000)
    if duration <= 0:
        return 999
    # Speed of sound in air ~ 343 m/s => 0.0343 cm/us
    return (duration * 0.0343) / 2

def drive_forward():
    m_in1.value(1); m_in2.value(0)
    m_in3.value(1); m_in4.value(0)

def drive_backward():
    m_in1.value(0); m_in2.value(1)
    m_in3.value(0); m_in4.value(1)

def turn_right():
    m_in1.value(1); m_in2.value(0)
    m_in3.value(0); m_in4.value(1)

def stop_motors():
    m_in1.value(0); m_in2.value(0)
    m_in3.value(0); m_in4.value(0)

print("Obstacle-Avoiding Car Initialized. Running autonomous loop...")
`;

  const pythonMotorCode = `"""
Motor Driver Helper Module (L298N)
"""
class MotorController:
    def __init__(self, in1, in2, in3, in4):
        self.in1 = in1
        self.in2 = in2
        self.in3 = in3
        self.in4 = in4

    def brake(self):
        self.in1.value(0)
        self.in2.value(0)
        self.in3.value(0)
        self.in4.value(0)
`;

  const arduinoCode = `// Obstacle Avoiding Car (ESP32 / Arduino C++ Fallback)
#define TRIG_PIN 5
#define ECHO_PIN 18
#define IN1 19
#define IN2 21
#define IN3 22
#define IN4 23

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  Serial.println("Robot car ready.");
}

long getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long dur = pulseIn(ECHO_PIN, HIGH, 30000);
  if (dur == 0) return 999;
  return dur * 0.034 / 2;
}

void loop() {
  long d = getDistance();
  if (d < 25) {
    // Obstacle detected: stop & pivot
    digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
    digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
    delay(400);
  } else {
    // Clear path: drive forward
    digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
    digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  }
  delay(50);
}
`;

  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    project_type: PROJECT_TYPES.EDITABLE_ENGINEERING_PROJECT,
    isPhysical: true,
    hasEditableCircuit: true,
    title,
    name: title,
    description,
    category: 'robotics',
    hardwarePlatform: 'ESP32',
    projectStatus: 'working_prototype',

    problemSolved: 'Preventing collisions in autonomous mobile ground vehicles through ultrasonic time-of-flight proximity detection and differential motor steering.',
    targetAudience: 'Secondary school science fair judges, robotics club students, and STEM robotics curriculum.',
    componentsList: bom,
    workingPrinciple: 'The front-mounted HC-SR04 ultrasonic sensor transmits 40kHz acoustic pulses and measures the echo duration. When distance falls below 25 cm, the ESP32 activates directional braking via the L298N H-Bridge, reverses briefly, and pivots 90 degrees to find an unobstructed corridor.',
    codeSummary: 'MicroPython dual-threaded event loop measuring ultrasonic pulse timing and commanding L298N logic pins for forward propulsion, avoidance turns, and emergency braking.',
    challengesFaced: 'Motor electrical noise induced false echo triggers on the ultrasonic sensor. Resolved by adding a 100uF decoupling capacitor across the L298N 5V logic line and running a star-ground configuration to the ESP32.',
    testingEvidence: 'Tested through 45 indoor obstacle trials: 43 successful autonomous redirections (95.5% success rate). Average avoidance reaction time measured at 48ms.',
    demonstrationPlan: 'Live obstacle course navigation inside a 2m x 2m enclosed arena with cardboard barriers.',
    futureImprovements: 'Integrate infrared line sensors on the undercarriage for dual-mode line following, and add an optical wheel encoder for closed-loop odometry.',
    mediaAttachments: [
      { id: 'att-car-1', name: 'robot_car_overhead.jpg', url: '/assets/sample-projects/car-top.jpg', type: 'image' }
    ],
    sourceFiles: [
      { name: 'main.py', code: pythonMainCode, language: 'python' },
      { name: 'motor_driver.py', code: pythonMotorCode, language: 'python' },
      { name: 'sketch.ino', code: arduinoCode, language: 'arduino-cpp' }
    ],

    components,
    connections,

    // Modular Representation
    identity: {
      id,
      title,
      category: 'robotics',
      status: 'working_prototype',
      hardwarePlatform: 'ESP32',
      description,
      visibility: 'public',
      createdAt: now,
      updatedAt: now
    },
    documentation: {
      problemSolved: 'Preventing collisions in autonomous mobile ground vehicles through ultrasonic time-of-flight proximity detection and differential motor steering.',
      targetAudience: 'Secondary school science fair judges, robotics club students, and STEM robotics curriculum.',
      workingPrinciple: 'The front-mounted HC-SR04 ultrasonic sensor transmits 40kHz acoustic pulses and measures the echo duration. When distance falls below 25 cm, the ESP32 activates directional braking via the L298N H-Bridge.',
      challengesFaced: 'Motor electrical noise induced false echo triggers on the ultrasonic sensor. Resolved by adding a 100uF decoupling capacitor across the L298N 5V logic line.',
      testingEvidence: 'Tested through 45 indoor obstacle trials: 43 successful autonomous redirections (95.5% success rate). Average avoidance reaction time measured at 48ms.',
      futureImprovements: 'Integrate infrared line sensors on the undercarriage for dual-mode line following, and add an optical wheel encoder for closed-loop odometry.'
    },
    bom,
    circuit: {
      components,
      connections,
      validationResults: [
        { id: 'val-voltage', severity: 'INFO', message: 'ESP32 operates at 3.3V logic; L298N logic input thresholds accept 3.3V high.' },
        { id: 'val-gnd', severity: 'PASS', message: 'Common ground confirmed between 7.4V battery pack, L298N, and ESP32 GND.' }
      ]
    },
    physicalLayout: {
      enabled: true,
      chassis: { type: '2wd_robot_car', width: 220, length: 280, shape: 'rounded-rect' },
      parts: [
        { id: 'part-chassis', type: 'chassis', name: '2WD Acrylic Robot Chassis', x: 200, y: 150 },
        { id: 'part-sonar', type: 'ultrasonic-mount', name: 'Front HC-SR04 Mount', x: 200, y: 30 },
        { id: 'part-mcu', type: 'controller-mount', name: 'ESP32 NodeMCU Bay', x: 200, y: 130 },
        { id: 'part-driver', type: 'driver-mount', name: 'L298N H-Bridge Driver Bay', x: 200, y: 220 },
        { id: 'part-motor-left', type: 'dc-motor', name: 'Left TT Drive Motor', x: 70, y: 200 },
        { id: 'part-motor-right', type: 'dc-motor', name: 'Right TT Drive Motor', x: 330, y: 200 },
        { id: 'part-battery', type: 'battery-holder', name: '2x 18650 Battery Pack', x: 200, y: 290 }
      ]
    },
    firmware: {
      targetBoard: 'ESP32',
      language: 'micropython',
      mainFile: 'main.py',
      files: [
        { path: 'main.py', content: pythonMainCode, language: 'python' },
        { path: 'motor_driver.py', content: pythonMotorCode, language: 'python' },
        { path: 'sketch.ino', content: arduinoCode, language: 'arduino-cpp' },
        { path: 'README.md', content: '# Obstacle Avoiding Car\nFirmware for ESP32 with L298N motor driver and HC-SR04 ultrasonic sensor.', language: 'markdown' }
      ]
    },
    simulation: {
      runtime: 'none',
      status: 'PARTIALLY_SUPPORTED',
      supportedDevices: ['HC-SR04 Ultrasonic Distance Sensor'],
      unsupportedDevices: ['ESP32 NodeMCU Development Board', 'L298N Dual H-Bridge Motor Driver Module', 'TT DC Gearbox Motors'],
      limitations: ['AVR8js simulation engine executes ATmega328P code; ESP32 firmware execution is not routed through AVR simulator']
    },
    pitchLab: {
      brief: {
        targetAudience: 'Science fair judges',
        presentationStyle: 'Engineering Competition'
      },
      pitches: {
        elevator: 'Our Autonomous Obstacle-Avoiding Car uses an ESP32 microcontroller and ultrasonic echolocation to detect barriers within 25 cm and execute real-time evasive maneuvers with a 95.5% success rate.',
        competition: 'Conventional budget robotic platforms struggle with sensor noise and latency when driving motors. By isolating the logic rail and running interrupt-driven ultrasonic timing on the ESP32, our system achieves a 48ms reaction time without stalling or crashing.',
        scienceFair: 'Good morning judges! Today we present our Autonomous Obstacle-Avoiding Car. Built around an ESP32 and an L298N H-Bridge driver, our vehicle uses 40kHz acoustic pulses to map obstacles. Over 45 empirical trials, the system avoided collisions in 43 tests, proving reliable autonomous obstacle navigation on a student budget.'
      },
      judgeQA: [
        {
          id: 'qa-car-1',
          question: 'Why did you select the ESP32 over an Arduino Uno for this robot?',
          answer: 'The ESP32 gives us faster clock speeds for accurate pulse timing, built-in dual cores to separate sensor reads from motor PWM, and future Wi-Fi telemetry capability for remote data logging.'
        },
        {
          id: 'qa-car-2',
          question: 'How did you handle the electrical noise generated by the DC motors?',
          answer: 'DC motor brushes produce inductive spikes that reset microcontrollers. We solved this with optical isolation on the L298N, a 100uF decoupling capacitor across the 5V logic line, and a single-point star ground back to the 7.4V battery pack.'
        }
      ],
      rehearsal: {
        timerSeconds: 120,
        currentCueIndex: 0
      }
    },
    version: {
      id: 'v1.0',
      label: 'Autonomous Baseline',
      createdAt: now
    },
    history: [],
    visibility: 'public',
    createdAt: now,
    updatedAt: now
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
    components: JSON.parse(JSON.stringify(sourceProject.components || [])),
    connections: JSON.parse(JSON.stringify(sourceProject.connections || [])),
    firmware: JSON.parse(JSON.stringify(sourceProject.firmware || {})),
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
    components: JSON.parse(JSON.stringify(project.components || [])),
    connections: JSON.parse(JSON.stringify(project.connections || [])),
    firmware: JSON.parse(JSON.stringify(project.firmware || {})),
    savedAt: new Date().toISOString()
  };
}
