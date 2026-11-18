/**
 * Tracewise Multimodal AI Vision Gateway (/api/vision)
 * 
 * Serverless multimodal endpoint for analyzing student electronics, breadboards,
 * and robotics prototypes using Google Gemini 1.5 Flash.
 * 
 * Grounding & Safety Contract:
 * 1. Takes real base64 image data and sends via inlineData to Gemini 1.5 Flash.
 * 2. Instructs Gemini to detect microcontrollers, components, bounding regions, and wire traces.
 * 3. Categorizes hardware into honest capability tiers (Level A to E).
 * 4. Flags hidden/obscured connections as unconfirmed and returns targeted verification questions.
 * 5. Returns structured JSON with provider attribution and confidence scores.
 */

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const clientRequestHistory = new Map();

function checkRateLimit(clientKey) {
  const now = Date.now();
  const timestamps = (clientRequestHistory.get(clientKey) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  timestamps.push(now);
  clientRequestHistory.set(clientKey, timestamps);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - timestamps.length };
}

function getGeminiApiKeys() {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY,
    process.env.GOOGLE_GEMINI_KEY
  ].filter(Boolean);
  return Array.from(new Set(keys));
}

const VISION_SYSTEM_PROMPT = `You are the Tracewise Multimodal Vision Analyzer, an expert embedded systems and circuit recognition engineer.
Analyze the provided photograph of an electronics, microcontroller, robotics, or breadboard project.

STRICT GROUNDING & ACCURACY CONTRACT:
1. Examine the visual evidence in the image carefully.
2. Identify the microcontroller or brain board (e.g. Arduino Uno, Nano, Mega, ESP32, Raspberry Pi Pico, STM32).
3. Identify all visible electronic components (LEDs, resistors, sensors, motor drivers, breadboard, servos, displays, buzzers).
   - For each component, provide normalized bounding box coordinates: { "x": 0.0-1.0, "y": 0.0-1.0, "width": 0.0-1.0, "height": 0.0-1.0 }.
   - Provide confidence score (0.0 to 1.0) and visual evidence description.
4. Trace visible jumper wires between pins/terminals.
   - Categorize certainty:
     - VISIBLE_IN_PHOTO: Clearly traceable end-to-end.
     - UNCONFIRMED: Partially obscured beneath chassis, inside breadboard, or out of frame.
5. Formulate 1 to 3 targeted clarification questions for the student (e.g. asking which pin a hidden wire connects to).
6. Assess Hardware Capability Tier:
   - Level A: Fully digital & AVR simulated (Arduino Uno + digital pins + basic LEDs/resistors/buttons).
   - Level B: Arduino + external modules with partial simulation (ultrasonic, servo, LCD).
   - Level C: Analog, motor, or high-power circuits (H-bridge, external batteries).
   - Level D: Non-AVR microcontrollers (ESP32, Raspberry Pi Pico, STM32 - code editing supported, avr8js simulator unsupported).
   - Level E: Complex robotics chassis / physical assemblies.

Return ONLY a valid JSON object matching this schema:
{
  "hardwarePlatform": "Arduino Uno R3" | "ESP32" | "Other",
  "category": "Microcontroller" | "Robotics" | "Sensor Build",
  "capabilityTier": "Level A" | "Level B" | "Level C" | "Level D" | "Level E",
  "capabilityDescription": "Detailed capability explanation",
  "isAvrSimulatable": boolean,
  "candidates": [
    {
      "provisionalId": "cand-1",
      "name": "Component Name",
      "partNumber": "Part Number or IC Code",
      "category": "Microcontrollers" | "Outputs" | "Sensors" | "Power" | "Wiring",
      "catalogMatch": "closest catalog id e.g. arduino-uno, led-red, resistor-220, ultrasonic-hcsr04",
      "boundingBox": { "x": 0.1, "y": 0.2, "width": 0.3, "height": 0.25 },
      "confidence": 0.92,
      "evidence": "Visual description of why this was identified",
      "needsReview": boolean
    }
  ],
  "provisionalConnections": [
    {
      "id": "wire-1",
      "from": { "componentId": "cand-1", "pinId": "D9" },
      "to": { "componentId": "cand-2", "pinId": "anode" },
      "wireColor": "blue",
      "certainty": "VISIBLE_IN_PHOTO" | "UNCONFIRMED",
      "evidence": "Visible blue jumper wire from pin D9 to LED lead"
    }
  ],
  "uncertainties": [
    {
      "description": "Wiring obscured beneath chassis or component body",
      "suggestedPins": ["GND", "VCC"],
      "reason": "Hidden from camera angle"
    }
  ],
  "studentQuestions": [
    "Specific question about wiring or part specification to ask student"
  ]
}`;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const clientKey = req.headers['x-client-key'] || req.body?.userId || 'anonymous-client';
  const rateLimit = checkRateLimit(clientKey);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait 1 minute before analyzing another photo.',
      status: 'rate_limited'
    });
  }

  const { imageBase64, mimeType = 'image/jpeg', fileName = 'project.jpg', userNotes = '', codeHint = '' } = req.body || {};

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Missing required imageBase64 payload.' });
  }

  // Sanitize base64 string
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '').trim();
  if (cleanBase64.length < 50) {
    return res.status(400).json({ error: 'Invalid or truncated image data.' });
  }

  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    return res.status(200).json({
      status: 'api_unavailable',
      provider: 'None',
      error: 'Google Gemini Multimodal API key is not configured on this server.',
      fallbackAvailable: true,
      message: 'Live computer vision is currently offline. You can use the interactive manual Component Builder to assemble your circuit.'
    });
  }

  const promptText = `${VISION_SYSTEM_PROMPT}

ADDITIONAL CONTEXT FROM STUDENT:
- File Name: "${fileName}"
- Student Notes / Build Description: "${userNotes || 'None provided'}"
- Associated Firmware Code Snippet: "${(codeHint || '').slice(0, 500) || 'None provided'}"`;

  for (const apiKey of keys) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64
                  }
                },
                {
                  text: promptText
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 429 || response.status === 503) {
        console.warn('Gemini vision quota exceeded or busy on this key, trying next...');
        continue;
      }

      if (!response.ok) {
        console.warn('Gemini vision API error status:', response.status);
        continue;
      }

      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          return res.status(200).json({
            status: 'COMPONENTS_RECOGNIZED',
            provider: 'Google Gemini 1.5 Flash Multimodal',
            hardwarePlatform: parsed.hardwarePlatform || 'Arduino Uno R3',
            category: parsed.category || 'General Electronics',
            capabilityTier: parsed.capabilityTier || 'Level A',
            capabilityDescription: parsed.capabilityDescription || '',
            isAvrSimulatable: parsed.isAvrSimulatable !== false,
            candidates: parsed.candidates || [],
            provisionalConnections: parsed.provisionalConnections || [],
            uncertainties: parsed.uncertainties || [],
            studentQuestions: parsed.studentQuestions || []
          });
        } catch (jsonErr) {
          console.warn('Gemini output failed JSON parsing:', jsonErr.message);
        }
      }
    } catch (err) {
      console.warn('Gemini vision request failed:', err.message);
    }
  }

  // If all keys fail or quota exhausted
  return res.status(200).json({
    status: 'api_unavailable',
    provider: 'None',
    error: 'Gemini 1.5 Flash Vision service is currently unavailable or quota-limited.',
    fallbackAvailable: true,
    message: 'Multimodal vision recognition is currently offline. You can use Tracewise\'s manual Component Builder to add components from our verified 33-part catalog.'
  });
}
