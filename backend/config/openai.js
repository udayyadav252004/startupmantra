const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config({ quiet: true });

let openaiClient;
let cachedClientSignature = '';
let localEnvConfig;

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'qwen/qwen3-coder:free';
const DEFAULT_HTTP_REFERER = 'http://localhost:5173';
const DEFAULT_APP_TITLE = 'StartupMantra';
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const OPENROUTER_FREE_MODEL = 'openrouter/free';
const FALLBACK_SYSTEM_MODEL = 'fallback-system';
const ENV_FILE_PATH = path.join(__dirname, '..', '.env');
const MODELS = [
  'qwen/qwen3-coder:free',
  'mistralai/mistral-7b-instruct:free',
  'openchat/openchat-3.5:free',
  'meta-llama/llama-3-8b-instruct:free',
];

function loadLocalEnvConfig() {
  if (localEnvConfig) {
    return localEnvConfig;
  }

  try {
    if (fs.existsSync(ENV_FILE_PATH)) {
      localEnvConfig = dotenv.parse(fs.readFileSync(ENV_FILE_PATH));
      return localEnvConfig;
    }
  } catch (error) {
    console.error('[ai-config] Could not read backend .env file.', error.message);
  }

  localEnvConfig = {};
  return localEnvConfig;
}

function getPreferredAiEnvValue(name, fallback = '') {
  const localEnv = loadLocalEnvConfig();
  const localValue = String(localEnv[name] || '').trim();

  if (localValue) {
    return localValue;
  }

  return String(process.env[name] || fallback).trim();
}

function getOpenAIConfig() {
  return {
    apiKey: getPreferredAiEnvValue('OPENAI_API_KEY'),
    baseURL: getPreferredAiEnvValue('OPENAI_BASE_URL', DEFAULT_BASE_URL),
    model: getPreferredAiEnvValue('OPENAI_MODEL', DEFAULT_MODEL),
    httpReferer: getPreferredAiEnvValue('OPENAI_HTTP_REFERER', DEFAULT_HTTP_REFERER),
    appTitle: getPreferredAiEnvValue('OPENAI_APP_TITLE', DEFAULT_APP_TITLE),
  };
}

function maskApiKey(apiKey) {
  if (!apiKey) {
    return 'missing';
  }

  if (apiKey.length <= 12) {
    return `${apiKey.slice(0, 3)}***`;
  }

  return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
}

function logOpenAIConfigStatus() {
  const config = getOpenAIConfig();

  console.log('[ai-config] OpenRouter environment check', {
    apiKeyLoaded: Boolean(config.apiKey),
    apiKeyPreview: maskApiKey(config.apiKey),
    baseURL: config.baseURL,
    model: config.model,
    httpReferer: config.httpReferer,
    appTitle: config.appTitle,
  });
}

function getOpenAIClient() {
  const config = getOpenAIConfig();

  if (!config.apiKey) {
    throw new Error('OPENAI_API_KEY is missing in backend/.env. Restart the backend after updating env values.');
  }

  const nextClientSignature = [config.apiKey, config.baseURL, config.httpReferer, config.appTitle].join('|');

  if (!openaiClient || cachedClientSignature !== nextClientSignature) {
    cachedClientSignature = nextClientSignature;

    openaiClient = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: {
        'HTTP-Referer': config.httpReferer,
        'X-Title': config.appTitle,
      },
    });
  }

  return openaiClient;
}

function getOpenAIModel() {
  return getOpenAIConfig().model;
}

function getFallbackModels() {
  const configuredModel = getOpenAIModel();

  return [...new Set([configuredModel, OPENROUTER_FREE_MODEL, ...MODELS].filter(Boolean))];
}

