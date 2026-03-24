export const ADMIN_AI_PROVIDER_DEFAULTS = {
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4.1-mini',
  },
  custom_openai: {
    label: 'OpenAI-compatible',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
  },
};

export const DEFAULT_ADMIN_AI_SYSTEM_PROMPT = [
  'You are BuildSabaidee Admin AI for construction and operations support.',
  'Help summarize project updates, procurement issues, worker reports, site risks, owner communications, and next-step task lists.',
  'Keep responses practical, structured, concise, and suitable for a construction admin or project manager.',
  'When information is missing, state assumptions clearly instead of inventing facts.',
].join(' ');

function createAdminAiError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function getProviderKey(provider) {
  return String(provider || '').toLowerCase() === 'openai' || String(provider || '').toLowerCase() === 'custom_openai'
    ? 'custom_openai'
    : 'openrouter';
}

export function normalizeAdminAiSettings(settings = {}) {
  const provider = getProviderKey(settings.aiProvider);
  const defaults = ADMIN_AI_PROVIDER_DEFAULTS[provider];
  const apiKey = String(
    settings.aiApiKey
      || (provider === 'openrouter' ? settings.openRouterApiKey : settings.openAIApiKey)
      || ''
  ).trim();

  return {
    ...settings,
    aiEnabled: Boolean(settings.aiEnabled),
    aiProvider: provider,
    aiModel: String(settings.aiModel || defaults.model).trim() || defaults.model,
    aiBaseUrl: String(settings.aiBaseUrl || defaults.baseUrl).trim() || defaults.baseUrl,
    aiApiKey: apiKey,
    aiSiteName: String(settings.aiSiteName || settings.platformCompanyName || '').trim(),
    aiSystemPrompt: String(settings.aiSystemPrompt || DEFAULT_ADMIN_AI_SYSTEM_PROMPT).trim() || DEFAULT_ADMIN_AI_SYSTEM_PROMPT,
  };
}

function buildEndpoint(baseUrl) {
  const normalizedBaseUrl = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(normalizedBaseUrl)) {
    throw createAdminAiError('invalid_endpoint', 'Invalid API base URL. Use a full http(s) URL.');
  }
  return `${normalizedBaseUrl}/chat/completions`;
}

function parseMessageContent(content) {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.type === 'text') return item.text || '';
        return '';
      })
      .join('\n')
      .trim();
  }
  return '';
}

function extractAssistantText(payload) {
  const directMessage = parseMessageContent(payload?.choices?.[0]?.message?.content);
  if (directMessage) return directMessage;

  const directText = typeof payload?.choices?.[0]?.text === 'string'
    ? payload.choices[0].text.trim()
    : '';
  if (directText) return directText;

  const outputText = Array.isArray(payload?.output)
    ? payload.output
        .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
        .map((item) => (item?.type === 'output_text' ? item.text || '' : ''))
        .join('\n')
        .trim()
    : '';
  if (outputText) return outputText;

  throw createAdminAiError('invalid_response', 'The AI provider returned a response without assistant text.', { payload });
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractErrorMessage(payload, fallbackMessage) {
  return String(
    payload?.error?.message
    || payload?.message
    || payload?.detail
    || fallbackMessage
  ).trim();
}

function mapHttpError(response, payload) {
  const baseMessage = extractErrorMessage(payload, `AI request failed with status ${response.status}.`);
  if (response.status === 404) {
    return createAdminAiError('invalid_endpoint', baseMessage, { status: response.status, payload });
  }
  if (response.status === 429) {
    return createAdminAiError('rate_limit', baseMessage, { status: response.status, payload });
  }
  if (response.status === 401 || response.status === 403) {
    return createAdminAiError('auth_error', baseMessage, { status: response.status, payload });
  }
  if (response.status >= 400 && response.status < 500) {
    return createAdminAiError('bad_request', baseMessage, { status: response.status, payload });
  }
  return createAdminAiError('provider_error', baseMessage, { status: response.status, payload });
}

export function getAdminAiConfig(settings = {}) {
  const normalized = normalizeAdminAiSettings(settings);
  const provider = getProviderKey(normalized.aiProvider);
  let endpoint = '';
  try {
    endpoint = buildEndpoint(normalized.aiBaseUrl);
  } catch {
    endpoint = '';
  }
  return {
    enabled: Boolean(normalized.aiEnabled),
    provider,
    providerLabel: ADMIN_AI_PROVIDER_DEFAULTS[provider].label,
    model: normalized.aiModel,
    baseUrl: String(normalized.aiBaseUrl || '').trim(),
    endpoint,
    apiKey: String(normalized.aiApiKey || '').trim(),
    siteName: String(normalized.aiSiteName || '').trim(),
    systemPrompt: normalized.aiSystemPrompt,
  };
}

export function isAdminAiReady(settings = {}) {
  const normalized = normalizeAdminAiSettings(settings);
  return Boolean(normalized.aiEnabled && normalized.aiApiKey && normalized.aiModel);
}

function createHeaders(config) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  };

  if (config.provider === 'openrouter') {
    const safeOrigin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://buildsabaidee.app';
    headers['HTTP-Referer'] = safeOrigin;
    if (config.siteName) {
      headers['X-Title'] = config.siteName;
    }
  }

  return headers;
}

function validateConfig(config) {
  if (!config.enabled) {
    throw createAdminAiError('disabled', 'AI test mode is disabled in Admin Settings.');
  }
  if (!config.apiKey) {
    throw createAdminAiError('missing_key', 'Missing API key. Add an API key in Admin Settings.');
  }
  if (!config.model) {
    throw createAdminAiError('missing_model', 'Missing model. Add a model name in Admin Settings.');
  }
  if (!config.baseUrl) {
    throw createAdminAiError('invalid_endpoint', 'Missing API base URL. Add a valid base URL in Admin Settings.');
  }
  if (!config.endpoint) {
    throw createAdminAiError('invalid_endpoint', 'Invalid API base URL. Use a full http(s) URL.');
  }
}

function createChatRequestBody(config, messages = []) {
  return {
    model: config.model,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: config.systemPrompt,
      },
      ...messages.map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: String(message.content || '').trim(),
      })).filter((message) => message.content),
    ],
  };
}

export function buildAdminAiRequestPreview(settings = {}, messages = []) {
  const config = getAdminAiConfig(settings);
  return {
    provider: config.provider,
    providerLabel: config.providerLabel,
    endpoint: config.endpoint,
    model: config.model,
    hasApiKey: Boolean(config.apiKey),
    messages: createChatRequestBody(config, messages).messages,
  };
}

export async function sendAdminAiMessage({ settings = {}, messages = [], signal } = {}) {
  const config = getAdminAiConfig(settings);
  validateConfig(config);

  let response;
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: createHeaders(config),
      body: JSON.stringify(createChatRequestBody(config, messages)),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw createAdminAiError('network_error', 'Network error. Check the API base URL and browser connectivity.', { cause: error });
  }

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw mapHttpError(response, payload);
  }

  return {
    text: extractAssistantText(payload),
    payload,
    config,
  };
}

export async function testAdminAiConnection({ settings = {}, signal } = {}) {
  const result = await sendAdminAiMessage({
    settings,
    signal,
    messages: [
      {
        role: 'user',
        content: 'Reply with a short confirmation that the BuildSabaidee admin AI connection is working.',
      },
    ],
  });

  return {
    ...result,
    success: true,
  };
}
