// =============================================================================
// TRACEWISE PITCH LAB — DETERMINISTIC GENERATION ENGINE
// Generates project-aware pitch scripts, judge questions, quizzes, and rubric evals
// without requiring client-side API keys or external LLMs.
// =============================================================================

export function extractProjectContext(project, userBrief = {}) {
  if (!project) return null;

  const components = project.components || [];
  const connections = project.connections || [];
  const code = project.code || '';
  const validation = project.validation || {};

  // Component breakdown
  const componentTypes = components.map(c => c.type || c.name);
  const componentNames = components.map(c => c.name || c.id);
  const hasArduino = components.some(c => (c.type || '').toLowerCase().includes('arduino'));
  const leds = components.filter(c => (c.type || '').toLowerCase().includes('led'));
  const resistors = components.filter(c => (c.type || '').toLowerCase().includes('resistor'));
  const sensors = components.filter(c => /(sensor|ldr|ultrasonic|temp)/i.test(c.type || c.name || ''));
  const inputs = components.filter(c => /(button|switch|sensor|potentiometer)/i.test(c.type || c.name || ''));
  const outputs = components.filter(c => /(led|motor|servo|buzzer|display)/i.test(c.type || c.name || ''));

  // Pin mappings analysis from code and netlist
  const pinDeclarations = [];
  const pinMatches = code.matchAll(/(?:const\s+int|#define|int)\s+([A-Za-z0-9_]+)\s*=?\s*(\d+)/g);
  for (const m of pinMatches) {
    pinDeclarations.push({ variable: m[1], pin: m[2] });
  }

  // Detect project archetype
  let archetype = 'General Electronics Prototype';
  const titleLower = (project.title || '').toLowerCase();
  if (titleLower.includes('traffic')) {
    archetype = 'Autonomous Traffic Signal Controller';
  } else if (titleLower.includes('pedestrian')) {
    archetype = 'Pedestrian Crossing Safety System';
  } else if (titleLower.includes('light') || titleLower.includes('ldr') || titleLower.includes('night')) {
    archetype = 'Ambient Light Responsive Automation';
  } else if (titleLower.includes('sweep') || titleLower.includes('servo') || titleLower.includes('robot')) {
    archetype = 'Micro-Robotic Actuator & Sensor Unit';
  }

  const versionStr = typeof project.version === 'object' && project.version !== null
    ? (project.version.id || project.version.label || 'v1.0')
    : (project.version || 'v1.0');

  return {
    projectId: project.id,
    title: project.title || 'Electronics Project',
    description: project.description || 'Interactive Arduino microcontroller circuit.',
    version: versionStr,
    archetype,
    componentsCount: components.length,
    componentNames,
    componentTypes,
    hasArduino,
    ledsCount: leds.length,
    resistorsCount: resistors.length,
    sensorsCount: sensors.length,
    inputsCount: inputs.length,
    outputsCount: outputs.length,
    pinDeclarations,
    codeLength: code.length,
    hasLoop: code.includes('void loop()'),
    hasSetup: code.includes('void setup()'),
    connectionsCount: connections.length,
    isValid: validation.status === 'clean' || validation.status === 'valid',
    validationIssues: validation.issues || [],
    userBrief: {
      problem: userBrief.problem || '',
      audience: userBrief.audience || '',
      importance: userBrief.importance || '',
      solution: userBrief.solution || '',
      testingEvidence: userBrief.testingEvidence || '',
      userFeedback: userBrief.userFeedback || '',
      limitations: userBrief.limitations || '',
      nextSteps: userBrief.nextSteps || ''
    }
  };
}

// -----------------------------------------------------------------------------
// PITCH SCRIPTS GENERATOR (30s, 60s, 120s, and 3-5min outline)
// -----------------------------------------------------------------------------

export function generatePitchDrafts(ctx) {
  if (!ctx) return {};

  const b = ctx.userBrief;
  const problem = b.problem.trim() || `handling practical signaling and automation challenges reliably with accessible microcontroller hardware`;
  const audience = b.audience.trim() || `students, urban engineers, and robotics teams`;
  const solution = b.solution.trim() || `a synchronized ${ctx.archetype} built around an Arduino Uno, dedicated current-limited outputs, and responsive state logic`;
  const testing = b.testingEvidence.trim() || `verified through static rule checking, AST pin collision validation, and circuit simulation`;
  const limitations = b.limitations.trim() || `currently runs as an educational prototype without high-voltage isolation or cellular telemetry`;
  const nextSteps = b.nextSteps.trim() || `adding hardware fail-safes and physical enclosure prototyping`;

  // 1. 30-Second Elevator Pitch
  const pitch30 = `We built the ${ctx.title} to address ${problem}. ` +
    `Designed for ${audience}, our system delivers ${solution}. ` +
    `Using ${ctx.componentsCount} integrated circuit elements on an Arduino Uno platform, it has been ${testing}. ` +
    `It transforms how beginners verify their hardware before physical construction.`;

  // 2. 60-Second Competition Pitch
  const pitch60 = `Hello judges. When ${audience} work on electronics, they often struggle with ${problem}. ` +
    `To solve this, we created ${ctx.title}—${solution}. ` +
    `\n\nOur circuit incorporates ${ctx.componentNames.slice(0, 4).join(', ')}${ctx.componentNames.length > 4 ? ' and additional sensors' : ''}. ` +
    `Every connection has been checked for pin conflicts, and our firmware implements deterministic state transitions. ` +
    `\n\nIn our tests, the design was ${testing}. ` +
    `While it is currently a prototype with limitations like ${limitations}, ` +
    `our next step is ${nextSteps}. ${ctx.title} proves that smart hardware engineering starts with clear, verifiable thinking.`;

  // 3. 120-Second Technical Pitch
  const pitch120 = `Good morning judges and panel. I'm presenting ${ctx.title}, ${solution}. ` +
    `\n\n1. THE PROBLEM & AUDIENCE:\n` +
    `${audience} face a critical challenge: ${problem}. Without transparent tooling, wiring mistakes easily damage components or cause erratic runtime bugs.` +
    `\n\n2. TECHNICAL ARCHITECTURE & IMPLEMENTATION:\n` +
    `Our hardware architecture relies on an Arduino Uno microcontroller managing ${ctx.inputsCount} inputs and ${ctx.outputsCount} outputs. ` +
    (ctx.pinDeclarations.length > 0
      ? `Pins are strictly allocated in firmware—including ${ctx.pinDeclarations.slice(0, 3).map(p => `${p.variable} on Digital Pin ${p.pin}`).join(', ')}—preventing resource collisions. `
      : `Pin mappings are deterministically mapped to protect outputs with current-limiting resistors. `) +
    `The firmware runs non-blocking timing routines, ensuring the circuit responds predictably under load.` +
    `\n\n3. VALIDATION & TESTING:\n` +
    `We tested and verified this project: ${testing}. Every change from our baseline was tracked and compared to catch regressions before deployment.` +
    `\n\n4. HONEST LIMITATIONS & FUTURE ROADMAP:\n` +
    `Engineering requires understanding real constraints. Right now, ${limitations}. ` +
    `With additional time, our roadmap focuses on ${nextSteps}. Thank you, and I look forward to your questions.`;

  // 4. 3-5 Minute Presentation Outline
  const outline = [
    {
      time: '0:00 - 0:45',
      section: 'Hook & Problem Statement',
      talkingPoints: [
        `Introduce yourself and project name (${ctx.title}).`,
        `Describe the relatable real-world problem: ${problem}.`,
        `Identify who suffers from this problem: ${audience}.`
      ]
    },
    {
      time: '0:45 - 2:00',
      section: 'Hardware Architecture & Live Demo',
      talkingPoints: [
        `Walk through the circuit layout: ${ctx.componentNames.join(', ')}.`,
        `Explain why the Arduino Uno and specific pins were selected.`,
        `Demonstrate how the firmware logic handles inputs and drives outputs.`
      ]
    },
    {
      time: '2:00 - 3:00',
      section: 'Testing, Diagnostics & Iteration',
      talkingPoints: [
        `Show testing evidence: ${testing}.`,
        `Highlight a specific bug or pin conflict encountered during development and how you solved it.`,
        `Discuss power management and component protection (e.g., resistor values).`
      ]
    },
    {
      time: '3:00 - 4:00',
      section: 'Limitations, Lessons & Next Steps',
      talkingPoints: [
        `Address current trade-offs honestly: ${limitations}.`,
        `Outline planned technical improvements: ${nextSteps}.`,
        `Summarize the key takeaway for the judges and open the floor for Q&A.`
      ]
    }
  ];

  return { pitch30, pitch60, pitch120, outline };
}

// -----------------------------------------------------------------------------
// JUDGE QUESTIONS GENERATOR (Categorized with Evidence & Follow-ups)
// -----------------------------------------------------------------------------

export function generateJudgeQuestions(ctx) {
  if (!ctx) return [];

  const b = ctx.userBrief;
  const hasUserProblem = Boolean(b.problem.trim());
  const hasUserTesting = Boolean(b.testingEvidence.trim());
  const hasUserLimits = Boolean(b.limitations.trim());

  return [
    {
      id: 'q-problem-1',
      category: 'Problem',
      difficulty: 'Beginner',
      question: `What specific real-world problem does ${ctx.title} solve, and why did you choose it?`,
      suggestedAnswer: hasUserProblem
        ? b.problem
        : `This project addresses ${ctx.archetype.toLowerCase()} challenges by providing a tested, repeatable reference design for students and makers.`,
      needsInput: !hasUserProblem,
      evidence: `Target archetype: ${ctx.archetype}.`,
      followUp: `Who stands to lose the most if this problem remains unaddressed?`
    },
    {
      id: 'q-solution-1',
      category: 'Solution',
      difficulty: 'Beginner',
      question: `How does your circuit solve this problem differently than existing off-the-shelf modules?`,
      suggestedAnswer: `Rather than a sealed black-box module, ${ctx.title} exposes a transparent breadboard schematic where every pin and wire has a documented purpose, backed by automated static rule validation.`,
      needsInput: false,
      evidence: `Configured with ${ctx.componentsCount} modular components and clear firmware definitions.`,
      followUp: `Why did you prefer this architecture over an integrated all-in-one breakout board?`
    },
    {
      id: 'q-tech-1',
      category: 'Technical',
      difficulty: 'Intermediate',
      question: `Walk me through your pin assignments and why you chose these specific digital or analog pins on the Arduino Uno.`,
      suggestedAnswer: ctx.pinDeclarations.length > 0
        ? `In firmware, we assigned ${ctx.pinDeclarations.map(p => `${p.variable} to Pin ${p.pin}`).join(', ')}. These pins were chosen to separate fast digital toggling from any potential PWM or analog lines.`
        : `Digital pins were selected to keep wiring direct and avoid sharing lines between concurrent actuators and indicators.`,
      needsInput: false,
      evidence: `Firmware declares: ${ctx.pinDeclarations.map(p => p.variable + '=' + p.pin).join(', ') || 'Standard digital I/O layout'}.`,
      followUp: `What would happen to the circuit if two components were wired to the same digital output pin?`
    },
    {
      id: 'q-tech-2',
      category: 'Technical',
      difficulty: 'Challenging',
      question: `How did you protect your components against overcurrent or voltage spikes?`,
      suggestedAnswer: ctx.resistorsCount > 0
        ? `We placed current-limiting resistors inline with sensitive components (like LEDs). For standard 5V logic with a ~2V LED drop, a 220Ω resistor keeps current safely around 13-14mA, well below the ATmega328P 20mA recommended pin ceiling.`
        : `Ohm's Law calculation: $I = (V_{CC} - V_F) / R$. We ensure every current path includes proper resistive drop or pull-up/pull-down configuration.`,
      needsInput: ctx.resistorsCount === 0,
      evidence: `Resistor count: ${ctx.resistorsCount} connected in circuit netlist.`,
      followUp: `What would happen to the Arduino pin driver after extended operation without current limiting?`
    },
    {
      id: 'q-product-1',
      category: 'Product',
      difficulty: 'Intermediate',
      question: `How would a student or beginner without electrical engineering background interact with your project for the first time?`,
      suggestedAnswer: `A beginner starts with the working verified baseline in Tracewise, follows the pin diagram, and modifies one variable (such as delay timing) to observe immediate, safe feedback.`,
      needsInput: false,
      evidence: `Includes interactive Tracewise Studio breadboard view and synchronized editor.`,
      followUp: `How does the system prevent a user from causing an undetected short circuit?`
    },
    {
      id: 'q-limitations-1',
      category: 'Limitations',
      difficulty: 'Challenging',
      question: `What are the critical failure points or technical limitations of your current prototype?`,
      suggestedAnswer: hasUserLimits
        ? b.limitations
        : `The system operates as an educational prototype. It lacks opto-isolated relay stages, ESD shielding on user-accessible pins, and hardware watchdog timers for automatic fault recovery.`,
      needsInput: !hasUserLimits,
      evidence: `Static verification validates netlist topology, not physical ambient conditions or temperature thermal drift.`,
      followUp: `If an input sensor line was physically severed while running, how does the firmware respond?`
    },
    {
      id: 'q-future-1',
      category: 'Future',
      difficulty: 'Intermediate',
      question: `If given another month and a $200 hardware budget, how would you scale or upgrade this prototype?`,
      suggestedAnswer: b.nextSteps.trim() || `We would design a custom PCB shield with surface-mount components, integrate an ESP32 for telemetry logging, and conduct physical stress testing in real environmental enclosures.`,
      needsInput: !Boolean(b.nextSteps.trim()),
      evidence: `Roadmap transition from breadboard prototype to custom PCB shield.`,
      followUp: `What is the single biggest architectural risk you would need to mitigate when moving to a custom PCB?`
    }
  ];
}

// -----------------------------------------------------------------------------
// INTERACTIVE QUIZ MODE GENERATOR
// -----------------------------------------------------------------------------

export function generateQuizQuestions(ctx) {
  if (!ctx) return [];

  return [
    {
      id: 'quiz-1',
      question: `Why is an inline resistor mandatory when driving a standard 5mm LED from an Arduino Uno 5V digital pin?`,
      options: [
        `It limits the current so the ATmega328P output pin does not exceed its maximum rating (~20-40mA).`,
        `It converts the digital DC signal into an alternating AC current required by the diode.`,
        `It increases the voltage from 5V to the 12V needed for LED illumination.`,
        `It acts as a radio frequency filter to prevent interference with USB communication.`
      ],
      correctIndex: 0,
      explanation: `LEDs have minimal internal resistance once forward voltage (~1.8V to 2.2V) is exceeded. Without a resistor, the diode draws destructive current, risking burning out both the LED and the microcontroller pin.`
    },
    {
      id: 'quiz-2',
      question: `In Arduino C++, what is the primary role of the \`pinMode(pin, OUTPUT)\` command inside \`setup()\`?`,
      options: [
        `It continuously reads voltage pulses throughout runtime.`,
        `It configures the microcontroller internal tri-state driver to low-impedance output mode.`,
        `It pauses execution for the specified number of milliseconds.`,
        `It clears the EEPROM memory associated with that pin number.`
      ],
      correctIndex: 1,
      explanation: `By default, AVR pins are high-impedance inputs. Calling \`pinMode(pin, OUTPUT)\` switches the internal FET circuitry so the pin can source or sink current to external components.`
    },
    {
      id: 'quiz-3',
      question: `When presenting your project to competition judges, what should you do if asked a technical question about an untested edge case?`,
      options: [
        `Guess an authoritative-sounding metric and pretend it was tested successfully.`,
        `Acknowledge the limitation transparently, explain how the prototype currently behaves, and describe how you would test it next.`,
        `Change the subject immediately to a feature you already know well.`,
        `Blame the platform software for not simulating that edge case.`
      ],
      correctIndex: 1,
      explanation: `Judges value engineering integrity above perfection. Transparently acknowledging limitations and outlining a systematic testing plan demonstrates authentic technical maturity.`
    },
    {
      id: 'quiz-4',
      question: `In ${ctx.title}, how does Tracewise detect pin collisions before code is flashed to a physical board?`,
      options: [
        `By using a remote cloud compiler that runs a complete AVR emulator.`,
        `By statically parsing the code's AST and cross-referencing assigned pin integers against the breadboard netlist connections.`,
        `By randomly probing pins during browser runtime.`,
        `By asking the user to manually verify each connection in a spreadsheet.`
      ],
      correctIndex: 1,
      explanation: `Tracewise employs deterministic static analysis: it checks the parsed pin constants against the visual circuit graph to identify conflicting outputs or short circuits instantly.`
    }
  ];
}

// -----------------------------------------------------------------------------
// MOCK JUDGE INTERVIEW FEEDBACK RUBRIC (Transparent, Deterministic)
// -----------------------------------------------------------------------------

export function evaluateInterviewAnswer(questionObj, userAnswer, ctx) {
  const answer = (userAnswer || '').trim();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  if (wordCount < 4) {
    return {
      score: 40,
      summary: `Answer is too brief. Judges need enough detail to assess your engineering thought process.`,
      strengths: [`Direct start.`],
      improvements: [
        `Elaborate with specific numbers, component names, or firmware logic.`,
        `Reference actual project evidence from ${ctx.title}.`
      ],
      rubric: {
        clarity: 5,
        relevance: 6,
        technicalAccuracy: 4,
        evidence: 2,
        limitationsAwareness: 3,
        structure: 4
      }
    };
  }

  // Dimension evaluations
  let clarity = 7;
  let relevance = 8;
  let technicalAccuracy = 7;
  let evidence = 6;
  let limitationsAwareness = 6;
  let structure = 7;

  const strengths = [];
  const improvements = [];

  // Check for technical keywords
  const techKeywords = ['pin', 'voltage', 'current', 'resistor', 'arduino', 'code', 'loop', 'timing', 'delay', 'sensor', 'signal', 'ohm', 'circuit', 'test', 'prototype'];
  const matchedKeywords = techKeywords.filter(k => answer.toLowerCase().includes(k));

  if (matchedKeywords.length >= 3) {
    technicalAccuracy += 2;
    evidence += 2;
    strengths.push(`Good use of technical terminology (${matchedKeywords.slice(0, 3).join(', ')}).`);
  } else {
    improvements.push(`Ground your response with concrete hardware terms (e.g. pin numbers, resistor values, voltages).`);
  }

  // Check for project title or specific component reference
  if (answer.toLowerCase().includes(ctx.title.toLowerCase()) || answer.toLowerCase().includes('arduino')) {
    evidence += 1;
    strengths.push(`Directly referenced your specific project context.`);
  }

  // Check for honesty about limitations
  if (/however|limitation|currently|future|next step|trade-off|not yet|prototype/i.test(answer)) {
    limitationsAwareness += 3;
    strengths.push(`Shows mature engineering perspective by recognizing project boundaries or trade-offs.`);
  } else if (questionObj.category === 'Limitations' || questionObj.category === 'Future') {
    limitationsAwareness -= 2;
    improvements.push(`Be candid about prototype limitations rather than presenting it as flawless.`);
  }

  // Check structure (e.g. multi-sentence, transitions)
  if (answer.includes('.') && answer.length > 80) {
    structure += 2;
    clarity += 1;
    strengths.push(`Clear, multi-point sentence structure.`);
  } else {
    improvements.push(`Use a 2-part structure: first state the direct answer, then provide the technical reason.`);
  }

  // Overall score out of 100
  const total = Math.min(100, Math.round(((clarity + relevance + technicalAccuracy + evidence + limitationsAwareness + structure) / 60) * 100));

  return {
    score: total,
    summary: total >= 80
      ? `Strong, convincing answer that balances technical evidence with honest engineering clarity.`
      : total >= 65
      ? `Solid response that addresses the core question. Adding more specific evidence will make it stand out.`
      : `Good starting point, but needs more concrete details to convince a technical panel.`,
    strengths: strengths.length > 0 ? strengths : [`Addressed the topic.`],
    improvements: improvements.length > 0 ? improvements : [`Keep your delivery steady and concise under live questioning.`],
    rubric: {
      clarity: Math.min(10, clarity),
      relevance: Math.min(10, relevance),
      technicalAccuracy: Math.min(10, technicalAccuracy),
      evidence: Math.min(10, evidence),
      limitationsAwareness: Math.min(10, limitationsAwareness),
      structure: Math.min(10, structure)
    }
  };
}
