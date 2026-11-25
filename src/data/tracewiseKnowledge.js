/**
 * Tracewise Verified Local Knowledge Base & Deterministic Guidance Engine
 * Provides instant, zero-latency, zero-cost educational explanations
 * for electronics concepts, platform workflows, pinouts, and tutorial mappings.
 */

export const ROUTE_CONTEXTS = {
  '/app': {
    title: 'Dashboard',
    role: 'Dashboard Guide',
    welcome: 'Welcome to your Workspace! You can start a new blank circuit, explore 5 starter projects, or view saved circuits.',
    suggestedQuestions: [
      'How do I start a new circuit project?',
      'What starter projects are available?',
      'How do I import an existing physical project?',
      'Where can I watch the beginner tutorial?'
    ],
    recommendedLessonId: 'lesson-1-dashboard'
  },
  '/app/studio': {
    title: 'Engineering Studio',
    role: 'Studio Engineering Helper',
    welcome: 'You are in the Engineering Studio. Add components from the left, connect pins on the canvas, edit code on the right, and run simulation.',
    suggestedQuestions: [
      'Why does an LED need a 220Ω resistor?',
      'How do I connect wires between components?',
      'How do I write Arduino firmware?',
      'How do I test my circuit in simulation?'
    ],
    recommendedLessonId: 'lesson-2-components'
  },
  '/app/compare': {
    title: 'Compare & Debug',
    role: 'Diagnostics Mentor',
    welcome: 'Compare & Debug helps you find wiring errors and firmware bugs by comparing your project against canonical reference designs.',
    suggestedQuestions: [
      'How does Compare & Debug detect mistakes?',
      'What should I do if a pin connection is red?',
      'How do I diff my firmware code?',
      'Watch Compare & Debug tutorial'
    ],
    recommendedLessonId: 'lesson-6-compare'
  },
  '/app/pitch': {
    title: 'Pitch Lab',
    role: 'Science Fair Pitch Mentor',
    welcome: 'Pitch Lab prepares you for science fairs with auto-generated slide decks, 60-second elevator pitches, and judge Q&A flashcards.',
    suggestedQuestions: [
      'How do I generate a science fair pitch?',
      'What will judges ask about my circuit?',
      'Can I download printable presentation cards?',
      'Watch Pitch Lab tutorial'
    ],
    recommendedLessonId: 'lesson-7-pitch'
  },
  '/app/community': {
    title: 'Community & Discovery',
    role: 'Community Ambassador',
    welcome: 'Discover inspiring circuits created by students worldwide, remix public projects, and exchange encrypted peer engineering notes.',
    suggestedQuestions: [
      'How do I publish my project to the community?',
      'How do I remix another student’s project?',
      'Is direct messaging end-to-end encrypted?',
      'Watch Community tutorial'
    ],
    recommendedLessonId: 'lesson-8-community'
  },
  '/learn': {
    title: 'Learning Centre',
    role: 'Learning Coach',
    welcome: 'Explore our 8 interactive animated tutorials and hands-on quiz challenges to master circuits and microcontrollers.',
    suggestedQuestions: [
      'Which tutorial should I start with?',
      'How does the Showcase Pointer work?',
      'How do I practice building on the real canvas?',
      'What is Ohm’s law?'
    ],
    recommendedLessonId: 'lesson-1-dashboard'
  }
};

