const CONVERSATION_GAP_MS = 45 * 60 * 1000;
const RESPONSE_WINDOW_MS = 2 * 60 * 60 * 1000;

const TOPIC_RULES = [
  { key: 'safety', topic: 'Safety', category: 'Site Safety', patterns: ['safety', 'unsafe', 'danger', 'accident', 'helmet', 'ตก', 'อันตราย', 'ความปลอดภัย', 'ປອດໄພ', 'ອັນຕະລາຍ'] },
  { key: 'materials', topic: 'Material Shortage', category: 'Procurement Delay', patterns: ['material', 'cement', 'concrete', 'steel', 'ขาด', 'วัสดุ', 'ของหมด', 'วัตถุดิบ', 'ວັດສະດຸ', 'ຂາດ'] },
  { key: 'billing', topic: 'Billing Status', category: 'Document Follow-up', patterns: ['invoice', 'billing', 'payment', 'receipt', 'ใบวางบิล', 'ใบแจ้งหนี้', 'จ่ายเงิน', 'เอกสาร', 'ໃບບິນ', 'ຊຳລະ'] },
  { key: 'schedule', topic: 'Schedule Delay', category: 'External Approval', patterns: ['delay', 'late', 'permit', 'approval', 'timeline', 'ล่าช้า', 'เลื่อน', 'อนุมัติ', 'ใบอนุญาต', 'ລ່າຊ້າ', 'ອະນຸມັດ'] },
  { key: 'progress', topic: 'Progress Update', category: 'Daily Reporting', patterns: ['progress', 'update', 'report', 'summary', 'คืบหน้า', 'รายงาน', 'สรุป', 'อัปเดต', 'ຄືບໜ້າ', 'ສະຫຼຸບ'] },
];

