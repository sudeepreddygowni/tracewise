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
 * RGB Mood Light Build Plan
 * Requirements:
 * - 1x Arduino Uno R3
 * - 1x Half Breadboard
 * - 1x RGB LED (Common Cathode)
 * - 3x 220Ω Resistors (Red on D9, Green on D10, Blue on D11)
 */
export function createRgbMoodLightBuildPlan(customTitle = null) {
  return {
    title: customTitle || 'RGB LED Mood Light & Color Mixer',
    description: 'Dynamic PWM color fader using a common cathode RGB LED with 3 series 220Ω resistors on PWM pins D9, D10, and D11.',
    targetBoard: 'uno-main',
    behavior: 'Smoothly cycles through red, green, blue, cyan, magenta, and amber color spectra.',
    components: [
      { id: 'uno-main', type: 'arduino-uno', name: 'Arduino Uno R3', x: 60, y: 140, props: { model: 'Uno R3', voltage: '5V' } },
      { id: 'bb-main', type: 'breadboard-half', name: 'Half Breadboard', x: 420, y: 120, props: { rows: 30 } },
      { id: 'rgb-1', type: 'rgb-led', name: 'RGB LED (Common Cathode)', x: 480, y: 310, props: { model: 'Common Cathode' } },
      { id: 'res-r', type: 'resistor', name: '220Ω Resistor (Red)', x: 440, y: 410, props: { resistance: '220Ω' } },
      { id: 'res-g', type: 'resistor', name: '220Ω Resistor (Green)', x: 520, y: 410, props: { resistance: '220Ω' } },
      { id: 'res-b', type: 'resistor', name: '220Ω Resistor (Blue)', x: 600, y: 410, props: { resistance: '220Ω' } }
    ],
    connections: [
      { id: 'w-uno-gnd', from: { componentId: 'uno-main', pinId: 'GND' }, to: { componentId: 'bb-main', pinId: 'rail-bot-neg' }, color: '#0F172A', label: 'Ground Rail' },
      { id: 'w-rgb-cat', from: { componentId: 'rgb-1', pinId: 'cathode' }, to: { componentId: 'bb-main', pinId: 'rail-bot-neg' }, color: '#0F172A', label: 'RGB Cathode to GND' },
      { id: 'w-uno-d9', from: { componentId: 'uno-main', pinId: 'D9' }, to: { componentId: 'res-r', pinId: 'lead1' }, color: '#EF4444', label: 'PWM Pin 9 to Red Resistor' },
      { id: 'w-res-r-lead', from: { componentId: 'res-r', pinId: 'lead2' }, to: { componentId: 'rgb-1', pinId: 'red' }, color: '#EF4444', label: 'Red Anode Lead' },
      { id: 'w-uno-d10', from: { componentId: 'uno-main', pinId: 'D10' }, to: { componentId: 'res-g', pinId: 'lead1' }, color: '#187A57', label: 'PWM Pin 10 to Green Resistor' },
      { id: 'w-res-g-lead', from: { componentId: 'res-g', pinId: 'lead2' }, to: { componentId: 'rgb-1', pinId: 'green' }, color: '#187A57', label: 'Green Anode Lead' },
      { id: 'w-uno-d11', from: { componentId: 'uno-main', pinId: 'D11' }, to: { componentId: 'res-b', pinId: 'lead1' }, color: '#3B82F6', label: 'PWM Pin 11 to Blue Resistor' },
      { id: 'w-res-b-lead', from: { componentId: 'res-b', pinId: 'lead2' }, to: { componentId: 'rgb-1', pinId: 'blue' }, color: '#3B82F6', label: 'Blue Anode Lead' }
    ],
    firmware: {
      files: [
        {
          name: 'sketch.ino',
          content: `// Tracewise RGB LED Mood Light & Color Mixer
const int RED_PIN = 9;
const int GREEN_PIN = 10;
const int BLUE_PIN = 11;

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
}

void setColor(int redVal, int greenVal, int blueVal) {
  analogWrite(RED_PIN, redVal);
  analogWrite(GREEN_PIN, greenVal);
  analogWrite(BLUE_PIN, blueVal);
}

void loop() {
  // Red
  setColor(255, 0, 0);
  delay(1000);
  // Green
  setColor(0, 255, 0);
  delay(1000);
  // Blue
  setColor(0, 0, 255);
  delay(1000);
  // Cyan
  setColor(0, 255, 255);
  delay(1000);
  // Amber / Yellow
  setColor(255, 180, 0);
  delay(1000);
}
`
        }
      ]
    }
  };
}

/**
 * Potentiometer Dimmer Build Plan
 */
