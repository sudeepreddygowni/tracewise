import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import AnimatedContent from '../animations/AnimatedContent';
import { TracewiseProjectGallery } from '../components/landing/TracewiseProjectGallery';
import GradientASCII from '../components/gradient-ascii/GradientASCII';
import { TracewiseBubbleArea, SoapBubbleButton } from '../components/ui/BubbleActions';
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
  HelpCircle
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
      a: 'No. Tracewise performs honest structural validation (verifying component connections, pin mappings, and firmware pin references). Digital checks cannot guarantee physical breadboard contacts, faulty jumper wires, or component tolerances. We teach students to verify each physical step with care.'
    },
    {
      q: 'Do I need physical Arduino hardware to use Tracewise?',
      a: 'Not to start! You can design, wire, and write code entirely inside the Tracewise web studio. When you are ready to build, our Physical Build Guide generates a step-by-step assembly checklist and Bill of Materials.'
    },
    {
      q: 'How is Tracewise different from generic AI chatbots?',
      a: 'Generic chatbots output speculative text that frequently invents pinouts or hallucinates circuit connections. Tracewise centers on an actual interactive engineering studio with an immutable project graph, deterministic rule checks, and version diffing.'
    },
    {
      q: 'What is the signature "Change-Aware Debugging" feature?',
      a: 'The central question beginners ask is: "My circuit was working before. What did I change that broke it?" Tracewise preserves baseline versions and highlights exactly what wires, pins, or code lines changed between forks, pinpointing regressions instantly.'
    },
    {
      q: 'Is Tracewise safe for middle and high school students?',
      a: 'Yes. Tracewise focuses strictly on low-voltage, 5V USB-powered educational circuits (LEDs, resistors, buttons, sensors). Projects are private by default, with no public unrestricted messaging.'
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
          paddingBottom: '80px',
          backgroundImage: `
            linear-gradient(90deg, rgba(7, 24, 49, 0.78) 0%, rgba(7, 24, 49, 0.42) 55%, rgba(7, 24, 49, 0.15) 100%),
            url('/assets/backgrounds/himalayan-hero.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          overflow: 'hidden'
        }}
      >
        <div className="container-tw" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '780px' }}>
            
            {/* Tag Pill */}
            <AnimatedContent trigger="mount" distance={30} duration={0.6}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.16)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  padding: '6px 16px',
                  borderRadius: 'var(--tw-radius-pill)',
                  backdropFilter: 'blur(12px)',
                  marginBottom: '20px'
                }}
              >
                <Cpu size={15} color="#2DC5E9" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  Electronics & Robotics for Students
                </span>
              </div>
            </AnimatedContent>

            {/* Main Headline */}
            <AnimatedContent trigger="mount" distance={45} delay={0.12} duration={0.8}>
              <h1
                style={{
                  fontSize: 'clamp(3rem, 5.4vw, 5.2rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.055em',
                  lineHeight: 1.05,
                  textShadow: '0 4px 24px rgba(7, 24, 49, 0.5)'
                }}
              >
                From a rough idea to a working circuit.
              </h1>
            </AnimatedContent>

            {/* Supporting Copy */}
            <AnimatedContent trigger="mount" distance={40} delay={0.24} duration={0.8}>
              <p
                style={{
                  fontSize: 'clamp(1.1rem, 1.8vw, 1.28rem)',
                  color: '#e2e8f0',
                  marginTop: '18px',
                  maxWidth: '620px',
                  lineHeight: 1.55,
                  textShadow: '0 2px 12px rgba(7, 24, 49, 0.6)'
                }}
              >
                Design electronics projects, modify their wiring and code, and learn from every version.
              </p>
            </AnimatedContent>

            {/* Interactive Project Composer Bar */}
            <AnimatedContent trigger="mount" distance={40} delay={0.36} duration={0.8}>
              <div
                className="glass-card"
                style={{
                  marginTop: '28px',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.92)',
                  borderRadius: '24px',
                  boxShadow: '0 20px 48px rgba(7, 24, 49, 0.35)',
                  maxWidth: '640px'
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
                    placeholder="Describe what you want to build (e.g. traffic light with button)..."
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: '0.92rem',
                      color: 'var(--tw-text)',
                      background: 'transparent'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{
                      padding: '8px 18px',
                      fontSize: '0.84rem',
                      borderRadius: 'var(--tw-radius-pill)'
                    }}
                  >
                    <span>Start</span>
                    <ArrowRight size={14} />
                  </button>
                </form>

                {/* Quick suggestions tags */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--tw-border)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)' }}>Try starters:</span>
                  <button
                    onClick={() => handleQuickPrompt('traffic light')}
                    style={{ fontSize: '0.74rem', color: 'var(--tw-brand)', fontWeight: 600, background: 'var(--tw-brand-soft)', padding: '2px 8px', borderRadius: '10px' }}
                  >
                    Traffic Light Controller
                  </button>
                  <button
                    onClick={() => handleQuickPrompt('pedestrian')}
                    style={{ fontSize: '0.74rem', color: 'var(--tw-brand)', fontWeight: 600, background: 'var(--tw-brand-soft)', padding: '2px 8px', borderRadius: '10px' }}
                  >
                    Pedestrian Crosswalk Bug Demo
                  </button>
                  <button
                    onClick={() => handleQuickPrompt('blink')}
                    style={{ fontSize: '0.74rem', color: 'var(--tw-brand)', fontWeight: 600, background: 'var(--tw-brand-soft)', padding: '2px 8px', borderRadius: '10px' }}
                  >
                    Heartbeat Blink
                  </button>
                </div>
              </div>
            </AnimatedContent>

            {/* Action Buttons Cluster with Soap Bubble UI */}
            <AnimatedContent trigger="mount" distance={30} delay={0.48} duration={0.8}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
                <TracewiseBubbleArea theme="light">
                  <SoapBubbleButton
                    onClick={() => {
                      loadProject('starter-traffic-light');
                      navigate('/app/studio/starter-traffic-light');
                    }}
                    style={{
                      padding: '12px 28px',
                      fontSize: '0.96rem',
                      fontWeight: 700
                    }}
                  >
                    Start Building →
                  </SoapBubbleButton>
                </TracewiseBubbleArea>

                <Link
                  to="/projects"
                  className="btn-secondary"
                  style={{
                    padding: '11px 24px',
                    fontSize: '0.92rem',
                    background: 'rgba(255, 255, 255, 0.22)',
                    borderColor: 'rgba(255, 255, 255, 0.45)',
                    color: '#ffffff'
                  }}
                >
                  <Play size={15} />
                  <span>Explore 5 Starters</span>
                </Link>
              </div>
            </AnimatedContent>
          </div>
        </div>

        {/* Floating Reference Glass Cards Preview Overlay */}
        <div
          style={{
            position: 'absolute',
            right: '4vw',
            top: '52%',
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
              background: 'rgba(255, 255, 255, 0.88)',
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
              <span>sketch.ino</span>
              <span style={{ color: '#2dc5e9' }}>Arduino C++</span>
            </div>
            <div style={{ color: '#93c5fd' }}>void loop() &#123;</div>
            <div style={{ paddingLeft: '12px', color: '#cbd5e1' }}>digitalWrite(RED_PIN, HIGH);</div>
            <div style={{ paddingLeft: '12px', color: '#cbd5e1' }}>delay(3000);</div>
            <div style={{ paddingLeft: '12px', color: '#cbd5e1' }}>digitalWrite(GREEN_PIN, HIGH);</div>
            <div style={{ color: '#93c5fd' }}>&#125;</div>
          </div>
        </div>

        <style>{`
          @media (max-width: 1100px) {
            .hero-floating-cards {
              display: none !important;
            }
          }
        `}</style>
      </section>

      {/* =========================================================================
          SECTION 2: THREE WAYS TO START
      ========================================================================= */}
      <section style={{ padding: '80px 0', backgroundColor: '#ffffff' }}>
        <div className="container-tw">
          <AnimatedContent trigger="scroll" distance={40} duration={0.8}>
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Flexible Entry
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '6px' }}>
                Three ways to begin your circuit.
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--tw-text-secondary)', marginTop: '8px' }}>
                Whether you have an idea in plain words, want to build from scratch, or prefer remixing proven starters.
              </p>
            </div>
          </AnimatedContent>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Path 1: Assisted Starter */}
            <div className="glass-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--tw-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tw-brand)', marginBottom: '16px' }}>
                  <Sparkles size={22} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
                  1. Assisted Starter
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', lineHeight: 1.55 }}>
                  Describe your idea in natural language. Our rule-grounded generator configures an initial Uno schematic and template sketch.
                </p>
              </div>
              <button
                onClick={() => {
                  loadProject('starter-traffic-light');
                  navigate('/app/studio/starter-traffic-light');
                }}
                className="btn-secondary"
                style={{ marginTop: '24px', alignSelf: 'flex-start' }}
              >
                <span>Describe Idea</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Path 2: Blank Canvas */}
            <div className="glass-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tw-success)', marginBottom: '16px' }}>
                  <Cpu size={22} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
                  2. Build from Scratch
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', lineHeight: 1.55 }}>
                  Start with a fresh Uno and empty breadboard. Drag LEDs, resistors, and buttons, draw jumper wires, and write your own loop.
                </p>
              </div>
              <button
                onClick={() => {
                  const blank = createNewProject('Custom Circuit');
                  navigate(`/app/studio/${blank.id}`);
                }}
                className="btn-secondary"
                style={{ marginTop: '24px', alignSelf: 'flex-start' }}
              >
                <span>Open Blank Canvas</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Path 3: Curated Starters */}
            <div className="glass-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tw-sky)', marginBottom: '16px' }}>
                  <Layers size={22} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
                  3. Remix a Working Starter
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', lineHeight: 1.55 }}>
                  The fastest way to learn. Open our 3-stage traffic light, heartbeat blink, or PWM dimmer, create an independent fork, and modify.
                </p>
              </div>
              <Link to="/projects" className="btn-primary" style={{ marginTop: '24px', alignSelf: 'flex-start' }}>
                <span>Explore Starters</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CHANGE-AWARE DEBUGGING (THE SIGNATURE PRODUCT DIFFERENTIATOR)
      ========================================================================= */}
      <section style={{ padding: '90px 0', backgroundColor: '#071831', color: '#ffffff' }} id="how-it-works">
        <div className="container-tw">
          <AnimatedContent trigger="scroll" distance={40} duration={0.8}>
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 56px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                The Tracewise Signature Experience
              </span>
              <h2 style={{ fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.04em' }}>
                Change-aware debugging for beginners.
              </h2>
              <p style={{ fontSize: '1.05rem', color: '#cbd5e1', marginTop: '12px', lineHeight: 1.6 }}>
                "My circuit was working before. What did I change that caused the problem?"
                We compare baseline versions against your modifications to identify pin conflicts, missing current resistors, and code mismatches.
              </p>
            </div>
          </AnimatedContent>

          {/* Interactive Comparison Preview Card */}
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
                <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Baseline: Traffic Light Controller (v1.0)
                </span>
                <span style={{ color: 'var(--tw-cyan)' }}>→</span>
                <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(45, 197, 233, 0.2)', color: '#2dc5e9', fontSize: '0.8rem', fontWeight: 600 }}>
                  Fork: Pedestrian Button Remix (v1.1)
                </span>
              </div>

              <Link
                to="/app/compare/starter-traffic-light-buggy"
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.84rem' }}
              >
                <span>Launch Interactive Diff</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>

            {/* Split Diffs View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Left: Circuit Delta */}
              <div style={{ background: '#0b2348', padding: '20px', borderRadius: '16px', border: '1px solid rgba(74, 167, 242, 0.2)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--tw-cyan)', marginBottom: '12px' }}>
                  Circuit Graph Delta
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                  <div style={{ padding: '6px 10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '6px' }}>
                    + Added Component: <b>Pedestrian Push Button</b>
                  </div>
                  <div style={{ padding: '6px 10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '6px' }}>
                    + Added Wire: <b>Uno Pin D7 → Button Pin 1a</b>
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
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Detected Pin Conflict in Firmware
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#fecaca', lineHeight: 1.5 }}>
                  Line 8 declares <code style={{ background: '#071831', padding: '2px 4px', borderRadius: '4px' }}>BUTTON_PIN = 2</code>, but the wire is plugged into <b>Pin D7</b>! Pin D2 is already driving the Red LED.
                </p>
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#ffffff' }}>
                  <b>Solution:</b> Update sketch to <code style={{ color: '#4ade80' }}>BUTTON_PIN = 7</code>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: PROJECT SHOWCASE WITH REACTDROPS FAN GALLERY
      ========================================================================= */}
      <section
        style={{
          position: 'relative',
          padding: '100px 0',
          backgroundImage: `
            linear-gradient(180deg, rgba(7, 24, 49, 0.5) 0%, rgba(245, 249, 253, 0.95) 100%),
            url('/assets/backgrounds/green-valley.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden'
        }}
        id="projects"
      >
        <div className="container-tw">
          <AnimatedContent trigger="scroll" distance={40} duration={0.8}>
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
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
                  fontWeight: 800,
                  color: '#ffffff',
                  textShadow: '0 4px 16px rgba(7, 24, 49, 0.4)'
                }}
              >
                Explore ideas. Make them yours.
              </h2>
              <p style={{ fontSize: '1.05rem', color: '#f1f5f9', marginTop: '6px', textShadow: '0 2px 10px rgba(7, 24, 49, 0.6)' }}>
                Hover and inspect our curated starter collection. Open in Studio or fork an independent remix.
              </p>
            </div>
          </AnimatedContent>

          {/* Official Fan Gallery Component */}
          <TracewiseProjectGallery />
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: OPTIONAL TECHNICAL TRANSITION WITH GRADIENT ASCII
      ========================================================================= */}
      <section style={{ padding: '60px 0', backgroundColor: '#071831', overflow: 'hidden' }}>
        <div className="container-tw">
          <div
            style={{
              width: '100%',
              height: '240px',
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(74, 167, 242, 0.25)'
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
                Engineering Core
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                Deterministic Static Rule Checks
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', maxWidth: '500px', marginTop: '4px' }}>
                We inspect pin references and circuit structure at code-speed without bloated external compilers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FREQUENTLY ASKED QUESTIONS (HONEST & EDUCATIONAL)
      ========================================================================= */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--tw-surface)' }} id="faq">
        <div className="container-tw" style={{ maxWidth: '840px' }}>
          <AnimatedContent trigger="scroll" distance={30} duration={0.8}>
            <div style={{ textAlign: 'center', marginBottom: '44px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Clear & Honest Answers
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '4px' }}>
                Frequently Asked Questions
              </h2>
            </div>
          </AnimatedContent>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;

              return (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    backgroundColor: '#ffffff'
                  }}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                      {faq.q}
                    </h3>
                    <ChevronDown
                      size={18}
                      color="var(--tw-text-muted)"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>

                  {isOpen && (
                    <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', marginTop: '12px', lineHeight: 1.6 }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CLOSING CALL TO ACTION
      ========================================================================= */}
      <section
        style={{
          padding: '100px 0',
          backgroundImage: 'linear-gradient(135deg, #071831 0%, #0B2348 60%, #12365C 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="container-tw" style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <AnimatedContent trigger="scroll" distance={40} duration={0.8}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Ready to experiment?
            </span>
            <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.04em' }}>
              Build it. Change it. Understand it.
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', maxWidth: '580px', margin: '14px auto 32px', lineHeight: 1.6 }}>
              Open your first starter circuit in seconds. No complex installs, no fake simulations.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <TracewiseBubbleArea theme="dark">
                <SoapBubbleButton
                  onClick={() => {
                    loadProject('starter-traffic-light');
                    navigate('/app/studio/starter-traffic-light');
                  }}
                  style={{ padding: '14px 34px', fontSize: '1rem', fontWeight: 700 }}
                >
                  Open Studio Now →
                </SoapBubbleButton>
              </TracewiseBubbleArea>

              <Link
                to="/projects"
                className="btn-secondary"
                style={{
                  padding: '13px 26px',
                  fontSize: '0.94rem',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.3)'
                }}
              >
                View Starter Gallery
              </Link>
            </div>
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

            <div style={{ display: 'flex', gap: '24px', fontSize: '0.86rem' }}>
              <Link to="/app" style={{ color: '#cbd5e1' }}>Studio</Link>
              <Link to="/projects" style={{ color: '#cbd5e1' }}>Starters</Link>
              <Link to="/learn" style={{ color: '#cbd5e1' }}>Practice Lab</Link>
              <Link to="/settings" style={{ color: '#cbd5e1' }}>Preferences</Link>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', fontSize: '0.78rem', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              © 2026 Tracewise. Skybound educational engineering for students.
            </div>
            <div>
              Designed with approved Montserrat, Google Sans Flex, and JetBrains Mono typography.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
