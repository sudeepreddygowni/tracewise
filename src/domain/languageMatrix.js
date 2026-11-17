/**
 * Tracewise Hardware-Language Capability Matrix
 * 
 * Canonical registry of supported microcontroller boards and programming languages.
 * Explicitly distinguishes editing, syntax checking, compilation, and behavioral simulation.
 * Never claims an AVR simulator executes ESP32 or Raspberry Pi code.
 */

export const SUPPORTED_BOARDS = [
  {
    id: 'arduino-uno',
    name: 'Arduino Uno R3',
    arch: 'AVR 8-bit (ATmega328P)',
    clockSpeed: '16 MHz',
    flash: '32 KB',
    voltage: '5V',
    defaultLanguage: 'arduino-cpp'
  },
  {
    id: 'arduino-mega',
    name: 'Arduino Mega 2560',
    arch: 'AVR 8-bit (ATmega2560)',
    clockSpeed: '16 MHz',
    flash: '256 KB',
    voltage: '5V',
    defaultLanguage: 'arduino-cpp'
  },
  {
    id: 'esp32-devkit',
    name: 'ESP32 NodeMCU DevKit',
    arch: 'Xtensa Dual-Core 32-bit (ESP32-WROOM)',
    clockSpeed: '240 MHz',
    flash: '4 MB',
    voltage: '3.3V',
    defaultLanguage: 'micropython'
  },
  {
    id: 'pico-rp2040',
    name: 'Raspberry Pi Pico',
    arch: 'ARM Cortex-M0+ Dual-Core (RP2040)',
    clockSpeed: '133 MHz',
    flash: '2 MB',
    voltage: '3.3V',
    defaultLanguage: 'micropython'
  },
  {
    id: 'raspberry-pi',
    name: 'Raspberry Pi 4 / 5',
    arch: 'ARM Cortex-A72 / A76 (Linux SBC)',
    clockSpeed: '1.8 - 2.4 GHz',
    flash: 'MicroSD / eMMC',
    voltage: '5V',
    defaultLanguage: 'python'
  },
  {
    id: 'microbit',
    name: 'BBC micro:bit v2',
    arch: 'ARM Cortex-M4 (nRF52833)',
    clockSpeed: '64 MHz',
    flash: '512 KB',
    voltage: '3.3V',
    defaultLanguage: 'micropython'
  }
];

export const SUPPORTED_LANGUAGES = [
  {
    id: 'arduino-cpp',
    name: 'Arduino C++',
    extensions: ['.ino', '.cpp', '.h'],
    mode: 'cpp',
    icon: 'FileCode'
  },
  {
    id: 'c-cpp',
    name: 'Standard C / C++',
    extensions: ['.c', '.cpp', '.h', '.hpp'],
    mode: 'cpp',
    icon: 'FileCode'
  },
  {
    id: 'micropython',
    name: 'MicroPython',
    extensions: ['.py'],
    mode: 'python',
    icon: 'FileCode'
  },
  {
    id: 'circuitpython',
    name: 'CircuitPython',
    extensions: ['.py'],
    mode: 'python',
    icon: 'FileCode'
  },
  {
    id: 'python',
    name: 'Python 3',
    extensions: ['.py'],
    mode: 'python',
    icon: 'FileCode'
  },
  {
    id: 'javascript',
    name: 'JavaScript / Node',
    extensions: ['.js'],
    mode: 'javascript',
    icon: 'FileCode'
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['.ts'],
    mode: 'typescript',
    icon: 'FileCode'
  },
  {
    id: 'markdown',
    name: 'Documentation',
    extensions: ['.md', '.txt'],
    mode: 'markdown',
    icon: 'FileText'
  }
];

/**
 * Capability Matrix: [boardId][languageId]
 */
