import React from 'react';
import { ArduinoUnoSvg } from './svg/ArduinoUnoSvg';
import { BreadboardSvg } from './svg/BreadboardSvg';
import { LedSvg } from './svg/LedSvg';
import { ResistorSvg } from './svg/ResistorSvg';
import { PushButtonSvg } from './svg/PushButtonSvg';
import { RgbLedSvg } from './svg/RgbLedSvg';
import { PotentiometerSvg } from './svg/PotentiometerSvg';
import { PhotoresistorSvg } from './svg/PhotoresistorSvg';
import { SlideSwitchSvg } from './svg/SlideSwitchSvg';
import { BuzzerSvg } from './svg/BuzzerSvg';

/**
 * Common interactive pin renderer for components
 */
export function RenderInteractivePins({ pins, activePinId, onPinClick, onPinHover }) {
  if (!pins || !pins.length) return null;

  return (
    <g className="tracewise-component-pins">
      {pins.map((pin) => {
        const isSelected = activePinId === pin.id;

        return (
          <g
            key={pin.id}
            data-pin="true"
            data-pin-id={pin.id}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPinClick && onPinClick(pin);
            }}
            onMouseEnter={() => onPinHover && onPinHover(pin)}
            onMouseLeave={() => onPinHover && onPinHover(null)}
            style={{ cursor: 'pointer', touchAction: 'none' }}
          >
            {/* Generous touch target for precision on phone/tablet and desktop */}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={14}
              fill="transparent"
              style={{ pointerEvents: 'auto' }}
            />
            {/* Pin metallic rim */}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={isSelected ? 6 : 4}
              fill={isSelected ? '#2dc5e9' : '#1e293b'}
              stroke={isSelected ? '#ffffff' : '#94a3b8'}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            {/* Center contact hole */}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={1.8}
              fill={isSelected ? '#ffffff' : '#f8fafc'}
              pointerEvents="none"
            />
            {isSelected && (
              <circle
                cx={pin.x}
                cy={pin.y}
                r={9}
                fill="none"
                stroke="#2dc5e9"
                strokeWidth={1.5}
                strokeDasharray="2,2"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Universal component SVG visual renderer with pin alignment.
 */
export function ComponentSvgRenderer({
  comp,
  def,
  activePinId,
  simState = {},
  onSimAction = null,
  onPinClick,
  onPinHover
}) {
  if (!comp || !def) return null;

  // 1. Original 10 dedicated components
  switch (comp.type) {
    case 'arduino-uno':
      return (
        <ArduinoUnoSvg
          powerOn={simState.powerOn}
          led13={simState.led13}
          tx={simState.tx}
          rx={simState.rx}
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
    case 'breadboard-half':
      return (
        <BreadboardSvg
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
    case 'led':
      return (
        <LedSvg
          color={comp.props?.color || 'red'}
          isLit={simState.isLit}
          isUnprotected={simState.isUnprotected}
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
    case 'resistor':
      return (
        <ResistorSvg
          resistance={comp.props?.resistance || '220Ω'}
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
    case 'push-button':
      return (
        <PushButtonSvg
          isPressed={simState.isPressed}
          onButtonDown={() => onSimAction && onSimAction('BUTTON_DOWN', comp.id)}
          onButtonUp={() => onSimAction && onSimAction('BUTTON_UP', comp.id)}
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
    case 'rgb-led':
      return (
        <RgbLedSvg
          red={simState.r ? 255 : (comp.props?.red ?? 255)}
          green={simState.g ? 255 : (comp.props?.green ?? 0)}
          blue={simState.b ? 255 : (comp.props?.blue ?? 128)}
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
    case 'potentiometer':
      return (
        <PotentiometerSvg
          value={simState.value ?? comp.props?.value ?? 512}
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
    case 'photoresistor':
      return (
        <PhotoresistorSvg
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
    case 'slide-switch':
      return (
        <SlideSwitchSvg
          state={comp.props?.state || 'left'}
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
    case 'buzzer':
      return (
        <BuzzerSvg
          isSounding={simState.isSounding}
          pins={def.pins}
          activePinId={activePinId}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      );
  }

  // 2. High-fidelity vector representations for the expanded 23 components + custom components
  const { width = 100, height = 100, viewBox = { x: 0, y: 0, width: 100, height: 100 } } = def;
  const vbStr = `${viewBox.x || 0} ${viewBox.y || 0} ${viewBox.width || width} ${viewBox.height || height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={vbStr}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible', userSelect: 'none' }}
    >
      <defs>
        {/* PCB Navy Gradient */}
        <linearGradient id="pcbNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B3C68" />
          <stop offset="100%" stopColor="#062444" />
        </linearGradient>

        {/* ESP32 Black PCB Gradient */}
        <linearGradient id="pcbBlackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Sensor Cyan Module Gradient */}
        <linearGradient id="pcbCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Metallic Can Gradient */}
        <linearGradient id="metalCylinderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="40%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        {/* IC Body Gradient */}
        <linearGradient id="icBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Render Component Body based on type */}
      {comp.type === 'arduino-nano' && (
        <g>
          {/* Blue PCB */}
          <rect x="10" y="4" width="190" height="82" rx="6" fill="url(#pcbNavyGrad)" stroke="#1e40af" strokeWidth="1.5" />
          {/* Mini-USB Port */}
          <rect x="4" y="28" width="18" height="34" rx="2" fill="url(#metalCylinderGrad)" stroke="#64748b" strokeWidth="1" />
          {/* ATmega328P Chip */}
          <rect x="85" y="24" width="42" height="42" rx="2" fill="url(#icBodyGrad)" stroke="#475569" strokeWidth="1" />
          <circle cx="92" cy="30" r="2.5" fill="#64748b" />
          <text x="106" y="48" fontSize="8" fill="#cbd5e1" textAnchor="middle" fontFamily="monospace" fontWeight="bold">ATmega</text>
          {/* Reset button */}
          <circle cx="150" cy="45" r="7" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
          {/* Labels */}
          <text x="56" y="48" fontSize="9" fill="#ffffff" fontWeight="bold">NANO</text>
        </g>
      )}

      {comp.type === 'arduino-mega' && (
        <g>
          {/* Blue PCB */}
          <rect x="10" y="4" width="420" height="272" rx="8" fill="url(#pcbNavyGrad)" stroke="#1e40af" strokeWidth="2" />
          {/* USB & Power barrel */}
          <rect x="4" y="20" width="36" height="50" rx="3" fill="url(#metalCylinderGrad)" stroke="#64748b" />
          <rect x="4" y="190" width="45" height="55" rx="3" fill="#0f172a" stroke="#334155" />
          {/* ATmega2560 square IC */}
          <rect x="160" y="100" width="65" height="65" rx="3" fill="url(#icBodyGrad)" stroke="#475569" />
          <text x="192" y="136" fontSize="10" fill="#cbd5e1" textAnchor="middle" fontFamily="monospace" fontWeight="bold">MEGA 2560</text>
          {/* Header silkscreens */}
          <rect x="155" y="8" width="245" height="12" fill="#0f172a" rx="2" />
          <rect x="155" y="260" width="235" height="12" fill="#0f172a" rx="2" />
          <rect x="412" y="75" width="24" height="150" fill="#0f172a" rx="2" />
        </g>
      )}

      {comp.type === 'esp32-devkit' && (
        <g>
          {/* Black Matte PCB */}
          <rect x="10" y="4" width="200" height="87" rx="6" fill="url(#pcbBlackGrad)" stroke="#334155" strokeWidth="1.5" />
          {/* Micro-USB */}
          <rect x="4" y="32" width="16" height="26" rx="2" fill="url(#metalCylinderGrad)" stroke="#64748b" />
          {/* Metallic RF Shield */}
          <rect x="110" y="18" width="75" height="54" rx="3" fill="url(#metalCylinderGrad)" stroke="#94a3b8" />
          <text x="147" y="48" fontSize="10" fill="#0f172a" textAnchor="middle" fontWeight="bold">ESP-WROOM-32</text>
          {/* Antenna trace zone */}
          <rect x="185" y="20" width="18" height="50" fill="#0f172a" rx="2" stroke="#eab308" strokeWidth="1" strokeDasharray="3,3" />
          {/* Buttons */}
          <rect x="35" y="20" width="12" height="12" rx="2" fill="#64748b" />
          <rect x="35" y="58" width="12" height="12" rx="2" fill="#64748b" />
        </g>
      )}

      {comp.type === 'sensor-dht11' && (
        <g>
          {/* Blue module PCB */}
          <rect x="10" y="10" width="60" height="72" rx="4" fill="url(#pcbCyanGrad)" stroke="#0284c7" />
          {/* Cyan slotted plastic sensor cage */}
          <rect x="14" y="14" width="52" height="50" rx="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
          {/* Grill slots */}
          {[22, 28, 34, 40, 46, 52].map((y) => (
            <line key={y} x1="20" y1={y} x2="60" y2={y} stroke="#0369a1" strokeWidth="2" strokeLinecap="round" />
          ))}
          {/* Header pins down */}
          <line x1="22" y1="82" x2="22" y2="86" stroke="#94a3b8" strokeWidth="3" />
          <line x1="40" y1="82" x2="40" y2="86" stroke="#94a3b8" strokeWidth="3" />
          <line x1="58" y1="82" x2="58" y2="86" stroke="#94a3b8" strokeWidth="3" />
        </g>
      )}

      {comp.type === 'sensor-ultrasonic-hcsr04' && (
        <g>
          {/* Blue PCB */}
          <rect x="10" y="8" width="110" height="54" rx="5" fill="url(#pcbCyanGrad)" stroke="#0284c7" strokeWidth="1.5" />
          {/* Left Transducer Cylinder (Transmitter T) */}
          <circle cx="36" cy="35" r="22" fill="url(#metalCylinderGrad)" stroke="#475569" strokeWidth="1.5" />
          <circle cx="36" cy="35" r="16" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
          <text x="36" y="38" fontSize="10" fill="#ffffff" textAnchor="middle" fontWeight="bold">T</text>
          {/* Right Transducer Cylinder (Receiver R) */}
          <circle cx="94" cy="35" r="22" fill="url(#metalCylinderGrad)" stroke="#475569" strokeWidth="1.5" />
          <circle cx="94" cy="35" r="16" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
          <text x="94" y="38" fontSize="10" fill="#ffffff" textAnchor="middle" fontWeight="bold">R</text>
          {/* Quartz crystal */}
          <rect x="61" y="26" width="8" height="18" rx="2" fill="url(#metalCylinderGrad)" stroke="#64748b" />
        </g>
      )}

      {comp.type === 'sensor-pir' && (
        <g>
          {/* Green PCB base */}
          <rect x="10" y="10" width="75" height="70" rx="6" fill="#15803d" stroke="#166534" strokeWidth="1.5" />
          {/* White Fresnel Dome Lens */}
          <circle cx="47" cy="45" r="28" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="47" cy="45" r="22" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="47" cy="45" r="14" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          {/* PIR label */}
          <text x="47" y="48" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="bold">PIR</text>
        </g>
      )}

      {(comp.type === 'sensor-ds18b20' || comp.type === 'sensor-tmp36') && (
        <g>
          {/* TO-92 Transistor/Sensor package */}
          <path d="M 16 35 A 16 16 0 0 1 48 35 L 48 48 L 16 48 Z" fill="url(#icBodyGrad)" stroke="#475569" strokeWidth="1.2" />
          {/* Leads */}
          <line x1="18" y1="48" x2="18" y2="72" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="32" y1="48" x2="32" y2="72" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="46" y1="48" x2="46" y2="72" stroke="#94a3b8" strokeWidth="2.5" />
          <text x="32" y="42" fontSize="6.5" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">
            {comp.type === 'sensor-ds18b20' ? 'DS18B20' : 'TMP36'}
          </text>
        </g>
      )}

      {comp.type === 'sensor-mpu6050' && (
        <g>
          {/* Blue PCB */}
          <rect x="8" y="8" width="94" height="48" rx="4" fill="url(#pcbCyanGrad)" stroke="#0284c7" strokeWidth="1.5" />
          {/* QFN IC chip */}
          <rect x="42" y="16" width="26" height="26" rx="2" fill="url(#icBodyGrad)" stroke="#475569" />
          <text x="55" y="32" fontSize="6.5" fill="#f8fafc" textAnchor="middle" fontWeight="bold">MPU-6050</text>
        </g>
      )}

      {comp.type === 'display-lcd-1602' && (
        <g>
          {/* Green PCB */}
          <rect x="6" y="6" width="188" height="83" rx="4" fill="#15803d" stroke="#166534" strokeWidth="1.5" />
          {/* Dark Glass Screen */}
          <rect x="26" y="14" width="154" height="67" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          {/* Active Liquid Crystal Matrix Background */}
          <rect x="34" y="20" width="138" height="55" rx="2" fill="#1e3a1e" stroke="#15803d" />
          {/* 5x8 matrix dot text simulation */}
          <text x="40" y="42" fontSize="12" fill="#4ade80" fontFamily="monospace" fontWeight="bold">HELLO TRACEWISE!</text>
          <text x="40" y="62" fontSize="12" fill="#4ade80" fontFamily="monospace" fontWeight="bold">16x2 I2C ACTIVE</text>
          {/* I2C header on left */}
          <rect x="10" y="20" width="8" height="58" rx="2" fill="#020617" />
        </g>
      )}

      {comp.type === 'display-oled-ssd1306' && (
        <g>
          {/* Blue PCB */}
          <rect x="8" y="6" width="84" height="83" rx="5" fill="url(#pcbCyanGrad)" stroke="#0284c7" strokeWidth="1.5" />
          {/* Glass OLED Panel */}
          <rect x="14" y="24" width="72" height="58" rx="2" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
          {/* Glowing Graphic Display */}
          <text x="50" y="45" fontSize="8" fill="#38bdf8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">SSD1306 0.96"</text>
          <line x1="22" y1="52" x2="78" y2="52" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="34" cy="64" r="5" fill="#38bdf8" />
          <circle cx="50" cy="64" r="5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="62" y="59" width="10" height="10" fill="#38bdf8" />
        </g>
      )}

      {comp.type === 'display-7seg' && (
        <g>
          {/* Black module block */}
          <rect x="8" y="16" width="69" height="78" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          {/* Glowing Segments (Displaying '8' and DP) */}
          <line x1="28" y1="28" x2="56" y2="28" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /> {/* a */}
          <line x1="58" y1="30" x2="58" y2="50" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /> {/* b */}
          <line x1="58" y1="56" x2="58" y2="76" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /> {/* c */}
          <line x1="28" y1="78" x2="56" y2="78" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /> {/* d */}
          <line x1="26" y1="56" x2="26" y2="76" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /> {/* e */}
          <line x1="26" y1="30" x2="26" y2="50" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /> {/* f */}
          <line x1="28" y1="53" x2="56" y2="53" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /> {/* g */}
          <circle cx="66" cy="78" r="3" fill="#ef4444" /> {/* DP */}
        </g>
      )}

      {comp.type === 'input-joystick' && (
        <g>
          {/* Black PCB */}
          <rect x="6" y="6" width="70" height="78" rx="6" fill="url(#pcbBlackGrad)" stroke="#334155" strokeWidth="1.5" />
          {/* Outer Ring */}
          <circle cx="40" cy="45" r="26" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* Thumb Stick Rubber Cap */}
          <circle cx="40" cy="45" r="18" fill="url(#icBodyGrad)" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="40" cy="45" r="8" fill="#0f172a" />
          {/* Pin Header Base */}
          <rect x="74" y="16" width="10" height="66" fill="#020617" rx="2" />
        </g>
      )}

      {comp.type === 'input-rotary-encoder' && (
        <g>
          {/* Blue PCB */}
          <rect x="6" y="8" width="68" height="72" rx="5" fill="url(#pcbCyanGrad)" stroke="#0284c7" strokeWidth="1.5" />
          {/* Metallic Encoder Knob Collar */}
          <circle cx="40" cy="42" r="22" fill="url(#metalCylinderGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* Central Flatted Shaft */}
          <circle cx="40" cy="42" r="10" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
          <path d="M 34 36 L 46 36 L 46 44 L 34 44 Z" fill="#cbd5e1" />
        </g>
      )}

      {comp.type === 'sensor-touch-capacitive' && (
        <g>
          {/* Red/Crimson PCB */}
          <rect x="8" y="8" width="49" height="42" rx="4" fill="#991b1b" stroke="#b91c1c" strokeWidth="1.5" />
          {/* Concentric touch pad circles */}
          <circle cx="32" cy="24" r="12" fill="none" stroke="#fca5a5" strokeWidth="1.5" />
          <circle cx="32" cy="24" r="6" fill="#ef4444" />
          <text x="32" y="44" fontSize="6.5" fill="#fee2e2" textAnchor="middle" fontWeight="bold">TOUCH</text>
        </g>
      )}

      {comp.type === 'output-servo' && (
        <g>
          {/* Translucent Blue SG90 Plastic Casing */}
          <rect x="10" y="14" width="70" height="52" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" opacity="0.95" />
          {/* Mounting flanges with screw holes */}
          <rect x="4" y="24" width="6" height="32" fill="#0284c7" rx="1" />
          <rect x="80" y="24" width="6" height="32" fill="#0284c7" rx="1" />
          <circle cx="7" cy="40" r="1.8" fill="#ffffff" />
          <circle cx="83" cy="40" r="1.8" fill="#ffffff" />
          {/* Output Spline Hub */}
          <circle cx="30" cy="40" r="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* White Servo Horn */}
          <path d="M 30 32 L 62 26 A 6 6 0 0 1 62 38 L 30 38 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx="30" cy="35" r="3" fill="#94a3b8" />
          {/* SG90 Text */}
          <text x="50" y="58" fontSize="8" fill="#ffffff" fontWeight="bold">SG90 9g</text>
          {/* 3-pin cable out */}
          <path d="M 80 55 Q 90 65 90 74" fill="none" stroke="#f97316" strokeWidth="3" />
        </g>
      )}

      {comp.type === 'output-neopixel' && (
        <g>
          {/* White/Black LED strip PCB */}
          <rect x="6" y="6" width="168" height="33" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* 8 WS2812B SMD LED modules */}
          {[24, 42, 60, 78, 96, 114, 132, 150].map((x, idx) => {
            const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
            return (
              <g key={x}>
                <rect x={x - 6} y="11" width="12" height="12" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
                <circle cx={x} cy="17" r="4" fill={colors[idx % colors.length]} opacity="0.9" />
              </g>
            );
          })}
        </g>
      )}

      {comp.type === 'output-dc-motor' && (
        <g>
          {/* Metallic cylindrical motor can */}
          <rect x="22" y="10" width="60" height="45" rx="10" fill="url(#metalCylinderGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* Front bearing boss */}
          <rect x="82" y="24" width="8" height="17" fill="#64748b" />
          {/* Rotating brass shaft */}
          <rect x="90" y="30" width="14" height="5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
          {/* Rear end cap */}
          <rect x="18" y="14" width="5" height="37" fill="#334155" rx="1" />
          {/* Solder lugs */}
          <rect x="12" y="20" width="6" height="5" fill="#f59e0b" rx="1" />
          <rect x="12" y="40" width="6" height="5" fill="#f59e0b" rx="1" />
        </g>
      )}

      {comp.type === 'passive-capacitor' && (
        <g>
          {/* Leads */}
          <line x1="22" y1="46" x2="22" y2="65" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="38" y1="46" x2="38" y2="65" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Blue Aluminum Electrolytic Can */}
          <rect x="14" y="12" width="32" height="36" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
          {/* Silver top vent */}
          <ellipse cx="30" cy="14" rx="14" ry="4" fill="url(#metalCylinderGrad)" stroke="#64748b" strokeWidth="0.8" />
          {/* Negative polarity stripe */}
          <rect x="36" y="15" width="8" height="32" fill="#ffffff" opacity="0.85" />
          <text x="40" y="32" fontSize="9" fill="#0f172a" textAnchor="middle" fontWeight="bold">-</text>
          {/* Value marking */}
          <text x="24" y="32" fontSize="7" fill="#ffffff" fontWeight="bold">10µF</text>
        </g>
      )}

      {comp.type === 'passive-diode' && (
        <g>
          {/* Leads */}
          <line x1="8" y1="18" x2="20" y2="18" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="55" y1="18" x2="67" y2="18" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Black DO-41 cylindrical diode body */}
          <rect x="20" y="10" width="35" height="16" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          {/* Silver Cathode Stripe Band */}
          <rect x="46" y="10" width="7" height="16" fill="url(#metalCylinderGrad)" />
          <text x="32" y="21" fontSize="7" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">1N4007</text>
        </g>
      )}

      {comp.type === 'transistor-npn' && (
        <g>
          {/* TO-92 Transistor Package */}
          <path d="M 16 28 A 16 16 0 0 1 48 28 L 48 42 L 16 42 Z" fill="url(#icBodyGrad)" stroke="#475569" strokeWidth="1.2" />
          {/* 3 Leads */}
          <line x1="18" y1="42" x2="18" y2="65" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="32" y1="42" x2="32" y2="65" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="46" y1="42" x2="46" y2="65" stroke="#94a3b8" strokeWidth="2.5" />
          <text x="32" y="36" fontSize="6.5" fill="#f8fafc" textAnchor="middle" fontFamily="monospace" fontWeight="bold">2N2222</text>
        </g>
      )}

      {comp.type === 'transistor-mosfet' && (
        <g>
          {/* TO-220 Metallic Heatsink Tab */}
          <rect x="18" y="10" width="34" height="20" rx="2" fill="url(#metalCylinderGrad)" stroke="#64748b" strokeWidth="1" />
          <circle cx="35" cy="18" r="4.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Black plastic encapsulation */}
          <rect x="14" y="28" width="42" height="30" rx="3" fill="url(#icBodyGrad)" stroke="#475569" strokeWidth="1.2" />
          {/* 3 Heavy power leads */}
          <line x1="20" y1="58" x2="20" y2="75" stroke="#cbd5e1" strokeWidth="3" />
          <line x1="35" y1="58" x2="35" y2="75" stroke="#cbd5e1" strokeWidth="3" />
          <line x1="50" y1="58" x2="50" y2="75" stroke="#cbd5e1" strokeWidth="3" />
          <text x="35" y="46" fontSize="7" fill="#f8fafc" textAnchor="middle" fontFamily="monospace" fontWeight="bold">IRFZ44N</text>
        </g>
      )}

      {comp.type === 'ic-74hc595' && (
        <g>
          {/* DIP-16 Black Epoxy IC Body */}
          <rect x="8" y="16" width="114" height="42" rx="3" fill="url(#icBodyGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* Pin 1 orientation semi-circular notch */}
          <path d="M 8 33 A 4 4 0 0 1 8 41 Z" fill="#020617" />
          {/* Pin 1 index dot */}
          <circle cx="20" cy="50" r="2.5" fill="#64748b" />
          {/* 16 Silver DIP Legs */}
          {[16, 30, 44, 58, 72, 86, 100, 114].map((x) => (
            <g key={x}>
              <line x1={x} y1="10" x2={x} y2="16" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
              <line x1={x} y1="58" x2={x} y2="65" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            </g>
          ))}
          {/* Part Marking */}
          <text x="65" y="40" fontSize="9" fill="#f8fafc" textAnchor="middle" fontFamily="monospace" fontWeight="bold">74HC595N</text>
        </g>
      )}

      {/* Fallback for Custom Imported SVG or Generic Module */}
      {!['arduino-nano', 'arduino-mega', 'esp32-devkit', 'sensor-dht11', 'sensor-ultrasonic-hcsr04', 'sensor-pir', 'sensor-ds18b20', 'sensor-tmp36', 'sensor-mpu6050', 'display-lcd-1602', 'display-oled-ssd1306', 'display-7seg', 'input-joystick', 'input-rotary-encoder', 'sensor-touch-capacitive', 'output-servo', 'output-neopixel', 'output-dc-motor', 'passive-capacitor', 'passive-diode', 'transistor-npn', 'transistor-mosfet', 'ic-74hc595'].includes(comp.type) && (
        <g>
          {def.svgBody ? (
            <g dangerouslySetInnerHTML={{ __html: def.svgBody }} />
          ) : (
            <g>
              <rect
                x="8"
                y="8"
                width={(viewBox.width || width) - 16}
                height={(viewBox.height || height) - 16}
                rx="6"
                fill="url(#pcbNavyGrad)"
                stroke="#2dc5e9"
                strokeWidth="1.5"
              />
              <text
                x={(viewBox.width || width) / 2}
                y={(viewBox.height || height) / 2}
                fontSize="10"
                fill="#ffffff"
                textAnchor="middle"
                fontWeight="bold"
              >
                {def.name || comp.type}
              </text>
            </g>
          )}
        </g>
      )}

      {/* Render All Interactive Pins on Top */}
      <RenderInteractivePins
        pins={def.pins}
        activePinId={activePinId}
        onPinClick={onPinClick}
        onPinHover={onPinHover}
      />
    </svg>
  );
}
