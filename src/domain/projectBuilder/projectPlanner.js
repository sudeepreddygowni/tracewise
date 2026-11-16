/**
 * Tracewise Project Builder — Project Planner
 * Classifies user intent, checks component capability, and generates validated build plans.
 */

import {
  createDiscoLightBuildPlan,
  createRgbMoodLightBuildPlan,
  createPotentiometerDimmerBuildPlan,
  createBuzzerAlarmBuildPlan
} from './projectTemplates.js';
import { compileBuildPlan } from './catalogCompiler.js';
import { planAddLedModification } from './projectModifier.js';

// Components known to be unsupported in the current basic catalog
const UNSUPPORTED_KEYWORDS = [
  { keyword: 'servo', name: 'Servo Motor' },
  { keyword: 'stepper', name: 'Stepper Motor' },
  { keyword: 'ultrasonic', name: 'Ultrasonic Distance Sensor (HC-SR04)' },
  { keyword: 'distance sensor', name: 'Ultrasonic Distance Sensor' },
  { keyword: 'hc-sr04', name: 'Ultrasonic Sensor (HC-SR04)' },
  { keyword: 'oled', name: 'OLED Display (I2C/SPI)' },
  { keyword: 'lcd', name: 'Liquid Crystal Display (LCD 1602)' },
  { keyword: 'display', name: 'Digital Display Screen' },
  { keyword: 'bluetooth', name: 'Bluetooth Transceiver (HC-05/06)' },
  { keyword: 'ble', name: 'Bluetooth Low Energy Module' },
  { keyword: 'wifi', name: 'Wi-Fi Module' },
  { keyword: 'esp32', name: 'ESP32 Microcontroller' },
  { keyword: 'esp8266', name: 'ESP8266 Wi-Fi Chip' },
  { keyword: 'relay', name: 'Electromechanical Relay Module' },
  { keyword: 'dht11', name: 'DHT11 Humidity & Temperature Sensor' },
  { keyword: 'dht22', name: 'DHT22 Temperature Sensor' },
  { keyword: 'temperature sensor', name: 'Temperature Sensor (DHT/DS18B20)' },
  { keyword: 'pir', name: 'PIR Motion Sensor' },
  { keyword: 'motion sensor', name: 'PIR Motion Sensor' },
  { keyword: 'rfid', name: 'RFID RC522 Reader' }
];

export const BUILD_INTENT = {
  CHAT_EXPLAIN: 'CHAT_EXPLAIN',
  BUILD_PROJECT: 'BUILD_PROJECT',
  MODIFY_PROJECT: 'MODIFY_PROJECT'
};

/**
 * Checks if a user prompt mentions hardware capabilities not in the Tracewise catalog.
 */
export function detectUnsupportedHardware(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const detected = [];

  for (const item of UNSUPPORTED_KEYWORDS) {
    if (lower.includes(item.keyword)) {
      if (!detected.includes(item.name)) {
        detected.push(item.name);
      }
    }
  }

  return detected;
}

/**
 * Classifies intention: pure questions vs build/create requests vs modification requests.
 */
export function classifyBuildIntent(promptText) {
  if (!promptText || typeof promptText !== 'string') {
    return BUILD_INTENT.CHAT_EXPLAIN;
  }

  const clean = promptText.trim();
  const lower = clean.toLowerCase();

  // Modification Intent: adding/changing components in current project
  const isModification = /\b(add|insert|attach|wire another|put another)\b/i.test(lower) &&
    /\b(led|resistor|button|wire|pin)\b/i.test(lower);
  if (isModification) {
    return BUILD_INTENT.MODIFY_PROJECT;
  }

  // Pure Question Intent: questions asking how/why without "create/build/make"
  const isExplicitQuestion = /^(why|how|what|explain|tell me|can you explain|check if|walk me through|troubleshoot)\b/i.test(clean) &&
    !/\b(create|build|make|generate|construct|assemble)\b/i.test(lower);
  if (isExplicitQuestion) {
    return BUILD_INTENT.CHAT_EXPLAIN;
  }

  // Explicit Creation / Build Intent
  const isCreation = /\b(create|build|make|generate|construct|design|assemble|set up)\b/i.test(lower) ||
    lower.includes('disco-light') ||
    lower.includes('disco light') ||
    (lower.includes('button') && lower.includes('led'));

  if (isCreation) {
    return BUILD_INTENT.BUILD_PROJECT;
  }

  return BUILD_INTENT.CHAT_EXPLAIN;
}

/**
 * Plans and compiles a project from a user prompt.
 */
