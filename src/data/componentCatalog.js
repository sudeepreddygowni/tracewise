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
  {
    type: 'arduino-uno',
    category: 'Microcontrollers',
    name: 'Arduino Uno R3',
    description: 'ATmega328P based microcontroller board with 14 digital I/O pins and 6 analog inputs.',
    width: 300,
    height: 220,
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
    defaultProps: { color: 'red' },
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
    defaultProps: { resistance: '220Ω', bands: ['red', 'red', 'brown', 'gold'] },
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
    defaultProps: { red: 255, green: 0, blue: 128, mode: 'common-cathode' },
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
    defaultProps: { resistance: '10kΩ', value: 512 },
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
    defaultProps: { lightLevel: 'medium' },
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
    defaultProps: { state: 'left' },
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
    defaultProps: { tone: '2.5kHz' },
    pins: [
      { id: 'anode', label: 'Positive (+)', role: 'positive', x: 20, y: 56 },
      { id: 'cathode', label: 'Negative (- / GND)', role: 'negative', x: 45, y: 56 }
    ],
    aliases: ['beeper', 'piezo', 'speaker', 'alarm', 'sounder', 'audio', 'tone']
  }
];

export function getComponentDefinition(type) {
  return COMPONENT_CATALOG.find(c => c.type === type) || null;
}