const POSITIVE_PATTERNS = ['thanks', 'thank you', 'good', 'done', 'completed', 'เรียบร้อย', 'ขอบคุณ', 'เสร็จแล้ว', 'สำเร็จ', 'ຂອບໃຈ', 'ສຳເລັດ'];
const NEGATIVE_PATTERNS = ['urgent', 'issue', 'problem', 'delay', 'late', 'blocked', 'risk', 'complain', 'fail', 'เสีย', 'ด่วน', 'ปัญหา', 'ล่าช้า', 'ค้าง', 'เสี่ยง', 'ร้องเรียน', 'ດ່ວນ', 'ບັນຫາ', 'ສ່ຽງ', 'ລ່າຊ້າ'];
const CLOSURE_PATTERNS = ['resolved', 'closed', 'done', 'completed', 'fixed', 'เรียบร้อย', 'ปิดงาน', 'แก้ไขแล้ว', 'เสร็จแล้ว', 'ສຳເລັດ', 'ແກ້ໄຂແລ້ວ'];
const ESCALATION_PATTERNS = ['manager', 'supervisor', 'urgent', 'escalate', 'takeover', 'หัวหน้า', 'ผู้จัดการ', 'เร่งด่วน', 'ส่งต่อ', 'ຜູ້ຈັດການ', 'ຫົວໜ້າ', 'ສົ່ງຕໍ່'];

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeChatMessage(message) {
  const createdAt = Number(message?.createdAt || Date.now());
  const senderRole = typeof message?.senderRole === 'string' ? message.senderRole : 'unknown';
  const sender = typeof message?.sender === 'string' && message.sender.trim() ? message.sender : senderRole;
  const text = typeof message?.text === 'string' ? message.text.trim() : '';
  const audioUrl = typeof message?.audioUrl === 'string' ? message.audioUrl : '';
  const roleType = senderRole === 'ai' || /^ai$/i.test(sender) || /assistant/i.test(sender)
    ? 'ai'
    : ['manager', 'owner', 'worker', 'human', 'user', 'contractor', 'foreman'].includes(senderRole)
      ? 'human'
      : 'human';

  return {
    ...message,
    id: String(message?.id || message?.clientId || `${senderRole}-${createdAt}`),
    clientId: typeof message?.clientId === 'string' ? message.clientId : '',
    createdAt,
    senderRole,
    sender,
    text,
    audioUrl,
    hasVoice: Boolean(audioUrl),
    projectId: String(message?.projectId || 'general'),
    roleType,
  };
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function inferTopic(text) {
  const normalized = String(text || '').toLowerCase();
  const match = TOPIC_RULES.find((rule) => includesAny(normalized, rule.patterns));
  if (match) return { topic: match.topic, category: match.category };
  return { topic: 'General Coordination', category: 'General Coordination' };
}

function summarizeTitle(firstHumanMessage, fallbackProjectId) {
  const sourceText = String(firstHumanMessage?.text || '').trim();
  if (!sourceText && firstHumanMessage?.hasVoice) {
    return `Voice update • ${fallbackProjectId}`;
  }
  if (!sourceText) {
    return `Project conversation • ${fallbackProjectId}`;
  }
  return sourceText.length > 64 ? `${sourceText.slice(0, 64).trim()}...` : sourceText;
}

function calculateAverageResponseMinutes(messages) {
  const responseDiffs = [];
  for (let index = 1; index < messages.length; index += 1) {
    const previous = messages[index - 1];
    const current = messages[index];
    if (previous.senderRole !== current.senderRole) {
      const diff = current.createdAt - previous.createdAt;
      if (diff > 0 && diff <= RESPONSE_WINDOW_MS) {
        responseDiffs.push(diff / 60000);
      }
    }
  }
  if (responseDiffs.length === 0) return null;
  const average = responseDiffs.reduce((sum, value) => sum + value, 0) / responseDiffs.length;
  return Math.round(average);
}

function detectSentiment(text, hasClosure) {
  const normalized = String(text || '').toLowerCase();
  const positiveHits = POSITIVE_PATTERNS.filter((pattern) => normalized.includes(pattern)).length + (hasClosure ? 1 : 0);
  const negativeHits = NEGATIVE_PATTERNS.filter((pattern) => normalized.includes(pattern)).length;
  if (negativeHits > positiveHits) return 'negative';
  if (positiveHits > negativeHits) return 'positive';
  return 'neutral';
}

function detectEscalation(text) {
  return includesAny(String(text || '').toLowerCase(), ESCALATION_PATTERNS);
}

function buildRecommendations({ topic, category, aiMessageCount, humanMessageCount, unansweredByUser, averageResponseMinutes, sentiment, hasEscalation, hasVoice }) {
  const items = [];
  if (averageResponseMinutes !== null && averageResponseMinutes > 20) {
    items.push(`AI responds slowly for ${topic.toLowerCase()} cases. Review routing and faster answer patterns.`);
  }
  if (aiMessageCount === 0 && humanMessageCount > 1) {
    items.push(`Add AI answer examples for ${topic.toLowerCase()} conversations.`);
  }
  if (category === 'Site Safety' || hasEscalation) {
    items.push(`Human takeover should remain mandatory for ${category.toLowerCase()} cases.`);
  }
  if (sentiment === 'negative') {
    items.push(`Users show dissatisfaction around ${topic.toLowerCase()}. Improve prompt guidance and escalation cues.`);
  }
  if (unansweredByUser) {
    items.push(`Conversations in ${category.toLowerCase()} often end without a clear close-out. Add closure prompts.`);
  }
  if (hasVoice) {
    items.push(`Prepare better transcript or summary support for voice-heavy ${topic.toLowerCase()} conversations.`);
  }
  return items.slice(0, 4);
}

export function buildChatConversations(rawMessages = [], reviewDecisionOverrides = {}) {
  const messages = rawMessages
    .filter(Boolean)
    .map(normalizeChatMessage)
    .sort((a, b) => a.createdAt - b.createdAt);

  const conversations = [];
  let currentConversation = null;

  messages.forEach((message) => {
    const shouldStartNewConversation = !currentConversation
      || currentConversation.projectId !== message.projectId
      || (message.createdAt - currentConversation.lastCreatedAt) > CONVERSATION_GAP_MS;

    if (shouldStartNewConversation) {
      if (currentConversation) conversations.push(currentConversation);
      currentConversation = {
        id: `conv-${message.projectId}-${message.createdAt}`,
        projectId: message.projectId,
        messages: [],
        lastCreatedAt: message.createdAt,
      };
    }

    currentConversation.messages.push(message);
    currentConversation.lastCreatedAt = message.createdAt;
  });

  if (currentConversation) conversations.push(currentConversation);

  return conversations.map((conversation) => {
    const thread = conversation.messages;
    const combinedText = thread.map((message) => message.text).filter(Boolean).join(' \n ');
    const firstHumanMessage = thread.find((message) => message.roleType === 'human') || thread[0];
    const { topic, category } = inferTopic(combinedText || firstHumanMessage?.text || '');
    const participants = Array.from(new Set(thread.map((message) => message.senderRole).filter(Boolean)));
    const aiMessageCount = thread.filter((message) => message.roleType === 'ai').length;
    const humanMessageCount = thread.length - aiMessageCount;
    const voiceMessageCount = thread.filter((message) => message.hasVoice).length;
    const averageResponseMinutes = calculateAverageResponseMinutes(thread);
    const hasClosure = includesAny(combinedText.toLowerCase(), CLOSURE_PATTERNS);
    const hasEscalation = detectEscalation(combinedText);
    const sentiment = detectSentiment(combinedText, hasClosure);
    const lastMessage = thread[thread.length - 1];
    const unansweredByUser = thread.length === 1 || (lastMessage.roleType === 'human' && !hasClosure && aiMessageCount === 0);
    const repeatedQuestionPenalty = /(\?|\u0e44\u0e2b\u0e21|\u0ec3\u0e14)/.test(combinedText) && thread.length <= 2 ? 8 : 0;
    const responsePenalty = averageResponseMinutes === null ? 10 : Math.min(20, Math.round(averageResponseMinutes / 2));
    const closureBonus = hasClosure ? 14 : 0;
    const aiBonus = aiMessageCount > 0 ? 8 : 0;
    const qualityScore = clamp(58 + closureBonus + aiBonus + Math.min(10, thread.length * 2) - responsePenalty - repeatedQuestionPenalty - (unansweredByUser ? 12 : 0));

    const businessBase = category === 'Site Safety' ? 92 : category === 'Procurement Delay' ? 88 : category === 'Document Follow-up' ? 78 : category === 'External Approval' ? 82 : 70;
    const businessValueScore = clamp(businessBase + (voiceMessageCount > 0 ? 4 : 0) + (participants.length > 2 ? 4 : 0) - (hasClosure ? 0 : 4));

    const riskScore = clamp(
      (category === 'Site Safety' ? 78 : category === 'Procurement Delay' ? 64 : category === 'External Approval' ? 58 : 32)
      + (sentiment === 'negative' ? 14 : sentiment === 'neutral' ? 4 : -10)
      + (hasEscalation ? 10 : 0)
      + (unansweredByUser ? 12 : 0)
      + (voiceMessageCount > 0 ? 3 : 0)
      - (hasClosure ? 16 : 0),
    );

    const satisfactionEstimate = clamp(
      74
      + (sentiment === 'positive' ? 14 : sentiment === 'neutral' ? 0 : -18)
      + (hasClosure ? 8 : 0)
      - (averageResponseMinutes !== null && averageResponseMinutes > 20 ? 10 : 0)
      - (unansweredByUser ? 12 : 0),
    );

    const resolutionStatus = hasClosure
      ? 'resolved'
      : aiMessageCount > 0 && !hasEscalation
        ? 'ai_resolved'
        : (riskScore >= 65 || unansweredByUser || humanMessageCount > aiMessageCount)
          ? 'human_needed'
          : 'pending';

    const recommendations = buildRecommendations({
      topic,
      category,
      aiMessageCount,
      humanMessageCount,
      unansweredByUser,
      averageResponseMinutes,
      sentiment,
      hasEscalation,
      hasVoice: voiceMessageCount > 0,
    });

    const override = reviewDecisionOverrides[conversation.id];
    const statusLabel = override === 'good_example'
      ? 'good'
      : override === 'needs_improvement'
        ? 'needs_review'
        : override === 'escalated'
          ? 'risk'
          : override === 'dataset_candidate'
            ? 'review'
            : riskScore >= 80
              ? 'risk'
              : qualityScore >= 85
                ? 'good'
                : qualityScore < 70
                  ? 'needs_review'
                  : 'review';

    return {
      id: conversation.id,
      projectId: conversation.projectId,
      title: summarizeTitle(firstHumanMessage, conversation.projectId),
      intent: topic,
      topic,
      category,
      sentiment,
      resolutionStatus,
      qualityScore,
      businessValueScore,
      satisfactionEstimate,
      riskScore,
      avgResponseMinutes: averageResponseMinutes,
      aiHandled: aiMessageCount > 0 && resolutionStatus === 'ai_resolved',
      statusLabel,
      occurredAt: thread[0]?.createdAt || Date.now(),
      lastMessageAt: lastMessage?.createdAt || Date.now(),
      messageCount: thread.length,
      voiceMessageCount,
      aiMessageCount,
      humanMessageCount,
      participants,
      participantsLabel: participants.join(', '),
      estimated: averageResponseMinutes === null,
      recommendations,
      thread: thread.map((message) => ({
        id: message.id,
        speaker: message.sender,
        role: message.roleType === 'ai' ? 'ai' : message.senderRole === 'owner' || message.senderRole === 'worker' ? 'user' : 'human',
        senderRole: message.senderRole,
        text: message.text,
        audioUrl: message.audioUrl,
        createdAt: message.createdAt,
      })),
    };
  }).sort((a, b) => b.occurredAt - a.occurredAt);
}

export function buildChatAnalytics(conversations = []) {
  const totalMessages = conversations.reduce((sum, conversation) => sum + conversation.messageCount, 0);
  const totalVoiceMessages = conversations.reduce((sum, conversation) => sum + conversation.voiceMessageCount, 0);
  const aiHandled = conversations.filter((conversation) => conversation.aiHandled).length;
  const aiMessages = conversations.reduce((sum, conversation) => sum + conversation.aiMessageCount, 0);
  const humanMessages = conversations.reduce((sum, conversation) => sum + conversation.humanMessageCount, 0);
  const responseTimeSamples = conversations.map((conversation) => conversation.avgResponseMinutes).filter((value) => Number.isFinite(value));
  const averageResponse = responseTimeSamples.length > 0
    ? Math.round(responseTimeSamples.reduce((sum, value) => sum + value, 0) / responseTimeSamples.length)
    : null;
  const sentiment = conversations.reduce((accumulator, conversation) => {
    accumulator[conversation.sentiment] = (accumulator[conversation.sentiment] || 0) + 1;
    return accumulator;
  }, { positive: 0, neutral: 0, negative: 0 });

  const topTopics = Object.entries(conversations.reduce((accumulator, conversation) => {
    accumulator[conversation.topic] = (accumulator[conversation.topic] || 0) + 1;
    return accumulator;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count }));

  const topCategories = Object.entries(conversations.reduce((accumulator, conversation) => {
    accumulator[conversation.category] = (accumulator[conversation.category] || 0) + 1;
    return accumulator;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count }));

  const averageSatisfaction = conversations.length > 0
    ? Math.round(conversations.reduce((sum, conversation) => sum + conversation.satisfactionEstimate, 0) / conversations.length)
    : 0;

  const reviewNeeded = [...conversations].sort((a, b) => (b.riskScore + (b.estimated ? 6 : 0)) - (a.riskScore + (a.estimated ? 6 : 0))).slice(0, 5);
  const interestingChats = [...conversations].sort((a, b) => (b.businessValueScore + b.qualityScore) - (a.businessValueScore + a.qualityScore)).slice(0, 5);

  const recommendations = Array.from(new Set(conversations.flatMap((conversation) => conversation.recommendations || []))).slice(0, 6);

  return {
    totalConversations: conversations.length,
    totalMessages,
    totalVoiceMessages,
    aiHandled,
    aiMessages,
    humanMessages,
    averageResponse,
    averageSatisfaction,
    sentiment,
    topTopics,
    topCategories,
    reviewNeeded,
    interestingChats,
    recommendations,
    hasEstimatedMetrics: responseTimeSamples.length !== conversations.length,
  };
}
