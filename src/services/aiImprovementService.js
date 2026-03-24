import { addDoc, collection, doc, getDocs, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';

export const AI_REVIEW_ITEMS_COLLECTION = 'ai_review_items';

function toNumber(value, fallback = 0) {
  if (value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeAiReviewItem(item = {}, id = '') {
  return {
    id: String(id || item.id || ''),
    title: String(item.title || '').trim() || 'Untitled review item',
    conversationText: String(item.conversationText || item.transcript || '').trim(),
    transcript: String(item.transcript || item.conversationText || '').trim(),
    category: String(item.category || 'General Coordination').trim() || 'General Coordination',
    tags: Array.isArray(item.tags)
      ? item.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : [],
    riskScore: toNumber(item.riskScore, 0),
    satisfactionEstimate: toNumber(item.satisfactionEstimate, 0),
    qualityScore: toNumber(item.qualityScore, 0),
    businessValueScore: toNumber(item.businessValueScore, 0),
    status: ['pending', 'approved', 'rejected', 'dataset_candidate'].includes(String(item.status || '').trim())
      ? String(item.status).trim()
      : 'pending',
    sourceType: String(item.sourceType || 'chat').trim() || 'chat',
    sourceConversationId: String(item.sourceConversationId || '').trim(),
    notes: String(item.notes || '').trim(),
    reviewedBy: String(item.reviewedBy || '').trim(),
    createdAt: toNumber(item.createdAt, Date.now()),
    updatedAt: toNumber(item.updatedAt, toNumber(item.createdAt, Date.now())),
  };
}

export function subscribeToAiReviewItems(db, onData, onError) {
  return onSnapshot(
    collection(db, AI_REVIEW_ITEMS_COLLECTION),
    (snapshot) => {
      const items = snapshot.docs
        .map((itemDoc) => normalizeAiReviewItem(itemDoc.data(), itemDoc.id))
        .sort((left, right) => right.updatedAt - left.updatedAt);
      onData(items);
    },
    onError,
  );
}

export async function fetchAiReviewItems(db) {
  const snapshot = await getDocs(collection(db, AI_REVIEW_ITEMS_COLLECTION));
  return snapshot.docs
    .map((itemDoc) => normalizeAiReviewItem(itemDoc.data(), itemDoc.id))
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function updateAiReviewItem(db, itemId, patch = {}) {
  const normalizedPatch = {};

  if (patch.status) normalizedPatch.status = patch.status;
  if (Object.prototype.hasOwnProperty.call(patch, 'notes')) normalizedPatch.notes = String(patch.notes || '').trim();
  if (Object.prototype.hasOwnProperty.call(patch, 'reviewedBy')) normalizedPatch.reviewedBy = String(patch.reviewedBy || '').trim();
  if (patch.tags) normalizedPatch.tags = Array.isArray(patch.tags) ? patch.tags : [];
  if (patch.category) normalizedPatch.category = String(patch.category || '').trim();

  normalizedPatch.updatedAt = serverTimestamp();

  await updateDoc(doc(db, AI_REVIEW_ITEMS_COLLECTION, itemId), normalizedPatch);
}

function createSeedReviewItem(conversation, reviewerEmail = '') {
  return {
    title: String(conversation.title || '').trim() || 'Untitled review item',
    conversationText: Array.isArray(conversation.thread)
      ? conversation.thread
          .map((message) => `${message.speaker || message.senderRole || 'Unknown'}: ${String(message.text || '').trim() || '[voice message]'}`)
          .join('\n')
      : '',
    transcript: Array.isArray(conversation.thread)
      ? conversation.thread
          .map((message) => `${message.speaker || message.senderRole || 'Unknown'}: ${String(message.text || '').trim() || '[voice message]'}`)
          .join('\n')
      : '',
    category: String(conversation.category || 'General Coordination').trim() || 'General Coordination',
    tags: [
      String(conversation.topic || '').trim(),
      String(conversation.resolutionStatus || '').trim(),
      ...(conversation.voiceMessageCount > 0 ? ['voice'] : []),
    ].filter(Boolean),
    riskScore: toNumber(conversation.riskScore, 0),
    satisfactionEstimate: toNumber(conversation.satisfactionEstimate, 0),
    qualityScore: toNumber(conversation.qualityScore, 0),
    businessValueScore: toNumber(conversation.businessValueScore, 0),
    status: conversation.riskScore >= 75 ? 'pending' : conversation.qualityScore >= 88 ? 'dataset_candidate' : 'pending',
    sourceType: 'chat_monitoring_seed',
    sourceConversationId: String(conversation.id || '').trim(),
    reviewedBy: reviewerEmail,
    notes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function seedAiReviewItemsFromConversations(db, conversations = [], reviewerEmail = '') {
  const sourceItems = Array.isArray(conversations) ? conversations.slice(0, 12) : [];
  for (const conversation of sourceItems) {
    await addDoc(collection(db, AI_REVIEW_ITEMS_COLLECTION), createSeedReviewItem(conversation, reviewerEmail));
  }
}
