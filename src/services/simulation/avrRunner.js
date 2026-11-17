/**
 * Tracewise AVR Microcontroller Runtime & Simulation Engine
 *
 * Implements:
 * 1. ATmega328P 16MHz CPU emulation based on avr8js.
 * 2. Hardware peripherals: Timers (millis/micros/delay/PWM), GPIO Ports B/C/D, ADC, and USART.
 * 3. Bidirectional electrical netlist integration (MCU outputs -> Component models -> Visual updates; User input -> MCU inputs).
 * 4. Serial Monitor support for bidirectional UART communication.
 * 5. Deterministic lifecycle controls: START, PAUSE, RESUME, STOP, RESET, STEP.
 */

import {
  CPU,
  AVRIOPort,
  portBConfig,
  portCConfig,
  portDConfig,
  AVRTimer,
  timer0Config,
  timer1Config,
  timer2Config,
  AVRUSART,
  usart0Config,
  AVRADC,
  adcConfig,
  atmega328Channels,
  PinState,
  avrInstruction
} from 'avr8js';
import intelHex from 'intel-hex';

// Arduino Uno Pin to ATmega328P Register Mapping
// Port D: D0 (PD0) to D7 (PD7)
// Port B: D8 (PB0) to D13 (PB5)
// Port C: A0 (PC0) to A5 (PC5)
export const ARDUINO_UNO_PINS = {
  D0: { port: 'D', bit: 0, role: 'digital-serial' },
  D1: { port: 'D', bit: 1, role: 'digital-serial' },
  D2: { port: 'D', bit: 2, role: 'digital' },
  D3: { port: 'D', bit: 3, role: 'pwm' },
  D4: { port: 'D', bit: 4, role: 'digital' },
  D5: { port: 'D', bit: 5, role: 'pwm' },
  D6: { port: 'D', bit: 6, role: 'pwm' },
  D7: { port: 'D', bit: 7, role: 'digital' },
  D8: { port: 'B', bit: 0, role: 'digital' },
  D9: { port: 'B', bit: 1, role: 'pwm' },
  D10: { port: 'B', bit: 2, role: 'pwm' },
  D11: { port: 'B', bit: 3, role: 'pwm' },
  D12: { port: 'B', bit: 4, role: 'digital' },
  D13: { port: 'B', bit: 5, role: 'digital-led' },
  A0: { port: 'C', bit: 0, adcChannel: 0, role: 'analog' },
  A1: { port: 'C', bit: 1, adcChannel: 1, role: 'analog' },
  A2: { port: 'C', bit: 2, adcChannel: 2, role: 'analog' },
  A3: { port: 'C', bit: 3, adcChannel: 3, role: 'analog' },
  A4: { port: 'C', bit: 4, adcChannel: 4, role: 'analog' },
  A5: { port: 'C', bit: 5, adcChannel: 5, role: 'analog' }
};

export class AvrSimulationRunner {
  constructor(hexString, options = {}) {
    this.hexString = hexString;
    this.options = options;
    this.status = 'NOT_STARTED'; // 'NOT_STARTED' | 'READY' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR'
    this.cpu = null;
    this.portB = null;
    this.portC = null;
    this.portD = null;
    this.timer0 = null;
    this.timer1 = null;
    this.timer2 = null;
    this.adc = null;
    this.usart = null;

    // Pin states: maps pin name (e.g. 'D13') to { high: boolean, voltage: number }
    this.pinStates = new Map();
    // ADC analog input voltages: maps channel 0..7 to voltage (0.0 to 5.0)
    this.analogVoltages = new Map();

    // Listeners
    this.listeners = new Set();
    this.serialListeners = new Set();

    // Animation & Cycle execution loop
    this.animationFrameId = null;
    this.lastTimestamp = 0;
    this.cyclesPerSecond = 16000000; // 16 MHz
    this.totalCyclesExecuted = 0;

    this.initMcu();
  }

  initMcu() {
    try {
      const { data } = intelHex.parse(this.hexString);
      // ATmega328P flash is 32KB (16384 16-bit words)
      const flashWords = new Uint16Array(16384);
      const u8 = new Uint8Array(flashWords.buffer);
      for (let i = 0; i < data.length; i++) {
        u8[i] = data[i];
      }

      this.cpu = new CPU(flashWords);

      // Initialize hardware timers
      this.timer0 = new AVRTimer(this.cpu, timer0Config);
      this.timer1 = new AVRTimer(this.cpu, timer1Config);
      this.timer2 = new AVRTimer(this.cpu, timer2Config);

      // Initialize GPIO Ports
      this.portB = new AVRIOPort(this.cpu, portBConfig);
      this.portC = new AVRIOPort(this.cpu, portCConfig);
      this.portD = new AVRIOPort(this.cpu, portDConfig);

      // Initialize ADC
      this.adc = new AVRADC(this.cpu, adcConfig);

      // Initialize USART for Serial Monitor
      this.usart = new AVRUSART(this.cpu, {
        ...usart0Config,
        onByteTransmit: (byte) => {
          const char = String.fromCharCode(byte);
          this.notifySerial(char);
        }
      });

      // Hook Port listeners to track pin state changes
      this.portB.addListener((val) => this.handlePortChange('B', val));
      this.portC.addListener((val) => this.handlePortChange('C', val));
      this.portD.addListener((val) => this.handlePortChange('D', val));

      // Default pins state
      for (const [pinName] of Object.entries(ARDUINO_UNO_PINS)) {
        this.pinStates.set(pinName, { high: false, voltage: 0.0 });
      }

      this.status = 'READY';
      this.notifyListeners({ type: 'STATUS', status: this.status });
    } catch (err) {
      this.status = 'ERROR';
      this.notifyListeners({ type: 'ERROR', error: err.message });
      throw err;
    }
  }

