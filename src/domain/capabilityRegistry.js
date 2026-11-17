/**
 * Tracewise Authoritative Component Capability Registry
 *
 * Defines the evidence-grounded simulation and engineering capabilities
 * of all components in the Tracewise platform.
 *
 * Capability Levels:
 * - Level 0: Catalog Only (Appears in catalog search and request index)
 * - Level 1: Visual (SVG placed on canvas with correct visual appearance)
 * - Level 2: Wiring (Accurate pins and terminal connections supported)
 * - Level 3: Validated (Structural and electrical netlist rules enforced)
 * - Level 4: Interactive (Interactive behavioral response to student actions)
 * - Level 5: Firmware-Driven (Directly drives or responds to compiled ATmega328P firmware)
 */

export const CAPABILITY_LEVEL = {
  CATALOG_ONLY: 0,
  VISUAL: 1,
  WIRING: 2,
  VALIDATED: 3,
  INTERACTIVE: 4,
  FIRMWARE_DRIVEN: 5
};

export const CAPABILITY_LABELS = {
  0: 'Catalog Only',
  1: 'Visual',
  2: 'Wiring Support',
  3: 'Electrical Rules Validated',
  4: 'Interactive Model',
  5: 'Firmware Simulated'
};

export const COMPONENT_CAPABILITIES = {
  // --- Microcontrollers ---
  'arduino-uno': {
    level: CAPABILITY_LEVEL.FIRMWARE_DRIVEN,
    label: 'Firmware Simulated (avr8js ATmega328P)',
    firmwareExecutable: true,
    supportedPins: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', '5V', '3V3', 'GND', 'VIN'],
    features: ['16MHz Clock Execution', 'Digital I/O', 'Analog ADC (0-5V)', 'PWM Output', 'Timer0/1/2 (millis/micros)', 'Hardware UART Serial Monitor']
  },
  'arduino-nano': {
    level: CAPABILITY_LEVEL.FIRMWARE_DRIVEN,
    label: 'Firmware Simulated (avr8js ATmega328P)',
    firmwareExecutable: true,
    supportedPins: ['D0_RX', 'D1_TX', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '5V', 'GND', '3V3', 'VIN'],
    features: ['Compact ATmega328P Model', 'Breadboard Compatible Pinout', 'Digital I/O', 'ADC (A0-A7)']
  },
  'arduino-mega': {
    level: CAPABILITY_LEVEL.WIRING,
    label: 'Wiring & Pinout Supported (ATmega2560)',
    firmwareExecutable: false,
    limitations: 'Full 54-pin ATmega2560 instruction emulation scheduled for future release; Uno/Nano recommended for executable firmware.'
  },
  'esp32-devkit': {
    level: CAPABILITY_LEVEL.WIRING,
    label: 'Wiring & Pinout Supported (Xtensa LX6)',
    firmwareExecutable: false,
    limitations: 'Xtensa dual-core and Wi-Fi stack require native QEMU emulation; Uno/Nano recommended for executable firmware.'
  },

  // --- Prototyping & Passives ---
  'breadboard-half': {
    level: CAPABILITY_LEVEL.INTERACTIVE,
    label: 'Interactive Terminal Strips & Dual Rails',
    firmwareExecutable: false,
    features: ['Rows 1-30 conductive strips', 'Independent Top and Bottom Power Rails (+/GND)', 'Center Channel Division']
  },
  'breadboard': {
    level: CAPABILITY_LEVEL.INTERACTIVE,
    label: 'Interactive Terminal Strips & Dual Rails',
    firmwareExecutable: false,
    features: ['Standard 830 tie-point solderless breadboard model']
  },
  'resistor': {
    level: CAPABILITY_LEVEL.INTERACTIVE,
    label: 'Current-Limiting & Voltage Division Model',
    firmwareExecutable: false,
    features: ['Two-terminal node separation (Lead 1 != Lead 2)', 'Configurable resistance (Ω / kΩ)', 'Ohm’s law current protection verification']
  },
  'passive-capacitor': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'Polarity & Capacitance Validated',
    firmwareExecutable: false,
    features: ['Capacitance value setting', 'Polarity validation against power rail']
  },
  'passive-diode': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'Rectifier & Bias Validated',
    firmwareExecutable: false,
    features: ['Anode/Cathode directional forward-bias validation']
  },

  // --- Output Devices ---
  'led': {
    level: CAPABILITY_LEVEL.FIRMWARE_DRIVEN,
    label: 'Firmware-Driven LED (Digital & PWM Brightness)',
    firmwareExecutable: true,
    features: ['Responds dynamically to MCU pin HIGH/LOW', 'PWM analogWrite brightness modulation', 'Current-limiting series resistor rule check']
  },
  'rgb-led': {
    level: CAPABILITY_LEVEL.FIRMWARE_DRIVEN,
    label: 'Firmware-Driven Tri-Color (Red/Green/Blue PWM)',
    firmwareExecutable: true,
    features: ['Common Cathode / Anode model', 'Multi-channel color mixing via PWM']
  },
  'buzzer': {
    level: CAPABILITY_LEVEL.FIRMWARE_DRIVEN,
    label: 'Firmware-Driven Piezo Sounder',
    firmwareExecutable: true,
    features: ['Responds to tone() and digital pulse output', 'Audio indicator visual pulse']
  },
  'output-servo': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'PWM Servo Motor Angle Model',
    firmwareExecutable: false,
    features: ['5V / GND / PWM Signal wiring check', 'Simulated shaft rotation preview']
  },
  'output-neopixel': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'Addressable RGB LED Strip Model',
    firmwareExecutable: false,
    features: ['DI / 5V / GND connection validation']
  },
  'output-dc-motor': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'DC Motor & Driver Validation',
    firmwareExecutable: false,
    features: ['Transistor/H-Bridge driver requirement rule check']
  },

  // --- Input Devices ---
  'push-button': {
    level: CAPABILITY_LEVEL.FIRMWARE_DRIVEN,
    label: 'Interactive Tactile Push Button',
    firmwareExecutable: true,
    features: ['Click to press / release', 'Drives MCU digital input with INPUT_PULLUP or pull-down resistor']
  },
  'slide-switch': {
    level: CAPABILITY_LEVEL.FIRMWARE_DRIVEN,
    label: 'Interactive SPDT Slide Switch',
    firmwareExecutable: true,
    features: ['Click to toggle Common pin between Terminal 1 and Terminal 2']
  },
  'potentiometer': {
    level: CAPABILITY_LEVEL.FIRMWARE_DRIVEN,
    label: 'Interactive Rotary Potentiometer (ADC 0-5V)',
    firmwareExecutable: true,
    features: ['Rotary / Slider wiper adjustment (0.0 to 1.0)', 'Directly alters analog voltage on connected MCU ADC channel (0-1023)']
  },
  'input-joystick': {
    level: CAPABILITY_LEVEL.INTERACTIVE,
    label: 'Dual-Axis Thumbstick & Select Button',
    firmwareExecutable: false,
    features: ['X-axis, Y-axis, and SW button pinouts']
  },
  'input-rotary-encoder': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'Quadrature Rotary Encoder (KY-040)',
    firmwareExecutable: false,
    features: ['CLK, DT, SW digital pinout validation']
  },
  'sensor-touch-capacitive': {
    level: CAPABILITY_LEVEL.INTERACTIVE,
    label: 'TTP223 Capacitive Touch Switch',
    firmwareExecutable: false,
    features: ['Interactive touch trigger simulation']
  },

  // --- Sensors ---
  'photoresistor': {
    level: CAPABILITY_LEVEL.INTERACTIVE,
    label: 'LDR Ambient Light Sensor',
    firmwareExecutable: false,
    features: ['Simulated ambient lux slider', 'Voltage divider resistor check']
  },
  'sensor-tmp36': {
    level: CAPABILITY_LEVEL.INTERACTIVE,
    label: 'TMP36 Precision Temperature Sensor',
    firmwareExecutable: false,
    features: ['10 mV/°C analog output model', 'Simulated temperature slider']
  },
  'sensor-dht11': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'DHT11 Temp & Humidity Sensor',
    firmwareExecutable: false,
    features: ['VCC, GND, Data 1-wire pinout check']
  },
  'sensor-ultrasonic-hcsr04': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'HC-SR04 Ultrasonic Distance Sensor',
    firmwareExecutable: false,
    features: ['Trigger and Echo timing pinout check']
  },
  'sensor-pir': {
    level: CAPABILITY_LEVEL.INTERACTIVE,
    label: 'PIR Motion Sensor (HC-SR501)',
    firmwareExecutable: false,
    features: ['Motion detected toggle to digital pin']
  },
  'sensor-ds18b20': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'DS18B20 1-Wire Digital Thermometer',
    firmwareExecutable: false,
    features: ['4.7kΩ pull-up resistor validation']
  },
  'sensor-mpu6050': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'MPU-6050 6-Axis Accelerometer & Gyro',
    firmwareExecutable: false,
    features: ['I2C SDA/SCL pinout validation']
  },

  // --- Displays ---
  'display-lcd-1602': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: '16x2 Character LCD (I2C Module)',
    firmwareExecutable: false,
    features: ['I2C addressable bus connection check']
  },
  'display-oled-ssd1306': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'SSD1306 0.96" Monochrome OLED (I2C)',
    firmwareExecutable: false,
    features: ['I2C SDA/SCL 3.3V/5V bus validation']
  },
  'display-7seg': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'Single-Digit 7-Segment LED Display',
    firmwareExecutable: false,
    features: ['Common Cathode / Anode 8-segment pin validation']
  },

  // --- Semiconductors & ICs ---
  'transistor-npn': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'NPN Bipolar Junction Transistor',
    firmwareExecutable: false,
    features: ['Base, Collector, Emitter pinout & base-resistor validation']
  },
  'transistor-mosfet': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: 'N-Channel Power MOSFET',
    firmwareExecutable: false,
    features: ['Gate, Drain, Source switching validation']
  },
  'ic-74hc595': {
    level: CAPABILITY_LEVEL.VALIDATED,
    label: '74HC595 8-Bit Serial-In Shift Register',
    firmwareExecutable: false,
    features: ['SER, SRCLK, RCLK SPI pinout validation']
  }
};

/**
 * Returns the capability descriptor for a component type.
 */
export function getComponentCapability(type) {
  if (!type) return null;
  const cleanType = String(type).trim().toLowerCase();
  return COMPONENT_CAPABILITIES[cleanType] || {
    level: CAPABILITY_LEVEL.CATALOG_ONLY,
    label: 'Catalog Listed',
    firmwareExecutable: false,
    features: []
  };
}

/**
 * Checks whether a component is directly executable via compiled MCU firmware.
 */
export function isFirmwareSimulatable(type) {
  const cap = getComponentCapability(type);
  return cap ? cap.level === CAPABILITY_LEVEL.FIRMWARE_DRIVEN : false;
}

/**
 * Checks whether a component has an interactive virtual UI model (clicks/sliders).
 */
export function isInteractivelySimulatable(type) {
  const cap = getComponentCapability(type);
  return cap ? cap.level >= CAPABILITY_LEVEL.INTERACTIVE : false;
}

export const CAPABILITY_REGISTRY = COMPONENT_CAPABILITIES;