export function planProjectFromPrompt(promptText, activeProject = null) {
  const clean = String(promptText || '').trim();
  const lower = clean.toLowerCase();

  // 1. Check for unsupported hardware
  const unsupported = detectUnsupportedHardware(clean);
  if (unsupported.length > 0) {
    return {
      status: 'CANNOT_BUILD',
      intent: BUILD_INTENT.BUILD_PROJECT,
      unsupported,
      message: `Tracewise cannot fully build this project because the required component (${unsupported.join(', ')}) is not available in the current component library. Our catalog currently supports: Arduino Uno R3, Half Breadboard, 5mm LEDs (Red/Green/Blue/Yellow), RGB LED, 220Ω & 10kΩ Resistors, Momentary Push Buttons, Potentiometer (10k), Photoresistor (LDR), Slide Switch (SPDT), and Active Piezo Buzzer.`,
      project: null
    };
  }

  const intent = classifyBuildIntent(clean);

  // 2. Incremental modification to active project
  if (intent === BUILD_INTENT.MODIFY_PROJECT && activeProject) {
    let color = 'yellow';
    if (lower.includes('red')) color = 'red';
    else if (lower.includes('green')) color = 'green';
    else if (lower.includes('blue')) color = 'blue';

    try {
      const modificationPlan = planAddLedModification(activeProject, color);
      return {
        status: 'READY_TO_MODIFY',
        intent: BUILD_INTENT.MODIFY_PROJECT,
        modificationPlan,
        message: `Prepared modification: ${modificationPlan.title}. You can review and apply this build to your canvas.`
      };
    } catch (err) {
      return {
        status: 'CANNOT_BUILD',
        intent: BUILD_INTENT.MODIFY_PROJECT,
        message: `Cannot modify project: ${err.message}`
      };
    }
  }

  // 3. New Project Build Intent
  if (intent === BUILD_INTENT.BUILD_PROJECT) {
    // RGB Mood Light
    if (lower.includes('rgb') || lower.includes('color mixer') || lower.includes('mood light')) {
      const buildPlan = createRgbMoodLightBuildPlan();
      const compiled = compileBuildPlan(buildPlan);
      return {
        status: 'BUILT',
        intent: BUILD_INTENT.BUILD_PROJECT,
        plan: buildPlan,
        buildPlan,
        project: compiled.project,
        validation: compiled.validation,
        summary: compiled.summary,
        message: `Built RGB LED Mood Light & Color Mixer with ${compiled.summary.componentCount} components, ${compiled.summary.connectionCount} wires, and PWM Arduino firmware.`
      };
    }

    // Potentiometer Dimmer
    if (lower.includes('potentiometer') || lower.includes('dimmer') || lower.includes('analog control') || lower.includes('dial')) {
      const buildPlan = createPotentiometerDimmerBuildPlan();
      const compiled = compileBuildPlan(buildPlan);
      return {
        status: 'BUILT',
        intent: BUILD_INTENT.BUILD_PROJECT,
        plan: buildPlan,
        buildPlan,
        project: compiled.project,
        validation: compiled.validation,
        summary: compiled.summary,
        message: `Built Rotary Potentiometer LED Dimmer with ${compiled.summary.componentCount} components, ${compiled.summary.connectionCount} wires, and analogRead/PWM firmware.`
      };
    }

    // Buzzer Sound Alarm
    if (lower.includes('buzzer') || lower.includes('alarm') || lower.includes('beeper') || lower.includes('sound alert')) {
      const buildPlan = createBuzzerAlarmBuildPlan();
      const compiled = compileBuildPlan(buildPlan);
      return {
        status: 'BUILT',
        intent: BUILD_INTENT.BUILD_PROJECT,
        plan: buildPlan,
        buildPlan,
        project: compiled.project,
        validation: compiled.validation,
        summary: compiled.summary,
        message: `Built Push-Button Sound Alarm & Active Buzzer with ${compiled.summary.componentCount} components, ${compiled.summary.connectionCount} wires, and audio alarm firmware.`
      };
    }

    // Disco Light Project (Test A & B)
    if (lower.includes('disco') || (lower.includes('button') && lower.includes('led'))) {
      const buildPlan = createDiscoLightBuildPlan();
      const compiled = compileBuildPlan(buildPlan);

      return {
        status: 'BUILT',
        intent: BUILD_INTENT.BUILD_PROJECT,
        plan: buildPlan,
        buildPlan,
        project: compiled.project,
        validation: compiled.validation,
        summary: compiled.summary,
        message: `Built Three-Color Button-Controlled Disco Light with ${compiled.summary.componentCount} components, ${compiled.summary.connectionCount} wires, and debounced Arduino C++ firmware.`
      };
    }
  }

  // Default: Conversational Question Intent
  return {
    status: 'CHAT_EXPLAIN',
    intent: BUILD_INTENT.CHAT_EXPLAIN,
    message: null,
    project: null
  };
}
