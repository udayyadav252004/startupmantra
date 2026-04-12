import { useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';

import Button from './components/Button';
import Card from './components/Card';
import DashboardShell from './components/DashboardShell';
import LandingShell from './components/LandingShell';
import StatusBadge from './components/StatusBadge';
import ToastStack from './components/ToastStack';
import { auth, googleProvider, hasFirebaseConfig } from './firebase';

const API = import.meta.env.VITE_API_URL;
const initialIdeaForm = { title: '', description: '', targetAudience: '', budget: '', experienceLevel: 'Beginner' };
const initialAuthForm = { name: '', email: '', password: '' };
const emptyRoadmap = { summary: '', timeline: [], milestones: [], tasks: [], risks: [], tools: [] };

function buildApiUrl(path) {
  const base = String(API || '').trim().replace(/\/$/, '');

  if (!base) {
    throw new Error('VITE_API_URL is not configured.');
  }

  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function isGoogleProviderUser(user) {
  return Boolean(user?.providerData?.some((provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID));
}

function normalizeFirebaseUser(user) {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Founder',
    email: user.email || '',
    emailVerified: Boolean(user.emailVerified || isGoogleProviderUser(user)),
  };
}

async function getFirebaseSession({ requireVerified = true } = {}) {
  if (!hasFirebaseConfig || !auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error('Please sign in to continue.');
  }

  await user.reload();
  const normalizedUser = normalizeFirebaseUser(auth.currentUser || user);

  if (requireVerified && !normalizedUser?.emailVerified) {
    throw new Error('Please verify your email before using StartupMantra.');
  }

  return { normalizedUser, token: await user.getIdToken(), user, userId: user.uid };
}

async function fetchJson(url, options = {}, config = {}) {
  const { includeUserIdInBody = false, includeUserIdInQuery = false, requireAuth = false } = config;
  let requestUrl = buildApiUrl(url);
  const requestOptions = { ...options, credentials: 'include', headers: { ...(options.headers || {}) } };

  if (requireAuth) {
    const session = await getFirebaseSession();
    requestOptions.headers.Authorization = `Bearer ${session.token}`;

    if (includeUserIdInQuery) {
      const separator = requestUrl.includes('?') ? '&' : '?';
      requestUrl = `${requestUrl}${separator}userId=${encodeURIComponent(session.userId)}`;
    }

    if (includeUserIdInBody) {
      const rawPayload = options.body ? JSON.parse(options.body) : {};
      requestOptions.body = JSON.stringify({ ...rawPayload, userId: session.userId });
      requestOptions.headers['Content-Type'] = requestOptions.headers['Content-Type'] || 'application/json';
    }
  }

  const response = await fetch(requestUrl, requestOptions);
  let payload = {};

  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.message || response.statusText || `Request failed for ${url}.`);
  }

  return payload;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMentorIntro(title) {
  return `I am your StartupMantra mentor for "${title}". Ask about MVP scope, validation, pricing, customers, or go-to-market.`;
}

function validateIdeaForm(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Give this startup idea a clear title.';
  if (form.description.trim().length < 24) errors.description = 'Add a bit more detail so the roadmap has enough context.';
  if (!form.targetAudience.trim()) errors.targetAudience = 'Tell the product who it is for.';
  if (form.budget === '') {
    errors.budget = 'Add a rough budget so the roadmap can stay realistic.';
  } else if (Number.isNaN(Number(form.budget)) || Number(form.budget) < 0) {
    errors.budget = 'Budget must be a non-negative number.';
  }
  if (!form.experienceLevel.trim()) errors.experienceLevel = 'Choose the founder experience level.';
  return errors;
}

function validateAuthForm(form, mode) {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (mode === 'signup' && !form.name.trim()) errors.name = 'Add your name so the workspace can personalize the experience.';
  if (!emailPattern.test(form.email.trim())) errors.email = 'Use a valid email address.';
  if (form.password.length < 6) errors.password = 'Password should be at least 6 characters.';
  return errors;
}

function describeAuthError(error) {
  const code = String(error?.code || '');
  if (code.includes('email-already-in-use')) return 'That email is already in use. Try logging in instead.';
  if (code.includes('invalid-email')) return 'That email address looks invalid.';
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) return 'Those credentials do not match an existing account.';
  if (code.includes('too-many-requests')) return 'Too many attempts for now. Please wait a moment and try again.';
  if (code.includes('popup-closed-by-user')) return 'The Google sign-in popup was closed before finishing.';
  return error instanceof Error ? error.message : 'Something went wrong while authenticating.';
}

