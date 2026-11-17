import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AvrSimulationRunner, ARDUINO_UNO_PINS } from '../services/simulation/avrRunner';
import { compileArduinoSketch } from '../services/compilerService';
import { buildNetlist, validateElectricalRules, traceLedBranch } from '../domain/netlistEngine';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  // Lifecycle status: 'STOPPED' | 'COMPILING' | 'READY' | 'RUNNING' | 'PAUSED' | 'ERROR'
  const [status, setStatus] = useState('STOPPED');
  const [simTime, setSimTime] = useState(0);
  const [pinStates, setPinStates] = useState({});
  const [serialOutput, setSerialOutput] = useState('');
  const [isSerialOpen, setIsSerialOpen] = useState(false);
  const [baudRate, setBaudRate] = useState(9600);
  const [compileError, setCompileError] = useState(null);
  const [compileDiagnostics, setCompileDiagnostics] = useState([]);
  const [electricalDiagnostics, setElectricalDiagnostics] = useState([]);
  const [lastCompiledHex, setLastCompiledHex] = useState(null);

  // Active runner instance ref
  const runnerRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Active project ref for real-time netlist queries
  const projectRef = useRef(null);
  const netlistRef = useRef(null);

  // Clean up runner on unmount
  useEffect(() => {
    return () => {
      if (runnerRef.current) {
        runnerRef.current.stop();
        runnerRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  // Update simTime timer display when running
  useEffect(() => {
    if (status === 'RUNNING') {
      timerIntervalRef.current = setInterval(() => {
        if (runnerRef.current) {
          setSimTime(runnerRef.current.getSimTime());
        }
      }, 50);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [status]);

  /**
   * Start or compile and run simulation
   */
  const startSimulation = useCallback(async (project) => {
    if (!project) return;
    projectRef.current = project;

    // 1. Solve electrical netlist and check safety
    const electricalCheck = validateElectricalRules(project);
    netlistRef.current = electricalCheck.netlist;
    setElectricalDiagnostics(electricalCheck.checks);

    const hasShortCircuit = electricalCheck.checks.some(c => c.id === 'err-short-circuit');
    if (hasShortCircuit) {
      setStatus('ERROR');
      setCompileError('CRITICAL: Direct short circuit between 5V and GND! Simulation halted to prevent damage.');
      return;
    }

    // 2. Extract firmware code
    const firmwareCode = project.firmware?.files?.[0]?.content || project.code || '';
    if (!firmwareCode.trim()) {
      setStatus('ERROR');
      setCompileError('No firmware code found. Please write Arduino C++ code before starting simulation.');
      return;
    }

    setStatus('COMPILING');
    setCompileError(null);
    setCompileDiagnostics([]);

    try {
      // 3. Compile Arduino sketch targeting ATmega328P
      const compileRes = await compileArduinoSketch(firmwareCode, { board: 'arduino:avr:uno' });
      if (!compileRes.success || !compileRes.hex) {
        setStatus('ERROR');
        setCompileError(compileRes.error || 'Compilation failed');
        setCompileDiagnostics(compileRes.diagnostics || []);
        return;
      }

      setLastCompiledHex(compileRes.hex);

      // 4. Tear down any existing runner
      if (runnerRef.current) {
        runnerRef.current.stop();
        runnerRef.current = null;
      }

      // 5. Instantiate new AvrSimulationRunner with compiled machine code
      const runner = new AvrSimulationRunner(compileRes.hex);
      runnerRef.current = runner;

      // Subscribe to pin state changes
      runner.addListener((evt) => {
        if (evt.type === 'PIN_CHANGE') {
          setPinStates({ ...evt.pinStates });
        } else if (evt.type === 'STATUS') {
          if (evt.status === 'RUNNING') setStatus('RUNNING');
          else if (evt.status === 'PAUSED') setStatus('PAUSED');
          else if (evt.status === 'STOPPED') setStatus('STOPPED');
          else if (evt.status === 'ERROR') setStatus('ERROR');
        } else if (evt.type === 'STOPPED') {
          setStatus('STOPPED');
          setPinStates({ ...evt.pinStates });
        }
      });

      // Subscribe to Serial Monitor USART output
      runner.onSerial((char) => {
        setSerialOutput(prev => prev + char);
      });

      // Start execution loop
      runner.start();
      setStatus('RUNNING');
      setSimTime(0);
    } catch (err) {
      setStatus('ERROR');
      setCompileError(err.message || 'Simulation initialization failed');
    }
  }, []);

  /**
   * Pause running simulation
   */
  const pauseSimulation = useCallback(() => {
    if (runnerRef.current && status === 'RUNNING') {
      runnerRef.current.pause();
      setStatus('PAUSED');
    }
  }, [status]);

  /**
   * Resume paused simulation
   */
  const resumeSimulation = useCallback(() => {
    if (runnerRef.current && status === 'PAUSED') {
      runnerRef.current.start();
      setStatus('RUNNING');
    }
  }, [status]);

  /**
   * Stop simulation and reset all output pins
   */
  const stopSimulation = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.stop();
      runnerRef.current = null;
    }
    setStatus('STOPPED');
    setSimTime(0);
    // Reset all pins to LOW (0V)
    const resetPins = {};
    for (const pinName of Object.keys(ARDUINO_UNO_PINS)) {
      resetPins[pinName] = { high: false, voltage: 0.0 };
    }
    setPinStates(resetPins);
  }, []);

  /**
   * Reset simulation CPU and re-run from cycle 0
   */
  const resetSimulation = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.reset();
      setSimTime(0);
      setSerialOutput(prev => prev + '\n--- System Reset ---\n');
      runnerRef.current.start();
      setStatus('RUNNING');
    }
  }, []);

  /**
   * User interaction: press or release a push button
   */
  const triggerButton = useCallback((componentId, isPressed) => {
    if (!runnerRef.current || !projectRef.current) return;
    const project = projectRef.current;
    const netlist = netlistRef.current || buildNetlist(project);

    // Find the button component
    const btnComp = (project.components || []).find(c => c.id === componentId);
    if (!btnComp) return;

    // Check which MCU digital pin is connected to terminal1 or terminal2
    const net1Id = netlist.pinToNetId.get(`${componentId}:terminal1`);
    const net2Id = netlist.pinToNetId.get(`${componentId}:terminal2`);

    const net1 = netlist.nets.find(n => n.id === net1Id);
    const net2 = netlist.nets.find(n => n.id === net2Id);

    // Find MCU pin on net 1 or net 2
    const mcuPin1 = net1?.pins?.find(p => p.componentType.startsWith('arduino') && /^D[0-9]+$/.test(p.pinId));
    const mcuPin2 = net2?.pins?.find(p => p.componentType.startsWith('arduino') && /^D[0-9]+$/.test(p.pinId));

    const targetPin = mcuPin1 || mcuPin2;
    if (!targetPin) return;

    // Determine if wiring is active-low (to GND) or active-high (to 5V)
    const otherNet = targetPin === mcuPin1 ? net2 : net1;
    const isWiredToGnd = otherNet?.isGND || false;

    // Standard Arduino button with INPUT_PULLUP:
    // When pressed, pin is connected to GND -> LOW (false). When released -> HIGH (true)
    let pinLogicLevel = false;
    if (isWiredToGnd) {
      pinLogicLevel = !isPressed; // Pressed = LOW (0V), Released = HIGH (5V)
    } else {
      pinLogicLevel = isPressed; // Active-high: Pressed = HIGH (5V), Released = LOW (0V)
    }

    runnerRef.current.setDigitalPinInput(targetPin.pinId, pinLogicLevel);
  }, []);

  /**
   * User interaction: adjust potentiometer wiper voltage
   */
  const setPotentiometerVoltage = useCallback((componentId, rawValue) => {
    if (!runnerRef.current || !projectRef.current) return;
    const project = projectRef.current;
    const netlist = netlistRef.current || buildNetlist(project);

    // Normalize value (0 to 1023)
    const val = Math.max(0, Math.min(1023, Number(rawValue) || 0));
    const voltage = (val / 1023.0) * 5.0;

    // Check which analog pin the wiper is connected to
    const wiperKey = `${componentId}:wiper`;
    const wiperNetId = netlist.pinToNetId.get(wiperKey) || netlist.pinToNetId.get(`${componentId}:terminal2`);
    const net = netlist.nets.find(n => n.id === wiperNetId);

    const mcuPin = net?.pins?.find(p => p.componentType.startsWith('arduino') && /^A[0-5]$/.test(p.pinId));
    if (mcuPin) {
      runnerRef.current.setAnalogInputVoltage(mcuPin.pinId, voltage);
    }
  }, []);

  /**
   * Send serial text string into MCU UART RX
   */
  const sendSerial = useCallback((text) => {
    if (runnerRef.current && text) {
      runnerRef.current.sendSerialInput(text + '\n');
    }
  }, []);

  /**
   * Clear serial output buffer
   */
  const clearSerial = useCallback(() => {
    setSerialOutput('');
  }, []);

  /**
   * Dynamic evaluation of component simulation state (e.g. LED illumination, buzzer sound)
   */
  const getComponentSimulationState = useCallback((comp) => {
    if (!comp) return { isActive: false };
    if (status !== 'RUNNING' && status !== 'PAUSED') {
      return { isActive: false, isLit: false };
    }

    const netlist = netlistRef.current;
    if (!netlist) return { isActive: false };

    // 1. Arduino Uno State
    if (comp.type === 'arduino-uno' || comp.type === 'arduino-nano') {
      const pin13State = pinStates['D13']?.high || false;
      return {
        powerOn: true,
        led13: pin13State,
        tx: false,
        rx: false
      };
    }

    // 2. Standard LED State
    if (comp.type === 'led') {
      const branch = traceLedBranch(comp, netlist);
      if (branch.drivenByMcuPin) {
        const pinState = pinStates[branch.drivenByMcuPin];
        const isHigh = pinState?.high || false;
        // LED is lit if driven HIGH and circuit has ground return
        const isLit = isHigh && branch.hasGroundReturn;
        return {
          isActive: isLit,
          isLit,
          color: comp.props?.color || 'red',
          isUnprotected: !branch.hasCurrentLimitingResistor && isLit
        };
      }
      return { isActive: false, isLit: false };
    }

    // 3. RGB LED State
    if (comp.type === 'rgb-led') {
      const redPin = comp.props?.redPin || 'D9';
      const greenPin = comp.props?.greenPin || 'D10';
      const bluePin = comp.props?.bluePin || 'D11';

      const isR = pinStates[redPin]?.high || false;
      const isG = pinStates[greenPin]?.high || false;
      const isB = pinStates[bluePin]?.high || false;

      return {
        isActive: isR || isG || isB,
        isLit: isR || isG || isB,
        r: isR,
        g: isG,
        b: isB
      };
    }

    // 4. Buzzer State
    if (comp.type === 'buzzer') {
      // Find connected MCU pin
      const posNetId = netlist.pinToNetId.get(`${comp.id}:pos`);
      const negNetId = netlist.pinToNetId.get(`${comp.id}:neg`);
      const posNet = netlist.nets.find(n => n.id === posNetId);
      const negNet = netlist.nets.find(n => n.id === negNetId);

      const mcuPin = posNet?.pins?.find(p => p.componentType.startsWith('arduino') && /^D[0-9]+$/.test(p.pinId));
      const hasGnd = negNet?.isGND || false;

      const isHigh = mcuPin ? (pinStates[mcuPin.pinId]?.high || false) : false;
      const isSounding = isHigh && hasGnd;

      return {
        isActive: isSounding,
        isSounding
      };
    }

    return { isActive: false };
  }, [status, pinStates]);

  const value = useMemo(() => ({
    status,
    simTime,
    pinStates,
    serialOutput,
    isSerialOpen,
    baudRate,
    compileError,
    compileDiagnostics,
    electricalDiagnostics,
    lastCompiledHex,
    isCompiling: status === 'COMPILING',
    isRunning: status === 'RUNNING',
    isPaused: status === 'PAUSED',
    isStopped: status === 'STOPPED',
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    triggerButton,
    setPotentiometerVoltage,
    sendSerial,
    clearSerial,
    setBaudRate,
    toggleSerial: () => setIsSerialOpen(prev => !prev),
    getComponentSimulationState
  }), [
    status,
    simTime,
    pinStates,
    serialOutput,
    isSerialOpen,
    baudRate,
    compileError,
    compileDiagnostics,
    electricalDiagnostics,
    lastCompiledHex,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    triggerButton,
    setPotentiometerVoltage,
    sendSerial,
    clearSerial,
    getComponentSimulationState
  ]);

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return ctx;
}