function shouldRetryAiRequest(error) {
  return error?.status === 429 || error?.status === 503;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function createCompletionWithTimeout(client, requestBody, requestTimeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, requestTimeoutMs);

  try {
    return await client.chat.completions.create(requestBody, {
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      const timeoutError = new Error(`AI request timed out after ${requestTimeoutMs}ms.`);
      timeoutError.code = 'ETIMEDOUT';
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function toCleanString(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function toTitleCase(value) {
  return toCleanString(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getLastUserMessage(messages) {
  if (!Array.isArray(messages)) {
    return '';
  }

  const userMessages = messages.filter((message) => message?.role === 'user');
  return toCleanString(userMessages[userMessages.length - 1]?.content);
}

function inferIdeasContext(messageText) {
  const categoryMatch = String(messageText || '').match(/Category:\s*(.+)/i);

  return {
    category: toCleanString(categoryMatch?.[1], 'startup'),
  };
}

function inferRoadmapContext(messageText) {
  const text = String(messageText || '');

  return {
    title: toCleanString(text.match(/Title:\s*(.+)/i)?.[1], 'New Startup Idea'),
    description: toCleanString(text.match(/Description:\s*(.+)/i)?.[1]),
    targetAudience: toCleanString(text.match(/Target audience:\s*(.+)/i)?.[1], 'early adopters'),
    budget: toCleanString(text.match(/Budget:\s*(.+)/i)?.[1], 'lean budget'),
    experienceLevel: toCleanString(text.match(/Experience level:\s*(.+)/i)?.[1], 'beginner'),
  };
}

function buildMergedContext(type, messages, context = {}) {
  const messageText = getLastUserMessage(messages);

  if (type === 'ideas') {
    return {
      ...inferIdeasContext(messageText),
      ...context,
    };
  }

  if (type === 'roadmap') {
    return {
      ...inferRoadmapContext(messageText),
      ...context,
    };
  }

  return {
    promptText: messageText,
    ...context,
  };
}

function buildIdeasFallbackData(context = {}) {
  const category = toCleanString(context.category, 'startup');
  const categoryLabel = toTitleCase(category) || 'Startup';
  const categoryLower = categoryLabel.toLowerCase();

  return {
    category,
    ideas: [
      {
        title: `${categoryLabel} Validation Hub`,
        explanation: `A lightweight ${categoryLower} platform that helps founders test demand with surveys, landing pages, and early customer interviews before building a full product.`,
      },
      {
        title: `${categoryLabel} Operations Assistant`,
        explanation: `A simple service for small teams in ${categoryLower} that automates repetitive admin work such as scheduling, follow-ups, and basic reporting.`,
      },
      {
        title: `${categoryLabel} Insights Dashboard`,
        explanation: `A beginner-friendly dashboard that turns everyday ${categoryLower} data into clear action items so founders can make better product and growth decisions.`,
      },
    ],
  };
}

function buildRoadmapFallbackData(context = {}) {
  const title = toCleanString(context.title, 'New Startup Idea');
  const targetAudience = toCleanString(context.targetAudience, 'early adopters');
  const budget = toCleanString(context.budget, 'lean budget');
  const experienceLevel = toCleanString(context.experienceLevel, 'beginner');
  const description = toCleanString(context.description, 'Solve one clear customer problem with a simple first version.');

  return {
    summary: `${title} should start with a small validation-first launch for ${targetAudience}. Keep the first version focused, affordable, and realistic for a ${experienceLevel} founder working with a ${budget}. ${description}`,
    timeline: [
      { phase: 'Discovery', duration: 'Week 1-2', focus: 'Validate the problem and interview target users.' },
      { phase: 'Planning', duration: 'Week 3-4', focus: 'Define the MVP scope, pricing idea, and success metrics.' },
      { phase: 'Build', duration: 'Month 2', focus: 'Create the MVP and test the core workflow with early users.' },
      { phase: 'Launch', duration: 'Month 3', focus: 'Release to a small group, collect feedback, and improve retention.' },
    ],
    milestones: [
      { name: 'Problem Validation', goal: 'Confirm that customers care enough to try the solution.', targetPeriod: 'Week 2' },
      { name: 'MVP Definition', goal: 'Reduce the product to the smallest version that solves one problem well.', targetPeriod: 'Week 4' },
      { name: 'Pilot Launch', goal: 'Get the product in front of early users and collect real usage feedback.', targetPeriod: 'Month 2' },
      { name: 'Early Traction Review', goal: 'Measure usage, learn what users value, and decide the next improvements.', targetPeriod: 'Month 3' },
    ],
    tasks: [
      { title: 'Interview target users', details: 'Talk to at least 10 potential users and document their biggest workflow pain points.', priority: 'high' },
      { title: 'Study competitors', details: 'Review similar products, pricing, and positioning to find a clear angle.', priority: 'high' },
      { title: 'Define MVP scope', details: 'Choose one core use case and remove features that are not essential for launch.', priority: 'high' },
      { title: 'Create a simple prototype', details: 'Build wireframes or a clickable mockup to test the value proposition early.', priority: 'medium' },
      { title: 'Build MVP', details: 'Ship the first working version with the smallest possible set of core features.', priority: 'high' },
      { title: 'Collect feedback weekly', details: 'Track user feedback, churn reasons, and requests after launch.', priority: 'medium' },
    ],
    risks: [
      { risk: 'Weak demand from target users', mitigation: 'Validate the problem before building and continue interviewing users during development.' },
      { risk: 'Overbuilding the first version', mitigation: 'Limit the MVP to one core workflow and delay non-essential features.' },
      { risk: 'Slow adoption after launch', mitigation: 'Run a small pilot, improve onboarding, and use direct founder-led outreach.' },
    ],
    tools: [
      { name: 'Figma', reason: 'Use it to sketch and test the product before spending time on development.' },
      { name: 'Firebase', reason: 'Launch faster with simple authentication, database, and hosting tools.' },
      { name: 'Trello', reason: 'Keep the roadmap and task list organized in a beginner-friendly way.' },
      { name: 'Google Forms', reason: 'Collect early validation feedback quickly from target users.' },
    ],
  };
}

function buildChatFallbackData(context = {}) {
  const question = toCleanString(context.question, 'What should I do next for my startup?');
  const title = toCleanString(context.title, 'your startup idea');
  const targetAudience = toCleanString(context.targetAudience, 'your early users');

  return [
    `Here is a practical answer for ${title}.`,
    '',
    `For the question "${question}", start with the smallest next step that helps you learn from ${targetAudience} quickly.`,
    '1. Clarify the single customer problem you want to solve first.',
    '2. Talk to a few target users before adding more features.',
    '3. Build a very small MVP that proves the core value.',
    '4. Measure usage and feedback weekly, then improve based on real behavior.',
    '',
    'If you want the safest next move, focus on validation and traction before spending more time or money on expansion.',
  ].join('\n');
}

function buildMockFallbackData(type, context = {}) {
  if (type === 'ideas') {
    return buildIdeasFallbackData(context);
  }

  if (type === 'roadmap') {
    return buildRoadmapFallbackData(context);
  }

  return buildChatFallbackData(context);
}

function normalizeIdeaItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const title = toCleanString(item.title);
  const explanation = toCleanString(item.explanation || item.description);

  if (!title || !explanation) {
    return null;
  }

  return { title, explanation };
}

function normalizeIdeasData(rawData, context = {}) {
  const fallbackData = buildIdeasFallbackData(context);

  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    throw new Error('AI returned an invalid ideas object.');
  }

  const ideas = Array.isArray(rawData.ideas)
    ? rawData.ideas.map(normalizeIdeaItem).filter(Boolean)
    : [];

  const mergedIdeas = [...ideas];

  for (const fallbackIdea of fallbackData.ideas) {
    const alreadyIncluded = mergedIdeas.some((idea) => idea.title.toLowerCase() === fallbackIdea.title.toLowerCase());

    if (!alreadyIncluded) {
      mergedIdeas.push(fallbackIdea);
    }

    if (mergedIdeas.length >= 5) {
      break;
    }
  }

  if (mergedIdeas.length < 3) {
    throw new Error('AI returned too few startup ideas.');
  }

  return {
    category: toCleanString(rawData.category, fallbackData.category),
    ideas: mergedIdeas.slice(0, 5),
  };
}

function normalizeRoadmapList(list, normalizeItem, fallbackList) {
  const normalized = Array.isArray(list) ? list.map(normalizeItem).filter(Boolean) : [];
  return normalized.length > 0 ? normalized : fallbackList;
}

function normalizeRoadmapData(rawData, context = {}) {
  const fallbackData = buildRoadmapFallbackData(context);

  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    throw new Error('AI returned an invalid roadmap object.');
  }

  return {
    summary: toCleanString(rawData.summary, fallbackData.summary),
    timeline: normalizeRoadmapList(
      rawData.timeline,
      (item) => {
        const phase = toCleanString(item?.phase);
        const duration = toCleanString(item?.duration);
        const focus = toCleanString(item?.focus);

        if (!phase || !duration || !focus) {
          return null;
        }

        return { phase, duration, focus };
      },
      fallbackData.timeline
    ),
    milestones: normalizeRoadmapList(
      rawData.milestones,
      (item) => {
        const name = toCleanString(item?.name);
        const goal = toCleanString(item?.goal);
        const targetPeriod = toCleanString(item?.targetPeriod);

        if (!name || !goal || !targetPeriod) {
          return null;
        }

        return { name, goal, targetPeriod };
      },
      fallbackData.milestones
    ),
    tasks: normalizeRoadmapList(
      rawData.tasks,
      (item) => {
        const title = toCleanString(item?.title);
        const details = toCleanString(item?.details);
        const priority = toCleanString(item?.priority, 'medium').toLowerCase();

        if (!title || !details) {
          return null;
        }

        return {
          title,
          details,
          priority: ['high', 'medium', 'low'].includes(priority) ? priority : 'medium',
        };
      },
      fallbackData.tasks
    ),
    risks: normalizeRoadmapList(
      rawData.risks,
      (item) => {
        const risk = toCleanString(item?.risk);
        const mitigation = toCleanString(item?.mitigation);

        if (!risk || !mitigation) {
          return null;
        }

        return { risk, mitigation };
      },
      fallbackData.risks
    ),
    tools: normalizeRoadmapList(
      rawData.tools,
      (item) => {
        const name = toCleanString(item?.name);
        const reason = toCleanString(item?.reason);

        if (!name || !reason) {
          return null;
        }

        return { name, reason };
      },
      fallbackData.tools
    ),
  };
}

function normalizeChatData(rawText) {
  const answer = toCleanString(rawText);

  if (!answer) {
    throw new Error('AI returned an empty chat response.');
  }

  return answer;
}

function extractCompletionText(response) {
  const content = response?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        return item?.text || '';
      })
      .join('\n')
      .trim();
  }

  return '';
}

function stripCodeFences(text) {
  return String(text || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function parseJsonResponse(text) {
  const cleanedText = stripCodeFences(text);

  if (!cleanedText) {
    throw new Error('AI returned an empty response.');
  }

  return JSON.parse(cleanedText);
}

function buildDataFromAiText(text, type, context = {}) {
  if (type === 'ideas') {
    return normalizeIdeasData(parseJsonResponse(text), context);
  }

  if (type === 'roadmap') {
    return normalizeRoadmapData(parseJsonResponse(text), context);
  }

  return normalizeChatData(text);
}

function getFriendlyAiErrorMessage(error, options = {}) {
  const status = error?.status;
  const code = error?.code || error?.cause?.code;

  if (options.allModelsExhausted && [429, 503].includes(status)) {
    return 'All AI models are busy. Please try again.';
  }

  if (status === 401) {
    return 'AI authentication failed. Check OPENAI_API_KEY, OpenRouter headers, and restart the backend.';
  }

  if (status === 429) {
    return 'The AI provider is rate-limited or the free model is currently busy. Please try again shortly.';
  }

  if (status === 400) {
    return 'The AI request was rejected. Check the model name and prompt format.';
  }

  if (status >= 500) {
    return 'The AI provider is temporarily unavailable. Please try again in a moment.';
  }

  if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
    return 'The connection to the AI provider failed. Please try again in a moment.';
  }

  return 'The AI request failed. Please try again in a moment.';
}

function logAiError(context, error) {
  console.error(`[${context}] AI request failed.`, {
    message: error?.message,
    status: error?.status,
    code: error?.code || error?.cause?.code,
    type: error?.type,
    providerMessage: error?.error?.message,
  });
}

function buildFallbackResult(type, context = {}, error = null) {
  const data = buildMockFallbackData(type, context);

  console.warn('[ai] Using fallback-system response.', {
    type,
    reason: getFriendlyAiErrorMessage(error, { allModelsExhausted: true }),
  });

  return {
    success: true,
    modelUsed: FALLBACK_SYSTEM_MODEL,
    data,
    usedFallback: true,
    error,
  };
}

async function generateAIResponse(messages, type, options = {}) {
  const context = buildMergedContext(type, messages, options.fallbackContext);
  let client;

  try {
    client = getOpenAIClient();
  } catch (error) {
    logAiError('ai-client', error);
    return buildFallbackResult(type, context, error);
  }

  const maxTokens = options.maxTokens;
  const temperature = options.temperature ?? 0.3;
  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const fallbackModels = Array.isArray(options.models) && options.models.length > 0
    ? options.models
    : getFallbackModels();

  let lastError = null;

  for (const model of fallbackModels) {
    console.log('Trying model:', model);

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
      console.log('Retry attempt:', attempt);

      try {
        const requestBody = {
          model,
          messages,
          temperature,
        };

        if (typeof maxTokens === 'number') {
          requestBody.max_tokens = maxTokens;
        }

        const response = await createCompletionWithTimeout(client, requestBody, requestTimeoutMs);
        const outputText = extractCompletionText(response);

        if (!outputText) {
          throw new Error('AI returned an empty response.');
        }

        const data = buildDataFromAiText(outputText, type, context);

        return {
          success: true,
          modelUsed: response?.model || model,
          data,
          usedFallback: false,
        };
      } catch (error) {
        lastError = error;

        console.error('[ai] Model request failed.', {
          model,
          attempt,
          maxAttempts: MAX_RETRIES + 1,
          status: error?.status,
          code: error?.code || error?.cause?.code,
          message: error?.message,
          providerMessage: error?.error?.message,
        });

        if (error?.status === 401) {
          return buildFallbackResult(type, context, error);
        }

        const shouldRetry = shouldRetryAiRequest(error) && attempt <= MAX_RETRIES;

        if (!shouldRetry) {
          console.log(`[ai] Switching to the next model after failure: ${model}`);
          break;
        }

        const delayMs = DEFAULT_RETRY_DELAY_MS * attempt;
        await wait(delayMs);
      }
    }
  }

  return buildFallbackResult(type, context, lastError);
}

module.exports = {
  buildMockFallbackData,
  extractCompletionText,
  generateAIResponse,
  getFriendlyAiErrorMessage,
  getOpenAIClient,
  getOpenAIConfig,
  getFallbackModels,
  getOpenAIModel,
  logAiError,
  logOpenAIConfigStatus,
  MODELS,
  OPENROUTER_FREE_MODEL,
  parseJsonResponse,
};