export default function App() {
  const [ideaForm, setIdeaForm] = useState(initialIdeaForm);
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [ideas, setIdeas] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [chatSessions, setChatSessions] = useState({});
  const [selectedIdeaId, setSelectedIdeaId] = useState('');
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const [generatorCategory, setGeneratorCategory] = useState('tech');
  const [authMode, setAuthMode] = useState('signup');
  const [authUser, setAuthUser] = useState(null);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [authFieldErrors, setAuthFieldErrors] = useState({});
  const [ideaFieldErrors, setIdeaFieldErrors] = useState({});
  const [backendStatus, setBackendStatus] = useState('Connecting...');
  const [dashboardError, setDashboardError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [activeRoadmapIdeaId, setActiveRoadmapIdeaId] = useState('');
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef(new Map());

  const backendOnline = String(backendStatus).toLowerCase().includes('running');
  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) || ideas[0] || null;
  const selectedIdeaRoadmaps = selectedIdea ? roadmaps.filter((roadmap) => roadmap.ideaId === selectedIdea.id) : [];
  const selectedRoadmap = selectedIdeaRoadmaps.find((roadmap) => roadmap.id === selectedRoadmapId) || selectedIdeaRoadmaps[0] || null;
  const roadmapData = selectedRoadmap?.roadmap || emptyRoadmap;
  const chatMessages = selectedIdea ? chatSessions[selectedIdea.id] || [] : [];

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      toastTimersRef.current.clear();
    };
  }, []);

  function dismissToast(id) {
    const timerId = toastTimersRef.current.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      toastTimersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function pushToast({ tone = 'info', title, description = '', duration = 4200, persistent = false }) {
    const id = createId('toast');
    setToasts((current) => [...current, { description, id, title, tone }]);
    if (!persistent) {
      const timerId = window.setTimeout(() => dismissToast(id), duration);
      toastTimersRef.current.set(id, timerId);
    }
    return id;
  }

  function scrollToSection(id) {
    if (typeof document === 'undefined') return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function jumpToPrimaryAction() {
    if (authUser) {
      scrollToSection('idea-studio');
      return;
    }
    setAuthMode('signup');
    scrollToSection('auth-panel');
  }

  function resetWorkspace() {
    setIdeas([]);
    setRoadmaps([]);
    setGeneratedIdeas([]);
    setChatSessions({});
    setSelectedIdeaId('');
    setSelectedRoadmapId('');
    setChatInput('');
    setChatError('');
    setIdeaForm(initialIdeaForm);
    setIdeaFieldErrors({});
    setDashboardError('');
  }

  async function loadDashboard(options = {}) {
    const includePrivateData = options.includePrivateData ?? Boolean(authUser);
    setIsRefreshing(true);
    setDashboardError('');

    const results = await Promise.allSettled([
      fetchJson('/test'),
      includePrivateData ? fetchJson('/api/ideas', {}, { includeUserIdInQuery: true, requireAuth: true }) : Promise.resolve({ ideas: [] }),
      includePrivateData ? fetchJson('/api/roadmaps', {}, { includeUserIdInQuery: true, requireAuth: true }) : Promise.resolve({ roadmaps: [] }),
    ]);

    const [statusResult, ideasResult, roadmapsResult] = results;
    const errors = [];

    if (statusResult.status === 'fulfilled') {
      setBackendStatus(statusResult.value.message || 'Backend running');
    } else {
      setBackendStatus(statusResult.reason.message || 'Backend unavailable');
      errors.push(statusResult.reason.message || 'Could not reach the backend.');
    }

    if (ideasResult.status === 'fulfilled') {
      setIdeas(Array.isArray(ideasResult.value.ideas) ? ideasResult.value.ideas : []);
    } else {
      setIdeas([]);
      errors.push(ideasResult.reason.message || 'Could not load ideas.');
    }

    if (roadmapsResult.status === 'fulfilled') {
      setRoadmaps(Array.isArray(roadmapsResult.value.roadmaps) ? roadmapsResult.value.roadmaps : []);
    } else {
      setRoadmaps([]);
      errors.push(roadmapsResult.reason.message || 'Could not load roadmaps.');
    }

    if (errors.length) setDashboardError(errors.join(' '));
    setIsRefreshing(false);
  }

  useEffect(() => {
    let isMounted = true;

    if (!hasFirebaseConfig || !auth) {
      setAuthError('Firebase Auth is not configured. Add your VITE_FIREBASE_* values to unlock the product experience.');
      setIsCheckingSession(false);
      loadDashboard({ includePrivateData: false });
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setIsCheckingSession(true);

      if (!user) {
        setAuthUser(null);
        resetWorkspace();
        await loadDashboard({ includePrivateData: false });
        if (isMounted) setIsCheckingSession(false);
        return;
      }

      try {
        await user.reload();
        const currentUser = auth.currentUser || user;
        const normalizedUser = normalizeFirebaseUser(currentUser);

        if (!normalizedUser?.emailVerified) {
          await firebaseSignOut(auth);
          if (!isMounted) return;
          setAuthUser(null);
          resetWorkspace();
          setAuthError('Please verify your email before using StartupMantra.');
          await loadDashboard({ includePrivateData: false });
          return;
        }

        if (!isMounted) return;
        setAuthUser(normalizedUser);
        setAuthError('');
        await loadDashboard({ includePrivateData: true });
      } catch (error) {
        if (!isMounted) return;
        console.error('[auth] Could not restore Firebase session.', error);
        setAuthUser(null);
        resetWorkspace();
        setAuthError(error instanceof Error ? error.message : 'Could not restore your session.');
        await loadDashboard({ includePrivateData: false });
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ideas.length) {
      setSelectedIdeaId('');
      return;
    }
    if (!ideas.some((idea) => idea.id === selectedIdeaId)) {
      setSelectedIdeaId(ideas[0].id);
    }
  }, [ideas, selectedIdeaId]);

  useEffect(() => {
    if (!selectedIdea || !selectedIdeaRoadmaps.length) {
      setSelectedRoadmapId('');
      return;
    }
    if (!selectedIdeaRoadmaps.some((roadmap) => roadmap.id === selectedRoadmapId)) {
      setSelectedRoadmapId(selectedIdeaRoadmaps[0].id);
    }
  }, [selectedIdea, selectedIdeaRoadmaps, selectedRoadmapId]);

  useEffect(() => {
    if (!selectedIdea) return;
    setChatSessions((current) => {
      if (current[selectedIdea.id]) return current;
      return {
        ...current,
        [selectedIdea.id]: [{ animate: false, content: createMentorIntro(selectedIdea.title), id: createId('mentor'), role: 'assistant' }],
      };
    });
  }, [selectedIdea]);

  useEffect(() => {
    setChatError('');
  }, [selectedIdeaId]);

  useEffect(() => {
    setAuthMessage('');
    setAuthError('');
    setAuthFieldErrors({});
  }, [authMode]);

  function handleIdeaFormChange(event) {
    const { name, value } = event.target;
    setIdeaForm((current) => ({ ...current, [name]: value }));
    setIdeaFieldErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleAuthChange(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
    setAuthFieldErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleSelectIdea(ideaId) {
    setSelectedIdeaId(ideaId);
    const matchingRoadmap = roadmaps.find((roadmap) => roadmap.ideaId === ideaId);
    if (matchingRoadmap) setSelectedRoadmapId(matchingRoadmap.id);
  }

  function handleSelectRoadmap(roadmapId) {
    const matchingRoadmap = roadmaps.find((roadmap) => roadmap.id === roadmapId);
    if (!matchingRoadmap) return;
    setSelectedIdeaId(matchingRoadmap.ideaId);
    setSelectedRoadmapId(matchingRoadmap.id);
  }

  function handleUseGeneratedIdea(idea) {
    setIdeaForm({ title: idea.title, description: idea.explanation, targetAudience: '', budget: '', experienceLevel: 'Beginner' });
    setIdeaFieldErrors({});
    pushToast({ tone: 'success', title: 'Idea loaded into your draft', description: 'Add your target audience and budget, then save it into the workspace.' });
    scrollToSection('idea-capture');
  }

  async function handleRefreshWorkspace() {
    await loadDashboard({ includePrivateData: Boolean(authUser) });
    pushToast({ tone: backendOnline ? 'success' : 'info', title: 'Workspace refreshed', description: backendOnline ? 'Your private ideas and roadmaps are up to date.' : 'We refreshed what we could, but the backend health check still needs attention.' });
  }

  async function handleSignOut() {
    if (!auth) {
      setAuthError('Firebase Auth is not configured.');
      return;
    }

    try {
      await firebaseSignOut(auth);
      pushToast({ tone: 'info', title: 'Signed out', description: 'Your private workspace has been closed on this device.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not sign out right now.';
      setAuthError(message);
      pushToast({ tone: 'error', title: 'Sign out failed', description: message });
    }
  }

  async function handleGoogleSignIn() {
    if (!auth || !googleProvider) {
      setAuthError('Google sign-in is not configured.');
      return;
    }

    setIsSubmittingAuth(true);
    setAuthMessage('');
    setAuthError('');

    try {
      await signInWithPopup(auth, googleProvider);
      setAuthForm(initialAuthForm);
      pushToast({ tone: 'success', title: 'Welcome to StartupMantra', description: 'Your Google account is ready and your workspace is loading.' });
    } catch (error) {
      const message = describeAuthError(error);
      setAuthError(message);
      pushToast({ tone: 'error', title: 'Google sign-in failed', description: message });
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    if (!auth) {
      setAuthError('Firebase Auth is not configured.');
      return;
    }

    const fieldErrors = validateAuthForm(authForm, authMode);
    if (Object.keys(fieldErrors).length) {
      setAuthFieldErrors(fieldErrors);
      pushToast({ tone: 'error', title: 'Check your details', description: 'A few fields still need attention before we can continue.' });
      return;
    }

    const name = authForm.name.trim();
    const email = authForm.email.trim();
    const password = authForm.password;

    setIsSubmittingAuth(true);
    setAuthMessage('');
    setAuthError('');

    try {
      if (authMode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(credential.user, { displayName: name });
        await sendEmailVerification(credential.user);
        await firebaseSignOut(auth);
        setAuthForm(initialAuthForm);
        setAuthMode('login');
        setAuthMessage('Verification email sent. Please verify before login.');
        pushToast({ tone: 'success', title: 'Verify your email', description: 'We sent a verification link. Open it, then come back and sign in.' });
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      await credential.user.reload();
      const currentUser = auth.currentUser || credential.user;
      const normalizedUser = normalizeFirebaseUser(currentUser);

      if (!normalizedUser?.emailVerified) {
        let verificationMessage = 'Please verify your email before logging in.';
        try {
          await sendEmailVerification(currentUser);
          verificationMessage = 'Email not verified. A fresh verification email has been sent.';
        } catch (verificationError) {
          verificationMessage = 'Email not verified. Please check your inbox and verify before logging in.';
        }
        await firebaseSignOut(auth);
        throw new Error(verificationMessage);
      }

      setAuthForm(initialAuthForm);
      setAuthMessage('Welcome back. Loading your private workspace now.');
      pushToast({ tone: 'success', title: 'Signed in successfully', description: 'Your verified workspace is ready.' });
    } catch (error) {
      const message = describeAuthError(error);
      setAuthError(message);
      pushToast({ tone: 'error', title: 'Authentication failed', description: message });
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleIdeaGeneratorSubmit(event) {
    event.preventDefault();
    const category = generatorCategory.trim();

    if (!authUser) {
      pushToast({ tone: 'error', title: 'Sign in first', description: 'Use a verified account before generating startup ideas.' });
      return;
    }

    if (!category) {
      pushToast({ tone: 'error', title: 'Choose a category', description: 'Pick a startup category before asking the AI for ideas.' });
      return;
    }

    setIsGeneratingIdeas(true);
    const loadingToastId = pushToast({ tone: 'loading', title: 'Generating startup ideas', description: 'Looking for founder-friendly directions with stronger market wedges.', persistent: true });

    try {
      const data = await fetchJson('/generate-ideas', { body: JSON.stringify({ category }), headers: { 'Content-Type': 'application/json' }, method: 'POST' }, { includeUserIdInBody: true, requireAuth: true });
      const nextIdeas = Array.isArray(data.result?.ideas) ? data.result.ideas : [];
      setGeneratedIdeas(nextIdeas);
      dismissToast(loadingToastId);
      pushToast({ tone: 'success', title: 'Fresh ideas ready', description: `Generated ${nextIdeas.length} startup directions for ${data.result?.category || category}.` });
    } catch (error) {
      dismissToast(loadingToastId);
      setGeneratedIdeas([]);
      pushToast({ tone: 'error', title: 'Idea generation failed', description: error instanceof Error ? error.message : 'Could not generate startup ideas.' });
    } finally {
      setIsGeneratingIdeas(false);
    }
  }

  async function handleSubmitIdea(event) {
    event.preventDefault();

    if (!authUser) {
      pushToast({ tone: 'error', title: 'Sign in first', description: 'Use a verified account before saving an idea.' });
      return;
    }

    const fieldErrors = validateIdeaForm(ideaForm);
    if (Object.keys(fieldErrors).length) {
      setIdeaFieldErrors(fieldErrors);
      pushToast({ tone: 'error', title: 'Complete the draft', description: 'A few details are missing before this idea can be saved.' });
      return;
    }

    setIsSubmittingIdea(true);
    const loadingToastId = pushToast({ tone: 'loading', title: 'Saving idea', description: 'Adding this startup concept to your private workspace.', persistent: true });

    try {
      const data = await fetchJson('/api/ideas', { body: JSON.stringify(ideaForm), headers: { 'Content-Type': 'application/json' }, method: 'POST' }, { includeUserIdInBody: true, requireAuth: true });
      setIdeas((current) => [data.idea, ...current.filter((idea) => idea.id !== data.idea.id)]);
      setSelectedIdeaId(data.idea.id);
      setIdeaForm(initialIdeaForm);
      setIdeaFieldErrors({});
      dismissToast(loadingToastId);
      pushToast({ tone: 'success', title: 'Idea saved', description: 'Your private startup workspace is ready for roadmap generation.' });
    } catch (error) {
      dismissToast(loadingToastId);
      pushToast({ tone: 'error', title: 'Could not save idea', description: error instanceof Error ? error.message : 'Something went wrong while saving the idea.' });
    } finally {
      setIsSubmittingIdea(false);
    }
  }

  async function handleGenerateRoadmap(idea) {
    if (!authUser) {
      pushToast({ tone: 'error', title: 'Sign in first', description: 'Use a verified account before generating a roadmap.' });
      return;
    }

    setActiveRoadmapIdeaId(idea.id);
    const loadingToastId = pushToast({ tone: 'loading', title: 'Generating roadmap', description: 'Sequencing milestones, tasks, tools, and risks for this idea.', persistent: true });

    try {
      const data = await fetchJson('/generate-roadmap', { body: JSON.stringify({ budget: idea.budget, description: idea.description, experienceLevel: idea.experienceLevel, ideaId: idea.id, targetAudience: idea.targetAudience, title: idea.title }), headers: { 'Content-Type': 'application/json' }, method: 'POST' }, { includeUserIdInBody: true, requireAuth: true });
      const roadmapRecord = data.savedRoadmap || { createdAt: new Date().toISOString(), id: createId('generated-roadmap'), ideaId: idea.id, ideaTitle: idea.title, model: data.model, roadmap: data.roadmap };
      setRoadmaps((current) => [roadmapRecord, ...current.filter((item) => item.id !== roadmapRecord.id)]);
      setSelectedIdeaId(idea.id);
      setSelectedRoadmapId(roadmapRecord.id);
      dismissToast(loadingToastId);
      pushToast({ tone: data.storageWarning ? 'info' : 'success', title: 'Roadmap ready', description: data.storageWarning || 'Your execution plan is now available in the workspace.' });
    } catch (error) {
      dismissToast(loadingToastId);
      pushToast({ tone: 'error', title: 'Could not generate roadmap', description: error instanceof Error ? error.message : 'Something went wrong while generating the roadmap.' });
    } finally {
      setActiveRoadmapIdeaId('');
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();
    if (!authUser) {
      const message = 'Use a verified account before using mentor chat.';
      setChatError(message);
      pushToast({ tone: 'error', title: 'Sign in first', description: message });
      return;
    }
    if (!selectedIdea) {
      setChatError('Select or save an idea before chatting with the mentor.');
      return;
    }

    const question = chatInput.trim();
    if (!question) {
      setChatError('Write a startup question before sending it to the mentor.');
      return;
    }

    const activeIdeaId = selectedIdea.id;
    const currentMessages = chatSessions[activeIdeaId] || [];
    const roadmapForChat = selectedRoadmap && selectedRoadmap.ideaId === selectedIdea.id ? selectedRoadmap.roadmap : null;
    const userMessage = { animate: false, content: question, id: createId('user'), role: 'user' };

    setIsSendingChat(true);
    setChatError('');
    setChatInput('');
    setChatSessions((current) => ({ ...current, [activeIdeaId]: [...(current[activeIdeaId] || []), userMessage] }));

    try {
      const data = await fetchJson('/chat', { body: JSON.stringify({ budget: selectedIdea.budget, description: selectedIdea.description, experienceLevel: selectedIdea.experienceLevel, history: currentMessages.map((message) => ({ content: message.content, role: message.role })), ideaId: selectedIdea.id, question, roadmap: roadmapForChat, targetAudience: selectedIdea.targetAudience, title: selectedIdea.title }), headers: { 'Content-Type': 'application/json' }, method: 'POST' }, { includeUserIdInBody: true, requireAuth: true });
      const assistantMessage = { animate: true, content: data.answer, id: createId('assistant'), role: 'assistant' };
      setChatSessions((current) => ({ ...current, [activeIdeaId]: [...(current[activeIdeaId] || []), assistantMessage] }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not send your message.';
      setChatSessions((current) => ({ ...current, [activeIdeaId]: (current[activeIdeaId] || []).filter((item) => item.id !== userMessage.id) }));
      setChatInput(question);
      setChatError(message);
      pushToast({ tone: 'error', title: 'Mentor response failed', description: message });
    } finally {
      setIsSendingChat(false);
    }
  }

  return (
    <div className="min-h-screen text-slate-100">
      <ToastStack onDismiss={dismissToast} toasts={toasts} />

      <main className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="sticky top-4 z-40 mb-8">
          <Card tone="soft" padding="sm" className="border-white/10 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(168,85,247,0.95))] text-sm font-semibold tracking-[0.18em] text-white shadow-[0_16px_34px_rgba(79,70,229,0.38)]">SM</div>
                <div>
                  <p className="text-lg font-semibold tracking-tight text-white">StartupMantra</p>
                  <p className="text-sm text-slate-400">Your Idea, Our Roadmap</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {authUser ? (
                  <StatusBadge tone="info">Private workspace active</StatusBadge>
                ) : (
                  <>
                    <Button onClick={() => scrollToSection('product-flow')} size="sm" variant="secondary">How it works</Button>
                    <Button onClick={jumpToPrimaryAction} size="sm">Generate Your First Idea</Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </header>

        {authUser ? (
          <DashboardShell
            activeRoadmapIdeaId={activeRoadmapIdeaId}
            authUser={authUser}
            backendOnline={backendOnline}
            backendStatus={backendStatus}
            chatError={chatError}
            chatInput={chatInput}
            chatMessages={chatMessages}
            dashboardError={dashboardError}
            generatedIdeas={generatedIdeas}
            generatorCategory={generatorCategory}
            handleChatSubmit={handleChatSubmit}
            handleGenerateRoadmap={handleGenerateRoadmap}
            handleIdeaFormChange={handleIdeaFormChange}
            handleIdeaGeneratorSubmit={handleIdeaGeneratorSubmit}
            handleRefreshWorkspace={handleRefreshWorkspace}
            handleSelectIdea={handleSelectIdea}
            handleSelectRoadmap={handleSelectRoadmap}
            handleSignOut={handleSignOut}
            handleSubmitIdea={handleSubmitIdea}
            handleUseGeneratedIdea={handleUseGeneratedIdea}
            ideaFieldErrors={ideaFieldErrors}
            ideaForm={ideaForm}
            ideas={ideas}
            isGeneratingIdeas={isGeneratingIdeas}
            isRefreshing={isRefreshing}
            isSendingChat={isSendingChat}
            isSubmittingIdea={isSubmittingIdea}
            roadmapData={roadmapData}
            selectedIdea={selectedIdea}
            selectedIdeaRoadmaps={selectedIdeaRoadmaps}
            selectedRoadmap={selectedRoadmap}
            setChatInput={setChatInput}
            setGeneratorCategory={setGeneratorCategory}
          />
        ) : (
          <LandingShell
            authError={authError}
            authFieldErrors={authFieldErrors}
            authForm={authForm}
            authMessage={authMessage}
            authMode={authMode}
            handleAuthChange={handleAuthChange}
            handleAuthSubmit={handleAuthSubmit}
            handleGoogleSignIn={handleGoogleSignIn}
            hasFirebaseConfig={hasFirebaseConfig}
            isCheckingSession={isCheckingSession}
            isSubmittingAuth={isSubmittingAuth}
            jumpToPrimaryAction={jumpToPrimaryAction}
            scrollToSection={scrollToSection}
            setAuthMode={setAuthMode}
            showGoogleSignIn={Boolean(googleProvider)}
          />
        )}
      </main>
    </div>
  );
}
