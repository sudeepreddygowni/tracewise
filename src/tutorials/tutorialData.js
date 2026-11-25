/**
 * Tracewise 8 Approved Tutorial Lesson Definitions
 *
 * Each lesson strictly adheres to:
 * 1. Scripted clicks are VISUAL PRESSES only (never automate production actions).
 * 2. Dedicated targets using `data-tour-target` for stability.
 * 3. Isolated demonstration preview state with auto-reset onCycle.
 * 4. Text-based accessible fallback steps.
 */

export const TUTORIAL_LESSONS = [
  {
    id: 'dashboard',
    order: 1,
    title: 'Create Your First Project',
    shortDescription: 'Learn how to start a new electronics project on the dashboard.',
    fullDescription: 'Every circuit in Tracewise starts with a project. This keeps your components, connections, and Arduino code organized in one place.',
    duration: '1.5 min',
    difficulty: 'Beginner',
    category: 'Project Management',
    learningObjectives: [
      'Locate the project creation controls',
      'Name your engineering project',
      'Understand how projects organize components and code'
    ],
    accessibleSteps: [
      'Step 1: On the Dashboard, find the "New Circuit" primary button.',
      'Step 2: Enter a clear project title such as "My First LED Circuit".',
      'Step 3: Click "Create Project" to enter the Engineering Studio workspace.'
    ],
    cursors: [
      {
        id: 'guide-1',
        name: 'Tracewise Tutor',
        color: '#1e3fd8',
        start: { x: '15%', y: '80%' },
        script: [
          { action: 'say', text: 'Welcome! Let\'s start a project.', duration: 1500 },
          { action: 'wait', duration: 400 },
          { action: 'hover', target: '[data-tour-target="new-project-btn"]', duration: 1000 },
          { action: 'click', target: '[data-tour-target="new-project-btn"]' },
          { action: 'say', text: 'Click New Circuit', duration: 1200 },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="project-title-input"]', duration: 800 },
          { action: 'click', target: '[data-tour-target="project-title-input"]' },
          { action: 'type', target: '[data-tour-target="project-title-input"]', text: 'My First LED Circuit', delay: 45 },
          { action: 'say', text: 'Name your circuit', duration: 1400 },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="confirm-create-btn"]', duration: 800 },
          { action: 'click', target: '[data-tour-target="confirm-create-btn"]' },
          { action: 'say', text: 'Project created!', duration: 1600 },
          { action: 'wait', duration: 1200 }
        ]
      }
    ]
  },
  {
    id: 'components',
    order: 2,
    title: 'Add Electronic Components',
    shortDescription: 'Explore the 33-part component library and place hardware on the canvas.',
    fullDescription: 'The component library contains microcontrollers, sensors, resistors, and LEDs. Learn how to search, place, and arrange parts on your canvas.',
    duration: '2 min',
    difficulty: 'Beginner',
    category: 'Circuit Studio',
    learningObjectives: [
      'Open and close the component library',
      'Search for parts like Arduino Uno R3, LED, and Resistor',
      'Add parts to the circuit canvas'
    ],
    accessibleSteps: [
      'Step 1: Click the "Components" button in the Studio toolbar to open the parts drawer.',
      'Step 2: Find "Arduino Uno R3" under Microcontrollers and click "+ Add".',
      'Step 3: Search for "LED" and add a 5mm Red LED.',
      'Step 4: Search for "Resistor" and add a 220Ω resistor to protect your LED.',
      'Step 5: Close the component library to give yourself full canvas workspace.'
    ],
    cursors: [
      {
        id: 'guide-2',
        name: 'Hardware Guide',
        color: '#0284c7',
        start: { x: '20%', y: '20%' },
        script: [
          { action: 'say', text: 'Open the Parts Library', duration: 1400 },
          { action: 'hover', target: '[data-tour-target="open-components-btn"]', duration: 800 },
          { action: 'click', target: '[data-tour-target="open-components-btn"]' },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="part-arduino-uno"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="part-arduino-uno"]' },
          { action: 'say', text: 'Added Arduino Uno R3', duration: 1400 },
          { action: 'wait', duration: 500 },
          { action: 'hover', target: '[data-tour-target="part-led-red"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="part-led-red"]' },
          { action: 'say', text: 'Added 5mm Red LED', duration: 1400 },
          { action: 'wait', duration: 500 },
          { action: 'hover', target: '[data-tour-target="part-resistor-220"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="part-resistor-220"]' },
          { action: 'say', text: 'Added 220Ω Resistor', duration: 1400 },
          { action: 'wait', duration: 500 },
          { action: 'hover', target: '[data-tour-target="close-components-btn"]', duration: 700 },
          { action: 'click', target: '[data-tour-target="close-components-btn"]' },
          { action: 'say', text: 'Canvas is ready!', duration: 1600 },
          { action: 'wait', duration: 1200 }
        ]
      }
    ]
  },
  {
    id: 'wiring',
    order: 3,
    title: 'Connect Your First Circuit',
    shortDescription: 'Wire electronic pins to establish complete electrical loops.',
    fullDescription: 'Electrical current requires a complete circuit. Learn how to route jumper wires from Arduino pins through current-limiting resistors to LED terminals.',
    duration: '2.5 min',
    difficulty: 'Beginner',
    category: 'Circuit Studio',
    learningObjectives: [
      'Identify terminal polarity (LED Anode vs Cathode)',
      'Route a wire from digital pin 13 to a 220Ω resistor',
      'Return the circuit to Arduino GND to close the electrical loop'
    ],
    accessibleSteps: [
      'Step 1: Click Arduino Pin D13 and drag a wire to Resistor Terminal 1.',
      'Step 2: Connect Resistor Terminal 2 to the longer leg (Anode) of the LED.',
      'Step 3: Connect the shorter leg (Cathode) of the LED to the Arduino GND pin.',
      'Step 4: Check the validation bar to confirm a valid closed loop.'
    ],
    cursors: [
      {
        id: 'guide-3',
        name: 'Circuit Coach',
        color: '#10b981',
        start: { x: '10%', y: '50%' },
        script: [
          { action: 'say', text: 'Let\'s route wires!', duration: 1400 },
          { action: 'hover', target: '[data-tour-target="pin-arduino-d13"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="pin-arduino-d13"]' },
          { action: 'hover', target: '[data-tour-target="pin-resistor-t1"]', duration: 1000 },
          { action: 'click', target: '[data-tour-target="pin-resistor-t1"]' },
          { action: 'say', text: 'Pin D13 → Resistor', duration: 1400 },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="pin-resistor-t2"]', duration: 800 },
          { action: 'click', target: '[data-tour-target="pin-resistor-t2"]' },
          { action: 'hover', target: '[data-tour-target="pin-led-anode"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="pin-led-anode"]' },
          { action: 'say', text: 'Resistor → LED Anode (+)', duration: 1500 },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="pin-led-cathode"]', duration: 800 },
          { action: 'click', target: '[data-tour-target="pin-led-cathode"]' },
          { action: 'hover', target: '[data-tour-target="pin-arduino-gnd"]', duration: 1000 },
          { action: 'click', target: '[data-tour-target="pin-arduino-gnd"]' },
          { action: 'say', text: 'Cathode (-) → GND. Circuit complete!', duration: 1800 },
          { action: 'wait', duration: 1200 }
        ]
      }
    ]
  },
  {
    id: 'firmware',
    order: 4,
    title: 'Write Arduino Firmware',
    shortDescription: 'Understand setup(), loop(), and digital I/O programming.',
    fullDescription: 'Microcontrollers run firmware code to control electronic components. Learn how setup() configures pins and loop() repeats output actions.',
    duration: '2 min',
    difficulty: 'Beginner',
    category: 'Firmware & Code',
    learningObjectives: [
      'Open the integrated code editor and files panel',
      'Understand pinMode(13, OUTPUT) in setup()',
      'Use digitalWrite() and delay() to create flashing sequences'
    ],
    accessibleSteps: [
      'Step 1: Click the "Code" tab in Studio to open the Arduino C++ editor.',
      'Step 2: Inspect sketch.ino. Inside setup(), pinMode(13, OUTPUT) configures Pin 13.',
      'Step 3: Inside loop(), digitalWrite(13, HIGH) powers the LED, delay(1000) pauses for 1 second, and digitalWrite(13, LOW) turns it off.'
    ],
    cursors: [
      {
        id: 'guide-4',
        name: 'Firmware Tutor',
        color: '#6366f1',
        start: { x: '50%', y: '20%' },
        script: [
          { action: 'say', text: 'Opening Code Editor', duration: 1400 },
          { action: 'hover', target: '[data-tour-target="code-tab-btn"]', duration: 800 },
          { action: 'click', target: '[data-tour-target="code-tab-btn"]' },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="editor-setup-line"]', duration: 1000 },
          { action: 'say', text: 'setup() configures pins once', duration: 1800 },
          { action: 'wait', duration: 800 },
          { action: 'hover', target: '[data-tour-target="editor-loop-line"]', duration: 1000 },
          { action: 'say', text: 'loop() runs continuously', duration: 1800 },
          { action: 'wait', duration: 800 },
          { action: 'hover', target: '[data-tour-target="editor-validate-btn"]', duration: 800 },
          { action: 'click', target: '[data-tour-target="editor-validate-btn"]' },
          { action: 'say', text: 'Firmware syntax verified!', duration: 1600 },
          { action: 'wait', duration: 1200 }
        ]
      }
    ]
  },
  {
    id: 'simulation',
    order: 5,
    title: 'Run a Simulation',
    shortDescription: 'Execute firmware on the cycle-accurate ATmega328P virtual MCU.',
    fullDescription: 'Tracewise compiles your Arduino sketch into AVR machine code and runs it in the browser with real pin physics. Learn how to start, pause, and inspect simulation.',
    duration: '2 min',
    difficulty: 'Beginner',
    category: 'Simulation Engine',
    learningObjectives: [
      'Start the virtual AVR simulation',
      'Observe real-time LED illumination and pin logic states',
      'Inspect Serial Monitor USART output',
      'Stop and reset the simulation'
    ],
    accessibleSteps: [
      'Step 1: Click "Run Simulation" in the control bar.',
      'Step 2: Watch the virtual compiler build your hex file and start the ATmega328P.',
      'Step 3: Observe Pin 13 turning HIGH and the LED glowing in real-time.',
      'Step 4: Use "Stop" or "Reset" to halt execution.'
    ],
    cursors: [
      {
        id: 'guide-5',
        name: 'Simulation Lab',
        color: '#f59e0b',
        start: { x: '40%', y: '10%' },
        script: [
          { action: 'say', text: 'Let\'s run our circuit!', duration: 1500 },
          { action: 'hover', target: '[data-tour-target="start-simulation-btn"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="start-simulation-btn"]' },
          { action: 'say', text: 'Compiling sketch.ino...', duration: 1400 },
          { action: 'wait', duration: 800 },
          { action: 'hover', target: '[data-tour-target="simulated-led-indicator"]', duration: 1000 },
          { action: 'say', text: 'LED is blinking at 1Hz!', duration: 2000 },
          { action: 'wait', duration: 1000 },
          { action: 'hover', target: '[data-tour-target="stop-simulation-btn"]', duration: 800 },
          { action: 'click', target: '[data-tour-target="stop-simulation-btn"]' },
          { action: 'say', text: 'Simulation stopped cleanly', duration: 1600 },
          { action: 'wait', duration: 1200 }
        ]
      }
    ]
  },
  {
    id: 'compare',
    order: 6,
    title: 'Find and Fix Mistakes (Compare & Debug)',
    shortDescription: 'Compare circuit versions side-by-side to pinpoint bugs.',
    fullDescription: 'When a project stops working after a change, Compare & Debug highlights discrepancies in pin routing, components, and code instead of starting over.',
    duration: '2 min',
    difficulty: 'Intermediate',
    category: 'Debugging',
    learningObjectives: [
      'Open Compare & Debug between baseline and modified projects',
      'Identify pin mismatches between schematic and firmware',
      'Resolve the discrepancy and restore working status'
    ],
    accessibleSteps: [
      'Step 1: Open Compare & Debug from the Studio top bar.',
      'Step 2: Compare Circuit A (working) with Circuit B (buggy).',
      'Step 3: Inspect the highlighted discrepancy: Code reads Pin 2 but wire is on Pin 7.',
      'Step 4: Align the pin definition to fix the bug.'
    ],
    cursors: [
      {
        id: 'guide-6',
        name: 'Debug Specialist',
        color: '#ef4444',
        start: { x: '30%', y: '30%' },
        script: [
          { action: 'say', text: 'Troubleshooting a broken circuit', duration: 1600 },
          { action: 'hover', target: '[data-tour-target="compare-diff-btn"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="compare-diff-btn"]' },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="diff-highlight-wire"]', duration: 1100 },
          { action: 'say', text: 'Found it! Wire is on Pin 7...', duration: 1800 },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="diff-highlight-code"]', duration: 1100 },
          { action: 'say', text: '...but code expects Pin 2!', duration: 1800 },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="align-pin-action"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="align-pin-action"]' },
          { action: 'say', text: 'Bug fixed! Pins are aligned.', duration: 1800 },
          { action: 'wait', duration: 1200 }
        ]
      }
    ]
  },
  {
    id: 'pitch',
    order: 7,
    title: 'Prepare a Presentation (Pitch Lab)',
    shortDescription: 'Turn project facts, testing notes, and code into science-fair slides.',
    fullDescription: 'Pitch Lab helps students present their engineering work. It organizes problem statements, solution principles, parts lists, and judge questions into exportable slides.',
    duration: '2 min',
    difficulty: 'Intermediate',
    category: 'Presentations',
    learningObjectives: [
      'Ingest project hardware and code context into Pitch Lab',
      'Generate science-fair slides (Problem, Working Principle, Evidence)',
      'Practice with simulated judge interview questions'
    ],
    accessibleSteps: [
      'Step 1: Open Pitch Lab from the Studio header.',
      'Step 2: Review automatically ingested project context.',
      'Step 3: Click "Generate Science Fair Slides" to structure your presentation.',
      'Step 4: Use Judge Q&A cards to practice answering technical questions.'
    ],
    cursors: [
      {
        id: 'guide-7',
        name: 'Pitch Mentor',
        color: '#8b5cf6',
        start: { x: '50%', y: '60%' },
        script: [
          { action: 'say', text: 'Ready for the Science Fair?', duration: 1600 },
          { action: 'hover', target: '[data-tour-target="pitch-lab-btn"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="pitch-lab-btn"]' },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="generate-slides-btn"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="generate-slides-btn"]' },
          { action: 'say', text: 'Generated 6 presentation slides!', duration: 1800 },
          { action: 'wait', duration: 800 },
          { action: 'hover', target: '[data-tour-target="judge-qa-tab"]', duration: 800 },
          { action: 'click', target: '[data-tour-target="judge-qa-tab"]' },
          { action: 'say', text: 'Practice real judge questions!', duration: 1800 },
          { action: 'wait', duration: 1200 }
        ]
      }
    ]
  },
  {
    id: 'community',
    order: 8,
    title: 'Share Your Project',
    shortDescription: 'Publish your electronics creation and collaborate with the community.',
    fullDescription: 'Share your working circuits, fork other students\' remixes, and collaborate in peer engineering groups.',
    duration: '1.5 min',
    difficulty: 'Beginner',
    category: 'Community & Collaboration',
    learningObjectives: [
      'Understand project visibility (Private vs Public)',
      'Add descriptions, tags, and cover details',
      'Publish your project for community remixing'
    ],
    accessibleSteps: [
      'Step 1: Click "Publish" in the Studio top bar.',
      'Step 2: Set visibility to "Public Community".',
      'Step 3: Add tags and a description explaining your circuit.',
      'Step 4: Confirm publication to make your project remixable by peers.'
    ],
    cursors: [
      {
        id: 'guide-8',
        name: 'Community Lead',
        color: '#ec4899',
        start: { x: '70%', y: '20%' },
        script: [
          { action: 'say', text: 'Share your creation!', duration: 1500 },
          { action: 'hover', target: '[data-tour-target="publish-project-btn"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="publish-project-btn"]' },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="visibility-public-toggle"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="visibility-public-toggle"]' },
          { action: 'say', text: 'Visibility set to Public', duration: 1600 },
          { action: 'wait', duration: 600 },
          { action: 'hover', target: '[data-tour-target="confirm-publish-btn"]', duration: 900 },
          { action: 'click', target: '[data-tour-target="confirm-publish-btn"]' },
          { action: 'say', text: 'Published to Community!', duration: 1800 },
          { action: 'wait', duration: 1200 }
        ]
      }
    ]
  }
];

export function getLessonById(lessonId) {
  return TUTORIAL_LESSONS.find(l => l.id === lessonId) || TUTORIAL_LESSONS[0];
}
