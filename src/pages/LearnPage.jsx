import React, { useState } from 'react';
import { Navbar } from '../components/navigation/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { useProject } from '../store/useProjectStore';
import { BookOpen, CheckCircle2, ArrowRight, Play, Sparkles, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export function LearnPage() {
  const navigate = useNavigate();
  const { loadProject } = useProject();
  const [completed, setCompleted] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const challenges = [
    {
      id: 'ch-1',
      title: 'Challenge 01: The Missing Ground Connection',
      level: 'Beginner',
      question: 'In an Arduino circuit, an LED anode is connected to Pin 13 through a 220Ω resistor. The LED will not turn on. What is missing?',
      options: [
        'A wire connecting the LED cathode to Arduino GND pin',
        'A 9V external battery connected to AREF',
        'An analog input sensor on A0',
        'A serial baud rate change to 115200'
      ],
      correctIndex: 0,
      explanation: 'Electric current requires a closed loop. Without a return path from the cathode to ground (GND), no electrons can flow through the LED junction.',
      starterId: 'starter-led-blink'
    },
    {
      id: 'ch-2',
      title: 'Challenge 02: Resolving Pin Conflicts',
      level: 'Intermediate',
      question: 'If your Arduino sketch specifies pinMode(2, OUTPUT) for a Red Traffic LED, and another library line writes pinMode(2, INPUT_PULLUP) for a button, what occurs?',
      options: [
        'The microcontroller automatically resolves it into a bus',
        'A pin conflict: Pin 2 cannot simultaneously act as a driven output and a pulled-up digital input',
        'The compiler refuses to compile the .ino file',
        'The USB port disconnects'
      ],
      correctIndex: 1,
      explanation: 'Pin 2 configuration was overwritten. In the physical circuit, pressing the button could create a short circuit or cause unpredictable LED flashing.',
      starterId: 'starter-traffic-light-buggy'
    },
    {
      id: 'ch-3',
      title: 'Challenge 03: PWM Duty Cycle Control',
      level: 'Beginner',
      question: 'On an Arduino Uno, which function outputs an 8-bit Pulse Width Modulation (PWM) signal from 0 to 255 on pins marked with a tilde (~)?',
      options: [
        'analogWrite(pin, value)',
        'digitalWrite(pin, value)',
        'pulseOut(pin, value)',
        'pwmSet(pin, value)'
      ],
      correctIndex: 0,
      explanation: 'analogWrite(pin, value) generates a PWM square wave at ~490Hz with duty cycle proportional to value/255.',
      starterId: 'starter-analog-dimmer'
    }
  ];

  const handleSelectAnswer = (chId, idx) => {
    setSelectedAnswers(prev => ({ ...prev, [chId]: idx }));
    const challenge = challenges.find(c => c.id === chId);
    if (challenge && idx === challenge.correctIndex) {
      setCompleted(prev => ({ ...prev, [chId]: true }));
      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      } catch (e) {}
    }
  };

  const handleLaunchChallenge = (starterId) => {
    loadProject(starterId);
    navigate(`/app/studio/${starterId}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ maxWidth: '960px', margin: '0 auto', width: '100%', padding: '120px 24px 60px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Interactive Practice Lab
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--tw-text)', marginTop: '4px' }}>
            Learn through modification.
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--tw-text-secondary)', marginTop: '6px' }}>
            Solve hands-on electronics challenges, understand circuit behaviors, and jump into real circuits to test your understanding.
          </p>
        </div>

        {/* Progress Tracker */}
        <div
          className="glass-card"
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="var(--tw-brand)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--tw-text)' }}>
              Completed Challenges: {Object.keys(completed).length} of {challenges.length}
            </span>
          </div>

          <div style={{ width: '200px', height: '8px', backgroundColor: 'var(--tw-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(Object.keys(completed).length / challenges.length) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--tw-brand)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Challenges List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {challenges.map((ch, idx) => {
            const isDone = !!completed[ch.id];
            const chosen = selectedAnswers[ch.id];

            return (
              <div
                key={ch.id}
                className="glass-card"
                style={{
                  padding: '24px 28px',
                  backgroundColor: '#ffffff',
                  borderColor: isDone ? '#bbf7d0' : 'var(--tw-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-brand)', background: 'var(--tw-brand-soft)', padding: '3px 10px', borderRadius: '10px' }}>
                    {ch.level}
                  </span>
                  {isDone && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={16} /> Solved
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px' }}>
                  {ch.title}
                </h3>
                <p style={{ fontSize: '0.94rem', color: 'var(--tw-text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
                  {ch.question}
                </p>

                {/* Multiple choice options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ch.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    const isCorrect = isSelected && optIdx === ch.correctIndex;
                    const isWrong = isSelected && optIdx !== ch.correctIndex;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(ch.id, optIdx)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: isCorrect
                            ? '1.5px solid var(--tw-success)'
                            : isWrong
                            ? '1.5px solid var(--tw-error)'
                            : isSelected
                            ? '1.5px solid var(--tw-brand)'
                            : '1px solid var(--tw-border)',
                          backgroundColor: isCorrect
                            ? '#f0fdf4'
                            : isWrong
                            ? '#fef2f2'
                            : isSelected
                            ? 'var(--tw-brand-soft)'
                            : 'var(--tw-bg)',
                          color: 'var(--tw-text)',
                          fontSize: '0.88rem',
                          fontWeight: isSelected ? 600 : 500,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ marginRight: '8px', color: 'var(--tw-text-muted)' }}>
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on answer */}
                {chosen !== undefined && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: isDone ? '#f0fdf4' : '#fff1f2',
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                      color: isDone ? '#166534' : '#991b1b'
                    }}
                  >
                    <b>{isDone ? 'Correct!' : 'Try again:'}</b> {ch.explanation}
                  </div>
                )}

                {/* Action button to open in studio */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--tw-border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleLaunchChallenge(ch.starterId)}
                    className="btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.84rem' }}
                  >
                    <Play size={14} />
                    <span>Open in Studio Canvas</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
