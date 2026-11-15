/**
 * Tracewise Official Starter Projects
 * Real, structured circuit records with valid pin endpoints and Arduino C++
 */

export const STARTER_PROJECTS = [
  {
    schemaVersion: 1,
    id: 'starter-traffic-light',
    title: 'Arduino Traffic Light Controller',
    description: '3-stage automated traffic sequence with Red, Yellow, Green LEDs and current limiting resistors.',
    level: 'Beginner',
    category: 'State Machine',
    thumbnail: '/assets/starters/traffic-light.webp',
    boardId: 'uno-main',
    components: [
      {
        id: 'uno-main',
        type: 'arduino-uno',
        name: 'Arduino Uno R3',
        x: 60,
        y: 120,
        props: { model: 'Uno R3' }
      },
      {
        id: 'led-red',
        type: 'led',
        name: 'Red LED',
        x: 480,
        y: 60,
        props: { color: 'red' }
      },
      {
        id: 'res-red',
        type: 'resistor',
        name: '220Ω Resistor (Red)',
        x: 580,
        y: 75,
        props: { resistance: '220Ω' }
      },
      {
        id: 'led-yellow',
        type: 'led',
        name: 'Yellow LED',
        x: 480,
        y: 160,
        props: { color: 'yellow' }
      },
      {
        id: 'res-yellow',
        type: 'resistor',
        name: '220Ω Resistor (Yellow)',
        x: 580,
        y: 175,
        props: { resistance: '220Ω' }
      },
      {
        id: 'led-green',
        type: 'led',
        name: 'Green LED',
        x: 480,
        y: 260,
        props: { color: 'green' }
      },
      {
        id: 'res-green',
        type: 'resistor',
        name: '220Ω Resistor (Green)',
        x: 580,
        y: 275,
        props: { resistance: '220Ω' }
      }
    ],
    connections: [
      {
        id: 'wire-red-sig',
        from: { componentId: 'uno-main', pinId: 'D2' },
        to: { componentId: 'led-red', pinId: 'anode' },
        color: '#EF4444',
        label: 'Red Signal (D2)'
      },
      {
        id: 'wire-red-res',
        from: { componentId: 'led-red', pinId: 'cathode' },
        to: { componentId: 'res-red', pinId: 'lead1' },
        color: '#0F172A',
        label: 'Red Cathode'
      },
      {
        id: 'wire-red-gnd',
        from: { componentId: 'res-red', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND' },
        color: '#0F172A',
        label: 'Ground'
      },
      {
        id: 'wire-yel-sig',
        from: { componentId: 'uno-main', pinId: 'D3' },
        to: { componentId: 'led-yellow', pinId: 'anode' },
        color: '#EAB308',
        label: 'Yellow Signal (D3)'
      },
      {
        id: 'wire-yel-res',
        from: { componentId: 'led-yellow', pinId: 'cathode' },
        to: { componentId: 'res-yellow', pinId: 'lead1' },
        color: '#0F172A',
        label: 'Yellow Cathode'
      },
      {
        id: 'wire-yel-gnd',
        from: { componentId: 'res-yellow', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND' },
        color: '#0F172A',
        label: 'Ground'
      },
      {
        id: 'wire-grn-sig',
        from: { componentId: 'uno-main', pinId: 'D4' },
        to: { componentId: 'led-green', pinId: 'anode' },
        color: '#187A57',
        label: 'Green Signal (D4)'
      },
      {
        id: 'wire-grn-res',
        from: { componentId: 'led-green', pinId: 'cathode' },
        to: { componentId: 'res-green', pinId: 'lead1' },
        color: '#0F172A',
        label: 'Green Cathode'
      },
      {
        id: 'wire-grn-gnd',
        from: { componentId: 'res-green', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND_2' },
        color: '#0F172A',
        label: 'Ground'
      }
    ],
    firmware: {
      language: 'arduino-cpp',
      mainFile: 'traffic_light.ino',
      files: [
        {
          path: 'traffic_light.ino',
          content: `// Tracewise Traffic Light Controller
// Pins: Red = D2, Yellow = D3, Green = D4

const int RED_PIN = 2;
const int YELLOW_PIN = 3;
const int GREEN_PIN = 4;

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(YELLOW_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Traffic system initialized.");
}

void loop() {
  // 1. Red Light Stop
  digitalWrite(RED_PIN, HIGH);
  digitalWrite(YELLOW_PIN, LOW);
  digitalWrite(GREEN_PIN, LOW);
  delay(3000);

  // 2. Red + Yellow Preparation
  digitalWrite(YELLOW_PIN, HIGH);
  delay(1000);

  // 3. Green Light Go
  digitalWrite(RED_PIN, LOW);
  digitalWrite(YELLOW_PIN, LOW);
  digitalWrite(GREEN_PIN, HIGH);
  delay(3000);

  // 4. Yellow Light Caution
  digitalWrite(GREEN_PIN, LOW);
  digitalWrite(YELLOW_PIN, HIGH);
  delay(1200);
}
`
        }
      ]
    },
    version: {
      id: 'v1.0-baseline',
      label: 'Verified Baseline',
      parentId: null,
      createdAt: '2026-11-15T10:00:00.000Z'
    },
    history: [],
    validationResults: [
      {
        id: 'chk-1',
        name: 'Component Endpoint Validation',
        status: 'PASSED',
        message: 'All 7 components and 9 wire endpoints match catalog specifications.'
      },
      {
        id: 'chk-2',
        name: 'Firmware Pin Consistency',
        status: 'PASSED',
        message: 'Code pins (D2, D3, D4) match hardware wired pins.'
      },
      {
        id: 'chk-3',
        name: 'LED Current Protection',
        status: 'PASSED',
        message: 'All 3 LEDs have dedicated 220Ω current-limiting resistors.'
      }
    ],
    visibility: 'public',
    updatedAt: '2026-11-15T10:00:00.000Z'
  },
  {
    schemaVersion: 1,
    id: 'starter-traffic-light-buggy',
    title: 'Pedestrian Crossing Remix (With Pin Mismatch)',
    description: 'A student fork of the traffic light adding a pedestrian crosswalk button, but introducing a detectable pin mismatch bug.',
    level: 'Intermediate',
    category: 'Debugging Challenge',
    thumbnail: '/assets/starters/project-remix.webp',
    boardId: 'uno-main',
    components: [
      {
        id: 'uno-main',
        type: 'arduino-uno',
        name: 'Arduino Uno R3',
        x: 60,
        y: 120,
        props: { model: 'Uno R3' }
      },
      {
        id: 'led-red',
        type: 'led',
        name: 'Red LED',
        x: 480,
        y: 60,
        props: { color: 'red' }
      },
      {
        id: 'res-red',
        type: 'resistor',
        name: '220Ω Resistor (Red)',
        x: 580,
        y: 75,
        props: { resistance: '220Ω' }
      },
      {
        id: 'led-yellow',
        type: 'led',
        name: 'Yellow LED',
        x: 480,
        y: 160,
        props: { color: 'yellow' }
      },
      {
        id: 'res-yellow',
        type: 'resistor',
        name: '220Ω Resistor (Yellow)',
        x: 580,
        y: 175,
        props: { resistance: '220Ω' }
      },
      {
        id: 'led-green',
        type: 'led',
        name: 'Green LED',
        x: 480,
        y: 260,
        props: { color: 'green' }
      },
      {
        id: 'res-green',
        type: 'resistor',
        name: '220Ω Resistor (Green)',
        x: 580,
        y: 275,
        props: { resistance: '220Ω' }
      },
      {
        id: 'btn-pedestrian',
        type: 'push-button',
        name: 'Pedestrian Cross Button',
        x: 480,
        y: 360,
        props: {}
      }
    ],
    connections: [
      {
        id: 'wire-red-sig',
        from: { componentId: 'uno-main', pinId: 'D2' },
        to: { componentId: 'led-red', pinId: 'anode' },
        color: '#EF4444',
        label: 'Red Signal (D2)'
      },
      {
        id: 'wire-red-res',
        from: { componentId: 'led-red', pinId: 'cathode' },
        to: { componentId: 'res-red', pinId: 'lead1' },
        color: '#0F172A',
        label: 'Red Cathode'
      },
      {
        id: 'wire-red-gnd',
        from: { componentId: 'res-red', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND' },
        color: '#0F172A',
        label: 'Ground'
      },
      {
        id: 'wire-yel-sig',
        from: { componentId: 'uno-main', pinId: 'D3' },
        to: { componentId: 'led-yellow', pinId: 'anode' },
        color: '#EAB308',
        label: 'Yellow Signal (D3)'
      },
      {
        id: 'wire-yel-res',
        from: { componentId: 'led-yellow', pinId: 'cathode' },
        to: { componentId: 'res-yellow', pinId: 'lead1' },
        color: '#0F172A',
        label: 'Yellow Cathode'
      },
      {
        id: 'wire-yel-gnd',
        from: { componentId: 'res-yellow', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND' },
        color: '#0F172A',
        label: 'Ground'
      },
      {
        id: 'wire-grn-sig',
        from: { componentId: 'uno-main', pinId: 'D4' },
        to: { componentId: 'led-green', pinId: 'anode' },
        color: '#187A57',
        label: 'Green Signal (D4)'
      },
      {
        id: 'wire-grn-res',
        from: { componentId: 'led-green', pinId: 'cathode' },
        to: { componentId: 'res-green', pinId: 'lead1' },
        color: '#0F172A',
        label: 'Green Cathode'
      },
      {
        id: 'wire-grn-gnd',
        from: { componentId: 'res-green', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND_2' },
        color: '#0F172A',
        label: 'Ground'
      },
      {
        id: 'wire-btn-sig',
        from: { componentId: 'uno-main', pinId: 'D7' },
        to: { componentId: 'btn-pedestrian', pinId: '1a' },
        color: '#2DC5E9',
        label: 'Button Signal (D7)'
      },
      {
        id: 'wire-btn-gnd',
        from: { componentId: 'btn-pedestrian', pinId: '2b' },
        to: { componentId: 'uno-main', pinId: 'GND_TOP' },
        color: '#0F172A',
        label: 'Button Ground'
      }
    ],
    firmware: {
      language: 'arduino-cpp',
      mainFile: 'traffic_pedestrian.ino',
      files: [
        {
          path: 'traffic_pedestrian.ino',
          content: `// Tracewise Pedestrian Traffic Light Remix
// Notice: Button wire connects to pin D7 on the board,
// BUT line 8 below mistakenly defines BUTTON_PIN as 2!

const int RED_PIN = 2;
const int YELLOW_PIN = 3;
const int GREEN_PIN = 4;
const int BUTTON_PIN = 2; // <--- BUG: Pin D2 is already used for RED_PIN! Wire is on D7!

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(YELLOW_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);
  if (buttonState == LOW) {
    // Pedestrian request triggered
    digitalWrite(GREEN_PIN, LOW);
    digitalWrite(YELLOW_PIN, HIGH);
    delay(1000);
    digitalWrite(YELLOW_PIN, LOW);
    digitalWrite(RED_PIN, HIGH);
    delay(5000);
  } else {
    // Standard green
    digitalWrite(RED_PIN, LOW);
    digitalWrite(YELLOW_PIN, LOW);
    digitalWrite(GREEN_PIN, HIGH);
  }
}
`
        }
      ]
    },
    version: {
      id: 'v1.1-fork',
      label: 'Pedestrian Fork (Buggy)',
      parentId: 'starter-traffic-light',
      createdAt: '2026-11-15T11:30:00.000Z'
    },
    history: [],
    validationResults: [
      {
        id: 'chk-err-1',
        name: 'Firmware Pin Conflict Mismatch',
        status: 'FAILED',
        severity: 'ERROR',
        message: 'Pin D2 is defined as both RED_PIN (Output) and BUTTON_PIN (Input). Meanwhile, physical wire wire-btn-sig is connected to Pin D7!',
        suggestedFix: 'Change line 8 in firmware to: const int BUTTON_PIN = 7;'
      }
    ],
    visibility: 'public',
    updatedAt: '2026-11-15T11:30:00.000Z'
  },
  {
    schemaVersion: 1,
    id: 'starter-button-led',
    title: 'Tactile Push Button & LED',
    description: 'Digital input sensing with tactile switch pull-up and status indicator LED.',
    level: 'Beginner',
    category: 'Input/Output',
    thumbnail: '/assets/starters/button-led.webp',
    boardId: 'uno-main',
    components: [
      {
        id: 'uno-main',
        type: 'arduino-uno',
        name: 'Arduino Uno R3',
        x: 60,
        y: 120,
        props: { model: 'Uno R3' }
      },
      {
        id: 'led-blue',
        type: 'led',
        name: 'Blue LED',
        x: 480,
        y: 100,
        props: { color: 'blue' }
      },
      {
        id: 'res-blue',
        type: 'resistor',
        name: '220Ω Resistor',
        x: 580,
        y: 115,
        props: { resistance: '220Ω' }
      },
      {
        id: 'btn-main',
        type: 'push-button',
        name: 'Push Button',
        x: 480,
        y: 240,
        props: {}
      }
    ],
    connections: [
      {
        id: 'w-led-sig',
        from: { componentId: 'uno-main', pinId: 'D8' },
        to: { componentId: 'led-blue', pinId: 'anode' },
        color: '#3B82F6',
        label: 'LED Signal (D8)'
      },
      {
        id: 'w-led-res',
        from: { componentId: 'led-blue', pinId: 'cathode' },
        to: { componentId: 'res-blue', pinId: 'lead1' },
        color: '#0F172A',
        label: 'LED Cathode'
      },
      {
        id: 'w-res-gnd',
        from: { componentId: 'res-blue', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND' },
        color: '#0F172A',
        label: 'Ground'
      },
      {
        id: 'w-btn-sig',
        from: { componentId: 'uno-main', pinId: 'D7' },
        to: { componentId: 'btn-main', pinId: '1a' },
        color: '#2DC5E9',
        label: 'Button Signal (D7)'
      },
      {
        id: 'w-btn-gnd',
        from: { componentId: 'btn-main', pinId: '2b' },
        to: { componentId: 'uno-main', pinId: 'GND_2' },
        color: '#0F172A',
        label: 'Button Ground'
      }
    ],
    firmware: {
      language: 'arduino-cpp',
      mainFile: 'button_led.ino',
      files: [
        {
          path: 'button_led.ino',
          content: `const int LED_PIN = 8;
const int BUTTON_PIN = 7;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  int pressed = digitalRead(BUTTON_PIN) == LOW;
  digitalWrite(LED_PIN, pressed ? HIGH : LOW);
}
`
        }
      ]
    },
    version: { id: 'v1.0', label: 'Baseline', parentId: null, createdAt: '2026-11-15T09:00:00.000Z' },
    history: [],
    validationResults: [],
    visibility: 'public',
    updatedAt: '2026-11-15T09:00:00.000Z'
  },
  {
    schemaVersion: 1,
    id: 'starter-led-blink',
    title: 'Heartbeat LED Blink',
    description: 'The fundamental hello-world of embedded electronics. Digital output pin 13 control.',
    level: 'Beginner',
    category: 'GPIO Basics',
    thumbnail: '/assets/starters/led-blink.webp',
    boardId: 'uno-main',
    components: [
      {
        id: 'uno-main',
        type: 'arduino-uno',
        name: 'Arduino Uno R3',
        x: 60,
        y: 120,
        props: { model: 'Uno R3' }
      },
      {
        id: 'led-red',
        type: 'led',
        name: 'Red LED',
        x: 480,
        y: 120,
        props: { color: 'red' }
      },
      {
        id: 'res-red',
        type: 'resistor',
        name: '220Ω Resistor',
        x: 580,
        y: 135,
        props: { resistance: '220Ω' }
      }
    ],
    connections: [
      {
        id: 'w1',
        from: { componentId: 'uno-main', pinId: 'D13' },
        to: { componentId: 'led-red', pinId: 'anode' },
        color: '#EF4444'
      },
      {
        id: 'w2',
        from: { componentId: 'led-red', pinId: 'cathode' },
        to: { componentId: 'res-red', pinId: 'lead1' },
        color: '#0F172A'
      },
      {
        id: 'w3',
        from: { componentId: 'res-red', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND_TOP' },
        color: '#0F172A'
      }
    ],
    firmware: {
      language: 'arduino-cpp',
      mainFile: 'blink.ino',
      files: [
        {
          path: 'blink.ino',
          content: `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
`
        }
      ]
    },
    version: { id: 'v1.0', label: 'Baseline', parentId: null, createdAt: '2026-11-15T08:00:00.000Z' },
    history: [],
    validationResults: [],
    visibility: 'public',
    updatedAt: '2026-11-15T08:00:00.000Z'
  },
  {
    schemaVersion: 1,
    id: 'starter-analog-dimmer',
    title: 'PWM Analog LED Dimmer',
    description: 'Pulse Width Modulation (PWM) on pin D9 controlling LED brightness smoothly.',
    level: 'Intermediate',
    category: 'Analog & PWM',
    thumbnail: '/assets/starters/circuit-code.webp',
    boardId: 'uno-main',
    components: [
      {
        id: 'uno-main',
        type: 'arduino-uno',
        name: 'Arduino Uno R3',
        x: 60,
        y: 120,
        props: { model: 'Uno R3' }
      },
      {
        id: 'led-green',
        type: 'led',
        name: 'Green LED',
        x: 480,
        y: 120,
        props: { color: 'green' }
      },
      {
        id: 'res-green',
        type: 'resistor',
        name: '220Ω Resistor',
        x: 580,
        y: 135,
        props: { resistance: '220Ω' }
      }
    ],
    connections: [
      {
        id: 'w1',
        from: { componentId: 'uno-main', pinId: 'D9' },
        to: { componentId: 'led-green', pinId: 'anode' },
        color: '#187A57'
      },
      {
        id: 'w2',
        from: { componentId: 'led-green', pinId: 'cathode' },
        to: { componentId: 'res-green', pinId: 'lead1' },
        color: '#0F172A'
      },
      {
        id: 'w3',
        from: { componentId: 'res-green', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND' },
        color: '#0F172A'
      }
    ],
    firmware: {
      language: 'arduino-cpp',
      mainFile: 'pwm_fade.ino',
      files: [
        {
          path: 'pwm_fade.ino',
          content: `const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  // Fade in
  for (int b = 0; b <= 255; b += 5) {
    analogWrite(LED_PIN, b);
    delay(25);
  }
  // Fade out
  for (int b = 255; b >= 0; b -= 5) {
    analogWrite(LED_PIN, b);
    delay(25);
  }
}
`
        }
      ]
    },
    version: { id: 'v1.0', label: 'Baseline', parentId: null, createdAt: '2026-11-15T08:30:00.000Z' },
    history: [],
    validationResults: [],
    visibility: 'public',
    updatedAt: '2026-11-15T08:30:00.000Z'
  }
];