export const KNOWLEDGE_TOPICS = [
  {
    id: 'resistor-led-ohm',
    keywords: ['resistor', 'led', '220', 'ohm', 'burn', 'current', 'limit', 'voltage'],
    title: 'Why LEDs Require Current-Limiting Resistors',
    answer: `### 💡 Why an LED Needs a 220Ω Resistor\n\nLEDs (Light Emitting Diodes) have almost **zero internal resistance** once forward voltage is reached (~2.0V for Red, ~3.2V for Blue/Green).\n\nIf you connect an LED directly to an Arduino 5V digital pin without a resistor:\n- **Excessive Current:** More than 50–100mA will surge through the LED (Arduino pins are rated for maximum 20–40mA).\n- **Damage:** Both the LED and the microcontroller pin will overheat and burn out permanently.\n\n**Ohm’s Law Calculation (V = I × R):**\n- **Voltage drop across resistor:** 5.0V - 2.0V = 3.0V\n- **Target safe current:** ~15mA (0.015A)\n- **Required Resistance:** R = 3.0V / 0.015A = 200Ω → **Standard 220Ω resistor**\n\nAlways wire a **220Ω resistor in series** with either the LED Anode (+) or Cathode (-).`,
    recommendedLessonId: 'lesson-3-wiring',
    followUps: ['How do I know which LED pin is Anode?', 'What happens with a 10k resistor?']
  },
  {
    id: 'led-polarity',
    keywords: ['anode', 'cathode', 'polarity', 'long leg', 'flat edge', 'positive', 'negative'],
    title: 'LED Polarity & Pin Identification',
    answer: `### 🔴 Identifying LED Anode (+) vs Cathode (-)\n\nAn LED is a diode that allows current to flow in **only one direction**:\n\n1. **Anode (+, Positive):**\n   - Longer lead wire.\n   - Connects to digital pin or 5V (via 220Ω resistor).\n2. **Cathode (-, Negative):**\n   - Shorter lead wire and a flat edge on the plastic rim.\n   - Connects to **GND** (Ground).\n\nIf connected backwards (Reverse Biased), no current flows and the LED will not light up, but it will not be harmed at 5V.`,
    recommendedLessonId: 'lesson-3-wiring',
    followUps: ['Why does an LED need a 220Ω resistor?', 'How do I wire it on the canvas?']
  },
  {
    id: 'digital-vs-analog',
    keywords: ['digital', 'analog', 'pwm', 'pins', 'a0', 'd13', 'tilde', 'analogread', 'digitalwrite'],
    title: 'Digital vs Analog Pins on Arduino Uno',
    answer: `### ⚡ Digital vs. Analog Pins\n\n- **Digital Pins (D0 to D13):**\n  - Read or write two binary states: \`HIGH\` (5V) or \`LOW\` (0V).\n  - **PWM Pins (~ 3, 5, 6, 9, 10, 11):** Support \`analogWrite(pin, 0-255)\` to simulate varying voltage by pulsing 5V rapidly (Pulse Width Modulation) for dimming LEDs or driving motors.\n  - **Pin 13:** Has a built-in test LED and resistor on board.\n\n- **Analog Inputs (A0 to A5):**\n  - Measure continuous voltages from **0V to 5V** using a 10-bit Analog-to-Digital Converter (ADC).\n  - \`analogRead(A0)\` returns integer values from **0** (0V) to **1023** (5V).\n  - Used for potentiometers, photoresistors (LDR), and analog sensors.`,
    recommendedLessonId: 'lesson-4-firmware',
    followUps: ['How does a potentiometer work?', 'How do I write Arduino code?']
  },
  {
    id: 'push-button-pullup',
    keywords: ['button', 'pushbutton', 'pullup', 'pulldown', 'floating', '10k', 'input_pullup'],
    title: 'Buttons & Floating Pin Prevention',
    answer: `### 🔘 Push Buttons & Input Pull-ups\n\nWhen a microcontroller input pin is not connected to a definite voltage, it is **floating** — picking up electrostatic noise and randomly toggling between HIGH and LOW.\n\n**Two Ways to Wire a Button:**\n1. **Software Internal Pull-up (Recommended):**\n   \`\`\`cpp\n   pinMode(buttonPin, INPUT_PULLUP);\n   \`\`\`\n   Connect one button terminal to the Arduino pin and the other to **GND**. When unpressed, reading is \`HIGH\`; when pressed, reading is \`LOW\`.\n\n2. **External 10kΩ Resistor:**\n   Connect a 10kΩ resistor between the digital pin and GND (pull-down) or 5V (pull-up) to tie down the idle state.`,
    recommendedLessonId: 'lesson-4-firmware',
    followUps: ['How do I wire a button in Studio?', 'Why does my button bounce?']
  },
  {
    id: 'simulation-basics',
    keywords: ['simulate', 'simulation', 'avr8js', 'start simulation', 'stop', 'virtual', 'speed'],
    title: 'Running the avr8js Circuit Simulator',
    answer: `### ⏱️ Running Tracewise Simulation\n\nTracewise runs an in-browser cycle-accurate **avr8js** engine simulating the ATmega328P microcontroller at 16MHz:\n\n1. Click the green **Start Simulation** button in the top toolbar or press the play button.\n2. The compiler compiles your C++ sketch into AVR machine instructions.\n3. The virtual CPU begins executing your code instruction-by-instruction.\n4. LEDs will illuminate, servos will sweep, and the **Serial Monitor** will display \`Serial.println()\` output.\n5. Click **Stop Simulation** to edit your circuit wiring or code.`,
    recommendedLessonId: 'lesson-5-simulation',
    followUps: ['How do I open the Serial Monitor?', 'What if simulation fails?']
  },
  {
    id: 'pitch-lab-guide',
    keywords: ['pitch', 'science fair', 'judge', 'presentation', 'slides', 'elevator pitch', 'rubric'],
    title: 'Pitch Lab for Science Fairs',
    answer: `### 🏆 Preparing with Pitch Lab\n\nPitch Lab turns your circuit into a complete science fair presentation:\n\n- **Executive Slide Deck:** Generates problem, solution, circuit architecture, schematic explanation, and results.\n- **60-Second Elevator Pitch:** Bulletproof spoken script tailored for judges walking down fair aisles.\n- **Judge Q&A Flashcards:** Anticipates tough questions on component choices, failure modes, and safety.\n- **Fair Rubric Scoring:** Evaluates scientific rigor, engineering clarity, and presentation quality.`,
    recommendedLessonId: 'lesson-7-pitch',
    followUps: ['How do I download printable presentation cards?', 'Watch Pitch Lab tutorial']
  },
  {
    id: 'compare-debug-guide',
    keywords: ['compare', 'debug', 'mistake', 'error', 'diff', 'broken', 'wrong pin', 'not working'],
    title: 'Using Compare & Debug',
    answer: `### 🔍 Compare & Debug Workflow\n\nIf your circuit doesn’t work as expected:\n\n1. Navigate to **Compare & Debug** from the top navbar.\n2. Select a reference design (e.g., *Canonical Traffic Light* or *Button LED*).\n3. Tracewise highlights netlist differences in real time:\n   - **Green lines:** Correct matching connections.\n   - **Red lines:** Missing wires, reversed polarity, or wrong microcontroller pin.\n   - **Yellow warnings:** Incorrect resistor value or floating pin.\n4. Click **Auto-Fix** or manually reconnect the flagged wire on the canvas.`,
    recommendedLessonId: 'lesson-6-compare',
    followUps: ['Watch Compare & Debug tutorial', 'How do I inspect components?']
  },
  {
    id: 'first-circuit-practice',
    keywords: ['first circuit', 'practice', 'walkthrough', 'step by step', 'guide me', 'beginner project'],
    title: 'Guided First Circuit Practice Mode',
    answer: `### 🚀 Practice Mode: Build Your First Circuit\n\nReady for hands-on learning? Tracewise includes a built-in step-by-step checklist on the canvas:\n\n1. Add an **Arduino Uno** to the canvas.\n2. Place a **Red LED** and a **220Ω Resistor**.\n3. Wire **Pin 13** → Resistor → LED Anode.\n4. Connect LED Cathode → **GND**.\n5. Click **Start Simulation** to watch your first circuit blink!\n\nYou can launch Practice Mode anytime from the **Learning Centre** or by clicking the *Build First Circuit* button.`,
    recommendedLessonId: 'lesson-2-components',
    followUps: ['Launch Guided Practice Mode', 'Watch Components Tutorial']
  }
];

