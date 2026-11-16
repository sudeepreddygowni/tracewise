import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Shield,
  AlertCircle,
  Clock,
  Printer,
  Compass
} from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { useAuth } from '../store/useAuthStore';
import {
  extractProjectContext,
  generatePitchDrafts,
  generateJudgeQuestions,
  generateQuizQuestions,
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
  const navigate = useNavigate();
  const { projects, activeProject, loadProject } = useProject();
  const { user, isGuest } = useAuth();

  // Find target project
  const currentProj = (activeProject && activeProject.id === projectId)
    ? activeProject
    : projects.find(p => p.id === projectId) || activeProject || projects[0];

  const [activeTab, setActiveTab] = useState('brief'); // 'brief' | 'pitches' | 'questions' | 'quiz' | 'interview' | 'summary'

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

  // Filtered interview questions
  const interviewQuestions = judgeQuestions.filter(
    q => interviewDifficulty === 'All' || q.difficulty === interviewDifficulty
  );

  // Load saved preparation on mount
  useEffect(() => {
    async function loadSavedData() {
      if (!currentProj) return;
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
  }, [currentProj?.id]);

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
    return Math.round((correct / quizQuestions.length) * 100);
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

  if (!currentProj) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--tw-bg)', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '24px' }}>
          <AlertCircle size={32} color="var(--tw-brand)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tw-text)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
            Project Not Found
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-muted)', marginBottom: '20px' }}>
            Please select an existing project from your dashboard to open the Project Pitch Lab.
          </p>
          <TracewiseBubbleButton to="/projects" variant="primary">
            <span>Browse Starter Projects</span>
          </TracewiseBubbleButton>
        </div>
      </div>
    );
  }

  return (
    <TracewiseBubbleArea theme="light">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--tw-bg)', padding: '100px 24px 80px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Top Bar: Return to Studio & Project Context */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Link
              to={`/app/studio/${currentProj.id}`}
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
              <span>Back to Studio Canvas</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--tw-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                {saveStatus}
              </span>
              <span style={{ fontSize: '0.78rem', backgroundColor: 'var(--tw-brand-soft)', color: 'var(--tw-brand)', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
                {ctx.archetype}
              </span>
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
                <b>Build the project. Explain the thinking. Own the presentation.</b> Prepare for competition judges, technical mentors, and project showcases using your actual circuit facts.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right', padding: '12px 18px', backgroundColor: 'var(--tw-bg)', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>COMPONENTS VERIFIED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-brand)', fontFamily: 'var(--font-heading)' }}>
                  {ctx.componentsCount} Elements
                </div>
              </div>
              <div style={{ textAlign: 'right', padding: '12px 18px', backgroundColor: 'var(--tw-bg)', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--tw-text-muted)', fontWeight: 600 }}>CIRCUIT DIAGNOSTIC</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: ctx.isValid ? 'var(--tw-success)' : '#eab308', fontFamily: 'var(--font-heading)' }}>
                  {ctx.isValid ? 'Clean Schematic' : 'Check Warnings'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'brief', label: '1. Project Brief', icon: FileText },
              { id: 'pitches', label: '2. Pitch Builder', icon: Mic },
              { id: 'questions', label: '3. Judge Questions', icon: HelpCircle },
              { id: 'quiz', label: '4. Knowledge Quiz', icon: Award },
              { id: 'interview', label: '5. Mock Interview', icon: Sparkles },
              { id: 'summary', label: '6. Executive One-Pager', icon: Printer }
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
                  Technical schematics alone don’t win judging panels. Fill in these optional questions to ground your presentation in genuine human and engineering facts.
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
                    placeholder="e.g. Uses a push-button interrupt and automated timed state machine to guarantee a 15-second protected crossing sequence..."
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
                    placeholder="e.g. Simulated 50 consecutive crossing cycles in Tracewise without pin conflicts or current overloads..."
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
                    placeholder="e.g. Runs on 5V logic without outdoor waterproofing or high-amperage relay isolation..."
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
                    placeholder="e.g. Designing a custom PCB shield and adding an audio buzzer for accessibility..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--tw-border)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--tw-border)' }}>
                <TracewiseBubbleButton
                  onClick={() => setActiveTab('pitches')}
                  variant="primary"
                >
                  <span>Build Pitch Scripts</span>
                  <ChevronRight size={16} />
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

          {/* TAB 3: JUDGE QUESTIONS GENERATOR */}
          {activeTab === 'questions' && (
            <div className="glass-card" style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                  Anticipated Judge Questions & Technical Evidence
                </h2>
                <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                  Review these targeted inquiries. If critical facts are unrecorded, the question is flagged with <b>Needs your input</b> so you are never caught unprepared.
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

          {/* TAB 4: INTERACTIVE KNOWLEDGE QUIZ */}
          {activeTab === 'quiz' && (
            <div className="glass-card" style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 6px', fontFamily: 'var(--font-heading)' }}>
                    Project Knowledge & Judging Readiness Quiz
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                    Test your understanding of the circuit physics, firmware architecture, and presentation strategy behind {currentProj.title}.
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

          {/* TAB 5: MOCK JUDGE INTERVIEW */}
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
                  {/* Current Question */}
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

                    {/* Answer Area */}
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

                  {/* Feedback Panel */}
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

                      {/* Rubric Breakdown Grid */}
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

                      {/* Strengths & Improvements */}
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

                      {/* Next Question Navigation */}
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

          {/* TAB 6: EXECUTIVE ONE-PAGER SUMMARY BRIEF */}
          {activeTab === 'summary' && (
            <div className="glass-card" style={{ padding: '36px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tw-text)', margin: '0 0 4px', fontFamily: 'var(--font-heading)' }}>
                    Executive One-Page Project Brief
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--tw-text-secondary)', margin: 0 }}>
                    Formatted for handouts, competition binders, mentor reviews, and presentation summaries.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <TracewiseBubbleButton
                    onClick={() => {
                      const md = `# ${ctx.title} — Executive Project Brief\n**Archetype:** ${ctx.archetype}\n\n## Problem Statement\n${brief.problem || 'Not specified'}\n\n## Target Audience\n${brief.audience || 'Not specified'}\n\n## Hardware Solution\n${brief.solution || 'Not specified'}\n\n## Components\n${ctx.componentNames.join(', ')}\n\n## Testing Evidence\n${brief.testingEvidence || 'Verified in Tracewise Studio'}\n\n## Honest Limitations\n${brief.limitations || 'Educational prototype'}\n\n## Future Roadmap\n${brief.nextSteps || 'Custom PCB design'}`;
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
                    TRACEWISE PROJECT SUMMARY BRIEF
                  </div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--tw-text)', margin: '4px 0', fontFamily: 'var(--font-heading)' }}>
                    {ctx.title}
                  </h1>
                  <div style={{ fontSize: '0.86rem', color: 'var(--tw-text-muted)' }}>
                    Category: {ctx.archetype} • Version: {typeof ctx.version === 'object' ? (ctx.version?.id || 'v1.0') : ctx.version} • Components: {ctx.componentsCount}
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
                      {brief.solution || `A synchronized circuit with ${ctx.componentsCount} components on an Arduino Uno platform.`}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Testing & Verification
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {brief.testingEvidence || 'Verified via static AST pin analysis and circuit simulation.'}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--tw-text)', marginBottom: '4px' }}>
                      Current Limitations
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--tw-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {brief.limitations || 'Educational prototype without physical environmental shielding.'}
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
                  <span>Verified via Tracewise Static Rule & Netlist Engine</span>
                  <span>Generated for Competition & Project Panels</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </TracewiseBubbleArea>
  );
}
