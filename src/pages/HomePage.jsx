import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
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
    const starter = STARTER_PROJECTS[0];
    loadProject(starter.id);
    navigate(`/app/studio/${starter.id}`);
  };

  const handleQuickPrompt = (title) => {
    const starter = STARTER_PROJECTS.find(s => s.title.toLowerCase().includes(title.toLowerCase())) || STARTER_PROJECTS[0];
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
      <Navbar />

      {/* =========================================================================
          SECTION 1: HIMALAYAN HERO WITH SKYBOUND ATMOSPHERE
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
          backgroundImage: `
            linear-gradient(90deg, rgba(7, 24, 49, 0.72) 0%, rgba(7, 24, 49, 0.38) 52%, rgba(7, 24, 49, 0.08) 100%),
            url('/assets/backgrounds/himalayan-hero.webp')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center 25%',
          overflow: 'hidden'
        }}
      >
        <div className="container-tw" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '780px' }}>
            
            {/* Tag Pill */}
            <AnimatedContent trigger="mount" distance={25} duration={0.6}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  padding: '6px 16px',
                  borderRadius: 'var(--tw-radius-pill)',
                  backdropFilter: 'blur(12px)',
                  marginBottom: '20px'
                }}
              >
                <Cpu size={15} color="#2DC5E9" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  Student Electronics & Circuit Engineering
                </span>
              </div>
            </AnimatedContent>

            {/* Main Headline */}
            <AnimatedContent trigger="mount" distance={35} delay={0.1} duration={0.8}>
              <h1
                style={{
                  fontSize: 'clamp(3rem, 5.5vw, 5.2rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.045em',
                  lineHeight: 1.08,
                  textShadow: '0 4px 24px rgba(7, 24, 49, 0.5)'
                }}
              >
                Make the circuit. Understand every change.
              </h1>
            </AnimatedContent>

            {/* Supporting Copy */}
            <AnimatedContent trigger="mount" distance={30} delay={0.2} duration={0.8}>
              <p
                style={{
                  fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
                  color: '#e2e8f0',
                  marginTop: '18px',
                  maxWidth: '640px',
                  lineHeight: 1.55,
                  textShadow: '0 2px 12px rgba(7, 24, 49, 0.6)'
                }}
              >
                Start with an Arduino project, experiment with its wiring and code, and see exactly what changed. Tracewise helps you learn by building, testing, and improving your projects.
              </p>
            </AnimatedContent>

            {/* Interactive Project Composer Bar with Bubble UI */}
            <AnimatedContent trigger="mount" distance={30} delay={0.3} duration={0.8}>
              <TracewiseBubbleArea theme="light" style={{ maxWidth: '640px', marginTop: '28px' }}>
                <div
                  className="glass-card"
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.92)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 48px rgba(7, 24, 49, 0.35)'
                  }}
                >
                  <form
                    onSubmit={handlePromptSubmit}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <Sparkles size={18} color="var(--tw-brand)" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="What would you like to build or change?"
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.94rem',
                        color: 'var(--tw-text)',
                        background: 'transparent'
                      }}
                    />
                    <TracewiseBubbleButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      style={{ padding: '8px 18px' }}
                    >
                      <span>Start</span>
                      <ArrowRight size={14} />
                    </TracewiseBubbleButton>
                  </form>

                  {/* Quick suggestions tags using Bubble buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--tw-border)' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)', alignSelf: 'center' }}>Try starters:</span>
                    <TracewiseBubbleButton
                      onClick={() => handleQuickPrompt('traffic light')}
                      size="sm"
                      variant="ghost"
                      style={{ fontSize: '0.74rem', padding: '3px 9px', minHeight: '1.75rem' }}
                    >
                      Traffic Light Demo
                    </TracewiseBubbleButton>
                    <TracewiseBubbleButton
                      onClick={() => handleQuickPrompt('pedestrian')}
                      size="sm"
                      variant="ghost"
                      style={{ fontSize: '0.74rem', padding: '3px 9px', minHeight: '1.75rem' }}
                    >
                      Pedestrian Bug Demo
                    </TracewiseBubbleButton>
                    <TracewiseBubbleButton
                      onClick={() => handleQuickPrompt('blink')}
                      size="sm"
                      variant="ghost"
                      style={{ fontSize: '0.74rem', padding: '3px 9px', minHeight: '1.75rem' }}
                    >
                      Heartbeat Blink
                    </TracewiseBubbleButton>
                  </div>
                </div>
              </TracewiseBubbleArea>
            </AnimatedContent>

            {/* Action Buttons Cluster with Bubble UI */}
            <AnimatedContent trigger="mount" distance={25} delay={0.4} duration={0.8}>
              <TracewiseBubbleArea theme="light" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
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
                    background: 'rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  }}
                >
                  <Play size={16} />
                  <span>Explore Projects</span>
                </TracewiseBubbleButton>
              </TracewiseBubbleArea>
            </AnimatedContent>
          </div>
        </div>

        {/* Floating Reference Glass Cards Preview Overlay */}
        <div
          style={{
            position: 'absolute',
            right: '4vw',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '380px',
            zIndex: 10
          }}
          className="hero-floating-cards"
        >
          {/* Card 1: Arduino Uno Pin Spec */}
          <div
            className="glass-card anim-float"
            style={{
              padding: '16px 20px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 40px rgba(7, 24, 49, 0.22)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tw-brand)' }}>
                ARDUINO UNO R3
              </span>
              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <CheckCircle2 size={12} /> Connected
              </span>
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--tw-text)' }}>
              14 Digital GPIO • 6 PWM • ATmega328P
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-code)' }}>D2: RED</span>
              <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-code)' }}>D3: YEL</span>
              <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-code)' }}>D4: GRN</span>
            </div>
          </div>

          {/* Card 2: Live Code Preview */}
          <div
            className="glass-dark anim-float-slow"
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--tw-radius-lg)',
              fontFamily: 'var(--font-code)',
              fontSize: '0.76rem',
              lineHeight: 1.5,
              border: '1px solid rgba(74, 167, 242, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.7rem', marginBottom: '4px' }}>
              <span>traffic_light.ino</span>
              <span style={{ color: '#2dc5e9' }}>Arduino C++</span>
            </div>
            <div style={{ color: '#93c5fd' }}>void loop() &#123;</div>
            <div style={{ paddingLeft: '12px', color: '#cbd5e1' }}>digitalWrite(RED_PIN, HIGH);</div>
            <div style={{ paddingLeft: '12px', color: '#cbd5e1' }}>delay(3000);</div>
            <div style={{ paddingLeft: '12px', color: '#cbd5e1' }}>digitalWrite(GREEN_PIN, HIGH);</div>
            <div style={{ color: '#93c5fd' }}>&#125;</div>
          </div>
        </div>

        {/* Seamless Hero to Sky Transition Mask (220px) */}
        <div className="trans-hero-bottom" />

        <style>{`
          @media (max-width: 1100px) {
            .hero-floating-cards {
              display: none !important;
            }
          }
        `}</style>
      </section>

      {/* =========================================================================
          SECTION 2: PROJECT CREATION & STUDIO ARCHITECTURE
          Heading: "Start with an idea. Or something that already works."
      ========================================================================= */}
      <section
        style={{
          position: 'relative',
          paddingTop: '60px',
          paddingBottom: '80px',
          backgroundColor: '#F5F9FD'
        }}
        id="workspace"
      >
        <div className="container-tw">
          <AnimatedContent trigger="scroll" distance={35} duration={0.8}>
            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                How You Begin
              </span>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--tw-text)', marginTop: '6px' }}>
                Start with an idea. Or something that already works.
              </h2>
              <p style={{ fontSize: '1.02rem', color: 'var(--tw-text-secondary)', marginTop: '8px' }}>
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

      {/* Seamless Transition: Sky/Ice to Deep Technical Navy (220px) */}
      <div className="trans-sky-to-navy" />

      {/* =========================================================================
          SECTION 3: REMIX & DEBUGGING
          Heading: "Something stopped working? See what changed."
      ========================================================================= */}
      <section style={{ position: 'relative', padding: '60px 0 80px', backgroundColor: '#071831', color: '#ffffff' }} id="how-it-works">
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

      {/* Seamless Transition: Navy to Green Valley Landscape (200px) */}
      <div className="trans-navy-to-valley" />

      {/* =========================================================================
          SECTION 4: PROJECT SHOWCASE WITH REACTDROPS FAN GALLERY
          Heading: "Good projects are meant to be explored."
      ========================================================================= */}
      <section
        style={{
          position: 'relative',
          paddingTop: '60px',
          paddingBottom: '120px',
          backgroundImage: `
            linear-gradient(180deg, rgba(7, 24, 49, 0.45) 0%, rgba(7, 24, 49, 0.1) 40%, rgba(7, 24, 49, 0.5) 100%),
            url('/assets/backgrounds/green-valley.webp')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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
                  color: '#ffffff',
                  background: 'rgba(7, 24, 49, 0.65)',
                  padding: '4px 14px',
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
              <p style={{ fontSize: '1.05rem', color: '#f1f5f9', marginTop: '6px', textShadow: '0 2px 10px rgba(7, 24, 49, 0.6)' }}>
                Open any starter circuit, test its logic, and make an independent remix without altering the original baseline.
              </p>
            </div>
          </AnimatedContent>

          {/* Official Fan Gallery Component */}
          <TracewiseProjectGallery />
        </div>
      </section>

      {/* Seamless Transition: Green Valley back into Dark Technical Atmosphere (240px) */}
      <div className="trans-valley-to-navy" />

      {/* =========================================================================
          SECTION 5: PHYSICAL BUILDING
          Heading: "From your screen to your breadboard."
      ========================================================================= */}
      <section style={{ padding: '80px 0 60px', backgroundColor: '#071831', color: '#ffffff' }}>
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

          {/* Technical Transition ASCII Panel */}
          <div
            style={{
              width: '100%',
              height: '240px',
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(74, 167, 242, 0.25)',
              marginBottom: '32px'
            }}
          >
            <GradientASCII
              colors={['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']}
              shape="horizon"
              characters=" =+xX0S8#@"
              cellSize={18}
              density={0.8}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(7,24,49,0.7) 0%, rgba(7,24,49,0.92) 80%)',
                color: '#ffffff',
                textAlign: 'center',
                padding: '20px'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Deterministic Static Rule Checks
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
                Structural checks you can rely on.
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', maxWidth: '520px', marginTop: '6px' }}>
                We inspect pin references and circuit connections directly against hardware definitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seamless Transition: Navy back to Soft Ice/Sky (200px) */}
      <div className="trans-navy-to-ice" />

      {/* =========================================================================
          SECTION 6: FREQUENTLY ASKED QUESTIONS
      ========================================================================= */}
      <section style={{ padding: '60px 0 80px', backgroundColor: '#F5F9FD' }} id="faq">
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

      {/* Seamless Transition: Soft Ice to Closing CTA Midnight (220px) */}
      <div className="trans-ice-to-cta" />

      {/* =========================================================================
          SECTION 7: CLOSING CALL TO ACTION
          Heading: "Ready to try your first circuit?"
      ========================================================================= */}
      <section
        style={{
          padding: '80px 0 100px',
          backgroundColor: '#071831',
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