export function createPotentiometerDimmerBuildPlan(customTitle = null) {
  return {
    title: customTitle || 'Rotary Potentiometer LED Dimmer',
    description: 'Analog input control: Reading 10k potentiometer wiper on A0 and mapping 0–1023 to PWM brightness on pin D9.',
    targetBoard: 'uno-main',
    behavior: 'Rotating the potentiometer smoothly scales the LED brightness from 0% to 100%.',
    components: [
      { id: 'uno-main', type: 'arduino-uno', name: 'Arduino Uno R3', x: 60, y: 140, props: { model: 'Uno R3', voltage: '5V' } },
      { id: 'bb-main', type: 'breadboard-half', name: 'Half Breadboard', x: 420, y: 120, props: { rows: 30 } },
      { id: 'pot-1', type: 'potentiometer', name: '10kΩ Potentiometer', x: 460, y: 280, props: { resistance: '10kΩ', value: 512 } },
      { id: 'led-1', type: 'led', name: 'Red Indicator LED', x: 620, y: 310, props: { color: 'red' } },
      { id: 'res-1', type: 'resistor', name: '220Ω Resistor', x: 620, y: 410, props: { resistance: '220Ω' } }
    ],
    connections: [
      { id: 'w-uno-5v', from: { componentId: 'uno-main', pinId: '5V' }, to: { componentId: 'pot-1', pinId: 'pin1' }, color: '#EF4444', label: '5V to Pot Terminal 1' },
      { id: 'w-uno-gnd', from: { componentId: 'uno-main', pinId: 'GND' }, to: { componentId: 'pot-1', pinId: 'pin3' }, color: '#0F172A', label: 'GND to Pot Terminal 2' },
      { id: 'w-pot-wiper', from: { componentId: 'pot-1', pinId: 'wiper' }, to: { componentId: 'uno-main', pinId: 'A0' }, color: '#EAB308', label: 'Pot Wiper to Analog A0' },
      { id: 'w-uno-d9', from: { componentId: 'uno-main', pinId: 'D9' }, to: { componentId: 'led-1', pinId: 'anode' }, color: '#3B82F6', label: 'PWM Pin 9 to LED Anode' },
      { id: 'w-led-res', from: { componentId: 'led-1', pinId: 'cathode' }, to: { componentId: 'res-1', pinId: 'lead1' }, color: '#0F172A', label: 'LED Cathode to Resistor' },
      { id: 'w-res-gnd', from: { componentId: 'res-1', pinId: 'lead2' }, to: { componentId: 'uno-main', pinId: 'GND_2' }, color: '#0F172A', label: 'Resistor to Ground' }
    ],
    firmware: {
      files: [
        {
          name: 'sketch.ino',
          content: `// Tracewise Potentiometer Dimmer
const int POT_PIN = A0;
const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  // Read analog input (0 - 1023)
  int potValue = analogRead(POT_PIN);
  
  // Map to 8-bit PWM range (0 - 255)
  int brightness = map(potValue, 0, 1023, 0, 255);
  
  // Drive LED brightness
  analogWrite(LED_PIN, brightness);
  delay(15);
}
`
        }
      ]
    }
  };
}

/**
 * Active Buzzer Sound Alarm Build Plan
 */
export function createBuzzerAlarmBuildPlan(customTitle = null) {
  return {
    title: customTitle || 'Push-Button Sound Alarm & Active Buzzer',
    description: 'Security & alert circuit: Pressing the push button triggers the 2.5kHz active piezo buzzer sound.',
    targetBoard: 'uno-main',
    behavior: 'Press button on D2 -> Active Buzzer on D8 sounds audible tone.',
    components: [
      { id: 'uno-main', type: 'arduino-uno', name: 'Arduino Uno R3', x: 60, y: 140, props: { model: 'Uno R3', voltage: '5V' } },
      { id: 'bb-main', type: 'breadboard-half', name: 'Half Breadboard', x: 420, y: 120, props: { rows: 30 } },
      { id: 'btn-1', type: 'push-button', name: 'Alarm Trigger Button', x: 460, y: 310, props: { color: 'red' } },
      { id: 'buzzer-1', type: 'buzzer', name: 'Active Piezo Buzzer', x: 600, y: 300, props: { tone: '2.5kHz' } }
    ],
    connections: [
      { id: 'w-uno-gnd', from: { componentId: 'uno-main', pinId: 'GND_TOP' }, to: { componentId: 'btn-1', pinId: '2a' }, color: '#0F172A', label: 'Button Ground Return' },
      { id: 'w-btn-d2', from: { componentId: 'btn-1', pinId: '1a' }, to: { componentId: 'uno-main', pinId: 'D2' }, color: '#187A57', label: 'Button to Digital Pin 2' },
      { id: 'w-buz-d8', from: { componentId: 'buzzer-1', pinId: 'anode' }, to: { componentId: 'uno-main', pinId: 'D8' }, color: '#F97316', label: 'Buzzer (+) to Pin 8' },
      { id: 'w-buz-gnd', from: { componentId: 'buzzer-1', pinId: 'cathode' }, to: { componentId: 'uno-main', pinId: 'GND' }, color: '#0F172A', label: 'Buzzer (-) to Ground' }
    ],
    firmware: {
      files: [
        {
          name: 'sketch.ino',
          content: `// Tracewise Active Buzzer Alarm Controller
const int BUTTON_PIN = 2;
const int BUZZER_PIN = 8;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);
  if (buttonState == LOW) { // Button pressed
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }
}
`
        }
      ]
    }
  };
}