  handlePortChange(portName, portVal) {
    let changed = false;

    for (const [pinName, mapping] of Object.entries(ARDUINO_UNO_PINS)) {
      if (mapping.port === portName) {
        const isHigh = (portVal & (1 << mapping.bit)) !== 0;
        const current = this.pinStates.get(pinName);
        if (!current || current.high !== isHigh) {
          const newState = { high: isHigh, voltage: isHigh ? 5.0 : 0.0 };
          this.pinStates.set(pinName, newState);
          changed = true;
        }
      }
    }

    if (changed) {
      this.notifyListeners({
        type: 'PIN_CHANGE',
        pinStates: Object.fromEntries(this.pinStates.entries()),
        cycles: this.cpu?.cycles || 0,
        simTime: this.getSimTime()
      });
    }
  }

  /**
   * Set digital input state from simulated hardware (e.g. push button)
   * @param {string} pinName - e.g. 'D2'
   * @param {boolean} isHigh - true = 5V, false = GND (0V)
   */
  setDigitalPinInput(pinName, isHigh) {
    const mapping = ARDUINO_UNO_PINS[pinName];
    if (!mapping || !this.cpu) return;

    if (mapping.port === 'D') {
      this.portD.setPin(mapping.bit, isHigh);
    } else if (mapping.port === 'B') {
      this.portB.setPin(mapping.bit, isHigh);
    } else if (mapping.port === 'C') {
      this.portC.setPin(mapping.bit, isHigh);
    }
  }

  /**
   * Set analog input voltage for ADC (e.g. potentiometer wiper)
   * @param {string} pinName - e.g. 'A0'
   * @param {number} voltage - 0.0 to 5.0 Volts
   */
  setAnalogInputVoltage(pinName, voltage) {
    const mapping = ARDUINO_UNO_PINS[pinName];
    if (!mapping || mapping.adcChannel === undefined || !this.adc) return;

    const clamped = Math.max(0.0, Math.min(5.0, Number(voltage) || 0.0));
    this.analogVoltages.set(mapping.adcChannel, clamped);

    // Update ADC channel configuration with input voltage
    if (this.adc && atmega328Channels[mapping.adcChannel]) {
      atmega328Channels[mapping.adcChannel].voltage = clamped;
    }
  }

  /**
   * Send serial text string into MCU RX
   */
  sendSerialInput(text) {
    if (!this.usart || !text) return;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      this.usart.writeByte(code);
    }
  }

  /**
   * Start or resume simulation execution loop
   */
  start() {
    if (this.status === 'RUNNING') return;
    this.status = 'RUNNING';
    this.lastTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.notifyListeners({ type: 'STATUS', status: this.status });
    this.runLoop();
  }

  pause() {
    if (this.status !== 'RUNNING') return;
    this.status = 'PAUSED';
    if (this.animationFrameId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationFrameId);
      } else {
        clearTimeout(this.animationFrameId);
      }
      this.animationFrameId = null;
    }
    this.notifyListeners({ type: 'STATUS', status: this.status, simTime: this.getSimTime() });
  }

  stop() {
    this.status = 'STOPPED';
    if (this.animationFrameId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationFrameId);
      } else {
        clearTimeout(this.animationFrameId);
      }
      this.animationFrameId = null;
    }

    // Reset all output pins to LOW (0V)
    for (const [pinName] of Object.entries(ARDUINO_UNO_PINS)) {
      this.pinStates.set(pinName, { high: false, voltage: 0.0 });
    }

    this.notifyListeners({
      type: 'STOPPED',
      status: this.status,
      pinStates: Object.fromEntries(this.pinStates.entries()),
      simTime: this.getSimTime()
    });
  }

  reset() {
    this.stop();
    this.totalCyclesExecuted = 0;
    this.initMcu();
    this.notifyListeners({
      type: 'RESET',
      status: this.status,
      pinStates: Object.fromEntries(this.pinStates.entries()),
      simTime: 0
    });
  }

  runLoop() {
    if (this.status !== 'RUNNING') return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsedMs = Math.max(1, Math.min(now - this.lastTimestamp, 64)); // Cap max step to 64ms for stability
    this.lastTimestamp = now;

    // Cycles to execute for this frame (16 MHz = 16,000 cycles per millisecond)
    const cyclesToRun = Math.round(elapsedMs * 16000);
    const cpu = this.cpu;

    if (cpu) {
      const targetCycle = cpu.cycles + cyclesToRun;
      while (cpu.cycles < targetCycle) {
        avrInstruction(cpu);
        cpu.tick();
      }
      this.totalCyclesExecuted = cpu.cycles;
    }

    // Schedule next frame across worker or main thread
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(() => this.runLoop());
    } else {
      this.animationFrameId = setTimeout(() => this.runLoop(), 10);
    }
  }

  /**
   * Execute a specified number of CPU cycles deterministically
   */
  step(cycles = 10000) {
    if (!this.cpu) return;
    const target = this.cpu.cycles + cycles;
    while (this.cpu.cycles < target) {
      avrInstruction(this.cpu);
      this.cpu.tick();
    }
    this.totalCyclesExecuted = this.cpu.cycles;
  }

  getSimTime() {
    if (!this.cpu) return 0;
    return this.cpu.cycles / this.cyclesPerSecond;
  }

  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.warn('Simulation listener error:', err);
      }
    }
  }

  onSerial(callback) {
    this.serialListeners.add(callback);
    return () => this.serialListeners.delete(callback);
  }

  notifySerial(char) {
    for (const listener of this.serialListeners) {
      try {
        listener(char);
      } catch (err) {
        console.warn('Serial listener error:', err);
      }
    }
  }
}
