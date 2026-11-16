/**
 * Tracewise Project Builder — Canonical Project Templates
 * Verified, catalog-grounded templates for educational electronics.
 */

/**
 * Three-Color Button-Controlled Disco Light
 * Requirements:
 * - 1x Arduino Uno R3
 * - 1x Half Breadboard
 * - 3x LEDs (Red, Green, Blue)
 * - 3x 220Ω Resistors
 * - 3x Push Buttons
 * Total: 11 component instances.
 * Behavior:
 * - Press Button 1 -> Red LED turns on.
 * - Press Button 2 -> Green LED turns on, Red turns off.
 * - Press Button 3 -> Blue LED turns on, others turn off.
 * - Only one LED active at a time; stays active until another button is pressed.
 */
export function createDiscoLightBuildPlan(customTitle = null) {
  return {
    title: customTitle || 'Three-Color Button-Controlled Disco Light',
    description: 'Interactive lighting controller: Pressing Button 1, 2, or 3 switches between Red, Green, and Blue LEDs with debounced single-color state machine.',
    targetBoard: 'uno-main',
    behavior: 'One-at-a-time LED selection controlled by 3 momentary push buttons with INPUT_PULLUP.',
    components: [
      {
        id: 'uno-main',
        type: 'arduino-uno',
        name: 'Arduino Uno R3',
        x: 60,
        y: 140,
        props: { model: 'Uno R3', voltage: '5V' }
      },
      {
        id: 'bb-main',
        type: 'breadboard-half',
        name: 'Half Breadboard',
        x: 420,
        y: 120,
        props: { rows: 30 }
      },
      // 3 Colored LEDs
      {
        id: 'led-red',
        type: 'led',
        name: 'Red LED',
        x: 440,
        y: 330,
        props: { color: 'red' }
      },
      {
        id: 'led-green',
        type: 'led',
        name: 'Green LED',
        x: 560,
        y: 330,
        props: { color: 'green' }
      },
      {
        id: 'led-blue',
        type: 'led',
        name: 'Blue LED',
        x: 680,
        y: 330,
        props: { color: 'blue' }
      },
      // 3 Series Current-Limiting Resistors (220Ω)
      {
        id: 'res-red',
        type: 'resistor',
        name: '220Ω Resistor (Red)',
        x: 430,
        y: 415,
        props: { resistance: '220Ω' }
      },
      {
        id: 'res-green',
        type: 'resistor',
        name: '220Ω Resistor (Green)',
        x: 550,
        y: 415,
        props: { resistance: '220Ω' }
      },
      {
        id: 'res-blue',
        type: 'resistor',
        name: '220Ω Resistor (Blue)',
        x: 670,
        y: 415,
        props: { resistance: '220Ω' }
      },
      // 3 Momentary Push Buttons (Tactile switches)
      {
        id: 'btn-red',
        type: 'push-button',
        name: 'Button 1 (Red Selector)',
        x: 435,
        y: 500,
        props: {}
      },
      {
        id: 'btn-green',
        type: 'push-button',
        name: 'Button 2 (Green Selector)',
        x: 555,
        y: 500,
        props: {}
      },
      {
        id: 'btn-blue',
        type: 'push-button',
        name: 'Button 3 (Blue Selector)',
        x: 675,
        y: 500,
        props: {}
      }
    ],
    connections: [
      // Button 1 (Red Selector) -> Arduino D2
      {
        id: 'wire-btn-red-sig',
        from: { componentId: 'uno-main', pinId: 'D2' },
        to: { componentId: 'btn-red', pinId: '1a' },
        color: '#2DC5E9',
        label: 'Button 1 Signal (D2)'
      },
      {
        id: 'wire-btn-red-gnd',
        from: { componentId: 'btn-red', pinId: '2a' },
        to: { componentId: 'uno-main', pinId: 'GND_TOP' },
        color: '#0F172A',
        label: 'Button 1 Ground Return'
      },
      // Button 2 (Green Selector) -> Arduino D3
      {
        id: 'wire-btn-grn-sig',
        from: { componentId: 'uno-main', pinId: 'D3' },
        to: { componentId: 'btn-green', pinId: '1a' },
        color: '#187A57',
        label: 'Button 2 Signal (D3)'
      },
      {
        id: 'wire-btn-grn-gnd',
        from: { componentId: 'btn-green', pinId: '2a' },
        to: { componentId: 'uno-main', pinId: 'GND_TOP' },
        color: '#0F172A',
        label: 'Button 2 Ground Return'
      },
      // Button 3 (Blue Selector) -> Arduino D4
      {
        id: 'wire-btn-blu-sig',
        from: { componentId: 'uno-main', pinId: 'D4' },
        to: { componentId: 'btn-blue', pinId: '1a' },
        color: '#3B82F6',
        label: 'Button 3 Signal (D4)'
      },
      {
        id: 'wire-btn-blu-gnd',
        from: { componentId: 'btn-blue', pinId: '2a' },
        to: { componentId: 'uno-main', pinId: 'GND_TOP' },
        color: '#0F172A',
        label: 'Button 3 Ground Return'
      },
      // Red LED Output -> Arduino D8 through 220Ω Resistor
      {
        id: 'wire-led-red-sig',
        from: { componentId: 'uno-main', pinId: 'D8' },
        to: { componentId: 'led-red', pinId: 'anode' },
        color: '#EF4444',
        label: 'Red LED Signal (D8)'
      },
      {
        id: 'wire-led-red-res',
        from: { componentId: 'led-red', pinId: 'cathode' },
        to: { componentId: 'res-red', pinId: 'lead1' },
        color: '#0F172A',
        label: 'Red Cathode to Resistor'
      },
      {
        id: 'wire-res-red-gnd',
        from: { componentId: 'res-red', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND' },
        color: '#0F172A',
        label: 'Red Ground Return'
      },
      // Green LED Output -> Arduino D9 through 220Ω Resistor
      {
        id: 'wire-led-grn-sig',
        from: { componentId: 'uno-main', pinId: 'D9' },
        to: { componentId: 'led-green', pinId: 'anode' },
        color: '#187A57',
        label: 'Green LED Signal (D9)'
      },
      {
        id: 'wire-led-grn-res',
        from: { componentId: 'led-green', pinId: 'cathode' },
        to: { componentId: 'res-green', pinId: 'lead1' },
        color: '#0F172A',
        label: 'Green Cathode to Resistor'
      },
      {
        id: 'wire-res-grn-gnd',
        from: { componentId: 'res-green', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND' },
        color: '#0F172A',
        label: 'Green Ground Return'
      },
      // Blue LED Output -> Arduino D10 through 220Ω Resistor
      {
        id: 'wire-led-blu-sig',
        from: { componentId: 'uno-main', pinId: 'D10' },
        to: { componentId: 'led-blue', pinId: 'anode' },
        color: '#3B82F6',
        label: 'Blue LED Signal (D10)'
      },
      {
        id: 'wire-led-blu-res',
        from: { componentId: 'led-blue', pinId: 'cathode' },
        to: { componentId: 'res-blue', pinId: 'lead1' },
        color: '#0F172A',
        label: 'Blue Cathode to Resistor'
      },
      {
        id: 'wire-res-blu-gnd',
        from: { componentId: 'res-blue', pinId: 'lead2' },
        to: { componentId: 'uno-main', pinId: 'GND_2' },
        color: '#0F172A',
        label: 'Blue Ground Return'
      }
    ],
    firmware: {
      language: 'arduino-cpp',
      mainFile: 'disco_light.ino',
      files: [
        {
          path: 'disco_light.ino',
          content: `// Tracewise Disco Light Controller
// 3-Color Button-Controlled LED Switcher
//
// Hardware Pin Allocation:
// - Button 1 (Red Selector):   Pin D2 (INPUT_PULLUP, active LOW)
// - Button 2 (Green Selector): Pin D3 (INPUT_PULLUP, active LOW)
// - Button 3 (Blue Selector):  Pin D4 (INPUT_PULLUP, active LOW)
// - Red LED (via 220Ω):        Pin D8 (OUTPUT)
// - Green LED (via 220Ω):      Pin D9 (OUTPUT)
// - Blue LED (via 220Ω):       Pin D10 (OUTPUT)

const int BTN_RED = 2;
const int BTN_GREEN = 3;
const int BTN_BLUE = 4;

const int LED_RED = 8;
const int LED_GREEN = 9;
const int LED_BLUE = 10;

// Active color mode: 1 = Red, 2 = Green, 3 = Blue
int currentMode = 1;

// Debounce state tracking
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

void setup() {
  // Initialize LED outputs
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);

  // Initialize push buttons with internal pull-up resistors (active LOW)
  pinMode(BTN_RED, INPUT_PULLUP);
  pinMode(BTN_GREEN, INPUT_PULLUP);
  pinMode(BTN_BLUE, INPUT_PULLUP);

  Serial.begin(9600);
  Serial.println("Disco Light Controller Initialized.");

  // Display initial color
  updateLeds(currentMode);
}

void updateLeds(int mode) {
  // Turn off all LEDs first (strictly one active at a time)
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_BLUE, LOW);

  // Activate only the selected LED
  if (mode == 1) {
    digitalWrite(LED_RED, HIGH);
    Serial.println("Active Mode: RED LED");
  } else if (mode == 2) {
    digitalWrite(LED_GREEN, HIGH);
    Serial.println("Active Mode: GREEN LED");
  } else if (mode == 3) {
    digitalWrite(LED_BLUE, HIGH);
    Serial.println("Active Mode: BLUE LED");
  }
}

void loop() {
  // Read momentary push buttons (LOW when pressed)
  bool redPressed = (digitalRead(BTN_RED) == LOW);
  bool greenPressed = (digitalRead(BTN_GREEN) == LOW);
  bool bluePressed = (digitalRead(BTN_BLUE) == LOW);

  // Debounced button state switching
  if (millis() - lastDebounceTime > debounceDelay) {
    if (redPressed && currentMode != 1) {
      currentMode = 1;
      updateLeds(currentMode);
      lastDebounceTime = millis();
    } else if (greenPressed && currentMode != 2) {
      currentMode = 2;
      updateLeds(currentMode);
      lastDebounceTime = millis();
    } else if (bluePressed && currentMode != 3) {
      currentMode = 3;
      updateLeds(currentMode);
      lastDebounceTime = millis();
    }
  }
}
`
        }
      ]
    }
  };
}

/**
 * Generates an accurate, grounded circuit explanation for the Disco Light project.
 */
export function generateGroundedCircuitExplanation(project) {
  const comps = project?.components || [];
  const wires = project?.connections || [];
  return `### 💡 Circuit Explanation: Three-Color Disco Light

Here is how your circuit works from hardware to firmware:

#### 1. Button Inputs (Pins D2, D3, D4)
- **Button 1 (Red Selector):** Wired to Arduino **D2** (Pin 1a) and **Ground** (Pin 2a).
- **Button 2 (Green Selector):** Wired to Arduino **D3** (Pin 1a) and **Ground** (Pin 2a).
- **Button 3 (Blue Selector):** Wired to Arduino **D4** (Pin 1a) and **Ground** (Pin 2a).
- In firmware, each button pin is initialized with \`pinMode(pin, INPUT_PULLUP)\`. The internal pullup resistor holds the input at **5V (HIGH)** when released. When a button is pressed, the internal switch contacts close to Ground, pulling the digital pin to **0V (LOW)**.

#### 2. LED Outputs (Pins D8, D9, D10)
- **Red LED:** Anode driven by **D8**, cathode wired through a **220Ω resistor** to Arduino Ground.
- **Green LED:** Anode driven by **D9**, cathode wired through a **220Ω resistor** to Arduino Ground.
- **Blue LED:** Anode driven by **D10**, cathode wired through a **220Ω resistor** to Arduino Ground.
- The 220 Ohm series resistors limit current to ~15mA per LED (calculated via Ohm's Law: (5V - 2.0V) / 220Ω ≈ 13.6mA), preventing damage to the ATmega328P I/O pins and protecting the LEDs.

#### 3. State Machine & Debounce Logic
- The \`loop()\` function monitors the three button inputs using a 50ms software debounce timer (\`lastDebounceTime\`).
- When Button 1 is pressed, \`currentMode\` updates to 1: Red turns ON, Green & Blue turn OFF.
- When Button 2 is pressed, \`currentMode\` updates to 2: Green turns ON, others turn OFF.
- When Button 3 is pressed, \`currentMode\` updates to 3: Blue turns ON, others turn OFF.
- Only one LED is active at a time, and the selected color remains lit until a different button is pressed.`;
}
