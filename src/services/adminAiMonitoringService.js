import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { buildChatConversations } from '../chatAnalytics';

const CHATS_COLLECTION = 'chats';
const AI_CHAT_PROJECT_ID = 'ai-nong-sabaidee';
const AI_CHAT_SOURCE = 'ai_nong_sabaidee';

function normalizeTimestamp(value) {
  const parsed = Number(value || Date.now());
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function createReviewItemId(conversationId) {
  return `ai-chat-${String(conversationId || '').trim() || 'general'}`;
}

function createThreadTranscript(thread = []) {
  return thread
    .map((message) => `${message.speaker || message.senderRole || 'Unknown'}: ${String(message.text || '').trim() || '[voice message]'}`)
    .join('\n');
}

export function createAdminAiConversationId() {
  return `ai-chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAdminAiChatMessage({
  conversationId,
  senderRole,
  sender,
  text,
  projectId = AI_CHAT_PROJECT_ID,
  context = 'website_ai_assistant',
  messageType = 'text',
  createdAt = Date.now(),
}) {
  const normalizedCreatedAt = normalizeTimestamp(createdAt);
  const messageId = `${conversationId}-${senderRole}-${normalizedCreatedAt}`;
  return {
    messageId,
    clientId: messageId,
    conversationId,
    sender: String(sender || senderRole || '').trim() || 'unknown',
    senderRole: String(senderRole || '').trim() || 'unknown',
    text: String(text || '').trim(),
    time: new Date(normalizedCreatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
    projectId: String(projectId || AI_CHAT_PROJECT_ID).trim() || AI_CHAT_PROJECT_ID,
    context: String(context || 'website_ai_assistant').trim() || 'website_ai_assistant',
    messageType: String(messageType || 'text').trim() || 'text',
    source: AI_CHAT_SOURCE,
    createdAt: normalizedCreatedAt,
  };
}

export async function logAdminAiChatMessage(db, message) {
  if (!db || !message) return null;
  return addDoc(collection(db, CHATS_COLLECTION), message);
}

export async function syncAdminAiReviewItem(db, messages = []) {
  if (!db || !Array.isArray(messages) || messages.length === 0) return null;

  const conversations = buildChatConversations(messages);
  const conversation = conversations[conversations.length - 1];
  if (!conversation) return null;

  const transcript = createThreadTranscript(conversation.thread);
  const reviewItemId = createReviewItemId(conversation.id);

  await setDoc(doc(db, 'ai_review_items', reviewItemId), {
    title: conversation.title,
    conversationText: transcript,
    transcript,
    category: conversation.category,
    tags: [
      String(conversation.topic || '').trim(),
      String(conversation.resolutionStatus || '').trim(),
      AI_CHAT_SOURCE,
      ...(conversation.voiceMessageCount > 0 ? ['voice'] : []),
    ].filter(Boolean),
    riskScore: Number(conversation.riskScore || 0),
    satisfactionEstimate: Number(conversation.satisfactionEstimate || 0),
    qualityScore: Number(conversation.qualityScore || 0),
    businessValueScore: Number(conversation.businessValueScore || 0),
    status: Number(conversation.riskScore || 0) >= 75 ? 'pending' : Number(conversation.qualityScore || 0) >= 88 ? 'dataset_candidate' : 'pending',
    sourceType: AI_CHAT_SOURCE,
    sourceConversationId: conversation.id,
    reviewedBy: '',
    notes: '',
    createdAt: normalizeTimestamp(conversation.occurredAt),
    updatedAt: Date.now(),
  }, { merge: true });

  return reviewItemId;
}

export async function seedAdminAiMonitoringData(db) {
  if (!db) return [];

  const conversationId = createAdminAiConversationId();
  const now = Date.now();
  const seedMessages = [
    createAdminAiChatMessage({
      conversationId,
      senderRole: 'user',
      sender: 'Website Visitor',
      text: 'ช่วยสรุปอัปเดตงานก่อสร้างวันนี้ให้หน่อย',
      createdAt: now,
    }),
    createAdminAiChatMessage({
      conversationId,
      senderRole: 'ai',
      sender: 'AI น้องสบายดี',
      text: 'สรุปวันนี้: งานโครงสร้างคืบหน้า 80%, มีวัสดุบางรายการรอส่ง, และควรติดตามงานระบบไฟเพิ่มเติมพรุ่งนี้',
      createdAt: now + 60 * 1000,
    }),
  ];

  for (const message of seedMessages) {
    await logAdminAiChatMessage(db, message);
  }

  await syncAdminAiReviewItem(db, seedMessages);
  return seedMessages;
}

export { AI_CHAT_PROJECT_ID, AI_CHAT_SOURCE };