/**
 * Deterministic local matcher for student questions
 * Returns structured match with zero network calls when confident
 */
export function matchLocalKnowledge(query, currentPath = '') {
  if (!query || typeof query !== 'string') return null;
  const clean = query.toLowerCase().trim();

  // 1. Check exact question match or keyword intersection
  let bestMatch = null;
  let highestScore = 0;

  for (const topic of KNOWLEDGE_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (clean.includes(kw)) {
        score += 2;
      }
    }
    if (clean.includes(topic.title.toLowerCase())) {
      score += 5;
    }
    if (score > highestScore && score >= 2) {
      highestScore = score;
      bestMatch = topic;
    }
  }

  if (bestMatch) {
    return {
      text: bestMatch.answer,
      title: bestMatch.title,
      matchedTopicId: bestMatch.id,
      recommendedLessonId: bestMatch.recommendedLessonId,
      followUps: bestMatch.followUps || [],
      sourceTag: 'Local Knowledge Base (Verified)'
    };
  }

  // 2. Route-based contextual answer if generic greeting or "help"
  if (/^(hi|hello|hey|help|where am i|what can you do|start)\b/i.test(clean)) {
    const sortedRoutes = Object.keys(ROUTE_CONTEXTS).sort((a, b) => b.length - a.length);
    const routeKey = sortedRoutes.find(r => currentPath.startsWith(r)) || '/app';
    const ctx = ROUTE_CONTEXTS[routeKey];
    return {
      text: `### 👋 Hi! I am Tracewise Mini\n\n${ctx.welcome}\n\nHere are a few things you can ask me on this page:\n${ctx.suggestedQuestions.map(q => `- **${q}**`).join('\n')}\n\nYou can also watch animated interactive tutorials or launch **Guided Practice Mode** anytime!`,
      title: ctx.title,
      matchedTopicId: 'greeting',
      recommendedLessonId: ctx.recommendedLessonId,
      followUps: ctx.suggestedQuestions.slice(0, 2),
      sourceTag: 'Local Knowledge Base (Verified)'
    };
  }

  return null;
}
