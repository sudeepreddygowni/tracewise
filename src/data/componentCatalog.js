/**
 * Tracewise Electronic Component Catalog
 * Contains accurate pin mappings and dimension data
 */

export const WIRE_COLORS = [
  { id: 'red', name: 'Power (+5V / Signal)', hex: '#EF4444' },
  { id: 'black', name: 'Ground (GND)', hex: '#0F172A' },
  { id: 'cyan', name: 'Signal (Cyan)', hex: '#2DC5E9' },
  { id: 'blue', name: 'Signal (Blue)', hex: '#3B82F6' },
  { id: 'green', name: 'Signal (Green)', hex: '#187A57' },
  { id: 'yellow', name: 'Signal (Yellow)', hex: '#EAB308' },
  { id: 'orange', name: 'Signal (Orange)', hex: '#F97316' },
  { id: 'purple', name: 'Signal (Purple)', hex: '#A855F7' }
];

export const COMPONENT_CATALOG = [
  // =========================================================================
  // 1. ORIGINAL CORE COMPONENTS
  // =========================================================================
  {
    type: 'arduino-uno',
    category: 'Microcontrollers',
    name: 'Arduino Uno R3',
    description: 'ATmega328P based microcontroller board with 14 digital I/O pins and 6 analog inputs.',
    width: 300,
    height: 220,
    viewBox: { x: 0, y: 0, width: 380, height: 280 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      // Top header (Digital 8-13, GND, AREF)
      { id: 'AREF', label: 'AREF', role: 'analog-ref', x: 120, y: 14 },
      { id: 'GND_TOP', label: 'GND', role: 'ground', x: 135, y: 14 },
      { id: 'D13', label: '13', role: 'digital-pwm', x: 150, y: 14 },
      { id: 'D12', label: '12', role: 'digital', x: 165, y: 14 },
      { id: 'D11', label: '~11', role: 'digital-pwm', x: 180, y: 14 },
      { id: 'D10', label: '~10', role: 'digital-pwm', x: 195, y: 14 },
      { id: 'D9', label: '~9', role: 'digital-pwm', x: 210, y: 14 },
      { id: 'D8', label: '8', role: 'digital', x: 225, y: 14 },
      // Top header (Digital 0-7)
      { id: 'D7', label: '7', role: 'digital', x: 245, y: 14 },
      { id: 'D6', label: '~6', role: 'digital-pwm', x: 260, y: 14 },
      { id: 'D5', label: '~5', role: 'digital-pwm', x: 275, y: 14 },
      { id: 'D4', label: '4', role: 'digital', x: 290, y: 14 },
      { id: 'D3', label: '~3', role: 'digital-pwm', x: 305, y: 14 },
      { id: 'D2', label: '2', role: 'digital', x: 320, y: 14 },
      { id: 'D1', label: 'TX->1', role: 'digital-serial', x: 335, y: 14 },
      { id: 'D0', label: 'RX<-0', role: 'digital-serial', x: 350, y: 14 },

      // Bottom header (Power & Analog)
      { id: 'IOREF', label: 'IOREF', role: 'power', x: 150, y: 206 },
      { id: 'RESET', label: 'RESET', role: 'control', x: 165, y: 206 },
      { id: '3V3', label: '3.3V', role: 'power-3v3', x: 180, y: 206 },
      { id: '5V', label: '5V', role: 'power-5v', x: 195, y: 206 },
      { id: 'GND', label: 'GND', role: 'ground', x: 210, y: 206 },
      { id: 'GND_2', label: 'GND', role: 'ground', x: 225, y: 206 },
      { id: 'VIN', label: 'VIN', role: 'power-vin', x: 240, y: 206 },
      
      { id: 'A0', label: 'A0', role: 'analog', x: 265, y: 206 },
      { id: 'A1', label: 'A1', role: 'analog', x: 280, y: 206 },
      { id: 'A2', label: 'A2', role: 'analog', x: 295, y: 206 },
      { id: 'A3', label: 'A3', role: 'analog', x: 310, y: 206 },
      { id: 'A4', label: 'A4', role: 'analog-i2c', x: 325, y: 206 },
      { id: 'A5', label: 'A5', role: 'analog-i2c', x: 340, y: 206 }
    ],
    aliases: ['uno', 'arduino', 'mcu', 'microcontroller', 'board', 'atmega328p']
  },
  {
    type: 'breadboard-half',
    category: 'Prototyping',
    name: 'Half Breadboard',
    description: '400 tie-point solderless breadboard with dual power rails.',
    width: 320,
    height: 180,
    viewBox: { x: 0, y: 0, width: 320, height: 180 },
    wiringSupported: true,
    codeAvailable: false,
    pins: [
      // Top power rails (+, -)
      { id: 'rail-top-pos', label: 'Top + (5V)', role: 'power-rail', x: 40, y: 15 },
      { id: 'rail-top-neg', label: 'Top - (GND)', role: 'ground-rail', x: 40, y: 30 },
      // Terminal rows
      { id: 'row-1', label: 'Row 1', role: 'terminal', x: 40, y: 60 },
      { id: 'row-5', label: 'Row 5', role: 'terminal', x: 90, y: 60 },
      { id: 'row-10', label: 'Row 10', role: 'terminal', x: 150, y: 60 },
      { id: 'row-15', label: 'Row 15', role: 'terminal', x: 210, y: 60 },
      { id: 'row-20', label: 'Row 20', role: 'terminal', x: 270, y: 60 },
      // Bottom terminal rows
      { id: 'row-1-bot', label: 'Row 1 (lower)', role: 'terminal', x: 40, y: 120 },
      { id: 'row-5-bot', label: 'Row 5 (lower)', role: 'terminal', x: 90, y: 120 },
      { id: 'row-10-bot', label: 'Row 10 (lower)', role: 'terminal', x: 150, y: 120 },
      { id: 'row-15-bot', label: 'Row 15 (lower)', role: 'terminal', x: 210, y: 120 },
      { id: 'row-20-bot', label: 'Row 20 (lower)', role: 'terminal', x: 270, y: 120 },
      // Bottom power rails (+, -)
      { id: 'rail-bot-pos', label: 'Bottom + (5V)', role: 'power-rail', x: 40, y: 150 },
      { id: 'rail-bot-neg', label: 'Bottom - (GND)', role: 'ground-rail', x: 40, y: 165 }
    ],
    aliases: ['breadboard', 'proto', 'plugboard', 'half-board', 'solderless']
  },
  {
    type: 'led',
    category: 'Output',
    name: '5mm LED',
    description: 'Light Emitting Diode with anode (+) and cathode (-). Requires current-limiting resistor.',
    width: 60,
    height: 70,
    viewBox: { x: 0, y: 0, width: 60, height: 70 },
    defaultProps: { color: 'red' },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'anode', label: 'Anode (+)', role: 'positive', x: 18, y: 60 },
      { id: 'cathode', label: 'Cathode (-)', role: 'negative', x: 42, y: 60 }
    ],
    aliases: ['diode', 'light', 'indicator', 'lamp', 'led']
  },
  {
    type: 'resistor',
    category: 'Passive',
    name: 'Resistor',
    description: 'Through-hole axial resistor for current limiting and voltage division.',
    width: 80,
    height: 35,
    viewBox: { x: 0, y: 0, width: 80, height: 35 },
    defaultProps: { resistance: '220Ω', bands: ['red', 'red', 'brown', 'gold'] },
    wiringSupported: true,
    codeAvailable: false,
    pins: [
      { id: 'lead1', label: 'Lead 1', role: 'passive', x: 6, y: 18 },
      { id: 'lead2', label: 'Lead 2', role: 'passive', x: 74, y: 18 }
    ],
    aliases: ['res', '220', 'ohm', 'current limiter', 'pullup', 'pulldown']
  },
  {
    type: 'push-button',
    category: 'Input',
    name: 'Push Button',
    description: 'Tactile momentary push button switch (normally open).',
    width: 65,
    height: 65,
    viewBox: { x: 0, y: 0, width: 65, height: 65 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: '1a', label: 'Pin 1a', role: 'switch-contact', x: 12, y: 15 },
      { id: '1b', label: 'Pin 1b', role: 'switch-contact', x: 12, y: 50 },
      { id: '2a', label: 'Pin 2a', role: 'switch-contact', x: 53, y: 15 },
      { id: '2b', label: 'Pin 2b', role: 'switch-contact', x: 53, y: 50 }
    ],
    aliases: ['button', 'pushbutton', 'switch', 'momentary']
  },
  {
    type: 'rgb-led',
    category: 'Output',
    name: 'RGB LED (Common Cathode)',
    description: 'Tri-color 5mm LED with separate Red, Green, and Blue anodes and a shared Common Cathode ground lead.',
    width: 70,
    height: 80,
    viewBox: { x: 0, y: 0, width: 70, height: 80 },
    defaultProps: { red: 255, green: 0, blue: 128, mode: 'common-cathode' },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'red', label: 'Red Anode', role: 'positive', x: 16, y: 70 },
      { id: 'cathode', label: 'Common Cathode (-)', role: 'negative', x: 28, y: 74 },
      { id: 'green', label: 'Green Anode', role: 'positive', x: 42, y: 70 },
      { id: 'blue', label: 'Blue Anode', role: 'positive', x: 54, y: 70 }
    ],
    aliases: ['rgb', 'tricolor', 'multi-color led', 'color led', 'neopixel']
  },
  {
    type: 'potentiometer',
    category: 'Input',
    name: 'Potentiometer (10kΩ)',
    description: 'Rotary variable resistor providing an adjustable analog voltage between 0V and 5V via the central wiper pin.',
    width: 70,
    height: 70,
    viewBox: { x: 0, y: 0, width: 70, height: 70 },
    defaultProps: { resistance: '10kΩ', value: 512 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'pin1', label: 'Terminal 1 (5V)', role: 'power', x: 14, y: 62 },
      { id: 'wiper', label: 'Wiper (Analog Output)', role: 'analog-output', x: 35, y: 62 },
      { id: 'pin3', label: 'Terminal 2 (GND)', role: 'ground', x: 56, y: 62 }
    ],
    aliases: ['pot', 'variable resistor', 'knob', 'dial', 'trimmer', 'trimpot', 'slider']
  },
  {
    type: 'photoresistor',
    category: 'Input',
    name: 'Photoresistor (LDR)',
    description: 'Light-Dependent Resistor whose resistance drops with ambient light intensity. Used in voltage dividers for light sensing.',
    width: 60,
    height: 60,
    viewBox: { x: 0, y: 0, width: 60, height: 60 },
    defaultProps: { lightLevel: 'medium' },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'pin1', label: 'Lead 1', role: 'passive', x: 18, y: 52 },
      { id: 'pin2', label: 'Lead 2', role: 'passive', x: 42, y: 52 }
    ],
    aliases: ['ldr', 'light sensor', 'photocell', 'photo sensor', 'cds cell']
  },
  {
    type: 'slide-switch',
    category: 'Input',
    name: 'Slide Switch (SPDT)',
    description: 'Single-Pole Double-Throw miniature slide switch. Connects Common to Terminal 1 or Terminal 2.',
    width: 65,
    height: 45,
    viewBox: { x: 0, y: 0, width: 65, height: 45 },
    defaultProps: { state: 'left' },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: '1', label: 'Terminal 1', role: 'switch-contact', x: 14, y: 38 },
      { id: 'common', label: 'Common (Wiper)', role: 'switch-contact', x: 32, y: 38 },
      { id: '2', label: 'Terminal 2', role: 'switch-contact', x: 50, y: 38 }
    ],
    aliases: ['switch', 'spdt', 'toggle', 'slide', 'selector']
  },
  {
    type: 'buzzer',
    category: 'Output',
    name: 'Active Buzzer',
    description: '5V Piezoelectric sound indicator that emits an audible 2.5kHz beep when driven HIGH.',
    width: 65,
    height: 65,
    viewBox: { x: 0, y: 0, width: 65, height: 65 },
    defaultProps: { tone: '2.5kHz' },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'anode', label: 'Positive (+)', role: 'positive', x: 20, y: 56 },
      { id: 'cathode', label: 'Negative (- / GND)', role: 'negative', x: 45, y: 56 }
    ],
    aliases: ['beeper', 'piezo', 'speaker', 'alarm', 'sounder', 'audio', 'tone']
  },

  // =========================================================================
  // 2. EXPANDED MICROCONTROLLERS
  // =========================================================================
  {
    type: 'arduino-nano',
    category: 'Microcontrollers',
    name: 'Arduino Nano V3',
    description: 'Compact ATmega328P microcontroller with 22 digital and analog I/O pins, designed for breadboard mounting.',
    width: 220,
    height: 90,
    viewBox: { x: 0, y: 0, width: 220, height: 90 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      // Top header (pins left to right, y=10)
      { id: 'D1_TX', label: 'TX (D1)', role: 'digital-serial', x: 22, y: 10 },
      { id: 'D0_RX', label: 'RX (D0)', role: 'digital-serial', x: 34, y: 10 },
      { id: 'RESET', label: 'RST', role: 'control', x: 46, y: 10 },
      { id: 'GND', label: 'GND', role: 'ground', x: 58, y: 10 },
      { id: 'D2', label: 'D2', role: 'digital', x: 70, y: 10 },
      { id: 'D3', label: '~D3', role: 'digital-pwm', x: 82, y: 10 },
      { id: 'D4', label: 'D4', role: 'digital', x: 94, y: 10 },
      { id: 'D5', label: '~D5', role: 'digital-pwm', x: 106, y: 10 },
      { id: 'D6', label: '~D6', role: 'digital-pwm', x: 118, y: 10 },
      { id: 'D7', label: 'D7', role: 'digital', x: 130, y: 10 },
      { id: 'D8', label: 'D8', role: 'digital', x: 142, y: 10 },
      { id: 'D9', label: '~D9', role: 'digital-pwm', x: 154, y: 10 },
      { id: 'D10', label: '~D10', role: 'digital-pwm', x: 166, y: 10 },
      { id: 'D11', label: '~D11', role: 'digital-pwm', x: 178, y: 10 },
      { id: 'D12', label: 'D12', role: 'digital', x: 190, y: 10 },
      // Bottom header (pins left to right, y=80)
      { id: 'D13', label: 'D13', role: 'digital-pwm', x: 22, y: 80 },
      { id: '3V3', label: '3V3', role: 'power-3v3', x: 34, y: 80 },
      { id: 'AREF', label: 'REF', role: 'analog-ref', x: 46, y: 80 },
      { id: 'A0', label: 'A0', role: 'analog', x: 58, y: 80 },
      { id: 'A1', label: 'A1', role: 'analog', x: 70, y: 80 },
      { id: 'A2', label: 'A2', role: 'analog', x: 82, y: 80 },
      { id: 'A3', label: 'A3', role: 'analog', x: 94, y: 80 },
      { id: 'A4', label: 'A4', role: 'analog-i2c', x: 106, y: 80 },
      { id: 'A5', label: 'A5', role: 'analog-i2c', x: 118, y: 80 },
      { id: 'A6', label: 'A6', role: 'analog', x: 130, y: 80 },
      { id: 'A7', label: 'A7', role: 'analog', x: 142, y: 80 },
      { id: '5V', label: '5V', role: 'power-5v', x: 154, y: 80 },
      { id: 'RESET2', label: 'RST', role: 'control', x: 166, y: 80 },
      { id: 'GND2', label: 'GND', role: 'ground', x: 178, y: 80 },
      { id: 'VIN', label: 'VIN', role: 'power-vin', x: 190, y: 80 }
    ],
    aliases: ['nano', 'arduino nano', 'atmega328', 'mcu']
  },
  {
    type: 'arduino-mega',
    category: 'Microcontrollers',
    name: 'Arduino Mega 2560 R3',
    description: 'High-pin-count ATmega2560 board with 54 digital I/O pins, 16 analog inputs, and 4 hardware UARTs.',
    width: 380,
    height: 240,
    viewBox: { x: 0, y: 0, width: 440, height: 280 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      // Top header (Digital 0-13, GND, AREF)
      { id: 'AREF', label: 'AREF', role: 'analog-ref', x: 160, y: 14 },
      { id: 'GND_TOP', label: 'GND', role: 'ground', x: 175, y: 14 },
      { id: 'D13', label: '13', role: 'digital-pwm', x: 190, y: 14 },
      { id: 'D12', label: '12', role: 'digital', x: 205, y: 14 },
      { id: 'D11', label: '~11', role: 'digital-pwm', x: 220, y: 14 },
      { id: 'D10', label: '~10', role: 'digital-pwm', x: 235, y: 14 },
      { id: 'D9', label: '~9', role: 'digital-pwm', x: 250, y: 14 },
      { id: 'D8', label: '~8', role: 'digital-pwm', x: 265, y: 14 },
      { id: 'D7', label: '~7', role: 'digital-pwm', x: 285, y: 14 },
      { id: 'D6', label: '~6', role: 'digital-pwm', x: 300, y: 14 },
      { id: 'D5', label: '~5', role: 'digital-pwm', x: 315, y: 14 },
      { id: 'D4', label: '~4', role: 'digital-pwm', x: 330, y: 14 },
      { id: 'D3', label: '~3', role: 'digital-pwm', x: 345, y: 14 },
      { id: 'D2', label: '~2', role: 'digital-pwm', x: 360, y: 14 },
      { id: 'D1', label: 'TX0', role: 'digital-serial', x: 375, y: 14 },
      { id: 'D0', label: 'RX0', role: 'digital-serial', x: 390, y: 14 },
      // Bottom power & analog
      { id: 'IOREF', label: 'IOREF', role: 'power', x: 160, y: 266 },
      { id: 'RESET', label: 'RESET', role: 'control', x: 175, y: 266 },
      { id: '3V3', label: '3.3V', role: 'power-3v3', x: 190, y: 266 },
      { id: '5V', label: '5V', role: 'power-5v', x: 205, y: 266 },
      { id: 'GND', label: 'GND', role: 'ground', x: 220, y: 266 },
      { id: 'GND_2', label: 'GND', role: 'ground', x: 235, y: 266 },
      { id: 'VIN', label: 'VIN', role: 'power-vin', x: 250, y: 266 },
      { id: 'A0', label: 'A0', role: 'analog', x: 275, y: 266 },
      { id: 'A1', label: 'A1', role: 'analog', x: 290, y: 266 },
      { id: 'A2', label: 'A2', role: 'analog', x: 305, y: 266 },
      { id: 'A3', label: 'A3', role: 'analog', x: 320, y: 266 },
      { id: 'A4', label: 'A4', role: 'analog', x: 335, y: 266 },
      { id: 'A5', label: 'A5', role: 'analog', x: 350, y: 266 },
      { id: 'A6', label: 'A6', role: 'analog', x: 365, y: 266 },
      { id: 'A7', label: 'A7', role: 'analog', x: 380, y: 266 },
      // Double header on right edge
      { id: 'D22', label: '22', role: 'digital', x: 418, y: 90 },
      { id: 'D23', label: '23', role: 'digital', x: 430, y: 90 },
      { id: 'D24', label: '24', role: 'digital', x: 418, y: 110 },
      { id: 'D25', label: '25', role: 'digital', x: 430, y: 110 },
      { id: 'D52', label: '52', role: 'digital', x: 418, y: 210 },
      { id: 'D53', label: '53', role: 'digital', x: 430, y: 210 }
    ],
    aliases: ['mega', 'arduino mega', '2560', 'mega2560']
  },
  {
    type: 'esp32-devkit',
    category: 'Microcontrollers',
    name: 'ESP32 DevKit V1',
    description: '30-pin dual-core Xtensa 240MHz microcontroller with integrated 2.4GHz Wi-Fi and Bluetooth BLE.',
    width: 220,
    height: 95,
    viewBox: { x: 0, y: 0, width: 220, height: 95 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      // Top row (pins left to right, y=10)
      { id: 'EN', label: 'EN', role: 'control', x: 20, y: 10 },
      { id: 'VP', label: 'VP (36)', role: 'analog', x: 33, y: 10 },
      { id: 'VN', label: 'VN (39)', role: 'analog', x: 46, y: 10 },
      { id: 'D34', label: 'D34', role: 'digital', x: 59, y: 10 },
      { id: 'D35', label: 'D35', role: 'digital', x: 72, y: 10 },
      { id: 'D32', label: 'D32', role: 'digital', x: 85, y: 10 },
      { id: 'D33', label: 'D33', role: 'digital', x: 98, y: 10 },
      { id: 'D25', label: 'D25', role: 'digital', x: 111, y: 10 },
      { id: 'D26', label: 'D26', role: 'digital', x: 124, y: 10 },
      { id: 'D27', label: 'D27', role: 'digital', x: 137, y: 10 },
      { id: 'D14', label: 'D14', role: 'digital', x: 150, y: 10 },
      { id: 'D12', label: 'D12', role: 'digital', x: 163, y: 10 },
      { id: 'D13', label: 'D13', role: 'digital', x: 176, y: 10 },
      { id: 'GND_TOP', label: 'GND', role: 'ground', x: 189, y: 10 },
      { id: 'VIN', label: 'VIN', role: 'power-vin', x: 202, y: 10 },
      // Bottom row (pins left to right, y=85)
      { id: 'D23', label: 'D23 (MOSI)', role: 'digital', x: 20, y: 85 },
      { id: 'D22', label: 'D22 (SCL)', role: 'analog-i2c', x: 33, y: 85 },
      { id: 'TX0', label: 'TX0 (1)', role: 'digital-serial', x: 46, y: 85 },
      { id: 'RX0', label: 'RX0 (3)', role: 'digital-serial', x: 59, y: 85 },
      { id: 'D21', label: 'D21 (SDA)', role: 'analog-i2c', x: 72, y: 85 },
      { id: 'D19', label: 'D19 (MISO)', role: 'digital', x: 85, y: 85 },
      { id: 'D18', label: 'D18 (SCK)', role: 'digital', x: 98, y: 85 },
      { id: 'D5', label: 'D5 (SS)', role: 'digital', x: 111, y: 85 },
      { id: 'TX2', label: 'TX2 (17)', role: 'digital-serial', x: 124, y: 85 },
      { id: 'RX2', label: 'RX2 (16)', role: 'digital-serial', x: 137, y: 85 },
      { id: 'D4', label: 'D4', role: 'digital', x: 150, y: 85 },
      { id: 'D2', label: 'D2', role: 'digital', x: 163, y: 85 },
      { id: 'D15', label: 'D15', role: 'digital', x: 176, y: 85 },
      { id: 'GND_BOT', label: 'GND', role: 'ground', x: 189, y: 85 },
      { id: '3V3', label: '3V3', role: 'power-3v3', x: 202, y: 85 }
    ],
    aliases: ['esp32', 'nodemcu', 'wifi', 'bluetooth', 'esp']
  },

  // =========================================================================
  // 3. EXPANDED SENSORS
  // =========================================================================
  {
    type: 'sensor-dht11',
    category: 'Sensors',
    name: 'DHT11 Temp & Humidity Sensor',
    description: 'Basic, low-cost digital temperature and humidity sensor module with single-wire bus interface.',
    width: 80,
    height: 95,
    viewBox: { x: 0, y: 0, width: 80, height: 95 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'VCC', label: 'VCC (+5V)', role: 'power-5v', x: 22, y: 86 },
      { id: 'DATA', label: 'DATA (Signal)', role: 'digital-io', x: 40, y: 86 },
      { id: 'GND', label: 'GND (-)', role: 'ground', x: 58, y: 86 }
    ],
    aliases: ['dht11', 'humidity', 'temperature', 'weather', 'temp sensor']
  },
  {
    type: 'sensor-ultrasonic-hcsr04',
    category: 'Sensors',
    name: 'HC-SR04 Ultrasonic Sensor',
    description: 'Dual-transducer ultrasonic distance sensor providing 2cm–400cm non-contact distance measurement.',
    width: 130,
    height: 75,
    viewBox: { x: 0, y: 0, width: 130, height: 75 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'VCC', label: 'VCC (5V)', role: 'power-5v', x: 42, y: 66 },
      { id: 'TRIG', label: 'TRIG (Trigger)', role: 'digital', x: 54, y: 66 },
      { id: 'ECHO', label: 'ECHO (Echo)', role: 'digital', x: 66, y: 66 },
      { id: 'GND', label: 'GND', role: 'ground', x: 78, y: 66 }
    ],
    aliases: ['ultrasonic', 'hcsr04', 'sonar', 'distance', 'rangefinder']
  },
  {
    type: 'sensor-pir',
    category: 'Sensors',
    name: 'PIR Motion Sensor (HC-SR501)',
    description: 'Pyroelectric infrared motion detector module with adjustable sensitivity and digital trigger output.',
    width: 95,
    height: 95,
    viewBox: { x: 0, y: 0, width: 95, height: 95 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'VCC', label: 'VCC (+5V)', role: 'power-5v', x: 30, y: 85 },
      { id: 'OUT', label: 'OUT (Signal)', role: 'digital', x: 47, y: 85 },
      { id: 'GND', label: 'GND (-)', role: 'ground', x: 64, y: 85 }
    ],
    aliases: ['pir', 'motion', 'occupancy', 'infrared', 'presence']
  },
  {
    type: 'sensor-ds18b20',
    category: 'Sensors',
    name: 'DS18B20 Digital Thermometer',
    description: '1-Wire digital temperature sensor in TO-92 package with ±0.5°C accuracy over -10°C to +85°C.',
    width: 65,
    height: 80,
    viewBox: { x: 0, y: 0, width: 65, height: 80 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'GND', label: 'Pin 1: GND', role: 'ground', x: 18, y: 72 },
      { id: 'DATA', label: 'Pin 2: DQ (Data)', role: 'digital-io', x: 32, y: 72 },
      { id: 'VDD', label: 'Pin 3: VDD (3.0-5.5V)', role: 'power-5v', x: 46, y: 72 }
    ],
    aliases: ['ds18b20', '1-wire', 'probe', 'temperature probe']
  },
  {
    type: 'sensor-tmp36',
    category: 'Sensors',
    name: 'TMP36 Analog Temperature Sensor',
    description: 'Low-voltage precision analog centigrade temperature sensor providing 10mV/°C linear scale factor.',
    width: 65,
    height: 80,
    viewBox: { x: 0, y: 0, width: 65, height: 80 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'VS', label: '+Vs (2.7V - 5.5V)', role: 'power-5v', x: 18, y: 72 },
      { id: 'VOUT', label: 'Vout (Analog)', role: 'analog-output', x: 32, y: 72 },
      { id: 'GND', label: 'GND', role: 'ground', x: 46, y: 72 }
    ],
    aliases: ['tmp36', 'analog temp', 'thermometer', 'lm35']
  },
  {
    type: 'sensor-mpu6050',
    category: 'Sensors',
    name: 'MPU-6050 6-Axis IMU (I2C)',
    description: '6-axis MotionTracking module combining a 3-axis gyroscope and a 3-axis accelerometer with I2C bus.',
    width: 110,
    height: 70,
    viewBox: { x: 0, y: 0, width: 110, height: 70 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'VCC', label: 'VCC (3-5V)', role: 'power-5v', x: 16, y: 60 },
      { id: 'GND', label: 'GND', role: 'ground', x: 27, y: 60 },
      { id: 'SCL', label: 'SCL', role: 'analog-i2c', x: 38, y: 60 },
      { id: 'SDA', label: 'SDA', role: 'analog-i2c', x: 49, y: 60 },
      { id: 'XDA', label: 'XDA', role: 'digital', x: 60, y: 60 },
      { id: 'XCL', label: 'XCL', role: 'digital', x: 71, y: 60 },
      { id: 'AD0', label: 'AD0', role: 'digital', x: 82, y: 60 },
      { id: 'INT', label: 'INT', role: 'digital', x: 93, y: 60 }
    ],
    aliases: ['mpu6050', 'gyro', 'accelerometer', 'imu', 'motion sensor']
  },

  // =========================================================================
  // 4. EXPANDED DISPLAYS
  // =========================================================================
  {
    type: 'display-lcd-1602',
    category: 'Displays',
    name: '16x2 Character LCD (I2C)',
    description: '16-character by 2-line alphanumeric LCD display with PCF8574 I2C backpack interface.',
    width: 200,
    height: 95,
    viewBox: { x: 0, y: 0, width: 200, height: 95 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'GND', label: 'GND', role: 'ground', x: 14, y: 28 },
      { id: 'VCC', label: 'VCC (5V)', role: 'power-5v', x: 14, y: 42 },
      { id: 'SDA', label: 'SDA', role: 'analog-i2c', x: 14, y: 56 },
      { id: 'SCL', label: 'SCL', role: 'analog-i2c', x: 14, y: 70 }
    ],
    aliases: ['lcd', '1602', 'i2c lcd', 'screen', 'character display']
  },
  {
    type: 'display-oled-ssd1306',
    category: 'Displays',
    name: 'SSD1306 0.96" OLED (I2C)',
    description: '128x64 monochrome OLED graphic display module communicating via 4-pin I2C interface.',
    width: 100,
    height: 95,
    viewBox: { x: 0, y: 0, width: 100, height: 95 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'GND', label: 'GND', role: 'ground', x: 28, y: 14 },
      { id: 'VCC', label: 'VCC (3.3-5V)', role: 'power-5v', x: 42, y: 14 },
      { id: 'SCL', label: 'SCL', role: 'analog-i2c', x: 56, y: 14 },
      { id: 'SDA', label: 'SDA', role: 'analog-i2c', x: 70, y: 14 }
    ],
    aliases: ['oled', 'ssd1306', '0.96', 'graphics display']
  },
  {
    type: 'display-7seg',
    category: 'Displays',
    name: '1-Digit 7-Segment Display',
    description: '0.56" common-cathode 7-segment LED display with decimal point.',
    width: 85,
    height: 110,
    viewBox: { x: 0, y: 0, width: 85, height: 110 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      // Top pins
      { id: 'G', label: 'Segment G', role: 'positive', x: 16, y: 10 },
      { id: 'F', label: 'Segment F', role: 'positive', x: 30, y: 10 },
      { id: 'COM1', label: 'Common Cathode (GND)', role: 'ground', x: 42, y: 10 },
      { id: 'A', label: 'Segment A', role: 'positive', x: 55, y: 10 },
      { id: 'B', label: 'Segment B', role: 'positive', x: 69, y: 10 },
      // Bottom pins
      { id: 'E', label: 'Segment E', role: 'positive', x: 16, y: 100 },
      { id: 'D', label: 'Segment D', role: 'positive', x: 30, y: 100 },
      { id: 'COM2', label: 'Common Cathode (GND)', role: 'ground', x: 42, y: 100 },
      { id: 'C', label: 'Segment C', role: 'positive', x: 55, y: 100 },
      { id: 'DP', label: 'Decimal Point', role: 'positive', x: 69, y: 100 }
    ],
    aliases: ['7seg', 'seven segment', 'numeric', 'digit', 'counter']
  },

  // =========================================================================
  // 5. EXPANDED INPUTS
  // =========================================================================
  {
    type: 'input-joystick',
    category: 'Input',
    name: 'Analog Thumb Joystick',
    description: 'Dual-axis analog potentiometer joystick module with integrated push-button switch.',
    width: 90,
    height: 90,
    viewBox: { x: 0, y: 0, width: 90, height: 90 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'GND', label: 'GND', role: 'ground', x: 80, y: 22 },
      { id: '5V', label: '+5V', role: 'power-5v', x: 80, y: 35 },
      { id: 'VRX', label: 'VRX (X-Axis)', role: 'analog-output', x: 80, y: 48 },
      { id: 'VRY', label: 'VRY (Y-Axis)', role: 'analog-output', x: 80, y: 61 },
      { id: 'SW', label: 'SW (Key Switch)', role: 'switch-contact', x: 80, y: 74 }
    ],
    aliases: ['joystick', 'thumbstick', 'analog stick', 'gamepad']
  },
  {
    type: 'input-rotary-encoder',
    category: 'Input',
    name: 'Rotary Encoder (KY-040)',
    description: '360-degree incremental quadrature rotary encoder with built-in push-button.',
    width: 80,
    height: 95,
    viewBox: { x: 0, y: 0, width: 80, height: 95 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'CLK', label: 'CLK (Output A)', role: 'digital-io', x: 16, y: 85 },
      { id: 'DT', label: 'DT (Output B)', role: 'digital-io', x: 30, y: 85 },
      { id: 'SW', label: 'SW (Button)', role: 'switch-contact', x: 44, y: 85 },
      { id: 'VCC', label: '+ (5V)', role: 'power-5v', x: 58, y: 85 },
      { id: 'GND', label: 'GND', role: 'ground', x: 72, y: 85 }
    ],
    aliases: ['encoder', 'rotary', 'ky040', 'dial', 'knob']
  },
  {
    type: 'sensor-touch-capacitive',
    category: 'Input',
    name: 'Capacitive Touch Sensor (TTP223)',
    description: 'Miniature capacitive digital touch sensor module with low power consumption.',
    width: 65,
    height: 65,
    viewBox: { x: 0, y: 0, width: 65, height: 65 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'GND', label: 'GND', role: 'ground', x: 18, y: 55 },
      { id: 'IO', label: 'I/O (Signal)', role: 'digital', x: 32, y: 55 },
      { id: 'VCC', label: 'VCC (2-5.5V)', role: 'power-5v', x: 46, y: 55 }
    ],
    aliases: ['touch', 'ttp223', 'capacitive', 'touch button']
  },

  // =========================================================================
  // 6. EXPANDED OUTPUTS
  // =========================================================================
  {
    type: 'output-servo',
    category: 'Output',
    name: 'SG90 Micro Servo 9g',
    description: 'Lightweight 180-degree positional rotary actuator driven by standard 50Hz PWM signals.',
    width: 110,
    height: 85,
    viewBox: { x: 0, y: 0, width: 110, height: 85 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'GND', label: 'GND (Brown)', role: 'ground', x: 80, y: 74 },
      { id: '5V', label: '5V (Red)', role: 'power-5v', x: 90, y: 74 },
      { id: 'PWM', label: 'PWM (Orange)', role: 'digital-pwm', x: 100, y: 74 }
    ],
    aliases: ['servo', 'sg90', 'motor', 'actuator', 'arm']
  },
  {
    type: 'output-neopixel',
    category: 'Output',
    name: 'WS2812B NeoPixel 8-Stick',
    description: 'Individually addressable smart RGB LED bar with cascaded single-line data control.',
    width: 180,
    height: 45,
    viewBox: { x: 0, y: 0, width: 180, height: 45 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: '5V_IN', label: '5V (Power)', role: 'power-5v', x: 10, y: 12 },
      { id: 'DIN', label: 'DIN (Data In)', role: 'digital-io', x: 10, y: 22 },
      { id: 'GND_IN', label: 'GND', role: 'ground', x: 10, y: 32 },
      { id: '5V_OUT', label: '5V (Out)', role: 'power-5v', x: 170, y: 12 },
      { id: 'DOUT', label: 'DOUT (Data Out)', role: 'digital-io', x: 170, y: 22 },
      { id: 'GND_OUT', label: 'GND (Out)', role: 'ground', x: 170, y: 32 }
    ],
    aliases: ['neopixel', 'ws2812b', 'led strip', 'smart led', 'rgb bar']
  },
  {
    type: 'output-dc-motor',
    category: 'Output',
    name: '5V DC Toy Motor',
    description: 'Standard 3-6V DC hobby electric motor for rotation, robotics, and vibration experiments.',
    width: 95,
    height: 65,
    viewBox: { x: 0, y: 0, width: 95, height: 65 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      { id: 'POS', label: 'Terminal +', role: 'positive', x: 12, y: 22 },
      { id: 'NEG', label: 'Terminal -', role: 'negative', x: 12, y: 42 }
    ],
    aliases: ['dc motor', 'motor', 'electric motor', 'spindle']
  },

  // =========================================================================
  // 7. EXPANDED PASSIVES, SEMICONDUCTORS & ICS
  // =========================================================================
  {
    type: 'passive-capacitor',
    category: 'Passive',
    name: 'Electrolytic Capacitor (10µF)',
    description: 'Polarized aluminum electrolytic capacitor for DC power rail decoupling and filtering.',
    width: 60,
    height: 75,
    viewBox: { x: 0, y: 0, width: 60, height: 75 },
    defaultProps: { capacitance: '10µF', voltage: '25V' },
    wiringSupported: true,
    codeAvailable: false,
    pins: [
      { id: 'anode', label: 'Anode (+ Long Lead)', role: 'positive', x: 22, y: 65 },
      { id: 'cathode', label: 'Cathode (- Short Lead)', role: 'negative', x: 38, y: 65 }
    ],
    aliases: ['cap', 'capacitor', 'electrolytic', 'filter']
  },
  {
    type: 'passive-diode',
    category: 'Semiconductors',
    name: '1N4007 Rectifier Diode',
    description: 'General-purpose 1A silicon rectifier diode for flyback protection and polarity safety.',
    width: 75,
    height: 35,
    viewBox: { x: 0, y: 0, width: 75, height: 35 },
    wiringSupported: true,
    codeAvailable: false,
    pins: [
      { id: 'anode', label: 'Anode (+)', role: 'positive', x: 8, y: 18 },
      { id: 'cathode', label: 'Cathode (- Stripe)', role: 'negative', x: 67, y: 18 }
    ],
    aliases: ['diode', '1n4007', 'rectifier', 'flyback']
  },
  {
    type: 'transistor-npn',
    category: 'Semiconductors',
    name: '2N2222 NPN Transistor',
    description: 'Classic TO-92 NPN bipolar junction transistor for switching relays, motors, and LEDs.',
    width: 65,
    height: 75,
    viewBox: { x: 0, y: 0, width: 65, height: 75 },
    wiringSupported: true,
    codeAvailable: false,
    pins: [
      { id: 'emitter', label: 'Pin 1: Emitter', role: 'transistor-terminal', x: 18, y: 65 },
      { id: 'base', label: 'Pin 2: Base', role: 'transistor-terminal', x: 32, y: 65 },
      { id: 'collector', label: 'Pin 3: Collector', role: 'transistor-terminal', x: 46, y: 65 }
    ],
    aliases: ['npn', '2n2222', 'bjt', 'transistor', 'switch']
  },
  {
    type: 'transistor-mosfet',
    category: 'Semiconductors',
    name: 'IRFZ44N N-Channel MOSFET',
    description: 'High-efficiency TO-220 power MOSFET for switching high-current DC loads with MCU logic.',
    width: 70,
    height: 85,
    viewBox: { x: 0, y: 0, width: 70, height: 85 },
    wiringSupported: true,
    codeAvailable: false,
    pins: [
      { id: 'gate', label: 'Pin 1: Gate', role: 'transistor-terminal', x: 20, y: 75 },
      { id: 'drain', label: 'Pin 2: Drain', role: 'transistor-terminal', x: 35, y: 75 },
      { id: 'source', label: 'Pin 3: Source', role: 'transistor-terminal', x: 50, y: 75 }
    ],
    aliases: ['mosfet', 'irfz44n', 'n-mosfet', 'fet', 'power switch']
  },
  {
    type: 'ic-74hc595',
    category: 'Integrated Circuits',
    name: '74HC595 8-Bit Shift Register',
    description: 'High-speed CMOS 8-bit serial-in, parallel-out shift register with 3-state output latch (DIP-16).',
    width: 130,
    height: 75,
    viewBox: { x: 0, y: 0, width: 130, height: 75 },
    wiringSupported: true,
    codeAvailable: true,
    pins: [
      // Top row (pins 16 down to 9, y=10)
      { id: 'VCC', label: 'Pin 16: VCC (5V)', role: 'power-5v', x: 16, y: 10 },
      { id: 'Q0', label: 'Pin 15: Q0 (Output)', role: 'digital', x: 30, y: 10 },
      { id: 'DS', label: 'Pin 14: DS (Serial Data)', role: 'digital', x: 44, y: 10 },
      { id: 'OE', label: 'Pin 13: OE (Output Enable)', role: 'digital', x: 58, y: 10 },
      { id: 'STCP', label: 'Pin 12: ST_CP (Latch)', role: 'digital', x: 72, y: 10 },
      { id: 'SHCP', label: 'Pin 11: SH_CP (Clock)', role: 'digital', x: 86, y: 10 },
      { id: 'MR', label: 'Pin 10: MR (Master Reset)', role: 'digital', x: 100, y: 10 },
      { id: 'Q7S', label: 'Pin 9: Q7S (Serial Out)', role: 'digital', x: 114, y: 10 },
      // Bottom row (pins 1 to 8, y=65)
      { id: 'Q1', label: 'Pin 1: Q1', role: 'digital', x: 16, y: 65 },
      { id: 'Q2', label: 'Pin 2: Q2', role: 'digital', x: 30, y: 65 },
      { id: 'Q3', label: 'Pin 3: Q3', role: 'digital', x: 44, y: 65 },
      { id: 'Q4', label: 'Pin 4: Q4', role: 'digital', x: 58, y: 65 },
      { id: 'Q5', label: 'Pin 5: Q5', role: 'digital', x: 72, y: 65 },
      { id: 'Q6', label: 'Pin 6: Q6', role: 'digital', x: 86, y: 65 },
      { id: 'Q7', label: 'Pin 7: Q7', role: 'digital', x: 100, y: 65 },
      { id: 'GND', label: 'Pin 8: GND', role: 'ground', x: 114, y: 65 }
    ],
    aliases: ['shift register', '74hc595', 'io expander', 'serial to parallel']
  }
];

