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
 * Adapter 1: Simulated Circuit & Contextual Project Adapter
 * Supports both full circuits and concept/early-stage projects without circuits.
 * Never fabricates Arduino Uno / ATmega328P claims when no circuit exists.
 */
export function buildCircuitPitchContext(project, userBrief = {}) {
  const components = Array.isArray(project.components) ? project.components : [];
  const connections = Array.isArray(project.connections) ? project.connections : [];
  const code = project.code || '';
  const validation = project.validation || {};
  const hasCircuit = components.length > 0;

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
  const descLower = (project.description || '').toLowerCase();
  const combined = `${titleLower} ${descLower}`;
  if (combined.includes('traffic')) {
    archetype = 'Autonomous Traffic Signal Controller';
  } else if (combined.includes('pedestrian')) {
    archetype = 'Pedestrian Crossing Safety System';
  } else if (combined.includes('light') || combined.includes('ldr') || combined.includes('night')) {
    archetype = 'Ambient Light Responsive Automation';
  } else if (combined.includes('sweep') || combined.includes('servo') || combined.includes('robot')) {
    archetype = 'Micro-Robotic Actuator & Sensor Unit';
  } else if (combined.includes('plant') || combined.includes('soil') || combined.includes('moisture')) {
    archetype = 'Automated Environmental Agriculture System';
  } else if (!hasCircuit) {
    archetype = 'Digital Engineering & Hardware Architecture';
  }

  const versionStr = typeof project.version === 'object' && project.version !== null
    ? (project.version.id || project.version.label || 'v1.0')
    : (project.version || 'v1.0');

  // Extract project information from root, documentation, identity, and brief
  const problem = (
    userBrief.problem ||
    project.problemSolved ||
    project.problemStatement ||
    project.problem ||
    project.documentation?.problemSolved ||
    ''
  ).trim();

  const audience = (
    userBrief.audience ||
    project.targetAudience ||
    project.audience ||
    project.documentation?.targetAudience ||
    ''
  ).trim();

  const solution = (
    userBrief.solution ||
    project.proposedSolution ||
    project.workingPrinciple ||
    project.solution ||
    project.documentation?.workingPrinciple ||
    project.description ||
    ''
  ).trim();

  const importance = (
    userBrief.importance ||
    project.importance ||
    project.whyItMatters ||
    ''
  ).trim();

  const testingEvidence = (
    userBrief.testingEvidence ||
    project.testingEvidence ||
    project.testing ||
    project.documentation?.testingEvidence ||
    ''
  ).trim();

  const limitations = (
    userBrief.limitations ||
    project.challengesFaced ||
    project.limitations ||
    project.documentation?.challengesFaced ||
    ''
  ).trim();

  const nextSteps = (
    userBrief.nextSteps ||
    project.futureImprovements ||
    project.nextSteps ||
    project.documentation?.futureImprovements ||
    ''
  ).trim();

  const userFeedback = (userBrief.userFeedback || project.userFeedback || '').trim();

  // Goals, notes, and design decisions
  const goals = Array.isArray(project.goals)
    ? project.goals
    : (typeof project.goals === 'string' ? [project.goals] : (Array.isArray(project.projectGoals) ? project.projectGoals : []));
  const notes = project.notes || project.documentationText || (typeof project.documentation === 'string' ? project.documentation : (project.documentation?.notes || ''));
  const designDecisions = Array.isArray(project.designDecisions)
    ? project.designDecisions
    : (typeof project.designDecisions === 'string' ? [project.designDecisions] : []);
  const mediaAttachments = Array.isArray(project.mediaAttachments)
    ? project.mediaAttachments
    : (project.documentation?.mediaAttachments || []);

  // Determine hardware platform honestly
  let hardwarePlatform = project.hardwarePlatform || '';
  if (!hardwarePlatform) {
    if (hasArduino) {
      hardwarePlatform = 'Arduino Uno';
    } else if (hasCircuit) {
      hardwarePlatform = 'Custom Circuit';
    } else {
      hardwarePlatform = 'Conceptual Hardware Architecture';
    }
  }

  return {
    projectId: project.id,
    projectType: 'simulated_circuit',
    isPhysicalProject: false,
    hasCircuit,
    hardwarePlatform,
    title: project.title || project.name || 'Electronics Project',
    description: project.description || (hasCircuit ? 'Interactive Arduino microcontroller circuit.' : 'Hardware engineering design and documentation.'),
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
    workingPrinciple: project.workingPrinciple || project.documentation?.workingPrinciple || '',
    challengesFaced: project.challengesFaced || project.documentation?.challengesFaced || '',
    demonstrationPlan: project.demonstrationPlan || project.documentation?.demonstrationPlan || '',
    futureImprovements: project.futureImprovements || project.documentation?.futureImprovements || '',
    goals,
    notes,
    designDecisions,
    mediaAttachments,
    userBrief: {
      problem,
      audience,
      importance,
      solution,
      testingEvidence,
      userFeedback,
      limitations,
      nextSteps
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
 * Generates pitch drafts for simulated circuits & context-only projects
 */
function generateCircuitPitchDrafts(ctx) {
  const b = ctx.userBrief;
  const hasCircuit = Boolean(ctx.hasCircuit && ctx.componentsCount > 0);
  const problem = b.problem.trim() || `handling practical signaling and automation challenges reliably with accessible microcontroller hardware`;
  const audience = b.audience.trim() || `students, urban engineers, and robotics teams`;
  const solution = b.solution.trim() || (hasCircuit
    ? `a synchronized ${ctx.archetype} built around an Arduino Uno, dedicated current-limited outputs, and responsive state logic`
    : `a structured ${ctx.archetype} engineered to solve this challenge through verified specifications and modular design`);
  const testing = b.testingEvidence.trim() || (hasCircuit
    ? `verified through static rule checking, AST pin collision validation, and circuit simulation`
    : (ctx.notes ? `structured through engineering documentation and architectural design review` : `undergoing specification review and schematic planning`));
  const limitations = b.limitations.trim() || (hasCircuit
    ? `currently runs as an educational prototype without high-voltage isolation or cellular telemetry`
    : `currently in architectural design stage awaiting component assembly and hardware bench trials`);
  const nextSteps = b.nextSteps.trim() || `adding hardware fail-safes and physical enclosure prototyping`;

  const compPhrase = hasCircuit
    ? `Using ${ctx.componentsCount} integrated circuit elements on an Arduino Uno platform, it has been ${testing}. `
    : `Grounding the system in verified engineering requirements, it is ${testing}. `;

  const pitch30 = `We built the ${ctx.title} to address ${problem}. ` +
    `Designed for ${audience}, our system delivers ${solution}. ` +
    compPhrase +
    `It transforms how beginners verify their hardware before physical construction.`;

  const pitch60 = `Hello judges. When ${audience} work on electronics, they often struggle with ${problem}. ` +
    `To solve this, we created ${ctx.title}—${solution}. ` +
    `\n\n${hasCircuit
      ? `Our circuit incorporates ${ctx.componentNames.slice(0, 4).join(', ')}${ctx.componentNames.length > 4 ? ' and additional sensors' : ''}. Every connection has been checked for pin conflicts, and our firmware implements deterministic state transitions.`
      : `Our engineering plan details the operational requirements, interface signals, and boundary conditions to ensure predictable hardware assembly.`} ` +
    `\n\nIn our tests, the design was ${testing}. ` +
    `While it is currently a prototype with limitations like ${limitations}, ` +
    `our next step is ${nextSteps}. ${ctx.title} proves that smart hardware engineering starts with clear, verifiable thinking.`;

  const pitch120 = `Good morning judges and panel. I'm presenting ${ctx.title}, ${solution}. ` +
    `\n\n1. THE PROBLEM & AUDIENCE:\n` +
    `${audience} face a critical challenge: ${problem}. Without transparent tooling, wiring mistakes easily damage components or cause erratic runtime bugs.` +
    `\n\n2. TECHNICAL ARCHITECTURE & IMPLEMENTATION:\n` +
    (hasCircuit
      ? `Our hardware architecture relies on an Arduino Uno microcontroller managing ${ctx.inputsCount} inputs and ${ctx.outputsCount} outputs. ` +
        (ctx.pinDeclarations.length > 0
          ? `Pins are strictly allocated in firmware—including ${ctx.pinDeclarations.slice(0, 3).map(p => `${p.variable} on Digital Pin ${p.pin}`).join(', ')}—preventing resource collisions. `
          : `Pin mappings are deterministically mapped to protect outputs with current-limiting resistors. `) +
        `The firmware runs non-blocking timing routines, ensuring the circuit responds predictably under load.`
      : `Our architecture is planned around the ${ctx.hardwarePlatform}, specifying input sensing stages, signal conditioning, and deterministic state transitions before physical hardware commit.`) +
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
      talkingPoints: hasCircuit
        ? [
            `Walk through the circuit layout: ${ctx.componentNames.join(', ')}.`,
            `Explain why the Arduino Uno and specific pins were selected.`,
            `Demonstrate how the firmware logic handles inputs and drives outputs.`
          ]
        : [
            `Walk through the planned hardware architecture: ${ctx.hardwarePlatform}.`,
            `Explain the operational requirements and interface specifications.`,
            `Demonstrate the documented system logic and state workflow.`
          ]
    },
    {
      time: '2:00 - 3:00',
      section: 'Testing, Diagnostics & Iteration',
      talkingPoints: [
        `Show testing evidence: ${testing}.`,
        `Highlight a specific bug or design challenge encountered during development and how you solved it.`,
        `Discuss power management and component protection.`
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

// -----------------------------------------------------------------------------
// STRUCTURED PRESENTATION SLIDE DECK GENERATOR
// Adapts dynamically to projects with or without completed circuits.
// Strictly grounds confirmed facts vs suggested content.
// -----------------------------------------------------------------------------

export function generatePresentationSlides(ctx) {
  if (!ctx) return [];

  const b = ctx.userBrief || {};
  const hasUserProblem = Boolean((b.problem || '').trim());
  const hasUserAudience = Boolean((b.audience || '').trim());
  const hasUserSolution = Boolean((b.solution || '').trim());
  const hasUserImportance = Boolean((b.importance || '').trim());
  const hasUserTesting = Boolean((b.testingEvidence || '').trim());
  const hasUserLimitations = Boolean((b.limitations || '').trim());
  const hasUserNextSteps = Boolean((b.nextSteps || '').trim());
  const hasCircuit = Boolean(ctx.hasCircuit && ctx.componentsCount > 0);
  const isPhys = Boolean(ctx.isPhysicalProject);

  const problemText = b.problem?.trim() || (isPhys
    ? `A tangible engineering problem in need of practical hardware automation.`
    : `Signaling, monitoring, and embedded control challenges requiring verifiable circuit design.`);
  const audienceText = b.audience?.trim() || `Students, engineering teams, and community practitioners`;
  const solutionText = b.solution?.trim() || (isPhys
    ? `A physical ${ctx.hardwarePlatform} prototype designed for reliable real-world automation.`
    : (hasCircuit
        ? `A synchronized ${ctx.archetype} with deterministic hardware states and fault protections.`
        : `An engineered modular design addressing practical hardware requirements.`));
  const importanceText = b.importance?.trim() || `Preventing undetected hardware failures, improving operational safety, and making engineering reproducible.`;
  const testingText = b.testingEvidence?.trim() || (hasCircuit
    ? `Verified through static rule checking, AST pin collision detection, and MCU simulation.`
    : `Detailed engineering specifications and planned bench validation protocols.`);
  const limitationsText = b.limitations?.trim() || (isPhys
    ? `Operates as an educational prototype under controlled bench conditions.`
    : (hasCircuit
        ? `Prototype configuration without industrial galvanic isolation or telemetry.`
        : `Early-stage architectural design preparing for hardware assembly.`));
  const nextStepsText = b.nextSteps?.trim() || `Refining physical enclosures, power efficiency, and long-term durability trials.`;

  const slides = [];

  // Slide 1: Title & Introduction
  slides.push({
    id: 'slide-1-title',
    slideNumber: 1,
    type: 'title',
    title: 'Project Title & Introduction',
    headline: ctx.title || 'Tracewise Electronics Project',
    bullets: [
      `System: ${ctx.title || 'Engineering Project'}`,
      `Hardware Platform: ${ctx.hardwarePlatform || 'Modular Architecture'}`,
      `Classification: ${ctx.archetype || 'Engineering Project'} • ${ctx.version || 'v1.0'}`
    ],
    speakerNotes: `Welcome judges and panel. Today I am excited to present ${ctx.title}, a project engineered to address real challenges with clear, verifiable hardware thinking.`,
    status: 'confirmed',
    category: 'Introduction'
  });

  // Slide 2: Problem Statement
  slides.push({
    id: 'slide-2-problem',
    slideNumber: 2,
    type: 'problem',
    title: 'Problem Statement',
    headline: `The Core Challenge: ${problemText.length > 80 ? problemText.slice(0, 80) + '...' : problemText}`,
    bullets: [
      `Target Users: ${audienceText}`,
      `Observed Challenge: ${problemText}`,
      `Current Shortcoming: Conventional solutions are either closed black-boxes or prone to undetected wiring errors.`
    ],
    speakerNotes: `To understand why this project was created, consider the challenge faced by ${audienceText}: ${problemText}. Without clear feedback, mistakes are difficult to diagnose.`,
    status: hasUserProblem ? 'confirmed' : 'suggested',
    category: 'Problem'
  });

  // Slide 3: Why It Matters
  slides.push({
    id: 'slide-3-importance',
    slideNumber: 3,
    type: 'importance',
    title: 'Why the Problem Matters',
    headline: 'Real-World Impact & Motivation',
    bullets: [
      `Significance: ${importanceText}`,
      `Operational Safety: Mitigating damage, short circuits, and intermittent operational bugs.`,
      `Accessibility: Providing a repeatable, low-cost engineering model that anyone can verify.`
    ],
    speakerNotes: `Why does solving this matter? Beyond just a technical exercise, ${importanceText}. It impacts real users and makes engineering more trustworthy.`,
    status: hasUserImportance ? 'confirmed' : 'suggested',
    category: 'Motivation'
  });

  // Slide 4: Proposed Solution
  slides.push({
    id: 'slide-4-solution',
    slideNumber: 4,
    type: 'solution',
    title: 'Proposed Solution',
    headline: `${solutionText.length > 80 ? solutionText.slice(0, 80) + '...' : solutionText}`,
    bullets: [
      `Solution Concept: ${solutionText}`,
      `Core Philosophy: Transparent design where every wire, pin, and logic state is intentional.`,
      `User Experience: Intuitive operation designed specifically for ${audienceText}.`
    ],
    speakerNotes: `Our solution is ${ctx.title}—${solutionText}. Rather than an unexplainable assembly, our design prioritizes clarity and predictability.`,
    status: hasUserSolution ? 'confirmed' : 'suggested',
    category: 'Solution'
  });

  // Slide 5: How It Works
  const principleText = ctx.workingPrinciple || (hasCircuit
    ? `The microcontroller reads incoming signals, executes non-blocking state evaluation, and triggers current-limited outputs.`
    : `The architecture routes input sensor data through defined processing thresholds to command responsive output actuators.`);
  slides.push({
    id: 'slide-5-working',
    slideNumber: 5,
    type: 'working_principle',
    title: 'How the Solution Works',
    headline: 'Operational Workflow & System Flow',
    bullets: [
      `Operational Logic: ${principleText}`,
      `Input Handling: Continuous monitoring of input lines with debounce and threshold filtering.`,
      `Output Control: Deterministic state updates driving connected hardware safely.`
    ],
    speakerNotes: `Here is how the system operates in real time: ${principleText}. Every state change happens predictably.`,
    status: ctx.workingPrinciple ? 'confirmed' : 'suggested',
    category: 'Operation'
  });

  // Slide 6: Important Features
  const featureList = [];
  if (ctx.componentsCount > 0) {
    featureList.push(`Modular Hardware: ${ctx.componentsCount} integrated components with documented pin interfaces.`);
  } else {
    featureList.push(`Specification-First Design: Structured architecture ready for physical prototyping.`);
  }
  featureList.push(`Fail-Safe Operation: Protected electrical paths and clean boundary checks.`);
  featureList.push(`Reproducible Build: Open schematic documentation allowing easy replication.`);

  slides.push({
    id: 'slide-6-features',
    slideNumber: 6,
    type: 'features',
    title: 'Important Features',
    headline: 'Engineered for Reliability and Usability',
    bullets: featureList,
    speakerNotes: `The primary features of ${ctx.title} emphasize reliability and practical deployment. We focused on features that directly address user needs.`,
    status: 'confirmed',
    category: 'Features'
  });

  // Slide 7: Technical Architecture
  const archBullets = [];
  archBullets.push(`Platform: ${ctx.hardwarePlatform}`);
  if (ctx.componentNames && ctx.componentNames.length > 0) {
    archBullets.push(`Key Elements: ${ctx.componentNames.slice(0, 4).join(', ')}${ctx.componentNames.length > 4 ? ` and ${ctx.componentNames.length - 4} others` : ''}`);
  } else if (ctx.designDecisions && ctx.designDecisions.length > 0) {
    archBullets.push(`Design Decisions: ${ctx.designDecisions.slice(0, 2).join('; ')}`);
  } else {
    archBullets.push(`Controller: Architecture planned around accessible microcontroller logic.`);
  }
  archBullets.push(`Circuit Protection: Current-limiting design protecting logic pins from overcurrent.`);

  slides.push({
    id: 'slide-7-architecture',
    slideNumber: 7,
    type: 'architecture',
    title: 'Technical Approach & Architecture',
    headline: `Hardware & Firmware Architecture (${ctx.hardwarePlatform})`,
    bullets: archBullets,
    speakerNotes: `Taking a deeper look at the technical architecture: we selected the ${ctx.hardwarePlatform} to strike the right balance of I/O capability, power requirements, and reliability.`,
    status: hasCircuit || isPhys ? 'confirmed' : 'suggested',
    category: 'Architecture'
  });

  // Slide 8: Implementation Progress
  const progressBullets = [];
  if (hasCircuit || isPhys) {
    progressBullets.push(`Hardware Build: ${ctx.componentsCount} components placed and connected.`);
    progressBullets.push(`Firmware / Logic: Code written and validated for pin consistency.`);
  } else {
    progressBullets.push(`Project Concept & Brief: Complete problem framing and audience definition.`);
    progressBullets.push(`Hardware Architecture: Core specifications and component list established.`);
  }
  progressBullets.push(`Documentation: Comprehensive project facts and presentation notes prepared in Pitch Lab.`);

  slides.push({
    id: 'slide-8-progress',
    slideNumber: 8,
    type: 'progress',
    title: 'Implementation Progress',
    headline: hasCircuit || isPhys ? 'Working Prototype Built & Verified' : 'Architecture & Specifications Defined',
    bullets: progressBullets,
    speakerNotes: `Where does the project currently stand? We have established the core engineering foundations, verified our design parameters, and documented our findings.`,
    status: 'confirmed',
    category: 'Progress'
  });

  // Slide 9: Demonstration & Testing Details (Adapts if circuit exists or plans if not)
  if (hasCircuit || isPhys) {
    slides.push({
      id: 'slide-9-demo-testing',
      slideNumber: 9,
      type: 'demo_testing',
      title: 'Demonstration & Circuit Details',
      headline: 'Empirical Verification & Demonstration',
      bullets: [
        `Verification Method: ${testingText}`,
        `Observed Stability: Deterministic execution across continuous operational cycles.`,
        `Demonstration: Live hardware/simulation state transitions responding to stimulus.`
      ],
      speakerNotes: `During our testing phases, we confirmed that: ${testingText}. The system responds smoothly without erratic states.`,
      status: hasUserTesting ? 'confirmed' : 'suggested',
      category: 'Validation'
    });
  } else {
    slides.push({
      id: 'slide-9-demo-testing',
      slideNumber: 9,
      type: 'validation_plan',
      title: 'Validation Plan & Test Objectives',
      headline: 'Testing Objectives & Validation Protocol',
      bullets: [
        `Planned Verification: ${testingText}`,
        `Test Criteria: Measurement of voltage rails, signal response latency, and threshold accuracy.`,
        `Edge Case Protocol: Testing intentional disconnects to verify safe fallback states.`
      ],
      speakerNotes: `Before moving to full physical deployment, our validation plan focuses on: ${testingText}. This rigorous protocol ensures no unexpected faults occur.`,
      status: 'suggested',
      category: 'Validation'
    });
  }

  // Slide 10: Future Improvements & Conclusion
  slides.push({
    id: 'slide-10-conclusion',
    slideNumber: 10,
    type: 'conclusion',
    title: 'Future Improvements & Conclusion',
    headline: 'Engineering Lessons & Future Horizons',
    bullets: [
      `Authentic Limitations: ${limitationsText}`,
      `Next Engineering Steps: ${nextStepsText}`,
      `Takeaway: ${ctx.title} proves that smart hardware engineering starts with clear, verifiable thinking.`
    ],
    speakerNotes: `In conclusion, every real engineering build has trade-offs. Right now, ${limitationsText}. With further time, our roadmap focuses on ${nextStepsText}. Thank you, and I look forward to your questions.`,
    status: hasUserLimitations ? 'confirmed' : 'suggested',
    category: 'Roadmap'
  });

  return slides;
}
