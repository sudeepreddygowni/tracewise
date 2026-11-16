import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedContent from '../animations/AnimatedContent';
import { TracewiseProjectGallery } from '../components/landing/TracewiseProjectGallery';
import GradientASCII from '../components/gradient-ascii/GradientASCII';
import {
  TracewiseBubbleArea,
  TracewiseBubbleButton,
  TracewiseBubbleIconButton
} from '../components/ui/BubbleActions';
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  GitCompare,
  Wrench,
  Cpu,
  Layers,
  Code,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  ShieldCheck,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { STARTER_PROJECTS } from '../data/starterProjects';
import { useProject } from '../store/useProjectStore';

export function HomePage() {
  const navigate = useNavigate();
  const { loadProject, createNewProject } = useProject();
  const [promptText, setPromptText] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const handlePromptSubmit = (e) => {
    e?.preventDefault();
    const clean = promptText.trim();
    if (!clean) {
      const defaultStarter = STARTER_PROJECTS[0];
      loadProject(defaultStarter.id);
      navigate(`/app/studio/${defaultStarter.id}`);
      return;
    }

    const lower = clean.toLowerCase();

    // 1. Question Intent (contains question words or '?')
    const isQuestion = /^(why|how|what|is|are|can|does|do|explain|check|help|troubleshoot)\b/i.test(clean) || clean.includes('?');
    if (isQuestion) {
      let targetStarter = STARTER_PROJECTS[0];
      if (lower.includes('button') || lower.includes('press') || lower.includes('switch')) {
        targetStarter = STARTER_PROJECTS.find(s => s.id === 'starter-button-led') || targetStarter;
      } else if (lower.includes('analog') || lower.includes('potentiometer') || lower.includes('dim')) {
        targetStarter = STARTER_PROJECTS.find(s => s.id === 'starter-analog-dimmer') || targetStarter;
      } else if (lower.includes('bug') || lower.includes('mismatch') || lower.includes('conflict')) {
        targetStarter = STARTER_PROJECTS.find(s => s.id === 'starter-traffic-light-buggy') || targetStarter;
      }

      loadProject(targetStarter.id);
      navigate(`/app/studio/${targetStarter.id}`, {
        state: { initialQuery: clean, openAssistant: true }
      });
      return;
    }

    // 2. Starter Keyword Intent
    if (lower.includes('pedestrian') || lower.includes('bug') || lower.includes('conflict')) {
      const s = STARTER_PROJECTS.find(p => p.id === 'starter-traffic-light-buggy') || STARTER_PROJECTS[0];
      loadProject(s.id);
      navigate(`/app/studio/${s.id}`);
      return;
    }
    if (lower.includes('traffic') || lower.includes('signal') || lower.includes('intersection')) {
      const s = STARTER_PROJECTS.find(p => p.id === 'starter-traffic-light') || STARTER_PROJECTS[0];
      loadProject(s.id);
      navigate(`/app/studio/${s.id}`);
      return;
    }
    if (lower.includes('button') || lower.includes('switch') || lower.includes('input')) {
      const s = STARTER_PROJECTS.find(p => p.id === 'starter-button-led') || STARTER_PROJECTS[0];
      loadProject(s.id);
      navigate(`/app/studio/${s.id}`);
      return;
    }
    if (lower.includes('dimmer') || lower.includes('analog') || lower.includes('potentiometer') || lower.includes('pwm')) {
      const s = STARTER_PROJECTS.find(p => p.id === 'starter-analog-dimmer') || STARTER_PROJECTS[0];
      loadProject(s.id);
      navigate(`/app/studio/${s.id}`);
      return;
    }
    if (lower.includes('blink') || lower.includes('simple led')) {
      const s = STARTER_PROJECTS.find(p => p.id === 'starter-led-blink') || STARTER_PROJECTS[0];
      loadProject(s.id);
      navigate(`/app/studio/${s.id}`);
      return;
    }

    // 3. Project Idea / Planning Intent
    let targetStarter = STARTER_PROJECTS[0];
    if (lower.includes('sensor') || lower.includes('measure') || lower.includes('monitor') || lower.includes('water') || lower.includes('plant')) {
      targetStarter = STARTER_PROJECTS.find(s => s.id === 'starter-analog-dimmer') || targetStarter;
    }
    loadProject(targetStarter.id);
    navigate(`/app/studio/${targetStarter.id}`, {
      state: {
        initialQuery: `I want to design: "${clean}". What components, pin connections, and safety precautions do you recommend?`,
        openAssistant: true
      }
    });
  };

  const handleQuickPrompt = (title) => {
    const lower = title.toLowerCase();
    let starter = STARTER_PROJECTS[0];
    if (lower.includes('pedestrian') || lower.includes('bug')) {
      starter = STARTER_PROJECTS.find(s => s.id === 'starter-traffic-light-buggy') || starter;
    } else if (lower.includes('button')) {
      starter = STARTER_PROJECTS.find(s => s.id === 'starter-button-led') || starter;
    } else if (lower.includes('dimmer') || lower.includes('analog')) {
      starter = STARTER_PROJECTS.find(s => s.id === 'starter-analog-dimmer') || starter;
    } else if (lower.includes('blink')) {
      starter = STARTER_PROJECTS.find(s => s.id === 'starter-led-blink') || starter;
    } else {
      starter = STARTER_PROJECTS.find(s => s.title.toLowerCase().includes(lower)) || starter;
    }
    loadProject(starter.id);
    navigate(`/app/studio/${starter.id}`);
  };

  const faqs = [
    {
      q: 'Does passing a virtual check guarantee my physical circuit will work?',
      a: 'No. Tracewise checks for structural correctness—verifying pin assignments, component compatibility, and matching code definitions. Real-world breadboards, loose jumper wires, and component tolerances still need your careful physical inspection. We provide the build guide to help you verify each step.'
    },
    {
      q: 'Do I need physical Arduino hardware to use Tracewise?',
      a: 'No physical hardware is needed to get started. You can design circuits, wire pins, and write Arduino code directly in the browser. When you are ready to build the circuit in real life, our build guide gives you a component checklist and connection guide.'
    },
    {
      q: 'How is Tracewise different from generic AI chatbots?',
      a: 'Chatbots output text that frequently invents pinouts or gives ungrounded advice. Tracewise is a visual engineering studio with an exact circuit graph, deterministic structural checks, and line-by-line version diffing. You see what is connected and what changed.'
    },
    {
      q: 'What is the advantage of comparing project versions?',
      a: 'When an electronics project stops working after a modification, finding the root cause is usually frustrating. Tracewise keeps your baseline intact and shows you exactly what changed between forks—highlighting modified pins, missing resistors, or conflicting code lines.'
    },
    {
      q: 'Is Tracewise safe and suitable for beginners?',
      a: 'Yes. Tracewise focuses on low-voltage (5V USB-powered) educational electronics such as LEDs, resistors, buttons, and sensors. Projects are private by default with no public social messaging.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* =========================================================================
          SECTION 1: HERO WITH REACT BITS GRADIENTASCII FULL-BLEED BACKGROUND
      ========================================================================= */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingTop: '130px',
          paddingBottom: '140px',
          background: 'radial-gradient(ellipse 100% 75% at 50% 30%, #17387e 0%, #0d2656 45%, #071831 82%, #0a1f40 100%)',
          overflow: 'hidden'
        }}
      >
        {/* Luminous Ambient Radial Glow behind the WebGL Canvas */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '12%',
            width: '76%',
            height: '68%',
            background: 'radial-gradient(ellipse at center, rgba(30, 63, 216, 0.42) 0%, rgba(45, 197, 233, 0.2) 45%, transparent 75%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
          aria-hidden="true"
        />

        {/* Full-Bleed Animated React Bits GradientASCII Canvas */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            zIndex: 1,
            pointerEvents: 'auto'
          }}
          aria-hidden="true"
        >
          <GradientASCII
            colors={['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']}
            shape="horizon"
            characters=" =+xX0S8#@"
            cellSize={18}
            density={0.8}
            glow={0.35}
            gradientOpacity={1.0}
            glyphOpacity={0.92}
            softness={0.4}
          />
        </div>

        {/* Localized Subtle Readability Backing (Preserves white typography without darkening the ASCII wave) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(ellipse 75% 60% at 50% 45%, rgba(7, 24, 49, 0.32) 0%, rgba(7, 24, 49, 0.1) 50%, transparent 80%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
          aria-hidden="true"
        />

        <div className="container-tw" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ maxWidth: '960px', width: '100%', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Tag Pill */}
            <AnimatedContent trigger="mount" distance={25} duration={0.6}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.28)',
                  padding: '7px 18px',
                  borderRadius: 'var(--tw-radius-pill)',
                  backdropFilter: 'blur(16px)',
                  marginBottom: '22px',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)'
                }}
              >
                <Cpu size={15} color="#2DC5E9" />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  Student Electronics & Circuit Engineering
                </span>
              </div>
            </AnimatedContent>

            {/* Main Headline */}
            <AnimatedContent trigger="mount" distance={35} delay={0.1} duration={0.8}>
              <h1
                style={{
                  fontSize: 'clamp(2.9rem, 5.6vw, 4.8rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.045em',
                  lineHeight: 1.08,
                  maxWidth: '920px',
                  margin: '0 auto',
                  textAlign: 'center',
                  textShadow: '0 4px 30px rgba(7, 24, 49, 0.7)'
                }}
              >
                Make the circuit.
                <br />
                Understand every change.
              </h1>
            </AnimatedContent>

            {/* Supporting Copy */}
            <AnimatedContent trigger="mount" distance={30} delay={0.2} duration={0.8}>
              <p
                style={{
                  fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
                  color: '#e2e8f0',
                  marginTop: '20px',
                  maxWidth: '720px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  textShadow: '0 2px 14px rgba(7, 24, 49, 0.8)'
                }}
              >
                Start with a working project, experiment with its code and connections, and understand how every change affects your design. Tracewise brings building, debugging, and learning into one workspace.
              </p>
            </AnimatedContent>

            {/* Interactive Project Composer Bar with Bubble UI */}
            <AnimatedContent trigger="mount" distance={30} delay={0.3} duration={0.8} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <TracewiseBubbleArea theme="light" style={{ width: '100%', maxWidth: '760px', marginTop: '32px' }}>
                <div
                  className="glass-card"
                  style={{
                    padding: '14px 18px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 48px rgba(7, 24, 49, 0.45)'
                  }}
                >
                  <form
                    onSubmit={handlePromptSubmit}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                  >
                    <Sparkles size={20} color="var(--tw-brand)" style={{ flexShrink: 0, marginLeft: '4px' }} />
                    <input
                      type="text"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="What would you like to build or change?"
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: '1rem',
                        color: 'var(--tw-text)',
                        background: 'transparent'
                      }}
                    />
                    <TracewiseBubbleButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      style={{ padding: '8px 20px', flexShrink: 0 }}
                    >
                      <span>Start</span>
                      <ArrowRight size={14} />
                    </TracewiseBubbleButton>
                  </form>

                  {/* Quick suggestions tags centered */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--tw-border)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>Try starters:</span>
                    <TracewiseBubbleButton
                      onClick={() => handleQuickPrompt('traffic light')}
                      size="sm"
                      variant="ghost"
                      style={{ fontSize: '0.76rem', padding: '4px 11px', minHeight: '1.75rem' }}
                    >
                      Traffic Light Demo
                    </TracewiseBubbleButton>
                    <TracewiseBubbleButton
                      onClick={() => handleQuickPrompt('pedestrian')}
                      size="sm"
                      variant="ghost"
                      style={{ fontSize: '0.76rem', padding: '4px 11px', minHeight: '1.75rem' }}
                    >
                      Pedestrian Bug Demo
                    </TracewiseBubbleButton>
                    <TracewiseBubbleButton
                      onClick={() => handleQuickPrompt('blink')}
                      size="sm"
                      variant="ghost"
                      style={{ fontSize: '0.76rem', padding: '4px 11px', minHeight: '1.75rem' }}
                    >
                      Heartbeat Blink
                    </TracewiseBubbleButton>
                  </div>
                </div>
              </TracewiseBubbleArea>
            </AnimatedContent>

            {/* Action Buttons Cluster with Bubble UI */}
            <AnimatedContent trigger="mount" distance={25} delay={0.4} duration={0.8}>
              <TracewiseBubbleArea theme="light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
                <TracewiseBubbleButton
                  to="/app/studio/starter-traffic-light"
                  variant="primary"
                  size="lg"
                >
                  <span>Try the Traffic Light Demo</span>
                  <ArrowRight size={16} />
                </TracewiseBubbleButton>

                <TracewiseBubbleButton
                  to="/projects"
                  variant="secondary"
                  size="lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.22)',
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.45)'
                  }}
                >
                  <Play size={16} />
                  <span>Explore Projects</span>
                </TracewiseBubbleButton>
              </TracewiseBubbleArea>
            </AnimatedContent>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: PROJECT CREATION & STUDIO ARCHITECTURE
          Heading: "Start with an idea. Or something that already works."
      ========================================================================= */}
      <section
        style={{
          position: 'relative',
          paddingTop: '80px',
          paddingBottom: '130px',
          background: 'linear-gradient(180deg, #071831 0%, #0d274e 10%, #1a4175 22%, #316298 34%, #6ba1d6 45%, #c8e2fb 54%, #edf6ff 62%, #e5f1fc 70%, #bcdcf7 78%, #78aedc 86%, #3a75ad 92%, #144075 97%, #071831 100%)'
        }}
        id="workspace"
      >
        <div className="container-tw">
          <AnimatedContent trigger="scroll" distance={35} duration={0.8}>
            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--tw-cyan)',
                  background: 'rgba(45, 197, 233, 0.14)',
                  border: '1px solid rgba(45, 197, 233, 0.3)',
                  padding: '4px 14px',
                  borderRadius: '16px',
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '10px'
                }}
              >
                How You Begin
              </span>
              <h2
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginTop: '6px',
                  textShadow: '0 2px 14px rgba(7, 24, 49, 0.4)'
                }}
              >
                Start with an idea. Or something that already works.
              </h2>
              <p
                style={{
                  fontSize: '1.02rem',
                  color: '#e2e8f0',
                  marginTop: '8px',
                  lineHeight: 1.6,
                  textShadow: '0 1px 8px rgba(7, 24, 49, 0.3)'
                }}
              >
                Begin with verified circuits you can test right away, or build your own from scratch. Tracewise guides you through component choices and pin connections.
              </p>
            </div>
          </AnimatedContent>

          <TracewiseBubbleArea theme="light">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Path 1: Starter Circuits */}
              <div className="glass-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '24px' }}>
                <div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--tw-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tw-brand)', marginBottom: '16px' }}>
                    <Layers size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
                    1. Remix a Working Starter
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', lineHeight: 1.55 }}>
                    The easiest way to learn. Open a tested project like our traffic light or analog dimmer, make small changes to the wiring or timing, and see the results immediately.
                  </p>
                </div>
                <TracewiseBubbleButton
                  to="/projects"
                  variant="primary"
                  size="sm"
                  style={{ marginTop: '24px', alignSelf: 'flex-start' }}
                >
                  <span>Explore Starters</span>
                  <ArrowRight size={14} />
                </TracewiseBubbleButton>
              </div>

              {/* Path 2: Blank Canvas */}
              <div className="glass-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '24px' }}>
                <div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tw-success)', marginBottom: '16px' }}>
                    <Cpu size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
                    2. Build Manually from Scratch
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', lineHeight: 1.55 }}>
                    Place an Arduino Uno and breadboard on the canvas. Add LEDs, resistors, and buttons, draw jumper wires between valid pins, and write your own Arduino C++ firmware.
                  </p>
                </div>
                <TracewiseBubbleButton
                  onClick={() => {
                    const blank = createNewProject('Custom Circuit');
                    navigate(`/app/studio/${blank.id}`);
                  }}
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: '24px', alignSelf: 'flex-start' }}
                >
                  <span>Open Blank Studio</span>
                  <ArrowRight size={14} />
                </TracewiseBubbleButton>
              </div>

              {/* Path 3: Assisted Idea */}
              <div className="glass-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '24px' }}>
                <div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tw-sky)', marginBottom: '16px' }}>
                    <Sparkles size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
                    3. Assisted Project Setup
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', lineHeight: 1.55 }}>
                    Describe what you want to create in plain English. Tracewise configures the initial board components and template code so you can focus on modifying the logic.
                  </p>
                </div>
                <TracewiseBubbleButton
                  to="/app/studio/starter-traffic-light"
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: '24px', alignSelf: 'flex-start' }}
                >
                  <span>Describe an Idea</span>
                  <ArrowRight size={14} />
                </TracewiseBubbleButton>
              </div>
            </div>
          </TracewiseBubbleArea>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: REMIX & DEBUGGING
          Heading: "Something stopped working? See what changed."
      ========================================================================= */}
      <section
        style={{
          position: 'relative',
          padding: '80px 0 90px',
          background: 'linear-gradient(180deg, #071831 0%, #0B2348 50%, #071831 100%)',
          color: '#ffffff'
        }}
        id="how-it-works"
      >
        <div className="container-tw">
          <AnimatedContent trigger="scroll" distance={35} duration={0.8}>
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 52px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Change-Aware Debugging
              </span>
              <h2 style={{ fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)', fontWeight: 700, marginTop: '8px', letterSpacing: '-0.04em' }}>
                Something stopped working? See what changed.
              </h2>
              <p style={{ fontSize: '1.05rem', color: '#cbd5e1', marginTop: '12px', lineHeight: 1.6 }}>
                Every beginner faces the moment where a working circuit breaks after a quick modification. Tracewise preserves your baseline and highlights exactly which wire, component, or code line caused the issue.
              </p>
            </div>
          </AnimatedContent>

          {/* Interactive Comparison Preview Card with Bubble UI */}
          <TracewiseBubbleArea theme="dark">
            <div
              className="glass-dark"
              style={{
                padding: '36px',
                borderRadius: '24px',
                border: '1px solid rgba(74, 167, 242, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
            >
              {/* Header comparison row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(74, 167, 242, 0.15)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', fontSize: '0.82rem', fontWeight: 600 }}>
                    Baseline: Traffic Light Controller (v1.0)
                  </span>
                  <span style={{ color: 'var(--tw-cyan)' }}>→</span>
                  <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(45, 197, 233, 0.2)', color: '#2dc5e9', fontSize: '0.82rem', fontWeight: 600 }}>
                    Fork: Pedestrian Button Remix (v1.1)
                  </span>
                </div>

                <TracewiseBubbleButton
                  to="/app/compare/starter-traffic-light-buggy"
                  variant="primary"
                  size="sm"
                >
                  <span>Open Comparison Diff</span>
                  <ArrowUpRight size={15} />
                </TracewiseBubbleButton>
              </div>

              {/* Split Diffs View */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Left: Circuit Delta */}
                <div style={{ background: '#0b2348', padding: '20px', borderRadius: '16px', border: '1px solid rgba(74, 167, 242, 0.2)' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--tw-cyan)', marginBottom: '12px' }}>
                    Circuit Graph Differences
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                    <div style={{ padding: '6px 10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '6px' }}>
                      + Added: <b>Pedestrian Push Button</b>
                    </div>
                    <div style={{ padding: '6px 10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '6px' }}>
                      + Added: <b>Jumper Wire from Uno Pin D7 to Button Pin 1a</b>
                    </div>
                    <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderRadius: '6px' }}>
                      • Preserved: Red LED (D2), Yellow (D3), Green (D4)
                    </div>
                  </div>
                </div>

                {/* Right: Detected Regression */}
                <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', marginBottom: '8px' }}>
                    <AlertTriangle size={18} />
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                      Detected Pin Conflict in Code
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#fecaca', lineHeight: 1.5 }}>
                    Line 8 declares <code style={{ background: '#071831', padding: '2px 4px', borderRadius: '4px' }}>BUTTON_PIN = 2</code>, but the wire is plugged into <b>Pin D7</b>. Pin D2 is already driving the Red LED.
                  </p>
                  <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#ffffff' }}>
                    <b>Fix:</b> Change line 8 to <code style={{ color: '#4ade80' }}>BUTTON_PIN = 7</code>.
                  </div>
                </div>
              </div>
            </div>
          </TracewiseBubbleArea>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: PROJECT SHOWCASE WITH REACTDROPS FAN GALLERY
          Heading: "Good projects are meant to be explored."
      ========================================================================= */}
      <section
        style={{
          position: 'relative',
          paddingTop: '60px',
          paddingBottom: '120px',
          background: 'linear-gradient(180deg, #071831 0%, #0B2348 45%, #0E2A58 75%, #071831 100%)',
          overflow: 'hidden'
        }}
        id="projects"
      >
        <div className="container-tw">
          <AnimatedContent trigger="scroll" distance={35} duration={0.8}>
            <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 36px' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--tw-cyan)',
                  background: 'rgba(11, 35, 72, 0.75)',
                  border: '1px solid rgba(45, 197, 233, 0.25)',
                  padding: '5px 16px',
                  borderRadius: '16px',
                  display: 'inline-block',
                  marginBottom: '10px'
                }}
              >
                Project Showcase
              </span>
              <h2
                style={{
                  fontSize: 'clamp(2.4rem, 4vw, 3.4rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  textShadow: '0 4px 16px rgba(7, 24, 49, 0.4)'
                }}
              >
                Good projects are meant to be explored.
              </h2>
              <p style={{ fontSize: '1.05rem', color: '#cbd5e1', marginTop: '6px' }}>
                Open any starter circuit, test its logic, and make an independent remix without altering the original baseline.
              </p>
            </div>
          </AnimatedContent>

          {/* Official Fan Gallery Component */}
          <TracewiseProjectGallery />
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: PHYSICAL BUILDING
          Heading: "From your screen to your breadboard."
      ========================================================================= */}
      <section
        style={{
          padding: '80px 0 100px',
          background: 'linear-gradient(180deg, #071831 0%, #0d274e 16%, #173d6f 34%, #2e5f94 52%, #588ec5 70%, #9fc9f0 84%, #dbeeff 94%, #F5F9FD 100%)',
          color: '#ffffff',
          position: 'relative'
        }}
      >
        <div className="container-tw">
          <AnimatedContent trigger="scroll" distance={35} duration={0.8}>
            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Physical Construction
              </span>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 700, marginTop: '8px' }}>
                From your screen to your breadboard.
              </h2>
              <p style={{ fontSize: '1.02rem', color: '#cbd5e1', marginTop: '10px', lineHeight: 1.6 }}>
                Virtual validation helps you verify wire mappings and avoid common pin conflicts before plugging components into a real breadboard.
              </p>
            </div>
          </AnimatedContent>

          {/* Technical Hardware Diagnostic & Pin Mapping Visual Card (Single WebGL canvas preserved for Hero) */}
          <div
            style={{
              width: '100%',
              minHeight: '180px',
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(11, 35, 72, 0.7) 0%, rgba(7, 24, 49, 0.95) 100%)',
              border: '1px solid rgba(74, 167, 242, 0.25)',
              marginBottom: '32px',
              padding: '28px 32px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px'
            }}
          >
            <div style={{ maxWidth: '520px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
                Deterministic Static Rule Checks
              </span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 700, marginTop: '6px', color: '#ffffff' }}>
                Structural checks you can rely on.
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                Every pin definition in your Arduino C++ code is parsed against your canvas wiring. We check power rails, current limiting, and pin collisions before you plug in physical hardware.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                background: 'rgba(7, 24, 49, 0.85)',
                padding: '16px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(74, 167, 242, 0.2)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                  <span style={{ opacity: 0.6 }}>MCU</span> PIN_13 (D13) ──→ LED_ANODE
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
                  <span style={{ opacity: 0.6 }}>RES</span> 220Ω (R1) ──→ LED_CATHODE
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                  <span style={{ opacity: 0.6 }}>PWR</span> ARDUINO_GND ──→ R1_PIN2
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FREQUENTLY ASKED QUESTIONS
      ========================================================================= */}
      <section
        style={{
          padding: '80px 0 110px',
          background: 'linear-gradient(180deg, #F5F9FD 0%, #F5F9FD 48%, #edf6ff 62%, #cbe4fa 74%, #84b8e3 84%, #427cb6 92%, #154278 97%, #071831 100%)',
          position: 'relative'
        }}
        id="faq"
      >
        <div className="container-tw" style={{ maxWidth: '840px' }}>
          <AnimatedContent trigger="scroll" distance={30} duration={0.8}>
            <div style={{ textAlign: 'center', marginBottom: '44px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Clear Answers
              </span>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--tw-text)', marginTop: '4px' }}>
                Frequently Asked Questions
              </h2>
            </div>
          </AnimatedContent>

          <TracewiseBubbleArea theme="light" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;

              return (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px'
                  }}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                      {faq.q}
                    </h3>
                    <TracewiseBubbleIconButton
                      size="sm"
                      variant="ghost"
                      style={{ pointerEvents: 'none' }}
                      aria-label="Toggle answer"
                    >
                      <ChevronDown
                        size={16}
                        color="var(--tw-text-muted)"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      />
                    </TracewiseBubbleIconButton>
                  </div>

                  {isOpen && (
                    <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', marginTop: '12px', lineHeight: 1.6 }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </TracewiseBubbleArea>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CLOSING CALL TO ACTION
          Heading: "Ready to try your first circuit?"
      ========================================================================= */}
      <section
        style={{
          padding: '90px 0 110px',
          background: 'linear-gradient(180deg, #071831 0%, #0B2348 45%, #071831 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="container-tw" style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <AnimatedContent trigger="scroll" distance={35} duration={0.8}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Get Started in Seconds
            </span>
            <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 700, marginTop: '8px', letterSpacing: '-0.04em' }}>
              Ready to try your first circuit?
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', maxWidth: '580px', margin: '14px auto 32px', lineHeight: 1.6 }}>
              Open a starter project, make a change, and see what you can learn from it.
            </p>

            <TracewiseBubbleArea theme="dark" style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <TracewiseBubbleButton
                to="/app/studio/starter-traffic-light"
                variant="primary"
                size="lg"
              >
                <span>Open Tracewise Studio</span>
                <ArrowRight size={16} />
              </TracewiseBubbleButton>

              <TracewiseBubbleButton
                to="/projects"
                variant="secondary"
                size="lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }}
              >
                <span>Browse Starter Circuits</span>
              </TracewiseBubbleButton>
            </TracewiseBubbleArea>
          </AnimatedContent>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: FOOTER
      ========================================================================= */}
      <footer style={{ backgroundColor: '#071831', borderTop: '1px solid rgba(74, 167, 242, 0.15)', padding: '50px 0 30px', color: '#94a3b8' }}>
        <div className="container-tw" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/assets/brand/tracewise-logo.png" alt="Tracewise" style={{ height: '28px' }} />
            </div>

            <div style={{ display: 'flex', gap: '24px', fontSize: '0.88rem', fontWeight: 500 }}>
              <Link to="/app" style={{ color: '#cbd5e1' }}>Studio</Link>
              <Link to="/projects" style={{ color: '#cbd5e1' }}>Projects</Link>
              <Link to="/learn" style={{ color: '#cbd5e1' }}>Practice Lab</Link>
              <Link to="/settings" style={{ color: '#cbd5e1' }}>Settings</Link>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', fontSize: '0.78rem', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              © 2026 Tracewise. Skybound educational electronics engineering for students.
            </div>
            <div>
              Designed with Space Grotesk, Manrope, and JetBrains Mono typography.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