export const CAPABILITY_MATRIX = {
  'arduino-uno': {
    'arduino-cpp': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: true,
      simulationSupported: true,
      runtimeExecutionSupported: true,
      toolchain: 'avr-gcc / avr8js ATmega328P emulator',
      supportedLibraries: ['Wire', 'SPI', 'Servo', 'LiquidCrystal', 'SoftwareSerial'],
      limitations: []
    },
    'c-cpp': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: true,
      simulationSupported: true,
      runtimeExecutionSupported: true,
      toolchain: 'avr-gcc bare-metal',
      supportedLibraries: ['avr/io.h', 'util/delay.h', 'avr/interrupt.h'],
      limitations: []
    },
    'micropython': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: false,
      simulationSupported: false,
      runtimeExecutionSupported: false,
      toolchain: 'None (ATmega328P has 2KB SRAM; insufficient for Python runtime)',
      supportedLibraries: [],
      limitations: ['Arduino Uno ATmega328P memory is too constrained for MicroPython. Editing supported for project notes.']
    },
    'python': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: false,
      simulationSupported: false,
      runtimeExecutionSupported: false,
      toolchain: 'Host-side pySerial / Firmata bridge',
      supportedLibraries: ['pyserial'],
      limitations: ['Standard Python runs on host PC communicating via USB serial to Arduino.']
    }
  },
  'esp32-devkit': {
    'micropython': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: false,
      simulationSupported: false,
      runtimeExecutionSupported: false,
      toolchain: 'MicroPython ESP32 firmware',
      supportedLibraries: ['machine', 'time', 'network', 'esp32', 'bluetooth'],
      limitations: ['MicroPython code editing & syntax checking supported. Local simulation for Xtensa architecture is not routed through AVR simulator.']
    },
    'arduino-cpp': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: true,
      simulationSupported: false,
      runtimeExecutionSupported: false,
      toolchain: 'esptool / esp32-arduino-core',
      supportedLibraries: ['WiFi', 'BluetoothSerial', 'esp_now', 'Wire', 'SPI'],
      limitations: ['ESP32 compilation requires Xtensa toolchain; AVR8js simulator does not execute Xtensa machine code.']
    },
    'circuitpython': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: false,
      simulationSupported: false,
      runtimeExecutionSupported: false,
      toolchain: 'Adafruit CircuitPython ESP32 port',
      supportedLibraries: ['board', 'digitalio', 'busio', 'neopixel'],
      limitations: ['CircuitPython editing supported. Simulation unavailable in local AVR engine.']
    }
  },
  'pico-rp2040': {
    'micropython': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: false,
      simulationSupported: false,
      runtimeExecutionSupported: false,
      toolchain: 'RP2040 MicroPython UF2',
      supportedLibraries: ['machine', 'rp2', 'time'],
      limitations: ['RP2040 editing supported. Simulation not executed on AVR emulator.']
    },
    'c-cpp': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: true,
      simulationSupported: false,
      runtimeExecutionSupported: false,
      toolchain: 'Pico C/C++ SDK (arm-none-eabi-gcc)',
      supportedLibraries: ['pico/stdlib.h', 'hardware/gpio.h'],
      limitations: ['Pico C SDK compilation supported; simulation not executed in AVR emulator.']
    }
  },
  'raspberry-pi': {
    'python': {
      editingSupported: true,
      syntaxCheckSupported: true,
      compilationSupported: false,
      simulationSupported: false,
      runtimeExecutionSupported: false,
      toolchain: 'Python 3 on Linux / Raspberry Pi OS',
      supportedLibraries: ['RPi.GPIO', 'gpiozero', 'smbus', 'opencv-python'],
      limitations: ['Raspberry Pi Linux operating system is not emulated in browser. Python source editing and project documentation fully supported.']
    }
  }
};

/**
 * Returns canonical capabilities for a given board and programming language.
 */
export function getBoardLanguageCapabilities(boardId = 'arduino-uno', languageId = 'arduino-cpp') {
  // Normalize IDs
  let normBoard = 'arduino-uno';
  const lowerB = (boardId || '').toLowerCase();
  if (lowerB.includes('esp32')) normBoard = 'esp32-devkit';
  else if (lowerB.includes('pico') || lowerB.includes('rp2040')) normBoard = 'pico-rp2040';
  else if (lowerB.includes('raspberry') || lowerB.includes('pi')) normBoard = 'raspberry-pi';
  else if (lowerB.includes('mega')) normBoard = 'arduino-mega';

  let normLang = 'arduino-cpp';
  const lowerL = (languageId || '').toLowerCase();
  if (lowerL.includes('micro') || (lowerL.includes('python') && normBoard === 'esp32-devkit')) normLang = 'micropython';
  else if (lowerL.includes('circuit')) normLang = 'circuitpython';
  else if (lowerL.includes('python')) normLang = 'python';
  else if (lowerL.includes('javascript') || lowerL.includes('js')) normLang = 'javascript';
  else if (lowerL.includes('typescript') || lowerL.includes('ts')) normLang = 'typescript';
  else if (lowerL.includes('c++') || lowerL.includes('cpp') || lowerL.includes('ino')) normLang = 'arduino-cpp';
  else if (lowerL.includes('markdown') || lowerL.includes('md')) normLang = 'markdown';

  const entry = CAPABILITY_MATRIX[normBoard]?.[normLang];
  if (entry) {
    return {
      boardId: normBoard,
      languageId: normLang,
      ...entry
    };
  }

  // Graceful fallback for uncataloged pairings
  return {
    boardId: normBoard,
    languageId: normLang,
    editingSupported: true,
    syntaxCheckSupported: true,
    compilationSupported: false,
    simulationSupported: false,
    runtimeExecutionSupported: false,
    toolchain: 'Source code editor only',
    supportedLibraries: [],
    limitations: [`Simulation and compilation for ${normBoard} + ${normLang} is not supported in local emulator.`]
  };
}