export function getComponentDefinition(type) {
  const builtIn = COMPONENT_CATALOG.find(c => c.type === type);
  if (builtIn) return builtIn;

  // Check locally registered custom components
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem('tracewise_custom_components_v1');
      if (raw) {
        const custom = JSON.parse(raw);
        if (Array.isArray(custom)) {
          const match = custom.find(c => c.type === type);
          if (match) return match;
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  return null;
}

/**
 * Compute the local rendered offset (in pixels from the top-left of the component element)
 * for a pin defined in SVG viewBox coordinates.
 *
 * Implements the standard W3C SVG viewBox-to-viewport coordinate mapping (xMidYMid meet).
 */
export function getPinRelativeCoords(def, pin) {
  if (!def || !pin) return { x: 0, y: 0 };

  const compW = def.width || 100;
  const compH = def.height || 100;
  const vb = def.viewBox || { x: 0, y: 0, width: compW, height: compH };

  const vbMinX = vb.x ?? 0;
  const vbMinY = vb.y ?? 0;
  const vbW = vb.width || compW;
  const vbH = vb.height || compH;

  // Standard SVG "xMidYMid meet" transformation
  const scaleX = compW / vbW;
  const scaleY = compH / vbH;
  const scale = Math.min(scaleX, scaleY);

  const renderedW = vbW * scale;
  const renderedH = vbH * scale;

  const alignX = (compW - renderedW) / 2;
  const alignY = (compH - renderedH) / 2;

  const localX = alignX + (pin.x - vbMinX) * scale;
  const localY = alignY + (pin.y - vbMinY) * scale;

  return { x: localX, y: localY };
}

/**
 * Compute absolute world coordinates for a component pin on the canvas.
 * Accounts for component position (x, y) and SVG viewBox-to-rendered scaling.
 */
export function getComponentPinCanvasCoords(comp, pinId, catalog = COMPONENT_CATALOG) {
  if (!comp) return { x: 0, y: 0 };
  const def = getComponentDefinition(comp.type) || catalog.find(c => c.type === comp.type);
  if (!def) return { x: comp.x || 0, y: comp.y || 0 };
  const pin = def.pins?.find(p => p.id === pinId);
  if (!pin) return { x: comp.x || 0, y: comp.y || 0 };

  const rel = getPinRelativeCoords(def, pin);
  return {
    x: (comp.x || 0) + rel.x,
    y: (comp.y || 0) + rel.y
  };
}
