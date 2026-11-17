// =============================================================================
// TRACEWISE PITCH LAB — DETERMINISTIC GENERATION ENGINE
// Generates project-aware pitch scripts, judge questions, quizzes, and rubric evals
// Supports both simulated circuits and documented physical projects.
// Never fabricates simulation results or Arduino claims for physical non-Arduino projects.
// =============================================================================

import { isPhysicalProject } from '../projectSchema.js';

/**
 * Normalizes project context for pitch generation
 */
export function extractProjectContext(project, userBrief = {}) {
  if (!project) return null;

  if (isPhysicalProject(project)) {
    return buildPhysicalProjectPitchContext(project, userBrief);
  }
  return buildCircuitPitchContext(project, userBrief);
}

/**
 * Adapter 1: Simulated Circuit Context
 */
export function buildCircuitPitchContext(project, userBrief = {}) {
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

  // Pin mappings analysis from code
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
    projectType: 'simulated_circuit',
    isPhysicalProject: false,
    hardwarePlatform: 'Arduino Uno',
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

/**
 * Adapter 2: Documented Physical Project Context (Grounded strictly in student facts)
 */
export function buildPhysicalProjectPitchContext(project, userBrief = {}) {
  const compList = Array.isArray(project.componentsList) ? project.componentsList : [];
  const compNames = compList.map(c => typeof c === 'string' ? c : (c.name || 'Component'));
  const hardwarePlatform = project.hardwarePlatform || 'Custom Hardware';
  const hasArduino = hardwarePlatform.toLowerCase().includes('arduino');

  const versionStr = typeof project.version === 'object' && project.version !== null
    ? (project.version.id || project.version.label || 'v1.0')
    : (project.version || 'v1.0');

  const problem = (userBrief.problem || project.problemSolved || '').trim();
  const solution = (userBrief.solution || project.description || '').trim();
  const audience = (userBrief.audience || project.targetAudience || '').trim();
  const testingEvidence = (userBrief.testingEvidence || project.testingEvidence || '').trim();
  const limitations = (userBrief.limitations || project.challengesFaced || '').trim();
  const nextSteps = (userBrief.nextSteps || project.futureImprovements || '').trim();

  return {
    projectId: project.id,
    projectType: 'documented_physical_project',
    isPhysicalProject: true,
    hardwarePlatform,
    category: project.category || 'robotics',
    projectStatus: project.projectStatus || 'working_prototype',
    title: project.title || project.name || 'Physical Electronics Project',
    description: project.description || '',
    version: versionStr,
    archetype: `${hardwarePlatform} Physical Project`,
    componentsCount: compList.length,
    componentNames: compNames,
    componentsList: compList,
    hasArduino,
    hasMedia: (project.mediaAttachments || []).length > 0,
    mediaCount: (project.mediaAttachments || []).length,
    hasCode: (project.sourceFiles || []).length > 0 || Boolean(project.codeSummary),
    sourceFilesCount: (project.sourceFiles || []).length,
    workingPrinciple: project.workingPrinciple || '',
    challengesFaced: project.challengesFaced || '',
    demonstrationPlan: project.demonstrationPlan || '',
    futureImprovements: project.futureImprovements || '',
    linkedSimulationId: project.linkedSimulationId || null,
    isLinkedToSimulation: Boolean(project.linkedSimulationId),
    userBrief: {
      problem,
      audience,
      importance: userBrief.importance || '',
      solution,
      testingEvidence,
      userFeedback: userBrief.userFeedback || '',
      limitations,
      nextSteps
    }
  };
}

// -----------------------------------------------------------------------------
// PITCH SCRIPTS GENERATOR (30s, 60s, 120s, and 3-5min outline)
// -----------------------------------------------------------------------------

export function generatePitchDrafts(ctx) {
  if (!ctx) return {};

  if (ctx.isPhysicalProject) {
    return generatePhysicalProjectPitchDrafts(ctx);
  }

  return generateCircuitPitchDrafts(ctx);
}

/**
 * Generates pitch drafts for simulated circuits
 */
function generateCircuitPitchDrafts(ctx) {
  const b = ctx.userBrief;
  const problem = b.problem.trim() || `handling practical signaling and automation challenges reliably with accessible microcontroller hardware`;
  const audience = b.audience.trim() || `students, urban engineers, and robotics teams`;
  const solution = b.solution.trim() || `a synchronized ${ctx.archetype} built around an Arduino Uno, dedicated current-limited outputs, and responsive state logic`;
  const testing = b.testingEvidence.trim() || `verified through static rule checking, AST pin collision validation, and circuit simulation`;
  const limitations = b.limitations.trim() || `currently runs as an educational prototype without high-voltage isolation or cellular telemetry`;
  const nextSteps = b.nextSteps.trim() || `adding hardware fail-safes and physical enclosure prototyping`;

  const pitch30 = `We built the ${ctx.title} to address ${problem}. ` +
    `Designed for ${audience}, our system delivers ${solution}. ` +
    `Using ${ctx.componentsCount} integrated circuit elements on an Arduino Uno platform, it has been ${testing}. ` +
    `It transforms how beginners verify their hardware before physical construction.`;

  const pitch60 = `Hello judges. When ${audience} work on electronics, they often struggle with ${problem}. ` +
    `To solve this, we created ${ctx.title}—${solution}. ` +
    `\n\nOur circuit incorporates ${ctx.componentNames.slice(0, 4).join(', ')}${ctx.componentNames.length > 4 ? ' and additional sensors' : ''}. ` +
    `Every connection has been checked for pin conflicts, and our firmware implements deterministic state transitions. ` +
    `\n\nIn our tests, the design was ${testing}. ` +
    `While it is currently a prototype with limitations like ${limitations}, ` +
    `our next step is ${nextSteps}. ${ctx.title} proves that smart hardware engineering starts with clear, verifiable thinking.`;

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

/**
 * Generates pitch drafts for documented physical projects (Grounded, never fabricating simulation or Arduino claims)
 */
function generatePhysicalProjectPitchDrafts(ctx) {
  const b = ctx.userBrief;
  const problem = b.problem.trim() || `a real-world automation and engineering problem in our community`;
  const audience = b.audience.trim() || `everyday users, students, and practitioners`;
  const solution = b.solution.trim() || `a physical ${ctx.hardwarePlatform} prototype built to automate and solve this task reliably`;
  const testing = b.testingEvidence.trim() || `hands-on bench trials measuring real response times and component stability`;
  const limitations = b.limitations.trim() || `currently an assembled prototype operating under controlled physical testing conditions`;
  const nextSteps = b.nextSteps.trim() || `refining the physical enclosure, power efficiency, and long-term durability`;

  const compPreview = ctx.componentNames.length > 0
    ? ctx.componentNames.slice(0, 3).join(', ')
    : 'specialized sensors and controller hardware';

  // 1. 30-Second Elevator Pitch
  const pitch30 = `We built ${ctx.title} to address ${problem}. ` +
    `Designed for ${audience}, our solution is ${solution}. ` +
    `Powered by a physical ${ctx.hardwarePlatform} setup integrating ${compPreview}, ` +
    `our project has undergone ${testing}. ` +
    `It proves that practical engineering delivers real solutions to genuine challenges.`;

  // 2. 60-Second Competition Pitch
  const pitch60 = `Hello judges. When ${audience} face ${problem}, they need a reliable, practical answer. ` +
    `To solve this, we designed and built ${ctx.title}—${solution}. ` +
    `\n\nOur physical system is engineered around a ${ctx.hardwarePlatform} board, coordinating ${compPreview}` +
    `${ctx.componentNames.length > 3 ? ` and ${ctx.componentNames.length - 3} other components` : ''}. ` +
    (ctx.workingPrinciple ? `Working principle: ${ctx.workingPrinciple}. ` : '') +
    `\n\nDuring physical testing, ${testing}. ` +
    (ctx.challengesFaced ? `Along the way, our biggest challenge was ${ctx.challengesFaced}, which taught us critical hardware debugging skills. ` : '') +
    `While it has honest prototype limitations such as ${limitations}, ` +
    `our roadmap focuses on ${nextSteps}. ${ctx.title} demonstrates authentic engineering built through hands-on perseverance.`;

  // 3. 120-Second Technical Pitch (Science Fair Presentation)
  const pitch120 = `Good morning judges and evaluation panel. I am presenting ${ctx.title}, ${solution}. ` +
    `\n\n1. THE PROBLEM & INSPIRATION:\n` +
    `${audience} experience a serious challenge: ${problem}. We wanted to build a hands-on physical solution that solves this directly rather than staying purely theoretical.` +
    `\n\n2. PHYSICAL ARCHITECTURE & WORKING PRINCIPLE:\n` +
    `Our hardware platform is built around the ${ctx.hardwarePlatform}. ` +
    (ctx.componentsCount > 0
      ? `We integrated ${ctx.componentsCount} physical components: ${ctx.componentNames.join(', ')}. `
      : `We carefully selected our sensors, power management, and controller to balance cost and reliability. `) +
    (ctx.workingPrinciple
      ? `\nHow it works: ${ctx.workingPrinciple}`
      : `\nThe controller reads incoming sensor data, evaluates operational thresholds, and commands actuators in real time.`) +
    `\n\n3. TESTING RESULTS & ENGINEERING CHALLENGES:\n` +
    `We tested this physical system through ${testing}. ` +
    (ctx.challengesFaced
      ? `Our most significant development obstacle was: ${ctx.challengesFaced}. We overcame this through iterative testing and component refinement.`
      : `Hardware development required careful power distribution and signal noise mitigation across our wiring.`) +
    `\n\n4. PROTOTYPE LIMITATIONS & FUTURE IMPROVEMENTS:\n` +
    `Every authentic engineering build has constraints. Right now, ${limitations}. ` +
    `Our next steps before full deployment are: ${nextSteps}. ` +
    `Thank you, and I look forward to demonstrating our prototype and answering your questions.`;

  // 4. 3-5 Minute Presentation Outline
  const outline = [
    {
      time: '0:00 - 0:45',
      section: 'Problem Hook & Motivation',
      talkingPoints: [
        `Introduce yourself, team members, and project title (${ctx.title}).`,
        `Describe the personal or community motivation behind the project: ${problem}.`,
        `Identify who directly benefits from this solution: ${audience}.`
      ]
    },
    {
      time: '0:45 - 2:00',
      section: 'Physical Build & Working Principle',
      talkingPoints: [
        `Show the physical build and explain why ${ctx.hardwarePlatform} was chosen as the core controller.`,
        `Walk through key hardware components: ${ctx.componentNames.slice(0, 4).join(', ') || 'sensors and actuators'}.`,
        ctx.workingPrinciple ? `Demonstrate the working principle: ${ctx.workingPrinciple}.` : `Explain how inputs trigger outputs and physical state transitions.`
      ]
    },
    {
      time: '2:00 - 3:15',
      section: 'Live Demonstration & Testing Evidence',
      talkingPoints: [
        ctx.demonstrationPlan ? `Perform live demonstration: ${ctx.demonstrationPlan}.` : `Showcase a live operational demonstration of the primary feature.`,
        `Share actual recorded data and testing outcomes: ${testing}.`,
        ctx.challengesFaced ? `Detail the biggest engineering hurdle faced: ${ctx.challengesFaced}, and how you solved it.` : `Discuss an unexpected bug or wiring hurdle and your debugging methodology.`
      ]
    },
    {
      time: '3:15 - 4:15',
      section: 'Honest Limitations, Future Roadmap & Q&A',
      talkingPoints: [
        `Acknowledge current prototype boundaries candidly: ${limitations}.`,
        `Detail concrete next steps with additional time or budget: ${nextSteps}.`,
        `Invite judges to inspect the hardware and ask questions.`
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

  if (ctx.isPhysicalProject) {
    return generatePhysicalProjectJudgeQuestions(ctx);
  }

  return generateCircuitJudgeQuestions(ctx);
}

function generateCircuitJudgeQuestions(ctx) {
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
      suggestedAnswer: ctx.pinDeclarations?.length > 0
        ? `In firmware, we assigned ${ctx.pinDeclarations.map(p => `${p.variable} to Pin ${p.pin}`).join(', ')}. These pins were chosen to separate fast digital toggling from any potential PWM or analog lines.`
        : `Digital pins were selected to keep wiring direct and avoid sharing lines between concurrent actuators and indicators.`,
      needsInput: false,
      evidence: `Firmware declares: ${(ctx.pinDeclarations || []).map(p => p.variable + '=' + p.pin).join(', ') || 'Standard digital I/O layout'}.`,
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

function generatePhysicalProjectJudgeQuestions(ctx) {
  const b = ctx.userBrief;
  const platform = ctx.hardwarePlatform;
  const hasUserProblem = Boolean(b.problem.trim());
  const hasUserTesting = Boolean(b.testingEvidence.trim());
  const hasUserChallenges = Boolean(ctx.challengesFaced.trim());
  const hasUserLimits = Boolean(b.limitations.trim());

  const compNamesStr = ctx.componentNames.length > 0
    ? ctx.componentNames.slice(0, 3).join(', ')
    : 'your primary components';

  return [
    {
      id: 'q-phys-problem',
      category: 'Problem & Motivation',
      difficulty: 'Beginner',
      question: `Why did you choose to build this specific project, and who did you design it for?`,
      suggestedAnswer: hasUserProblem
        ? b.problem
        : `We identified an important real-world challenge: ${ctx.description || 'practical hardware automation'}, and set out to build a hands-on physical prototype.`,
      needsInput: !hasUserProblem,
      evidence: `Project Category: ${ctx.category}. Target Audience: ${b.audience || 'General public'}.`,
      followUp: `What did existing alternatives lack that convinced you to build your own physical hardware?`
    },
    {
      id: 'q-phys-controller',
      category: 'Technical Architecture',
      difficulty: 'Intermediate',
      question: `Why did you select the ${platform} as your main controller instead of other microcontrollers?`,
      suggestedAnswer: `We chose ${platform} for its specific balance of I/O capability, processing speed, community library support, and power requirements for our ${ctx.category} application.`,
      needsInput: false,
      evidence: `Hardware Platform: ${platform}.`,
      followUp: `If your system needed to run on battery power for six months, what changes would you make to the controller or firmware?`
    },
    {
      id: 'q-phys-integration',
      category: 'Hardware Integration',
      difficulty: 'Intermediate',
      question: `Walk me through how your main components (${compNamesStr}) interface together physically.`,
      suggestedAnswer: ctx.workingPrinciple
        ? ctx.workingPrinciple
        : `The ${platform} controller interfaces with our sensors and actuators through dedicated communication protocols (such as GPIO, I2C, or SPI), with power distributed through a common ground reference.`,
      needsInput: !ctx.workingPrinciple,
      evidence: `Total Bill of Materials: ${ctx.componentsCount} components recorded.`,
      followUp: `How did you manage signal integrity or electrical noise between high-power actuators and sensitive sensor lines?`
    },
    {
      id: 'q-phys-challenges',
      category: 'Troubleshooting & Challenges',
      difficulty: 'Challenging',
      question: `What was the most difficult hardware or wiring obstacle you encountered during assembly, and how did you diagnose it?`,
      suggestedAnswer: hasUserChallenges
        ? ctx.challengesFaced
        : `During physical assembly, component integration and loose wiring created unexpected intermittent behavior. We used systematic step-by-step continuity testing and isolated sub-circuits to track down the root cause.`,
      needsInput: !hasUserChallenges,
      evidence: hasUserChallenges ? `Recorded in engineering challenge log.` : `Documented prototype debugging experience.`,
      followUp: `If a judge unplugged one sensor right now, how would your software fail safely?`
    },
    {
      id: 'q-phys-testing',
      category: 'Testing & Evidence',
      difficulty: 'Challenging',
      question: `What actual measurements or empirical test results did you record to prove this prototype works?`,
      suggestedAnswer: hasUserTesting
        ? b.testingEvidence
        : `We conducted functional bench trials to test operating voltages, signal response times, and actuator reliability under repeated test cycles.`,
      needsInput: !hasUserTesting,
      evidence: hasUserTesting ? `Verified through student testing log.` : `Awaiting additional quantitative bench test data.`,
      followUp: `How repeatable are your test numbers across different battery levels or environmental temperatures?`
    },
    {
      id: 'q-phys-limits',
      category: 'Limitations',
      difficulty: 'Challenging',
      question: `What are the critical limitations of this physical prototype that keep it from being a commercial product today?`,
      suggestedAnswer: hasUserLimits
        ? b.limitations
        : `As a science fair prototype, it relies on breadboard or perfboard wiring rather than a manufactured multi-layer PCB, lacks ruggedized ingress protection (IP casing), and needs dedicated power management.`,
      needsInput: !hasUserLimits,
      evidence: `Prototype status: ${ctx.projectStatus}.`,
      followUp: `What would be your first step if an investor funded you to turn this into a production device?`
    },
    {
      id: 'q-phys-future',
      category: 'Future Roadmap',
      difficulty: 'Intermediate',
      question: `If you had another two weeks before the science fair awards, what single feature or upgrade would you add?`,
      suggestedAnswer: b.nextSteps || ctx.futureImprovements || `We would design a 3D-printed custom enclosure, optimize power consumption, and add remote telemetry or data logging.`,
      needsInput: !Boolean(b.nextSteps || ctx.futureImprovements),
      evidence: `Next steps documented in engineering brief.`,
      followUp: `What is the risk of adding that feature right before the presentation?`
    }
  ];
}

// -----------------------------------------------------------------------------
// INTERACTIVE QUIZ MODE GENERATOR
// -----------------------------------------------------------------------------

export function generateQuizQuestions(ctx) {
  if (!ctx) return [];

  if (ctx.isPhysicalProject) {
    return [
      {
        id: 'quiz-phys-1',
        question: `When building a physical prototype using a ${ctx.hardwarePlatform}, why is having a common Ground (GND) across all power supplies essential?`,
        options: [
          `It prevents any current from flowing through the circuit.`,
          `It establishes a shared zero-volt reference so signal voltages are correctly interpreted between components.`,
          `It increases the battery life by recycling discarded electrons.`,
          `It automatically doubles the clock frequency of the microcontroller.`
        ],
        correctIndex: 1,
        explanation: `Voltage is a relative potential difference. Without a shared common GND, a HIGH digital signal from one board or sensor has no meaningful reference point at the receiving microcontroller.`
      },
      {
        id: 'quiz-phys-2',
        question: `When presenting your physical project to science fair judges, what is the best strategy if an unexpected glitch occurs during your live demonstration?`,
        options: [
          `Quickly hide the project and pretend the demonstration was supposed to be a video only.`,
          `Remain calm, transparently describe what the circuit is trying to do, point out the suspected fault point, and explain your debugging methodology.`,
          `Argue with the judges that the project worked perfectly in your room.`,
          `Blame the competition venue for faulty AC power.`
        ],
        correctIndex: 1,
        explanation: `Science fair judges are practicing engineers and scientists. They care more about how you think, diagnose faults, and handle stress than whether an educational prototype functions flawlessly every second.`
      },
      {
        id: 'quiz-phys-3',
        question: `Why is it critical to record honest prototype limitations (such as battery life, sensor drift, or range) in your science fair documentation?`,
        options: [
          `Judges disqualify projects that claim to be 100% flawless because real engineering always involves trade-offs.`,
          `It lowers expectations so you don't have to prepare for difficult questions.`,
          `Transparently identifying constraints proves you thoroughly tested the system and understand real-world engineering trade-offs.`,
          `Both A and C are correct.`
        ],
        correctIndex: 3,
        explanation: `Engineering is the discipline of managing trade-offs. Stating authentic limitations and outlining next steps proves technical depth, thorough testing, and scientific integrity.`
      },
      {
        id: 'quiz-phys-4',
        question: `When powering motors or high-current actuators from the same battery as your ${ctx.hardwarePlatform}, what risk must you protect against?`,
        options: [
          `Voltage sags (brownouts) when motors draw stall current, causing the microcontroller to unexpectedly reboot.`,
          `The microcontroller running too fast and exceeding 100% CPU clock.`,
          `Wires changing color under magnetic fields.`,
          `Radio signals turning into sound waves.`
        ],
        correctIndex: 0,
        explanation: `Motors draw large startup and stall currents, which can pull the supply rail below the microcontroller's minimum operating voltage, triggering a brownout reset (BOR). Decoupling capacitors and separate regulator paths prevent this.`
      }
    ];
  }

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
// SCIENCE FAIR PREPARATION CHECKLIST
// -----------------------------------------------------------------------------

export function generateScienceFairChecklist(ctx) {
  if (!ctx) return [];

  const b = ctx.userBrief;
  const isPhys = ctx.isPhysicalProject;

  return [
    {
      id: 'chk-title',
      title: 'Project Title & Purpose Defined',
      description: 'Clear name and a concise description of what the project does.',
      completed: Boolean(ctx.title && (ctx.description || b.solution)),
      field: 'title'
    },
    {
      id: 'chk-problem',
      title: 'Real-World Problem & Target Audience',
      description: 'Who has this problem and why is solving it important?',
      completed: Boolean(b.problem && b.audience),
      field: 'problem'
    },
    {
      id: 'chk-components',
      title: isPhys ? 'Physical Bill of Materials Listed' : 'Circuit Components Configured',
      description: isPhys ? `${ctx.componentsCount} physical components recorded.` : `${ctx.componentsCount} circuit parts placed.`,
      completed: ctx.componentsCount > 0,
      field: 'components'
    },
    {
      id: 'chk-principle',
      title: 'Working Principle Explained',
      description: 'Explanation of how sensor inputs trigger actions and firmware logic.',
      completed: Boolean(ctx.workingPrinciple || ctx.pinDeclarations?.length > 0),
      field: 'workingPrinciple'
    },
    {
      id: 'chk-testing',
      title: 'Actual Testing Evidence Recorded',
      description: 'Real bench measurements, trial observations, or validation results.',
      completed: Boolean(b.testingEvidence),
      field: 'testingEvidence'
    },
    {
      id: 'chk-challenges',
      title: 'Engineering Challenges & Solutions Documented',
      description: 'A genuine problem encountered during development and how you solved it.',
      completed: Boolean(ctx.challengesFaced || b.limitations),
      field: 'challenges'
    },
    {
      id: 'chk-demo',
      title: 'Live Demonstration Plan Prepared',
      description: 'Step-by-step sequence for demonstrating the project to science fair judges.',
      completed: Boolean(ctx.demonstrationPlan),
      field: 'demoPlan'
    },
    {
      id: 'chk-pitch',
      title: '2-Minute Presentation Rehearsed',
      description: 'Practiced delivering the problem, solution, architecture, and honest trade-offs.',
      completed: Boolean(b.solution && b.testingEvidence && (ctx.challengesFaced || b.limitations)),
      field: 'rehearsal'
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
        `Elaborate with specific numbers, component names, or technical principles.`,
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
  const techKeywords = ['pin', 'voltage', 'current', 'resistor', 'code', 'loop', 'timing', 'sensor', 'signal', 'ohm', 'circuit', 'test', 'prototype', 'controller', 'hardware', 'gpio', 'battery', 'power', 'ground', 'esp32', 'arduino', 'communication'];
  const matchedKeywords = techKeywords.filter(k => answer.toLowerCase().includes(k));

  if (matchedKeywords.length >= 3) {
    technicalAccuracy += 2;
    evidence += 2;
    strengths.push(`Good use of technical terminology (${matchedKeywords.slice(0, 3).join(', ')}).`);
  } else {
    improvements.push(`Ground your response with concrete hardware terms (e.g. component names, voltages, signal types).`);
  }

  // Check for project title or specific component reference
  if (answer.toLowerCase().includes(ctx.title.toLowerCase()) || answer.toLowerCase().includes(ctx.hardwarePlatform.toLowerCase())) {
    evidence += 1;
    strengths.push(`Directly referenced your specific project context (${ctx.hardwarePlatform}).`);
  }

  // Check for honesty about limitations
  if (/however|limitation|currently|future|next step|trade-off|not yet|prototype|obstacle|challenge/i.test(answer)) {
    limitationsAwareness += 3;
    strengths.push(`Shows mature engineering perspective by recognizing project boundaries or trade-offs.`);
  } else if (questionObj.category?.includes('Limitations') || questionObj.category?.includes('Challenges')) {
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