/**
 * Creates a complete build plan for a 3-Color Traffic Light Controller.
 */
export function createTrafficLightBuildPlan(customTitle = null) {
  return {
    title: customTitle || 'Automated 3-Color Traffic Light Sequence',
    description: '3-stage automated traffic light with Red, Yellow, and Green LEDs and 220Ω current-limiting resistors.',
    targetBoard: 'uno-main',
    components: [
      { id: 'uno-main', type: 'arduino-uno', name: 'Arduino Uno R3', x: 80, y: 140, props: { model: 'Uno R3' } },
      { id: 'bb-1', type: 'breadboard-half', name: 'Half Breadboard', x: 440, y: 140 },
      { id: 'led-red', type: 'led', name: 'Red LED', x: 470, y: 70, props: { color: 'red' } },
      { id: 'led-yel', type: 'led', name: 'Yellow LED', x: 540, y: 70, props: { color: 'yellow' } },
      { id: 'led-grn', type: 'led', name: 'Green LED', x: 610, y: 70, props: { color: 'green' } },
      { id: 'res-red', type: 'resistor', name: '220Ω Resistor (Red)', x: 470, y: 170, props: { resistance: '220Ω' } },
      { id: 'res-yel', type: 'resistor', name: '220Ω Resistor (Yellow)', x: 540, y: 170, props: { resistance: '220Ω' } },
      { id: 'res-grn', type: 'resistor', name: '220Ω Resistor (Green)', x: 610, y: 170, props: { resistance: '220Ω' } }
    ],
    connections: [
      { id: 'w-red-sig', from: { componentId: 'uno-main', pinId: 'D11' }, to: { componentId: 'led-red', pinId: 'anode' }, color: '#ef4444' },
      { id: 'w-red-res', from: { componentId: 'led-red', pinId: 'cathode' }, to: { componentId: 'res-red', pinId: 'lead1' }, color: '#ef4444' },
      { id: 'w-red-gnd', from: { componentId: 'res-red', pinId: 'lead2' }, to: { componentId: 'uno-main', pinId: 'GND' }, color: '#000000' },

      { id: 'w-yel-sig', from: { componentId: 'uno-main', pinId: 'D12' }, to: { componentId: 'led-yel', pinId: 'anode' }, color: '#eab308' },
      { id: 'w-yel-res', from: { componentId: 'led-yel', pinId: 'cathode' }, to: { componentId: 'res-yel', pinId: 'lead1' }, color: '#eab308' },
      { id: 'w-yel-gnd', from: { componentId: 'res-yel', pinId: 'lead2' }, to: { componentId: 'uno-main', pinId: 'GND' }, color: '#000000' },

      { id: 'w-grn-sig', from: { componentId: 'uno-main', pinId: 'D13' }, to: { componentId: 'led-grn', pinId: 'anode' }, color: '#22c55e' },
      { id: 'w-grn-res', from: { componentId: 'led-grn', pinId: 'cathode' }, to: { componentId: 'res-grn', pinId: 'lead1' }, color: '#22c55e' },
      { id: 'w-grn-gnd', from: { componentId: 'res-grn', pinId: 'lead2' }, to: { componentId: 'uno-main', pinId: 'GND' }, color: '#000000' }
    ],
    firmware: {
      language: 'arduino-cpp',
      files: [
        {
          path: 'sketch.ino',
          content: `// Automated 3-Stage Traffic Light Sequence
const int RED_PIN = 11;
const int YEL_PIN = 12;
const int GRN_PIN = 13;

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(YEL_PIN, OUTPUT);
  pinMode(GRN_PIN, OUTPUT);
}

void loop() {
  // Green active
  digitalWrite(GRN_PIN, HIGH);
  digitalWrite(YEL_PIN, LOW);
  digitalWrite(RED_PIN, LOW);
  delay(3000);

  // Yellow warning
  digitalWrite(GRN_PIN, LOW);
  digitalWrite(YEL_PIN, HIGH);
  digitalWrite(RED_PIN, LOW);
  delay(1000);

  // Red stop
  digitalWrite(GRN_PIN, LOW);
  digitalWrite(YEL_PIN, LOW);
  digitalWrite(RED_PIN, HIGH);
  delay(3000);
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
