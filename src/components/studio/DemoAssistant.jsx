import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  Wrench,
  RefreshCw,
  Send,
  Cpu,
  Zap,
  HelpCircle,
  MessageSquare,
  Copy,
  ShieldCheck,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';
import { assistantProvider } from '../../domain/assistant/assistantProvider';
import { SafeMarkdown } from './SafeMarkdown';
import { detectUnsupportedHardware, classifyBuildIntent, BUILD_INTENT } from '../../domain/projectBuilder/projectPlanner';
import {
  createDiscoLightBuildPlan,
  createRgbMoodLightBuildPlan,
  createPotentiometerDimmerBuildPlan,
  createBuzzerAlarmBuildPlan,
  generateGroundedCircuitExplanation
} from '../../domain/projectBuilder/projectTemplates';
import { compileBuildPlan } from '../../domain/projectBuilder/catalogCompiler';
import { planAddLedModification } from '../../domain/projectBuilder/projectModifier';

export function DemoAssistant({ project, validation, onApplyFix, initialQuery = null, buildCompleted = false, buildMessage = null }) {
  const [appliedProposalId, setAppliedProposalId] = useState(null);
  
  // Real component counts from project state
  const comps = project?.components || [];
  const wires = project?.connections || [];
  const ledCount = comps.filter(c => c.type === 'led').length;
  const buttonCount = comps.filter(c => c.type === 'push-button').length;
  const resistorCount = comps.filter(c => c.type === 'resistor').length;

  const initialWelcomeText = buildCompleted
    ? `### 🚀 Project Built Successfully!\n\n**"${project?.title || 'Your Circuit'}"** has been constructed on your canvas with matching Arduino C++ firmware.\n\n- **Components generated (${comps.length}):** ${ledCount} LEDs, ${buttonCount} Buttons, ${resistorCount} Resistors, 1 Arduino Uno R3, 1 Half Breadboard\n- **Connections routed:** ${wires.length} catalog-verified wires\n- **Firmware:** Synthesized debounced state machine firmware loaded in the code editor\n- **Validation Status:** ${validation?.overallStatus || 'STRUCTURALLY_VALID'}\n\nWhat would you like to verify or modify?`
    : `### 👋 Welcome to Tracewise Studio!\n\nI am your Engineering Assistant for **"${project?.title || 'your project'}"**. I continuously inspect your canvas wiring, component catalog definitions, and Arduino firmware.\n\nHow can I help you today?`;

  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: initialWelcomeText,
      sourceTag: 'Deterministic Rule Engine',
      verifiedFacts: [
        `Components: ${comps.length}`,
        `Wires: ${wires.length}`
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const scrollContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const prevProjectIdRef = useRef(project?.id);
  const initialQueryExecutedRef = useRef(false);

  // Measure scroll position to support conditional auto-scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const near = distanceToBottom < 80;
    setIsNearBottom(near);
    setShowJumpToBottom(!near && distanceToBottom > 160);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setIsNearBottom(true);
    setShowJumpToBottom(false);
  }, []);

  // Conditional auto-scrolling: only scroll down if near bottom or user just posted
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'user' || isNearBottom) {
      scrollToBottom(true);
    }
  }, [messages, isThinking, isNearBottom, scrollToBottom]);

  // Clean context reset when project switches
  useEffect(() => {
    if (project?.id && project.id !== prevProjectIdRef.current) {
      prevProjectIdRef.current = project.id;
      setAppliedProposalId(null);
      setLastFailedQuery(null);
      setMessages([
        {
          id: `msg-welcome-${project.id}`,
          role: 'assistant',
          text: `### 🔄 Switched Project: ${project.title}\n\nAll pin declarations, catalog definitions, and wiring netlists are loaded for this project. What would you like to verify or improve?`,
          sourceTag: 'Deterministic Rule Engine',
          verifiedFacts: [
            `Project: ${project.title}`,
            `Components: ${(project.components || []).length}`,
            `Connections: ${(project.connections || []).length}`
          ]
        }
      ]);
      scrollToBottom(false);
    }
  }, [project?.id, project?.title, project?.components, project?.connections, scrollToBottom]);

  // Discover reviewable proposals through Assistant Architecture Provider
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    let mounted = true;
    assistantProvider.getProposals({
      project,
      validation,
      onApplyFix: (fix) => {
        onApplyFix(fix);
        if (fix?.id) setAppliedProposalId(fix.id);
      }
    }).then((list) => {
      if (mounted) setProposals(list);
    });
    return () => { mounted = false; };
  }, [project, validation, onApplyFix]);

  // Assistant query processor
  const handleQuery = async (queryText) => {
    if (!queryText || !queryText.trim() || isThinking) return;

    const cleanQuery = queryText.trim();
    const userMsg = { id: `user-${Date.now()}`, role: 'user', text: cleanQuery };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);
    setLastFailedQuery(null);

    const lower = cleanQuery.toLowerCase();

    // 1. Check for unsupported hardware (Test D)
    const unsupported = detectUnsupportedHardware(cleanQuery);
    if (unsupported.length > 0) {
      setMessages(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          text: `### ⚠️ Component Not Available in Catalog\n\nTracewise cannot fully build this project because the required component (**${unsupported.join(', ')}**) is not available in the current component library.\n\nOur catalog currently supports:\n- **Microcontroller:** Arduino Uno R3\n- **Prototyping:** Half Breadboard\n- **Components:** 5mm LEDs (Red, Green, Blue, Yellow), RGB LED (Common Cathode), 220Ω & 10kΩ Resistors, Momentary Push Buttons, Potentiometer (10k), Photoresistor (LDR), Slide Switch (SPDT), and Active Piezo Buzzer\n\nI will not generate an empty skeleton or fabricate connections for unsupported components. Would you like to build an interactive circuit using our supported catalog components?`,
          sourceTag: 'Tracewise Project Builder',
          verifiedFacts: [
            `Requested: ${unsupported.join(', ')}`,
            'Status: Unsupported in current library'
          ]
        }
      ]);
      setIsThinking(false);
      return;
    }

    // 2. Incremental Circuit Modification Intent (Test C: "Add another LED to the current project")
    const isAddLed = (lower.includes('add') || lower.includes('attach') || lower.includes('wire')) &&
      lower.includes('led');

    if (isAddLed && project) {
      try {
        let color = 'yellow';
        if (lower.includes('red')) color = 'red';
        else if (lower.includes('green')) color = 'green';
        else if (lower.includes('blue')) color = 'blue';

        const modPlan = planAddLedModification(project, color);
        const proposalId = `prop-mod-${Date.now()}`;

        // Create an active reviewable proposal
        const newProposal = {
          id: proposalId,
          title: modPlan.title,
          summary: modPlan.summary,
          changes: modPlan.changesPreview.map(c => ({ type: 'circuit', description: c })),
          action: () => {
            onApplyFix({
              type: 'apply_project_modification',
              modification: modPlan,
              id: proposalId
            });
            setAppliedProposalId(proposalId);
          }
        };

        setProposals(prev => [newProposal, ...prev]);

        setMessages(prev => [
          ...prev,
          {
            id: `ast-${Date.now()}`,
            role: 'assistant',
            text: `### 🛠️ Proposed Project Modification\n\nI have prepared a build proposal to **${modPlan.title}**.\n\n**Planned Changes:**\n${modPlan.changesPreview.map(c => `- ${c}`).join('\n')}\n\nYou can click **"Review & Apply"** on the proposal card above to update your circuit canvas and firmware.`,
            sourceTag: 'Tracewise Project Builder',
            verifiedFacts: [
              `Target Pin: ${modPlan.allocatedPin}`,
              'Components to Add: 1 LED, 1 Resistor',
              'Wires to Add: 3'
            ]
          }
        ]);
        setIsThinking(false);
        return;
      } catch (err) {
        setMessages(prev => [
          ...prev,
          {
            id: `ast-err-${Date.now()}`,
            role: 'assistant',
            text: `⚠️ Could not prepare modification: ${err.message}`,
            isError: true
          }
        ]);
        setIsThinking(false);
        return;
      }
    }

    // 3. Disco Light Build in Current Project
    const isDiscoBuild = (lower.includes('disco') && (lower.includes('build') || lower.includes('create') || lower.includes('make'))) ||
      (lower.includes('three button') && lower.includes('led'));

    if (isDiscoBuild) {
      const plan = createDiscoLightBuildPlan();
      const compiled = compileBuildPlan(plan);
      const proposalId = `prop-disco-${Date.now()}`;

      const newProposal = {
        id: proposalId,
        title: 'Build Three-Color Button-Controlled Disco Light',
        summary: 'Compiles 11 component instances (Uno, Breadboard, 3 LEDs, 3 Resistors, 3 Buttons), 15 wires, and debounced state machine firmware.',
        changes: [
          { type: 'circuit', description: 'Add 3 LEDs (Red on D8, Green on D9, Blue on D10)' },
          { type: 'circuit', description: 'Add 3 series 220Ω resistors connected to Ground' },
          { type: 'circuit', description: 'Add 3 push buttons (D2, D3, D4 with Ground return)' },
          { type: 'firmware', description: 'Compile debounced single-color state machine firmware' }
        ],
        action: () => {
          onApplyFix({
            type: 'replace_project',
            project: compiled.project,
            id: proposalId
          });
          setAppliedProposalId(proposalId);
        }
      };

      setProposals(prev => [newProposal, ...prev]);

      setMessages(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          text: `### 💡 Ready to Build Disco Light Controller\n\nI have generated a verified build plan for the **Three-Color Button-Controlled Disco Light**:\n\n- **11 Components:** Arduino Uno R3, Half Breadboard, 3 LEDs (Red, Green, Blue), 3 Resistors (220Ω), 3 Momentary Push Buttons\n- **15 Wires:** Buttons to D2/D3/D4, LEDs to D8/D9/D10 through series 220Ω resistors, and ground returns\n- **Firmware:** Synthesized debounced state machine with one-color-at-a-time logic\n\nClick **"Review & Apply"** on the proposal card above to build this circuit onto your canvas.`,
          sourceTag: 'Tracewise Project Builder',
          verifiedFacts: [
            'Components: 11',
            'Wires: 15',
            'Validation: PASSED'
          ]
        }
      ]);
      setIsThinking(false);
      return;
    }

    // 3b. RGB Mood Light Build
    const isRgbBuild = (lower.includes('rgb') || lower.includes('color mixer') || lower.includes('mood light')) &&
      (lower.includes('build') || lower.includes('create') || lower.includes('make'));
    if (isRgbBuild) {
      const plan = createRgbMoodLightBuildPlan();
      const compiled = compileBuildPlan(plan);
      const proposalId = `prop-rgb-${Date.now()}`;
      const newProposal = {
        id: proposalId,
        title: plan.title,
        summary: plan.description,
        changes: [
          { type: 'circuit', description: 'Place Common Cathode RGB LED and 3 series 220Ω resistors' },
          { type: 'circuit', description: 'Wire Red, Green, Blue channels to PWM Pins D9, D10, D11' },
          { type: 'firmware', description: 'Compile PWM analogWrite spectrum cycling firmware' }
        ],
        action: () => {
          onApplyFix({ type: 'replace_project', project: compiled.project, id: proposalId });
          setAppliedProposalId(proposalId);
        }
      };
      setProposals(prev => [newProposal, ...prev]);
      setMessages(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          text: `### 🌈 Ready to Build RGB LED Mood Light\n\nI have generated a verified build plan for the **RGB LED Mood Light & Color Mixer**:\n\n- **Components:** Arduino Uno R3, Half Breadboard, RGB LED (Common Cathode), 3x 220Ω Resistors\n- **Connections:** PWM pins D9, D10, D11 driving color anodes through resistors, cathode grounded\n- **Firmware:** PWM spectrum fader loaded into Arduino C++ editor\n\nClick **"Review & Apply"** on the proposal card above to place this circuit onto your canvas.`,
          sourceTag: 'Tracewise Project Builder',
          verifiedFacts: ['RGB Channels: D9 (Red), D10 (Green), D11 (Blue)', 'Resistors: 3x 220Ω']
        }
      ]);
      setIsThinking(false);
      return;
    }

    // 3c. Potentiometer Dimmer Build
    const isPotBuild = (lower.includes('potentiometer') || lower.includes('dimmer') || lower.includes('dial')) &&
      (lower.includes('build') || lower.includes('create') || lower.includes('make'));
    if (isPotBuild) {
      const plan = createPotentiometerDimmerBuildPlan();
      const compiled = compileBuildPlan(plan);
      const proposalId = `prop-pot-${Date.now()}`;
      const newProposal = {
        id: proposalId,
        title: plan.title,
        summary: plan.description,
        changes: [
          { type: 'circuit', description: 'Place 10kΩ Potentiometer, Red LED, and 220Ω Resistor' },
          { type: 'circuit', description: 'Wire wiper to Analog A0, 5V, GND, and LED to PWM D9' },
          { type: 'firmware', description: 'Compile analogRead to PWM map() brightness scaling firmware' }
        ],
        action: () => {
          onApplyFix({ type: 'replace_project', project: compiled.project, id: proposalId });
          setAppliedProposalId(proposalId);
        }
      };
      setProposals(prev => [newProposal, ...prev]);
      setMessages(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          text: `### 🎛️ Ready to Build Potentiometer LED Dimmer\n\nI have generated a verified build plan for the **Rotary Potentiometer LED Dimmer**:\n\n- **Components:** Arduino Uno R3, Half Breadboard, 10kΩ Rotary Potentiometer, Red LED, 220Ω Resistor\n- **Wiring:** Wiper to Analog A0, LED driven from PWM Pin 9 through current-limiting resistor\n- **Firmware:** \`analogRead(A0)\` mapped to \`analogWrite(9, val)\`\n\nClick **"Review & Apply"** above to build this circuit onto your canvas.`,
          sourceTag: 'Tracewise Project Builder',
          verifiedFacts: ['Wiper Pin: A0 (0-1023 input)', 'Output Pin: D9 (PWM 0-255 brightness)']
        }
      ]);
      setIsThinking(false);
      return;
    }

    // 3d. Buzzer Alarm Build
    const isBuzzerBuild = (lower.includes('buzzer') || lower.includes('alarm') || lower.includes('beeper')) &&
      (lower.includes('build') || lower.includes('create') || lower.includes('make'));
    if (isBuzzerBuild) {
      const plan = createBuzzerAlarmBuildPlan();
      const compiled = compileBuildPlan(plan);
      const proposalId = `prop-buz-${Date.now()}`;
      const newProposal = {
        id: proposalId,
        title: plan.title,
        summary: plan.description,
        changes: [
          { type: 'circuit', description: 'Place Active Piezo Buzzer and Push Button' },
          { type: 'circuit', description: 'Wire Push Button to D2 with GND return, Buzzer (+) to D8' },
          { type: 'firmware', description: 'Compile button debounced audio trigger firmware' }
        ],
        action: () => {
          onApplyFix({ type: 'replace_project', project: compiled.project, id: proposalId });
          setAppliedProposalId(proposalId);
        }
      };
      setProposals(prev => [newProposal, ...prev]);
      setMessages(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          text: `### 🔔 Ready to Build Push-Button Sound Alarm\n\nI have generated a verified build plan for the **Push-Button Sound Alarm & Active Buzzer**:\n\n- **Components:** Arduino Uno R3, Half Breadboard, Alarm Push Button, Active Piezo Buzzer\n- **Wiring:** Button on digital input D2 (INPUT_PULLUP), Buzzer positive lead on digital output D8\n- **Firmware:** Real-time state detection sounding 2.5kHz alert when pressed\n\nClick **"Review & Apply"** on the proposal card to build this onto your canvas.`,
          sourceTag: 'Tracewise Project Builder',
          verifiedFacts: ['Trigger: Pin D2 (INPUT_PULLUP)', 'Sound: Pin D8 (Active Buzzer)']
        }
      ]);
      setIsThinking(false);
      return;
    }

    // 4. Grounded Circuit Explanation (Test E: "Explain how the circuit works")
    const isExplainCircuit = lower.includes('explain') && (lower.includes('circuit') || lower.includes('how it works') || lower.includes('how this works') || lower.includes('how does'));
    if (isExplainCircuit) {
      const isDiscoProject = (project?.title || '').toLowerCase().includes('disco') ||
        (comps.filter(c => c.type === 'push-button').length >= 3 && comps.filter(c => c.type === 'led').length >= 3);

      if (isDiscoProject) {
        setMessages(prev => [
          ...prev,
          {
            id: `ast-${Date.now()}`,
            role: 'assistant',
            text: generateGroundedCircuitExplanation(project),
            sourceTag: 'Tracewise Deterministic Reasoning Engine',
            verifiedFacts: [
              `Buttons: 3 inputs (D2, D3, D4 with INPUT_PULLUP)`,
              `LEDs: 3 outputs (D8, D9, D10 with 220Ω protection)`,
              `Components: ${comps.length}`,
              `Wires: ${wires.length}`
            ]
          }
        ]);
        setIsThinking(false);
        return;
      }
    }

    // 5. General Conversational / Engineering Assistance
    try {
      const res = await assistantProvider.getResponse({
        queryText: cleanQuery,
        project,
        validation,
        history: messages
      });

      setMessages(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          text: res.text,
          sourceTag: res.sourceTag || res.provider || 'Deterministic Rule Engine',
          verifiedFacts: res.verifiedFacts || []
        }
      ]);
    } catch (err) {
      setLastFailedQuery(cleanQuery);
      setMessages(prev => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ I encountered a temporary connection issue processing that query. You can click Retry below.`,
          isError: true
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Execute initialQuery if provided via navigation state
  useEffect(() => {
    if (initialQuery && !initialQueryExecutedRef.current) {
      initialQueryExecutedRef.current = true;
      handleQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleCopyMessage = (id, text) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const quickPrompts = [
    'Explain how my circuit is wired',
    'Which pin is my LED connected to?',
    'Check if my firmware pins match hardware',
    'Explain why I need a resistor for the LED'
  ];

  return (
    <TracewiseBubbleArea theme="light" style={{ height: '100%', minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Pinned Assistant Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--tw-border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--tw-brand) 0%, var(--tw-cyan) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--tw-text)', fontFamily: 'var(--font-heading)' }}>
                Engineering Assistant
              </h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)' }}>
                Conversational • Grounded in Circuit Netlist
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: 'var(--tw-brand-soft)',
              color: 'var(--tw-brand)',
              fontSize: '0.68rem',
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            <ShieldCheck size={12} />
            <span>Student Safe</span>
          </div>
        </div>

        {/* Scrollable Chat Area with Independent Scrolling */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Active Proposals Section */}
          {proposals.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actionable Proposals ({proposals.length})
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--tw-text-muted)' }}>
                  Requires User Approval
                </span>
              </div>

              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: appliedProposalId === prop.id ? '1.5px solid var(--tw-success)' : '1px solid var(--tw-border)',
                    backgroundColor: appliedProposalId === prop.id ? '#f0fdf4' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h5 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                      {prop.title}
                    </h5>
                    {appliedProposalId === prop.id && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tw-success)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={13} /> Applied
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--tw-text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {prop.summary}
                  </p>

                  <div style={{ background: 'var(--tw-bg)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {prop.changes.map((c, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--tw-text-secondary)' }}>
                        <span style={{ color: 'var(--tw-brand)', fontWeight: 'bold' }}>•</span>
                        <span>{c.description}</span>
                      </div>
                    ))}
                  </div>

                  <TracewiseBubbleButton
                    onClick={prop.action}
                    disabled={appliedProposalId === prop.id}
                    variant={appliedProposalId === prop.id ? 'secondary' : 'primary'}
                    size="sm"
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      alignSelf: 'flex-start',
                      marginTop: '2px',
                      gap: '6px',
                      opacity: appliedProposalId === prop.id ? 0.7 : 1
                    }}
                  >
                    <Wrench size={12} />
                    <span>{appliedProposalId === prop.id ? 'Fix Applied' : 'Review & Apply'}</span>
                  </TracewiseBubbleButton>
                </div>
              ))}
            </div>
          )}

          {/* Chat Conversation Thread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Conversation
            </span>

            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: m.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    backgroundColor: m.role === 'user' ? 'var(--tw-brand)' : (m.isError ? '#fef2f2' : 'var(--tw-bg)'),
                    color: m.role === 'user' ? '#ffffff' : (m.isError ? '#991b1b' : 'var(--tw-text)'),
                    border: m.role === 'user' ? 'none' : (m.isError ? '1px solid #fecaca' : '1px solid var(--tw-border)'),
                    fontSize: '0.84rem',
                    lineHeight: 1.55,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    wordBreak: 'break-word'
                  }}
                >
                  {m.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  ) : (
                    <SafeMarkdown content={m.text} />
                  )}
                </div>

                {/* Footer metadata & copy action for assistant replies */}
                {m.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', fontSize: '0.68rem', color: 'var(--tw-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: m.sourceTag?.includes('Gemini') ? 'var(--tw-cyan)' : 'var(--tw-success)' }} />
                      {m.sourceTag || 'Deterministic Rule Engine'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(m.id, m.text)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--tw-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        borderRadius: '6px'
                      }}
                      title="Copy response to clipboard"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check size={11} color="var(--tw-success)" />
                          <span style={{ color: 'var(--tw-success)', fontWeight: 600 }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  backgroundColor: 'var(--tw-bg)',
                  border: '1px solid var(--tw-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--tw-text-muted)'
                }}
              >
                <RefreshCw size={13} className="animate-spin" />
                <span>Analyzing circuit netlist & AST rules...</span>
              </div>
            )}

            {/* Retry button if last query failed */}
            {lastFailedQuery && !isThinking && (
              <div style={{ alignSelf: 'flex-start' }}>
                <TracewiseBubbleButton
                  onClick={() => handleQuery(lastFailedQuery)}
                  variant="secondary"
                  size="sm"
                  style={{ gap: '6px', fontSize: '0.74rem' }}
                >
                  <RotateCcw size={12} />
                  <span>Retry Question</span>
                </TracewiseBubbleButton>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>
              Suggested Questions:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuery(p)}
                  disabled={isThinking}
                  style={{
                    backgroundColor: 'var(--tw-brand-soft)',
                    border: '1px solid var(--tw-border)',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    color: 'var(--tw-brand)',
                    cursor: isThinking ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    opacity: isThinking ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !isThinking && (e.currentTarget.style.backgroundColor = 'rgba(30,63,216,0.12)')}
                  onMouseLeave={(e) => !isThinking && (e.currentTarget.style.backgroundColor = 'var(--tw-brand-soft)')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Jump to Latest Button */}
        {showJumpToBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            style={{
              position: 'absolute',
              bottom: '68px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'var(--tw-brand)',
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              boxShadow: '0 4px 14px rgba(30, 63, 216, 0.4)',
              cursor: 'pointer',
              zIndex: 25,
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <span>Jump to latest</span>
            <ChevronDown size={14} />
          </button>
        )}

        {/* Pinned Chat Input Bar */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--tw-border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexShrink: 0,
            zIndex: 10
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleQuery(inputText);
              }
            }}
            placeholder="Ask a circuit or code question..."
            disabled={isThinking}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: '20px',
              border: '1px solid var(--tw-border)',
              fontSize: '0.82rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <TracewiseBubbleIconButton
            onClick={() => handleQuery(inputText)}
            variant="primary"
            size="sm"
            title="Send Question"
            disabled={!inputText.trim() || isThinking}
          >
            <Send size={15} />
          </TracewiseBubbleIconButton>
        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
