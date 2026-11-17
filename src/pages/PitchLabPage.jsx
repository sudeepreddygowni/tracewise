import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Award,
  Mic,
  HelpCircle,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Cpu,
  Layers,
  ChevronRight,
  ChevronLeft,
  Shield,
  AlertCircle,
  Clock,
  Printer,
  Compass,
  Play,
  Pause,
  CheckCircle2,
  ListChecks
} from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { useAuth } from '../store/useAuthStore';
import {
  extractProjectContext,
  generatePitchDrafts,
  generateJudgeQuestions,
  generateQuizQuestions,
  generateScienceFairChecklist,
  evaluateInterviewAnswer
} from '../domain/pitch/pitchEngine';
import {
  getPitchPreparation,
  savePitchPreparation,
  recordPitchAttempt
} from '../services/pitchStorage';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../components/ui/BubbleActions';
import { assistantProvider } from '../domain/assistant/assistantProvider';

export function PitchLabPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, activeProject, loadProject } = useProject();
  const { user } = useAuth();

  // Check URL query parameters (e.g. ?created=true)
  const searchParams = new URLSearchParams(location.search);
  const isJustCreated = searchParams.get('created') === 'true';

  // Find target project strictly by ID when specified
  const foundProj = projectId
    ? ((activeProject && activeProject.id === projectId) ? activeProject : projects.find(p => p.id === projectId))
    : (activeProject || projects[0]);

  const projectNotFound = Boolean(projectId && !foundProj);
  const currentProj = foundProj || null;

  const [activeTab, setActiveTab] = useState('brief'); // 'brief' | 'pitches' | 'rehearsal' | 'questions' | 'quiz' | 'interview' | 'checklist' | 'summary'

  // Brief Form State
  const [brief, setBrief] = useState({
    problem: '',
    audience: '',
    importance: '',
    solution: '',
    testingEvidence: '',
    userFeedback: '',
    limitations: '',
    nextSteps: ''
  });

  // Pitches State
  const [pitches, setPitches] = useState({
    pitch30: '',
    pitch60: '',
    pitch120: ''
  });

  const [pitchDuration, setPitchDuration] = useState('60'); // '30' | '60' | '120' | 'outline'
  const [copiedKey, setCopiedKey] = useState(null);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [isSaving, setIsSaving] = useState(false);
  const [pitchCritique, setPitchCritique] = useState(null);
  const [isCritiquing, setIsCritiquing] = useState(false);

  // Rehearsal Mode State
  const [rehearsalCardIndex, setRehearsalCardIndex] = useState(0);
  const [rehearsalTimer, setRehearsalTimer] = useState(0);
  const [isRehearsalTimerRunning, setIsRehearsalTimerRunning] = useState(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Mock Interview State
  const [interviewDifficulty, setInterviewDifficulty] = useState('Intermediate');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInterviewAnswer, setUserInterviewAnswer] = useState('');
  const [interviewEvaluations, setInterviewEvaluations] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Project context calculation
  const ctx = currentProj ? extractProjectContext(currentProj, brief) : null;
  const generatedDrafts = ctx ? generatePitchDrafts(ctx) : null;
  const judgeQuestions = ctx ? generateJudgeQuestions(ctx) : [];
  const quizQuestions = ctx ? generateQuizQuestions(ctx) : [];
  const checklist = ctx ? generateScienceFairChecklist(ctx) : [];

  // Filtered interview questions
  const interviewQuestions = judgeQuestions.filter(
    q => interviewDifficulty === 'All' || q.difficulty === interviewDifficulty
  );

  // Load saved preparation on mount and prefill from physical project
  useEffect(() => {
    async function loadSavedData() {
      if (!currentProj) return;

      // Initialize with physical project facts if available
      if (currentProj.project_type === 'documented_physical_project') {
        setBrief(prev => ({
          ...prev,
          problem: prev.problem || currentProj.problemSolved || '',
          solution: prev.solution || currentProj.description || '',
          audience: prev.audience || currentProj.targetAudience || '',
          testingEvidence: prev.testingEvidence || currentProj.testingEvidence || '',
          limitations: prev.limitations || currentProj.challengesFaced || '',
          nextSteps: prev.nextSteps || currentProj.futureImprovements || ''
        }));
      }

      const saved = await getPitchPreparation(currentProj.id, user);
      if (saved) {
        if (saved.brief) setBrief(prev => ({ ...prev, ...saved.brief }));
        if (saved.pitches) setPitches(prev => ({ ...prev, ...saved.pitches }));
      }
    }
    loadSavedData();
  }, [currentProj?.id, user?.uid]);

  // Sync default generated pitches if not customized
  useEffect(() => {
    if (generatedDrafts) {
      setPitches(prev => ({
        pitch30: prev.pitch30 || generatedDrafts.pitch30,
        pitch60: prev.pitch60 || generatedDrafts.pitch60,
        pitch120: prev.pitch120 || generatedDrafts.pitch120
      }));
    }
  }, [currentProj?.id, generatedDrafts?.pitch30]);

  // Rehearsal timer tick
  useEffect(() => {
    let interval = null;
    if (isRehearsalTimerRunning) {
      interval = setInterval(() => {
        setRehearsalTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRehearsalTimerRunning]);

  const formatRehearsalTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleRunAIReview = async () => {
    const currentText = pitches[`pitch${pitchDuration}`] || '';
    if (!currentText.trim() || isCritiquing) return;

    setIsCritiquing(true);
    try {
      const res = await assistantProvider.getResponse({
        queryText: currentText,
        task: 'pitch_review',
        project: currentProj,
        validation: currentProj?.validation
      });
      setPitchCritique(res);
    } catch (err) {
      console.warn('Pitch critique error:', err);
    } finally {
      setIsCritiquing(false);
    }
  };

  // Auto-save handler
  const handleSave = async (updatedBrief = brief, updatedPitches = pitches) => {
    if (!currentProj) return;
    setIsSaving(true);
    setSaveStatus('Saving...');
    try {
      const res = await savePitchPreparation(currentProj.id, { brief: updatedBrief, pitches: updatedPitches }, user);
      if (res && res.message) {
        setSaveStatus(res.message);
      } else {
        setSaveStatus(user && !user.isAnonymous ? 'Synced to Supabase' : 'Saved locally in browser');
      }
    } catch (e) {
      setSaveStatus('Save error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBriefChange = (field, value) => {
    const updated = { ...brief, [field]: value };
    setBrief(updated);
    handleSave(updated, pitches);
  };

  const handlePitchChange = (key, value) => {
    const updated = { ...pitches, [key]: value };
    setPitches(updated);
    handleSave(brief, updated);
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResetDraft = (durationKey) => {
    if (!generatedDrafts) return;
    const defaultText = generatedDrafts[`pitch${durationKey}`];
    handlePitchChange(`pitch${durationKey}`, defaultText);
  };

  // Quiz submission
  const handleSelectQuizOption = (qId, optionIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateQuizScore = () => {
    let correct = 0;
    quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correctIndex) correct++;
    });
    return Math.round((correct / (quizQuestions.length || 1)) * 100);
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    const score = calculateQuizScore();
    if (currentProj) {
      recordPitchAttempt(currentProj.id, {
        attemptType: 'quiz',
        score,
        data: { quizAnswers }
      }, user).catch(() => {});
    }
  };

  // Mock interview answer submission
  const handleEvaluateAnswer = () => {
    if (!userInterviewAnswer.trim()) return;
    setIsEvaluating(true);
    const currQ = interviewQuestions[currentQuestionIndex] || interviewQuestions[0];
    const evaluation = evaluateInterviewAnswer(currQ, userInterviewAnswer, ctx);
    setInterviewEvaluations(prev => ({
      ...prev,
      [currQ.id]: {
        userAnswer: userInterviewAnswer,
        ...evaluation
      }
    }));
    setIsEvaluating(false);

    if (currentProj && evaluation) {
      recordPitchAttempt(currentProj.id, {
        attemptType: 'mock_interview',
        score: evaluation.overallScore,
        data: {
          questionId: currQ.id,
          question: currQ.question,
          userAnswer: userInterviewAnswer,
          scores: evaluation.scores,
          feedback: evaluation.feedback
        }
      }, user).catch(() => {});
    }
  };

  // STRICT PROJECT NOT FOUND STATE
  if (projectNotFound || !currentProj) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#071831', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', padding: '36px', textAlign: 'center', backgroundColor: '#0a1f40', borderRadius: '24px', border: '1px solid rgba(45, 197, 233, 0.25)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
          <AlertCircle size={36} color="#38bdf8" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Project Not Found
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.5 }}>
            {projectId
              ? `We could not find the project with ID "${projectId}". It may have been deleted, or you might need to select an existing project from your dashboard.`
              : `Please select a project from your dashboard to open the Project Pitch Lab.`}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <TracewiseBubbleButton to="/app" variant="secondary">
              <span>My Projects</span>
            </TracewiseBubbleButton>
            <TracewiseBubbleButton to="/app/projects/new-existing" variant="primary">
              <span>Add Existing Project</span>
            </TracewiseBubbleButton>
          </div>
        </div>
      </div>
    );
  }

  // Back link routes to Project Overview for physical builds, Studio for circuits
  const backRoute = ctx.isPhysicalProject
    ? `/app/projects/${currentProj.id}`
    : `/app/studio/${currentProj.id}`;
  const backLabel = ctx.isPhysicalProject
    ? 'Back to Project Overview'
    : 'Back to Studio Canvas';

  // Rehearsal cards derived from 120s pitch or outline
  const rehearsalCards = [
    {
      title: '1. Hook & Problem Statement',
      targetTime: '0:00 - 0:30',
      content: `Hello judges. When ${brief.audience || 'users'} work on this problem, they face ${brief.problem || 'a significant practical obstacle'}. We built ${ctx.title} to deliver ${brief.solution || 'a reliable physical solution'}.`
    },
    {
      title: '2. Hardware Architecture & Working Principle',
      targetTime: '0:30 - 1:00',
      content: ctx.isPhysicalProject
        ? `Our physical build is powered by a ${ctx.hardwarePlatform} microcontroller coordinating ${ctx.componentNames.slice(0, 3).join(', ') || 'our sensor inputs and outputs'}. Working principle: ${ctx.workingPrinciple || 'Inputs evaluate threshold conditions and command actuators in real time.'}`
        : `Our hardware architecture relies on an Arduino Uno microcontroller managing ${ctx.inputsCount} inputs and ${ctx.outputsCount} outputs with verified current-limiting protection.`
    },
    {
      title: '3. Testing Evidence & Overcoming Challenges',
      targetTime: '1:00 - 1:30',
      content: `We tested our build: ${brief.testingEvidence || 'through repeated functional bench trials'}. Our most critical engineering challenge was: ${ctx.challengesFaced || 'component integration and signal stability'}, which we diagnosed and resolved through systematic testing.`
    },
    {
      title: '4. Honest Limitations & Next Steps',
      targetTime: '1:30 - 2:00',
      content: `Engineering requires knowing real-world constraints. Current limitations: ${brief.limitations || 'prototype operating under bench conditions'}. Our roadmap for full deployment: ${brief.nextSteps || 'custom PCB design and enclosure prototyping'}. Thank you!`
    }
  ];

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', padding: '100px 24px 80px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Success Banner if Just Created */}
          {isJustCreated && (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.92rem',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span>
                  Your project <b>"{currentProj.title}"</b> is ready! Prepare your presentation, rehearsal cue cards, and judge Q&A below.
                </span>
              </div>
            </div>
          )}

          {/* Top Bar: Return to Studio / Overview & Project Context */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Link
              to={backRoute}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--tw-brand)',
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={16} />
              <span>{backLabel}</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                {saveStatus}
              </span>
              <span style={{ fontSize: '0.78rem', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
                {ctx.hardwarePlatform || ctx.archetype}
              </span>
              {ctx.isPhysicalProject && (
                <span style={{ fontSize: '0.78rem', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
                  Physical Build
                </span>
              )}
            </div>
          </div>

          {/* Pitch Lab Header Banner */}
          <div
            className="glass-card"
            style={{
              padding: '32px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 12px 32px rgba(7, 24, 49, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tw-brand)' }}>
                  Competition & Presentation Training
                </span>
              </div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                Project Pitch Lab: {currentProj.title}
              </h1>
              <p style={{ fontSize: '1rem', color: 'var(--tw-text-secondary)', margin: 0, maxWidth: '720px' }}>
                <b>Build the project. Explain the thinking. Own the presentation.</b> Prepare for competition judges, technical mentors, and project showcases using your actual project facts.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right', padding: '12px 18px', backgroundColor: 'var(--tw-bg)', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>COMPONENTS LISTED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-brand)', fontFamily: 'var(--font-heading)' }}>
                  {ctx.componentsCount} Parts
                </div>
              </div>
              <div style={{ textAlign: 'right', padding: '12px 18px', backgroundColor: 'var(--tw-bg)', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>HARDWARE PLATFORM</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-brand)', fontFamily: 'var(--font-heading)' }}>
                  {ctx.hardwarePlatform}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'brief', label: '1. Project Brief', icon: FileText },
              { id: 'pitches', label: '2. Pitch Builder', icon: Mic },
              { id: 'rehearsal', label: '3. Practice Rehearsal', icon: Clock },
              { id: 'questions', label: '4. Judge Questions', icon: HelpCircle },
              { id: 'quiz', label: '5. Knowledge Quiz', icon: Award },
              { id: 'interview', label: '6. Mock Interview', icon: Sparkles },
              { id: 'checklist', label: '7. Science Fair Checklist', icon: ListChecks },
              { id: 'summary', label: '8. Executive Summary', icon: Printer }
            ].map(tabItem => {
              const Icon = tabItem.icon;
              const isActive = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setActiveTab(tabItem.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--tw-brand)' : 'transparent',
                    backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    color: isActive ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 14px rgba(30, 63, 216, 0.08)' : 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={16} color={isActive ? 'var(--tw-brand)' : 'currentColor'} />
                  <span>{tabItem.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: PROJECT BRIEF FORM */}
          {activeTab === 'brief' && (
            <div className="glass-card" style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                  Project Framing & Context Brief
                </h2>
                <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                  Ground your presentation in genuine human and engineering facts. These answers automatically update all pitch drafts and rehearsal cards.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                    1. What problem does this project solve?
                  </label>
                  <textarea
                    rows={3}
                    value={brief.problem}
                    onChange={(e) => handleBriefChange('problem', e.target.value)}
                    placeholder="e.g. Traditional pedestrian crosswalks fail to signal nighttime visibility for oncoming cyclists..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                    2. Who experiences this problem?
                  </label>
                  <textarea
                    rows={3}
                    value={brief.audience}
                    onChange={(e) => handleBriefChange('audience', e.target.value)}
                    placeholder="e.g. Pedestrians, campus commuters, and visual impairment guides..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                    3. How does your solution work?
                  </label>
                  <textarea
                    rows={3}
                    value={brief.solution}
                    onChange={(e) => handleBriefChange('solution', e.target.value)}
                    placeholder={ctx.isPhysicalProject ? `e.g. The ${ctx.hardwarePlatform} reads distance from ultrasonic sensors and controls DC motors via an H-bridge driver...` : 'e.g. Uses a push-button interrupt and automated timed state machine...'}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                    4. What has actually been tested?
                  </label>
                  <textarea
                    rows={3}
                    value={brief.testingEvidence}
                    onChange={(e) => handleBriefChange('testingEvidence', e.target.value)}
                    placeholder={ctx.isPhysicalProject ? 'e.g. Tested 20 obstacle avoidance trials on bench surfaces; 19/20 obstacles successfully navigated with 120ms reaction time...' : 'e.g. Simulated 50 consecutive crossing cycles without pin conflicts...'}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                    5. What are the current limitations? (Honesty wins judges)
                  </label>
                  <textarea
                    rows={3}
                    value={brief.limitations}
                    onChange={(e) => handleBriefChange('limitations', e.target.value)}
                    placeholder="e.g. Operates as an assembled prototype without waterproof casing or battery gauge..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '6px' }}>
                    6. What would you improve next?
                  </label>
                  <textarea
                    rows={3}
                    value={brief.nextSteps}
                    onChange={(e) => handleBriefChange('nextSteps', e.target.value)}
                    placeholder="e.g. Designing a custom PCB shield and 3D printing an aerodynamic enclosure..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--tw-border)' }}>
                <TracewiseBubbleButton
                  onClick={() => setActiveTab('pitches')}
                  variant="primary"
                >
                  <span>Build Pitch Scripts →</span>
                </TracewiseBubbleButton>
              </div>
            </div>
          )}

          {/* TAB 2: PITCH BUILDER */}
          {activeTab === 'pitches' && (
            <div className="glass-card" style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 4px', fontFamily: 'var(--font-heading)' }}>
                    Editable Presentation Drafts
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                    Select your speaking window. Every draft is grounded in your active hardware components and brief.
                  </p>
                </div>

                {/* Duration Toggle */}
                <div style={{ display: 'flex', background: 'var(--tw-bg)', padding: '4px', borderRadius: '12px' }}>
                  {[
                    { id: '30', label: '30-Sec Elevator' },
                    { id: '60', label: '60-Sec Pitch' },
                    { id: '120', label: '120-Sec Tech Pitch' },
                    { id: 'outline', label: '3-5 Min Outline' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPitchDuration(item.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: pitchDuration === item.id ? '#ffffff' : 'transparent',
                        color: pitchDuration === item.id ? 'var(--tw-brand)' : 'var(--tw-text-secondary)',
                        boxShadow: pitchDuration === item.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pitch Content Editor or Outline View */}
              {pitchDuration !== 'outline' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-text-muted)' }}>
                      SCRIPT DRAFT (CLICK TO EDIT)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <TracewiseBubbleButton
                        onClick={() => handleResetDraft(pitchDuration)}
                        variant="secondary"
                        size="sm"
                      >
                        <RotateCcw size={14} />
                        <span>Reset to Generated</span>
                      </TracewiseBubbleButton>
                      <TracewiseBubbleButton
                        onClick={() => handleCopy(pitches[`pitch${pitchDuration}`], `pitch${pitchDuration}`)}
                        variant="secondary"
                        size="sm"
                      >
                        {copiedKey === `pitch${pitchDuration}` ? <Check size={14} color="var(--tw-success)" /> : <Copy size={14} />}
                        <span>{copiedKey === `pitch${pitchDuration}` ? 'Copied!' : 'Copy Script'}</span>
                      </TracewiseBubbleButton>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    value={pitches[`pitch${pitchDuration}`] || ''}
                    onChange={(e) => handlePitchChange(`pitch${pitchDuration}`, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1.5px solid var(--tw-border)',
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      color: 'var(--tw-text)',
                      backgroundColor: '#fafbfc',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />

                  {/* AI Presentation Review Trigger */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <TracewiseBubbleButton
                      onClick={handleRunAIReview}
                      variant="primary"
                      size="sm"
                      disabled={isCritiquing || !pitches[`pitch${pitchDuration}`]?.trim()}
                      style={{ gap: '6px' }}
                    >
                      <Sparkles size={14} />
                      <span>{isCritiquing ? 'Analyzing Presentation...' : 'Critique Pitch Draft'}</span>
                    </TracewiseBubbleButton>

                    <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)' }}>
                      Evaluates problem clarity, timing pace, and hardware grounding.
                    </span>
                  </div>

                  {pitchCritique && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '20px',
                        borderRadius: '16px',
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid var(--tw-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)' }}>
                            {pitchCritique.sourceTag || 'Deterministic Rule Engine'}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-text)' }}>
                            Presentation Evaluation & Rubric Feedback
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPitchCritique(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--tw-text-muted)', fontSize: '0.76rem', cursor: 'pointer' }}
                        >
                          Dismiss
                        </button>
                      </div>

                      <div style={{ fontSize: '0.86rem', color: 'var(--tw-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {pitchCritique.text}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {generatedDrafts?.outline.map((sec, idx) => (
                    <div key={idx} style={{ padding: '18px 20px', borderRadius: '16px', backgroundColor: 'var(--tw-bg)', border: '1px solid var(--tw-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--tw-brand)', textTransform: 'uppercase' }}>
                          {sec.time} • {sec.section}
                        </span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.92rem', color: 'var(--tw-text-secondary)', lineHeight: 1.6 }}>
                        {sec.talkingPoints.map((pt, pIdx) => (
                          <li key={pIdx} style={{ marginBottom: '4px' }}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRACTICE REHEARSAL (CUE CARDS & TIMER) */}
          {activeTab === 'rehearsal' && (
            <div className="glass-card" style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 4px', fontFamily: 'var(--font-heading)' }}>
                    Presentation Rehearsal Cue Cards
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                    Rehearse your spoken pitch with timed section cue cards. Practice steady pacing before approaching judges.
                  </p>
                </div>

                {/* Built-in Timer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--tw-bg)', padding: '6px 14px', borderRadius: '14px', border: '1px solid var(--tw-border)' }}>
                  <Clock size={16} color="var(--tw-brand)" />
                  <span style={{ fontFamily: 'var(--font-code)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--tw-brand)' }}>
                    {formatRehearsalTime(rehearsalTimer)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRehearsalTimerRunning(!isRehearsalTimerRunning)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: isRehearsalTimerRunning ? '#fef08a' : 'var(--tw-brand)',
                      color: isRehearsalTimerRunning ? '#854d0e' : '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {isRehearsalTimerRunning ? 'Pause' : 'Start Timer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRehearsalTimerRunning(false);
                      setRehearsalTimer(0);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--tw-text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Cue Card Display */}
              <div
                style={{
                  padding: '36px',
                  borderRadius: '20px',
                  backgroundColor: '#071831',
                  color: '#ffffff',
                  boxShadow: '0 16px 36px rgba(7, 24, 49, 0.15)',
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CUE CARD {rehearsalCardIndex + 1} OF {rehearsalCards.length} • {rehearsalCards[rehearsalCardIndex].title}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Pacing Target: {rehearsalCards[rehearsalCardIndex].targetTime}
                    </span>
                  </div>

                  <p style={{ fontSize: '1.25rem', lineHeight: 1.6, color: '#f8fafc', fontWeight: 500, margin: 0 }}>
                    "{rehearsalCards[rehearsalCardIndex].content}"
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <button
                    type="button"
                    onClick={() => setRehearsalCardIndex(prev => Math.max(0, prev - 1))}
                    disabled={rehearsalCardIndex === 0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: rehearsalCardIndex === 0 ? '#64748b' : '#ffffff',
                      cursor: rehearsalCardIndex === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '0.84rem'
                    }}
                  >
                    <ChevronLeft size={16} />
                    <span>Previous Section</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {rehearsalCards.map((_, idx) => (
                      <span
                        key={idx}
                        onClick={() => setRehearsalCardIndex(idx)}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: rehearsalCardIndex === idx ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setRehearsalCardIndex(prev => Math.min(rehearsalCards.length - 1, prev + 1))}
                    disabled={rehearsalCardIndex === rehearsalCards.length - 1}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#2dc5e9',
                      border: 'none',
                      color: '#071831',
                      cursor: rehearsalCardIndex === rehearsalCards.length - 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '0.84rem'
                    }}
                  >
                    <span>Next Section</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: JUDGE QUESTIONS GENERATOR */}
          {activeTab === 'questions' && (
            <div className="glass-card" style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                  Anticipated Judge Questions & Technical Evidence
                </h2>
                <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                  Review these targeted inquiries tailored specifically to {ctx.hardwarePlatform}.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {judgeQuestions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      padding: '22px',
                      borderRadius: '18px',
                      backgroundColor: '#fafbfc',
                      border: '1px solid var(--tw-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: '8px', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)' }}>
                          {q.category}
                        </span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--tw-text-muted)' }}>
                          {q.difficulty}
                        </span>
                      </div>

                      {q.needsInput && (
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} />
                          Needs your input
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                      {q.question}
                    </h3>

                    <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid var(--tw-border)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-text-muted)', marginBottom: '4px' }}>
                        SUGGESTED RESPONSE:
                      </div>
                      <p style={{ fontSize: '0.92rem', color: 'var(--tw-text)', lineHeight: 1.55, margin: 0 }}>
                        {q.suggestedAnswer}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem', color: 'var(--tw-text-muted)' }}>
                      <div>
                        <b>Project Evidence:</b> {q.evidence}
                      </div>
                      <div>
                        <b>Follow-Up:</b> {q.followUp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: INTERACTIVE KNOWLEDGE QUIZ */}
          {activeTab === 'quiz' && (
            <div className="glass-card" style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                    Project Knowledge & Judging Readiness Quiz
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                    Test your understanding of the hardware architecture, power distribution, and judging strategy for {currentProj.title}.
                  </p>
                </div>

                {quizSubmitted && (
                  <div style={{ padding: '10px 18px', borderRadius: '14px', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)', fontWeight: 800, fontSize: '1.1rem' }}>
                    Score: {calculateQuizScore()}%
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {quizQuestions.map((q, idx) => {
                  const selected = quizAnswers[q.id];
                  const isAnswered = selected !== undefined;
                  const isCorrect = selected === q.correctIndex;

                  return (
                    <div key={q.id} style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#fafbfc', border: '1px solid var(--tw-border)' }}>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '14px' }}>
                        {idx + 1}. {q.question}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {q.options.map((opt, oIdx) => {
                          const isOptionSelected = selected === oIdx;
                          let bg = '#ffffff';
                          let border = 'var(--tw-border)';

                          if (quizSubmitted) {
                            if (oIdx === q.correctIndex) {
                              bg = '#f0fdf4';
                              border = '#86efac';
                            } else if (isOptionSelected) {
                              bg = '#fef2f2';
                              border = '#fca5a5';
                            }
                          } else if (isOptionSelected) {
                            bg = 'rgba(30, 63, 216, 0.05)';
                            border = 'var(--tw-brand)';
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleSelectQuizOption(q.id, oIdx)}
                              style={{
                                textAlign: 'left',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: `1.5px solid ${border}`,
                                backgroundColor: bg,
                                fontSize: '0.88rem',
                                color: 'var(--tw-text)',
                                cursor: quizSubmitted ? 'default' : 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '10px', backgroundColor: isCorrect ? '#f0fdf4' : '#fffbeb', border: `1px solid ${isCorrect ? '#bbf7d0' : '#fde68a'}`, fontSize: '0.84rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5 }}>
                          <b>Explanation:</b> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--tw-border)' }}>
                {quizSubmitted ? (
                  <TracewiseBubbleButton
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                    variant="secondary"
                  >
                    <RotateCcw size={16} />
                    <span>Retake Quiz</span>
                  </TracewiseBubbleButton>
                ) : (
                  <TracewiseBubbleButton
                    onClick={handleSubmitQuiz}
                    variant="primary"
                    disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                  >
                    <span>Submit & Check Answers</span>
                    <Check size={16} />
                  </TracewiseBubbleButton>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MOCK JUDGE INTERVIEW */}
          {activeTab === 'interview' && (
            <div className="glass-card" style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                    Live Mock Judge Interview Practice
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                    Type your verbal response to the judge’s inquiry. Receive immediate, transparent rubric feedback across 6 technical communication dimensions.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Beginner', 'Intermediate', 'Challenging'].map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        setInterviewDifficulty(diff);
                        setCurrentQuestionIndex(0);
                        setUserInterviewAnswer('');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: interviewDifficulty === diff ? 'var(--tw-brand)' : 'var(--tw-bg)',
                        color: interviewDifficulty === diff ? '#ffffff' : 'var(--tw-text-muted)'
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {interviewQuestions.length > 0 ? (
                <div>
                  <div style={{ padding: '24px', borderRadius: '18px', backgroundColor: '#f8fafc', border: '1.5px solid var(--tw-border)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase' }}>
                        QUESTION {currentQuestionIndex + 1} OF {interviewQuestions.length} • {interviewQuestions[currentQuestionIndex].category}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--tw-text-muted)' }}>
                        Difficulty: {interviewQuestions[currentQuestionIndex].difficulty}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 16px' }}>
                      "{interviewQuestions[currentQuestionIndex].question}"
                    </h3>

                    <textarea
                      rows={5}
                      value={userInterviewAnswer}
                      onChange={(e) => setUserInterviewAnswer(e.target.value)}
                      placeholder="Type your response as if speaking to competition judges..."
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid var(--tw-border)',
                        fontSize: '0.94rem',
                        lineHeight: 1.55,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <TracewiseBubbleButton
                        onClick={handleEvaluateAnswer}
                        variant="primary"
                        disabled={!userInterviewAnswer.trim() || isEvaluating}
                      >
                        <Sparkles size={16} />
                        <span>Evaluate Response</span>
                      </TracewiseBubbleButton>
                    </div>
                  </div>

                  {interviewEvaluations[interviewQuestions[currentQuestionIndex].id] && (
                    <div style={{ padding: '24px', borderRadius: '18px', backgroundColor: '#ffffff', border: '1.5px solid var(--tw-brand-soft)', boxShadow: '0 8px 24px rgba(30, 63, 216, 0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Award size={20} color="var(--tw-brand)" />
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                            Judge Panel Feedback
                          </h4>
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-brand)' }}>
                          {interviewEvaluations[interviewQuestions[currentQuestionIndex].id].score} / 100
                        </div>
                      </div>

                      <p style={{ fontSize: '0.94rem', color: 'var(--tw-text)', lineHeight: 1.5, marginBottom: '16px' }}>
                        {interviewEvaluations[interviewQuestions[currentQuestionIndex].id].summary}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                        {Object.entries(interviewEvaluations[interviewQuestions[currentQuestionIndex].id].rubric).map(([dim, val]) => (
                          <div key={dim} style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: 'var(--tw-bg)' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--tw-text-muted)', textTransform: 'capitalize' }}>
                              {dim.replace(/([A-Z])/g, ' $1')}
                            </div>
                            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--tw-text)' }}>
                              {val} / 10
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f0fdf4' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--tw-success)', textTransform: 'uppercase' }}>
                            Strengths
                          </span>
                          <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--tw-text)' }}>
                            {interviewEvaluations[interviewQuestions[currentQuestionIndex].id].strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fffbeb' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                            Practical Improvements
                          </span>
                          <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--tw-text)' }}>
                            {interviewEvaluations[interviewQuestions[currentQuestionIndex].id].improvements.map((imp, idx) => (
                              <li key={idx}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
                        {currentQuestionIndex < interviewQuestions.length - 1 ? (
                          <TracewiseBubbleButton
                            onClick={() => {
                              setCurrentQuestionIndex(prev => prev + 1);
                              setUserInterviewAnswer('');
                            }}
                            variant="primary"
                          >
                            <span>Next Question</span>
                            <ChevronRight size={16} />
                          </TracewiseBubbleButton>
                        ) : (
                          <TracewiseBubbleButton
                            onClick={() => {
                              setCurrentQuestionIndex(0);
                              setUserInterviewAnswer('');
                            }}
                            variant="secondary"
                          >
                            <RotateCcw size={16} />
                            <span>Restart Interview Session</span>
                          </TracewiseBubbleButton>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px' }}>No questions found for this difficulty.</div>
              )}
            </div>
          )}

          {/* TAB 7: SCIENCE FAIR PREPARATION CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="glass-card" style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                  Science Fair Preparation Checklist
                </h2>
                <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                  Make sure your project explanation, hardware evidence, demonstration plan, and practice rehearsal are complete.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {checklist.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '18px 22px',
                      borderRadius: '16px',
                      backgroundColor: item.completed ? '#f0fdf4' : '#fafbfc',
                      border: `1.5px solid ${item.completed ? '#bbf7d0' : 'var(--tw-border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <CheckCircle2 size={22} color={item.completed ? '#16a34a' : '#94a3b8'} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.96rem', color: item.completed ? '#15803d' : 'var(--tw-text)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--tw-text-secondary)' }}>
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {!item.completed && (
                      <button
                        type="button"
                        onClick={() => {
                          if (item.field === 'title' || item.field === 'components') {
                            if (ctx.isPhysicalProject) navigate(`/app/projects/${currentProj.id}`);
                            else setActiveTab('brief');
                          } else if (item.field === 'rehearsal') {
                            setActiveTab('rehearsal');
                          } else {
                            setActiveTab('brief');
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--tw-brand-soft)',
                          color: 'var(--tw-brand)',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Complete Item →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: EXECUTIVE ONE-PAGER SUMMARY BRIEF */}
          {activeTab === 'summary' && (
            <div className="glass-card" style={{ padding: '36px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 4px', fontFamily: 'var(--font-heading)' }}>
                    Executive One-Page Project Brief
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                    Formatted for competition binders, mentor reviews, and judges handouts. Grounded strictly in authentic project facts.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <TracewiseBubbleButton
                    onClick={() => {
                      const md = `# ${ctx.title} — Executive Project Brief\n**Platform:** ${ctx.hardwarePlatform}\n**Category:** ${ctx.archetype}\n\n## Problem Statement\n${brief.problem || 'Not specified'}\n\n## Target Audience\n${brief.audience || 'Not specified'}\n\n## Solution & Working Principle\n${brief.solution || 'Not specified'}\n\n## Components List\n${ctx.componentNames.join(', ')}\n\n## Testing Evidence\n${brief.testingEvidence || 'Bench tested'}\n\n## Honest Limitations\n${brief.limitations || 'Assembled prototype'}\n\n## Future Roadmap\n${brief.nextSteps || 'Custom PCB design'}`;
                      handleCopy(md, 'summary_md');
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    {copiedKey === 'summary_md' ? <Check size={14} color="var(--tw-success)" /> : <Copy size={14} />}
                    <span>{copiedKey === 'summary_md' ? 'Copied Markdown' : 'Copy as Markdown'}</span>
                  </TracewiseBubbleButton>

                  <TracewiseBubbleButton
                    onClick={() => window.print()}
                    variant="primary"
                    size="sm"
                  >
                    <Printer size={14} />
                    <span>Print One-Pager</span>
                  </TracewiseBubbleButton>
                </div>
              </div>

              {/* Printable Document Box */}
              <div style={{ padding: '32px', borderRadius: '18px', border: '1px solid var(--tw-border)', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '2px solid var(--tw-border)', paddingBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tw-brand)', textTransform: 'uppercase' }}>
                    TRACEWISE SCIENCE FAIR PROJECT BRIEF
                  </div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tw-text)', margin: '4px 0', fontFamily: 'var(--font-heading)' }}>
                    {ctx.title}
                  </h1>
                  <div style={{ fontSize: '0.86rem', color: 'var(--tw-text-muted)' }}>
                    Platform: {ctx.hardwarePlatform} • Archetype: {ctx.archetype} • Components: {ctx.componentsCount} Parts
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Problem Statement
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {brief.problem || 'No problem statement recorded yet. Add one in the Project Brief tab.'}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Target Audience
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {brief.audience || 'Students, robotics teams, and engineering makers.'}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Technical Solution
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {brief.solution || (ctx.isPhysicalProject ? `A physical ${ctx.hardwarePlatform} prototype integrating ${ctx.componentsCount} components.` : `A synchronized circuit with ${ctx.componentsCount} components on an Arduino Uno platform.`)}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Testing & Verification
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {brief.testingEvidence || (ctx.isPhysicalProject ? 'Bench tested and validated with hands-on physical prototype trials.' : 'Verified via static AST pin analysis and circuit simulation.')}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Current Limitations
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {brief.limitations || 'Educational prototype operating under bench conditions.'}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Future Roadmap
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {brief.nextSteps || 'Custom PCB prototyping and remote telemetry integration.'}
                    </p>
                  </div>
                </div>

                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--tw-border)', fontSize: '0.8rem', color: 'var(--tw-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{ctx.isPhysicalProject ? `Documented Physical Engineering Build (${ctx.hardwarePlatform})` : 'Verified via Tracewise Static Rule & Netlist Engine'}</span>
                  <span>Generated for Science Fair & Project Panels</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
