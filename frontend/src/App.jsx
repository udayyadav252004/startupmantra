import { useEffect, useState } from 'react';
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

import { auth, googleProvider, hasFirebaseConfig } from './firebase';

const API = import.meta.env.VITE_API_URL;

const initialForm = {
  title: '',
  description: '',
  targetAudience: '',
  budget: '',
  experienceLevel: 'Beginner',
};

const initialAuthForm = {
  name: '',
  email: '',
  password: '',
};

const experienceOptions = ['Beginner', 'Intermediate', 'Advanced'];
const ideaCategories = ['tech', 'health', 'education', 'finance', 'productivity', 'sustainability'];
const mentorSuggestions = [
  'What should my MVP include?',
  'How do I validate this idea quickly?',
  'What is the best go-to-market plan?',
];

const surfaceCardClass =
  'rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-[0_28px_80px_rgba(0,0,0,0.35)] backdrop-blur';
const insetCardClass = 'rounded-[1.5rem] border border-white/10 bg-black/25';
const inputClass =
  'w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20';
const primaryButtonClass =
  'inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-[0_14px_32px_rgba(249,115,22,0.3)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-300/60 disabled:text-zinc-900/60';
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-orange-400/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60';

function formatDate(value) {
  if (!value) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCurrency(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return 'Budget not set';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function createMessageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMentorIntro(title) {
  return `I am your StartupMantra mentor for "${title}". Ask about MVP scope, validation, pricing, customers, or go-to-market.`;
}

function buildApiUrl(path) {
  const base = String(API || '').trim().replace(/\/$/, '');

  if (!base) {
    throw new Error('VITE_API_URL is not configured.');
  }

  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function isGoogleProviderUser(user) {
  return Boolean(
    user?.providerData?.some((provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID)
  );
}

function normalizeFirebaseUser(user) {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'StartupMantra User',
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

  const token = await user.getIdToken();

  return {
    token,
    user,
    userId: user.uid,
    normalizedUser,
  };
}

async function fetchJson(url, options = {}, config = {}) {
  const {
    requireAuth = false,
    includeUserIdInBody = false,
    includeUserIdInQuery = false,
  } = config;
  let requestUrl = buildApiUrl(url);
  const requestOptions = {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
    },
  };

  if (requireAuth) {
    const session = await getFirebaseSession();
    requestOptions.headers.Authorization = `Bearer ${session.token}`;

    if (includeUserIdInQuery) {
      const separator = requestUrl.includes('?') ? '&' : '?';
      requestUrl = `${requestUrl}${separator}userId=${encodeURIComponent(session.userId)}`;
    }

    if (includeUserIdInBody) {
      const rawPayload = options.body ? JSON.parse(options.body) : {};
      requestOptions.body = JSON.stringify({
        ...rawPayload,
        userId: session.userId,
      });
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

function SurfaceCard({ className = '', children }) {
  return <article className={`${surfaceCardClass} ${className}`}>{children}</article>;
}

function Notice({ tone, children }) {
  const toneClasses = {
    warning: 'border-orange-400/25 bg-orange-500/10 text-orange-100',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
    error: 'border-rose-500/20 bg-rose-500/10 text-rose-100',
    info: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
  };

  return <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClasses[tone]}`}>{children}</div>;
}

function StatCard({ label, value, caption }) {
  const compactValue = String(value).length > 18;

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="h-1 w-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-300" />
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className={`mt-3 font-black text-stone-50 ${compactValue ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl'}`}>
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-400">{caption}</p>
    </SurfaceCard>
  );
}

function EmptyPanel({ title, body }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-orange-400/20 bg-black/20 p-6 text-center sm:p-8">
      <h3 className="text-lg font-bold text-stone-100">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-400">{body}</p>
    </div>
  );
}

function RoadmapSection({ title, label, children, className = '' }) {
  return (
    <section className={`${insetCardClass} p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-lg font-bold text-stone-100">{title}</h4>
        <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">
          {label}
        </span>
      </div>
      {children}
    </section>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <article
        className={`max-w-[88%] rounded-[1.4rem] px-4 py-3 shadow-lg sm:max-w-[82%] ${
          isUser
            ? 'border border-orange-300/25 bg-gradient-to-br from-orange-400 to-orange-500 text-zinc-950'
            : 'border border-white/10 bg-zinc-950/85 text-stone-100'
        }`}
      >
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
            isUser ? 'text-zinc-800/75' : 'text-orange-200'
          }`}
        >
          {isUser ? 'You' : 'Mentor'}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
      </article>
    </div>
  );
}

export default function App() {
  const [formData, setFormData] = useState(initialForm);
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [ideas, setIdeas] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [chatSessions, setChatSessions] = useState({});
  const [selectedIdeaId, setSelectedIdeaId] = useState('');
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [generatorCategory, setGeneratorCategory] = useState('tech');
  const [authUser, setAuthUser] = useState(null);
  const [protectedMessage, setProtectedMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState('Checking backend...');
  const [dashboardError, setDashboardError] = useState('');
  const [ideaMessage, setIdeaMessage] = useState('');
  const [ideaError, setIdeaError] = useState('');
  const [generateMessage, setGenerateMessage] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [generatorMessage, setGeneratorMessage] = useState('');
  const [generatorError, setGeneratorError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [generatingIdeaId, setGeneratingIdeaId] = useState('');

  function resetPrivateWorkspace() {
    setIdeas([]);
    setRoadmaps([]);
    setGeneratedIdeas([]);
    setChatSessions({});
    setSelectedIdeaId('');
    setSelectedRoadmapId('');
    setChatInput('');
    setChatError('');
    setIdeaMessage('');
    setIdeaError('');
    setGenerateMessage('');
    setGenerateError('');
    setGeneratorMessage('');
    setGeneratorError('');
  }

  async function loadDashboard(options = {}) {
    const includePrivateData = options?.includePrivateData ?? Boolean(authUser);

    setIsRefreshing(true);
    setDashboardError('');

    const results = await Promise.allSettled([
      fetchJson('/test'),
      includePrivateData
        ? fetchJson('/api/ideas', {}, { requireAuth: true, includeUserIdInQuery: true })
        : Promise.resolve({ ideas: [] }),
      includePrivateData
        ? fetchJson('/api/roadmaps', {}, { requireAuth: true, includeUserIdInQuery: true })
        : Promise.resolve({ roadmaps: [] }),
    ]);

    const [statusResult, ideasResult, roadmapsResult] = results;
    const errors = [];

    if (statusResult.status === 'fulfilled') {
      setBackendStatus(statusResult.value.message);
    } else {
      setBackendStatus(statusResult.reason.message);
      errors.push(statusResult.reason.message);
    }

    if (ideasResult.status === 'fulfilled') {
      setIdeas(Array.isArray(ideasResult.value.ideas) ? ideasResult.value.ideas : []);
    } else {
      setIdeas([]);
      errors.push(ideasResult.reason.message);
    }

    if (roadmapsResult.status === 'fulfilled') {
      setRoadmaps(Array.isArray(roadmapsResult.value.roadmaps) ? roadmapsResult.value.roadmaps : []);
    } else {
      setRoadmaps([]);
      errors.push(roadmapsResult.reason.message);
    }

    if (errors.length > 0) {
      setDashboardError(errors.join(' '));
    }

    setIsRefreshing(false);
  }

  useEffect(() => {
    let isMounted = true;

    if (!hasFirebaseConfig || !auth) {
      setAuthError('Firebase Auth is not configured.');
      setIsCheckingSession(false);
      loadDashboard({ includePrivateData: false });
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) {
        return;
      }

      setIsCheckingSession(true);

      if (!user) {
        setAuthUser(null);
        setProtectedMessage('');
        resetPrivateWorkspace();
        await loadDashboard({ includePrivateData: false });
        if (isMounted) {
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        await user.reload();
        const currentUser = auth.currentUser || user;
        const normalizedUser = normalizeFirebaseUser(currentUser);

        if (!normalizedUser?.emailVerified) {
          await firebaseSignOut(auth);
          if (!isMounted) {
            return;
          }
          setAuthUser(null);
          setProtectedMessage('');
          resetPrivateWorkspace();
          setAuthError('Please verify your email before using StartupMantra.');
          await loadDashboard({ includePrivateData: false });
          return;
        }

        if (!isMounted) {
          return;
        }

        setAuthUser(normalizedUser);
        setProtectedMessage('Email verified. Your ideas, roadmaps, and mentor chat are scoped to this account only.');
        setAuthError('');
        await loadDashboard({ includePrivateData: true });
      } catch (error) {
        console.error('[auth] Could not restore Firebase session.', error);
        if (!isMounted) {
          return;
        }
        setAuthUser(null);
        setProtectedMessage('');
        resetPrivateWorkspace();
        setAuthError(
          error instanceof Error ? error.message : 'Could not restore the current Firebase session.'
        );
        await loadDashboard({ includePrivateData: false });
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
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
    if (!roadmaps.length) {
      setSelectedRoadmapId('');
      return;
    }

    if (!roadmaps.some((roadmap) => roadmap.id === selectedRoadmapId)) {
      const matchingRoadmap = roadmaps.find(
        (roadmap) => selectedIdeaId && roadmap.ideaId === selectedIdeaId
      );

      setSelectedRoadmapId(matchingRoadmap ? matchingRoadmap.id : roadmaps[0].id);
    }
  }, [roadmaps, selectedRoadmapId, selectedIdeaId]);

  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) || ideas[0] || null;
  const selectedRoadmap =
    roadmaps.find((roadmap) => roadmap.id === selectedRoadmapId) ||
    roadmaps.find((roadmap) => selectedIdea && roadmap.ideaId === selectedIdea.id) ||
    roadmaps[0] ||
    null;
  const roadmapData = selectedRoadmap?.roadmap || {
    summary: '',
    timeline: [],
    milestones: [],
    tasks: [],
    risks: [],
    tools: [],
  };
  const chatMessages = selectedIdea ? chatSessions[selectedIdea.id] || [] : [];
  const selectedIdeaRoadmapCount = selectedIdea
    ? roadmaps.filter((roadmap) => roadmap.ideaId === selectedIdea.id).length
    : 0;
  const notices = [
    dashboardError ? { key: 'dashboard', tone: 'warning', message: dashboardError } : null,
    ideaMessage ? { key: 'idea-message', tone: 'success', message: ideaMessage } : null,
    ideaError ? { key: 'idea-error', tone: 'error', message: ideaError } : null,
    generateMessage ? { key: 'generate-message', tone: 'info', message: generateMessage } : null,
    generateError ? { key: 'generate-error', tone: 'error', message: generateError } : null,
  ].filter(Boolean);

  useEffect(() => {
    if (!selectedIdea) {
      return;
    }

    setChatSessions((current) => {
      if (current[selectedIdea.id]) {
        return current;
      }

      return {
        ...current,
        [selectedIdea.id]: [
          {
            id: createMessageId('mentor'),
            role: 'assistant',
            content: createMentorIntro(selectedIdea.title),
          },
        ],
      };
    });
  }, [selectedIdea]);

  useEffect(() => {
    setChatInput('');
    setChatError('');
  }, [selectedIdeaId]);

  useEffect(() => {
    setAuthMessage('');
    setAuthError('');
  }, [authMode]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleAuthChange(event) {
    const { name, value } = event.target;

    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSelectIdea(ideaId) {
    setSelectedIdeaId(ideaId);

    const matchingRoadmap = roadmaps.find((roadmap) => roadmap.ideaId === ideaId);

    if (matchingRoadmap) {
      setSelectedRoadmapId(matchingRoadmap.id);
    }
  }

  function handleUseGeneratedIdea(idea) {
    setFormData({
      title: idea.title,
      description: idea.explanation,
      targetAudience: '',
      budget: '',
      experienceLevel: 'Beginner',
    });
    setIdeaMessage(`Loaded "${idea.title}" into the idea form. Add audience and budget, then save it.`);
    setIdeaError('');

    if (typeof document !== 'undefined') {
      document.getElementById('idea-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function handleSignOut() {
    if (!auth) {
      setAuthError('Firebase Auth is not configured.');
      return;
    }
    setAuthError('');
    try {
      await firebaseSignOut(auth);
      setAuthMessage('Signed out successfully.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign out right now.');
    }
  }

  async function handleIdeaGeneratorSubmit(event) {
    event.preventDefault();
    const category = generatorCategory.trim();

    if (!authUser) {
      setGeneratorError('Sign in with a verified account to generate startup ideas.');
      return;
    }

    if (!category) {
      setGeneratorError('Choose or enter a category before generating startup ideas.');
      return;
    }

    setIsGeneratingIdeas(true);
    setGeneratorError('');
    setGeneratorMessage('');

    try {
      const data = await fetchJson('/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
        }),
      }, {
        requireAuth: true,
        includeUserIdInBody: true,
      });

      const nextIdeas = Array.isArray(data.result?.ideas) ? data.result.ideas : [];
      setGeneratedIdeas(nextIdeas);
      setGeneratorMessage(`Generated ${nextIdeas.length} startup ideas for ${data.result?.category || category}.`);
    } catch (error) {
      setGeneratedIdeas([]);
      setGeneratorError(error instanceof Error ? error.message : 'Could not generate startup ideas.');
    } finally {
      setIsGeneratingIdeas(false);
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
      setAuthMessage('Signed in with Google successfully.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign in with Google.');
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

    const name = authForm.name.trim();
    const email = authForm.email.trim();
    const password = authForm.password;

    setIsSubmittingAuth(true);
    setAuthMessage('');
    setAuthError('');

    try {
      if (authMode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        if (name) {
          await updateProfile(credential.user, {
            displayName: name,
          });
        }

        await sendEmailVerification(credential.user);
        await firebaseSignOut(auth);

        setAuthForm(initialAuthForm);
        setAuthMode('login');
        setAuthMessage('Verification email sent. Please verify before login.');
        setProtectedMessage('');
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
          verificationMessage = 'Email not verified. A new verification email has been sent. Please verify before logging in.';
        } catch (verificationError) {
          verificationMessage = 'Email not verified. Please check your inbox and verify before logging in.';
        }

        await firebaseSignOut(auth);
        throw new Error(verificationMessage);
      }

      setAuthForm(initialAuthForm);
      setAuthMessage('Signed in successfully.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not complete authentication.');
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleIdeaSubmit(event) {
    event.preventDefault();

    if (!authUser) {
      setIdeaError('Sign in with a verified account before saving an idea.');
      return;
    }

    setIsSubmittingIdea(true);
    setIdeaMessage('');
    setIdeaError('');
    setDashboardError('');

    try {
      const data = await fetchJson('/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }, {
        requireAuth: true,
        includeUserIdInBody: true,
      });

      setIdeas((current) => [data.idea, ...current]);
      setSelectedIdeaId(data.idea.id);
      setFormData(initialForm);
      setIdeaMessage(data.message);
    } catch (error) {
      setIdeaError(error instanceof Error ? error.message : 'Could not save idea.');
    } finally {
      setIsSubmittingIdea(false);
    }
  }

  async function handleGenerateRoadmap(idea) {
    if (!authUser) {
      setGenerateError('Sign in with a verified account before generating a roadmap.');
      return;
    }

    setGeneratingIdeaId(idea.id);
    setGenerateMessage('');
    setGenerateError('');
    setDashboardError('');

    try {
      const data = await fetchJson('/generate-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          title: idea.title,
          description: idea.description,
          targetAudience: idea.targetAudience,
          budget: idea.budget,
          experienceLevel: idea.experienceLevel,
        }),
      }, {
        requireAuth: true,
        includeUserIdInBody: true,
      });

      const roadmapRecord = data.savedRoadmap || {
        id: `generated-${Date.now()}`,
        ideaId: idea.id,
        ideaTitle: idea.title,
        roadmap: data.roadmap,
        model: data.model,
        createdAt: new Date().toISOString(),
      };

      setRoadmaps((current) => [
        roadmapRecord,
        ...current.filter((item) => item.id !== roadmapRecord.id),
      ]);
      setSelectedIdeaId(idea.id);
      setSelectedRoadmapId(roadmapRecord.id);
      setGenerateMessage(data.storageWarning || data.message);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Could not generate roadmap.');
    } finally {
      setGeneratingIdeaId('');
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();

    if (!authUser) {
      setChatError('Sign in with a verified account before using mentor chat.');
      return;
    }

    if (!selectedIdea) {
      setChatError('Select an idea before chatting with the mentor.');
      return;
    }

    const question = chatInput.trim();

    if (!question) {
      setChatError('Enter a startup question to continue.');
      return;
    }

    const activeIdeaId = selectedIdea.id;
    const userMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: question,
    };
    const roadmapForChat =
      selectedRoadmap && selectedRoadmap.ideaId === selectedIdea.id ? selectedRoadmap.roadmap : null;

    setIsSendingChat(true);
    setChatError('');
    setChatInput('');
    setChatSessions((current) => ({
      ...current,
      [activeIdeaId]: [...(current[activeIdeaId] || []), userMessage],
    }));

    try {
      const data = await fetchJson('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: selectedIdea.id,
          title: selectedIdea.title,
          description: selectedIdea.description,
          targetAudience: selectedIdea.targetAudience,
          budget: selectedIdea.budget,
          experienceLevel: selectedIdea.experienceLevel,
          roadmap: roadmapForChat,
          question,
          history: chatMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      }, {
        requireAuth: true,
        includeUserIdInBody: true,
      });

      const assistantMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: data.answer,
      };

      setChatSessions((current) => ({
        ...current,
        [activeIdeaId]: [...(current[activeIdeaId] || []), assistantMessage],
      }));
    } catch (error) {
      setChatSessions((current) => ({
        ...current,
        [activeIdeaId]: (current[activeIdeaId] || []).filter((message) => message.id !== userMessage.id),
      }));
      setChatInput(question);
      setChatError(error instanceof Error ? error.message : 'Could not send chat message.');
    } finally {
      setIsSendingChat(false);
    }
  }

  return (
    <div className="min-h-screen text-stone-100">
      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className={`${surfaceCardClass} relative overflow-hidden p-6 sm:p-8 lg:p-10`}>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.18),_transparent_52%)]" />
          <div className="pointer-events-none absolute -top-8 right-10 h-36 w-36 rounded-full bg-orange-500/15 blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
            <div className="space-y-5">
              <div className="inline-flex w-fit rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-200">
                StartupMantra Dashboard
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black leading-tight text-stone-50 sm:text-5xl lg:text-6xl">
                  Connected startup workflows, from idea discovery to roadmap execution.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-stone-300 sm:text-lg">
                  Sign in with a verified Firebase account to generate ideas, save them privately, build roadmaps, and chat with the mentor in your own workspace.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  className={`${secondaryButtonClass} w-full sm:w-auto`}
                  disabled={isRefreshing}
                  onClick={loadDashboard}
                  type="button"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh dashboard'}
                </button>
                <div className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-300 sm:w-auto">
                  {selectedIdea ? `${selectedIdea.title} selected` : 'Select an idea to continue'}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  label="Ideas"
                  value={ideas.length}
                  caption="Saved startup ideas currently available for roadmap generation and chat."
                />
                <StatCard
                  label="Roadmaps"
                  value={roadmaps.length}
                  caption="Generated roadmap records returned from the backend history API."
                />
                <StatCard
                  label="Backend"
                  value={backendStatus}
                  caption="Live connection status from the Express health check route."
                />
              </div>
            </div>

            <SurfaceCard className="p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-200">
                Account
              </p>
              <div className="mt-4 space-y-4">
                {authUser ? (
                  <>
                    <div className={`${insetCardClass} p-5`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Verified account</p>
                      <h2 className="mt-3 text-2xl font-black text-stone-50">{authUser.name || 'StartupMantra User'}</h2>
                      <p className="mt-2 text-sm text-stone-300">{authUser.email}</p>
                      <p className="mt-4 text-sm leading-6 text-stone-400">
                        {protectedMessage || 'This verified Firebase account can only access its own ideas and roadmaps.'}
                      </p>
                    </div>

                    {authMessage && <Notice tone="success">{authMessage}</Notice>}
                    {authError && <Notice tone="error">{authError}</Notice>}

                    <button className={`${secondaryButtonClass} w-full`} onClick={handleSignOut} type="button">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <button
                        className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          authMode === 'login'
                            ? 'bg-orange-500 text-zinc-950'
                            : 'border border-white/10 bg-white/[0.04] text-stone-300 hover:border-orange-400/25'
                        }`}
                        onClick={() => setAuthMode('login')}
                        type="button"
                      >
                        Login
                      </button>
                      <button
                        className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          authMode === 'signup'
                            ? 'bg-orange-500 text-zinc-950'
                            : 'border border-white/10 bg-white/[0.04] text-stone-300 hover:border-orange-400/25'
                        }`}
                        onClick={() => setAuthMode('signup')}
                        type="button"
                      >
                        Signup
                      </button>
                    </div>

                    {authMessage && <Notice tone="success">{authMessage}</Notice>}
                    {authError && <Notice tone="error">{authError}</Notice>}

                    <form className="space-y-4" onSubmit={handleAuthSubmit}>
                      {authMode === 'signup' && (
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-stone-200">Name</span>
                          <input
                            className={inputClass}
                            name="name"
                            placeholder="Ada Lovelace"
                            value={authForm.name}
                            onChange={handleAuthChange}
                          />
                        </label>
                      )}

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-stone-200">Email</span>
                        <input
                          className={inputClass}
                          name="email"
                          placeholder="ada@example.com"
                          type="email"
                          value={authForm.email}
                          onChange={handleAuthChange}
                        />
                      </label>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-stone-200">Password</span>
                        <input
                          className={inputClass}
                          name="password"
                          placeholder="At least 6 characters"
                          type="password"
                          value={authForm.password}
                          onChange={handleAuthChange}
                        />
                      </label>

                      <button
                        className={`${primaryButtonClass} w-full`}
                        disabled={isSubmittingAuth || isCheckingSession}
                        type="submit"
                      >
                        {isCheckingSession
                          ? 'Checking session...'
                          : isSubmittingAuth
                            ? authMode === 'signup'
                              ? 'Creating account...'
                              : 'Signing in...'
                            : authMode === 'signup'
                              ? 'Create account'
                              : 'Sign in'}
                      </button>
                    </form>

                    <div className="space-y-3">
                      {googleProvider && (
                        <button
                          className={`${secondaryButtonClass} w-full`}
                          disabled={isSubmittingAuth || isCheckingSession}
                          onClick={handleGoogleSignIn}
                          type="button"
                        >
                          {isSubmittingAuth ? 'Opening Google...' : 'Continue with Google'}
                        </button>
                      )}
                      <p className="text-sm leading-6 text-stone-400">
                        Email and password signups must verify email before login. Google sign-in can be used as a faster verified path.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </SurfaceCard>
          </div>
        </header>

        {notices.length > 0 && (
          <section className="mt-6 grid gap-3">
            {notices.map((notice) => (
              <Notice key={notice.key} tone={notice.tone}>
                {notice.message}
              </Notice>
            ))}
          </section>
        )}

        {!hasFirebaseConfig ? (
          <section className="mt-8">
            <SurfaceCard className="p-6 sm:p-8">
              <EmptyPanel
                title="Firebase Auth is not configured"
                body="Add your VITE_FIREBASE_* environment variables so users can sign in, verify email, and load private data."
              />
            </SurfaceCard>
          </section>
        ) : !authUser ? (
          <section className="mt-8">
            <SurfaceCard className="p-6 sm:p-8">
              <EmptyPanel
                title={isCheckingSession ? 'Checking your account' : 'Sign in to access your workspace'}
                body={
                  isCheckingSession
                    ? 'We are checking Firebase Auth and your verification status.'
                    : 'Use a verified email or Google sign-in to unlock your private ideas, roadmaps, and mentor chat. Each account only sees its own data.'
                }
              />
            </SurfaceCard>
          </section>
        ) : (
        <div className="mt-8 grid gap-8 xl:grid-cols-[0.94fr_1.06fr]">
          <section className="space-y-6">
            <SurfaceCard className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200">
                    AI Idea Generator
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-stone-50 sm:text-3xl">Generate startup ideas</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-400">
                    Pick a category, generate 3 to 5 startup suggestions, and load the best one straight into your private idea form.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-300">
                  {generatedIdeas.length} ideas in current batch
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleIdeaGeneratorSubmit}>
                <div className="flex flex-wrap gap-3">
                  {ideaCategories.map((category) => (
                    <button
                      key={category}
                      className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                        generatorCategory === category
                          ? 'bg-orange-500 text-zinc-950'
                          : 'border border-white/10 bg-white/[0.05] text-stone-300 hover:border-orange-400/25 hover:bg-white/[0.08]'
                      }`}
                      onClick={() => setGeneratorCategory(category)}
                      type="button"
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-stone-200">Category</span>
                  <input
                    className={inputClass}
                    placeholder="tech, health, education, finance"
                    value={generatorCategory}
                    onChange={(event) => setGeneratorCategory(event.target.value)}
                  />
                </label>

                <button className={`${primaryButtonClass} w-full sm:w-auto`} disabled={isGeneratingIdeas} type="submit">
                  {isGeneratingIdeas ? 'Generating ideas...' : 'Generate ideas'}
                </button>
              </form>

              <div className="mt-6 space-y-4">
                {generatorMessage && <Notice tone="success">{generatorMessage}</Notice>}
                {generatorError && <Notice tone="error">{generatorError}</Notice>}
              </div>

              <div className="mt-6">
                {!generatedIdeas.length ? (
                  <EmptyPanel
                    title={isGeneratingIdeas ? 'Generating idea suggestions' : 'No generated ideas yet'}
                    body={
                      isGeneratingIdeas
                        ? 'The AI assistant is preparing startup suggestions for the selected category.'
                        : 'Run the generator to see 3 to 5 startup ideas here.'
                    }
                  />
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {generatedIdeas.map((idea, index) => (
                      <article key={`${idea.title}-${index}`} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">
                            Idea {index + 1}
                          </span>
                          <button
                            className={secondaryButtonClass}
                            onClick={() => handleUseGeneratedIdea(idea)}
                            type="button"
                          >
                            Use idea
                          </button>
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-stone-50">{idea.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-stone-400">{idea.explanation}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6 sm:p-8" id="idea-form-card">
              <div className="mb-6 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200">
                  Quick Add
                </p>
                <h2 className="text-2xl font-black text-stone-50 sm:text-3xl">Add a new startup idea</h2>
                <p className="max-w-2xl text-sm leading-7 text-stone-400">
                  Submit an idea manually or start with an AI suggestion, then store it in Firestore so it becomes part of the main dashboard flow.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleIdeaSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-stone-200">Title</span>
                  <input
                    className={inputClass}
                    name="title"
                    placeholder="AI-powered bookkeeping for neighborhood shops"
                    required
                    value={formData.title}
                    onChange={handleChange}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-stone-200">Description</span>
                  <textarea
                    className={`${inputClass} min-h-32`}
                    name="description"
                    placeholder="Explain the product, the customer problem, and why this startup should exist."
                    required
                    value={formData.description}
                    onChange={handleChange}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-stone-200">Target audience</span>
                  <input
                    className={inputClass}
                    name="targetAudience"
                    placeholder="Local retailers, freelancers, startup teams"
                    required
                    value={formData.targetAudience}
                    onChange={handleChange}
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-200">Budget</span>
                    <input
                      className={inputClass}
                      min="0"
                      name="budget"
                      placeholder="5000"
                      required
                      type="number"
                      value={formData.budget}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-stone-200">Experience level</span>
                    <select
                      className={inputClass}
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                    >
                      {experienceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <button
                  className={`${primaryButtonClass} w-full sm:w-auto`}
                  disabled={isSubmittingIdea}
                  type="submit"
                >
                  {isSubmittingIdea ? 'Saving idea...' : 'Save startup idea'}
                </button>
              </form>
            </SurfaceCard>

            <SurfaceCard className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200">
                    Idea Backlog
                  </p>
                  <div>
                    <h2 className="text-2xl font-black text-stone-50 sm:text-3xl">Submitted ideas</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-400">
                      Pick an idea to inspect context, generate a roadmap, or continue the discussion in mentor chat.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-300">
                  {ideas.length} total ideas
                </div>
              </div>

              <div className="mt-6">
                {!ideas.length ? (
                  <EmptyPanel
                    title={isRefreshing ? 'Loading ideas' : 'No ideas saved yet'}
                    body={
                      isRefreshing
                        ? 'The dashboard is requesting idea records from the backend.'
                        : 'Use the idea generator or the form above to save your first startup idea.'
                    }
                  />
                ) : (
                  <div className="grid gap-4">
                    {ideas.map((idea) => {
                      const isSelected = selectedIdea && selectedIdea.id === idea.id;
                      const isGenerating = generatingIdeaId === idea.id;

                      return (
                        <article
                          key={idea.id}
                          className={`rounded-[1.6rem] border p-5 transition sm:p-6 ${
                            isSelected
                              ? 'border-orange-400/45 bg-gradient-to-br from-orange-500/16 to-orange-500/5 shadow-[0_18px_50px_rgba(249,115,22,0.12)]'
                              : 'border-white/10 bg-black/20 hover:border-orange-400/25 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-4">
                              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                                <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-orange-200">
                                  {idea.experienceLevel}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-stone-300">
                                  {formatDate(idea.createdAt)}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-stone-50">{idea.title}</h3>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">
                                  {idea.description}
                                </p>
                              </div>
                              <div className="grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
                                <p>
                                  <span className="font-semibold text-stone-100">Audience:</span> {idea.targetAudience}
                                </p>
                                <p>
                                  <span className="font-semibold text-stone-100">Budget:</span> {formatCurrency(idea.budget)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                              <button
                                className={secondaryButtonClass}
                                onClick={() => handleSelectIdea(idea.id)}
                                type="button"
                              >
                                {isSelected ? 'Selected' : 'View idea'}
                              </button>
                              <button
                                className={primaryButtonClass}
                                disabled={isGenerating}
                                onClick={() => handleGenerateRoadmap(idea)}
                                type="button"
                              >
                                {isGenerating ? 'Generating...' : 'Generate roadmap'}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </SurfaceCard>
          </section>

          <section className="space-y-6">
            <SurfaceCard className="overflow-hidden p-6 sm:p-8">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.16),_transparent_55%)]" />
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200">
                    Roadmap Viewer
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-stone-50">Generated roadmap</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">
                    Review the latest strategy for the selected idea, then continue with mentor chat using the same context.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-300">
                    {selectedIdea ? `${selectedIdeaRoadmapCount} roadmap runs for this idea` : 'Choose an idea first'}
                  </div>
                  {selectedIdea && (
                    <button
                      className={`${primaryButtonClass} w-full sm:w-auto`}
                      disabled={generatingIdeaId === selectedIdea.id}
                      onClick={() => handleGenerateRoadmap(selectedIdea)}
                      type="button"
                    >
                      {generatingIdeaId === selectedIdea.id ? 'Generating...' : 'Generate from selected idea'}
                    </button>
                  )}
                </div>
              </div>

              {roadmaps.length > 0 && (
                <div className="relative mt-6 flex flex-wrap gap-3">
                  {roadmaps.slice(0, 5).map((roadmap) => {
                    const isSelected = selectedRoadmap && selectedRoadmap.id === roadmap.id;

                    return (
                      <button
                        key={roadmap.id}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'border border-orange-300/20 bg-orange-500 text-zinc-950'
                            : 'border border-white/10 bg-white/[0.05] text-stone-300 hover:border-orange-400/25 hover:bg-white/[0.08]'
                        }`}
                        onClick={() => setSelectedRoadmapId(roadmap.id)}
                        type="button"
                      >
                        {roadmap.ideaTitle}
                      </button>
                    );
                  })}
                </div>
              )}
            </SurfaceCard>

            {!selectedRoadmap ? (
              <SurfaceCard className="p-6 sm:p-8">
                <EmptyPanel
                  title={isRefreshing ? 'Loading roadmap history' : 'No roadmap selected'}
                  body={
                    isRefreshing
                      ? 'The dashboard is requesting roadmap history from the backend.'
                      : 'Pick an idea and generate a roadmap to view milestones, tasks, risks, tools, and timeline here.'
                  }
                />
              </SurfaceCard>
            ) : (
              <SurfaceCard className="p-6 sm:p-8">
                <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200">
                      {selectedRoadmap.ideaTitle}
                    </p>
                    <h3 className="mt-3 text-3xl font-black text-stone-50">Roadmap summary</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
                      {roadmapData.summary}
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm text-stone-400 sm:text-right">
                    <p>Generated {formatDate(selectedRoadmap.createdAt)}</p>
                    <p>Model: {selectedRoadmap.model || 'AI model'}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                  <section className="space-y-6">
                    <RoadmapSection title="Timeline" label="Phases">
                      {!roadmapData.timeline.length ? (
                        <EmptyPanel title="No timeline available" body="Generate a roadmap to populate startup phases here." />
                      ) : (
                        <div className="grid gap-3 md:grid-cols-3">
                          {roadmapData.timeline.map((phase) => (
                            <article key={`${phase.phase}-${phase.duration}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
                                {phase.duration}
                              </p>
                              <h5 className="mt-3 text-base font-bold text-stone-100">{phase.phase}</h5>
                              <p className="mt-2 text-sm leading-6 text-stone-400">{phase.focus}</p>
                            </article>
                          ))}
                        </div>
                      )}
                    </RoadmapSection>

                    <RoadmapSection title="Milestones" label="Goals">
                      {!roadmapData.milestones.length ? (
                        <EmptyPanel title="No milestones available" body="Roadmap milestones will appear here once generated." />
                      ) : (
                        <div className="grid gap-3">
                          {roadmapData.milestones.map((milestone) => (
                            <article key={`${milestone.name}-${milestone.targetPeriod}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <h5 className="text-base font-bold text-stone-100">{milestone.name}</h5>
                                  <p className="mt-2 text-sm leading-6 text-stone-400">{milestone.goal}</p>
                                </div>
                                <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
                                  {milestone.targetPeriod}
                                </span>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </RoadmapSection>

                    <RoadmapSection title="Tasks" label="Action List">
                      {!roadmapData.tasks.length ? (
                        <EmptyPanel title="No tasks available" body="Actionable startup tasks will appear here once a roadmap exists." />
                      ) : (
                        <div className="grid gap-3">
                          {roadmapData.tasks.map((task) => (
                            <article key={`${task.title}-${task.priority}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <h5 className="text-base font-bold text-stone-100">{task.title}</h5>
                                  <p className="mt-2 text-sm leading-6 text-stone-400">{task.details}</p>
                                </div>
                                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">
                                  {task.priority}
                                </span>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </RoadmapSection>
                  </section>

                  <section className="space-y-6">
                    <RoadmapSection title="Risks" label="Watchouts">
                      {!roadmapData.risks.length ? (
                        <EmptyPanel title="No risks available" body="Risk and mitigation guidance will appear here after roadmap generation." />
                      ) : (
                        <div className="grid gap-3">
                          {roadmapData.risks.map((riskItem) => (
                            <article key={riskItem.risk} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                              <h5 className="text-base font-bold text-stone-100">{riskItem.risk}</h5>
                              <p className="mt-2 text-sm leading-6 text-stone-400">{riskItem.mitigation}</p>
                            </article>
                          ))}
                        </div>
                      )}
                    </RoadmapSection>

                    <RoadmapSection title="Tools" label="Recommended Stack">
                      {!roadmapData.tools.length ? (
                        <EmptyPanel title="No tools available" body="Recommended tools will appear here after a roadmap is generated." />
                      ) : (
                        <div className="grid gap-3">
                          {roadmapData.tools.map((tool) => (
                            <article key={tool.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                              <h5 className="text-base font-bold text-stone-100">{tool.name}</h5>
                              <p className="mt-2 text-sm leading-6 text-stone-400">{tool.reason}</p>
                            </article>
                          ))}
                        </div>
                      )}
                    </RoadmapSection>
                  </section>
                </div>
              </SurfaceCard>
            )}

            <SurfaceCard className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200">
                    Mentor Chat
                  </p>
                  <h3 className="mt-3 text-2xl font-black text-stone-50 sm:text-3xl">Ask a startup question</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-400">
                    Ask about validation, pricing, product scope, or go-to-market. The mentor uses your selected idea and visible roadmap context.
                  </p>
                </div>
                {selectedIdea && (
                  <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-100">
                    {selectedIdea.title}
                  </div>
                )}
              </div>

              {!selectedIdea ? (
                <div className="mt-6">
                  <EmptyPanel
                    title="Select an idea to start chatting"
                    body="Choose an idea from the backlog so the mentor can answer with the right startup context."
                  />
                </div>
              ) : (
                <>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {mentorSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-stone-300 transition hover:border-orange-400/25 hover:bg-white/[0.08] hover:text-stone-100"
                        onClick={() => setChatInput(suggestion)}
                        type="button"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  <div className={`${insetCardClass} mt-6 p-4`}>
                    <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
                      {chatMessages.map((message) => (
                        <ChatBubble key={message.id} message={message} />
                      ))}

                      {isSendingChat && (
                        <div className="flex justify-start">
                          <div className="rounded-[1.4rem] border border-white/10 bg-zinc-950/85 px-4 py-3 text-sm text-stone-300 shadow-lg">
                            Mentor is thinking...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {chatError && (
                    <div className="mt-4">
                      <Notice tone="error">{chatError}</Notice>
                    </div>
                  )}

                  <form className="mt-5 space-y-4" onSubmit={handleChatSubmit}>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-stone-200">Your question</span>
                      <textarea
                        className={`${inputClass} min-h-32`}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder="Ask about validation, product scope, pricing, marketing, or launch strategy."
                        value={chatInput}
                      />
                    </label>

                    <button
                      className={`${primaryButtonClass} w-full sm:w-auto`}
                      disabled={isSendingChat}
                      type="submit"
                    >
                      {isSendingChat ? 'Sending question...' : 'Ask mentor'}
                    </button>
                  </form>
                </>
              )}
            </SurfaceCard>
          </section>
        </div>
        )}
      </main>
    </div>
  );
}







