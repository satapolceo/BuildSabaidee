import { isAdminAiReady, sendAdminAiMessage } from './adminAiClient';

function countBy(items, selector) {
  return items.reduce((accumulator, item) => {
    const key = selector(item);
    if (!key) return accumulator;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function toSortedEntries(record, limit = 5) {
  return Object.entries(record)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function buildRuleBasedRecommendations(items, statusCounts, categoryCounts, tagCounts) {
  const recommendations = [];
  const pendingCount = statusCounts.pending || 0;
  const rejectedCount = statusCounts.rejected || 0;
  const datasetCount = statusCounts.dataset_candidate || 0;
  const approvedCount = statusCounts.approved || 0;
  const topCategory = categoryCounts[0];
  const topTag = tagCounts[0];

  if (pendingCount >= 5) {
    recommendations.push(`Reduce the pending review backlog by triaging the highest-risk items first.`);
  }
  if (topCategory) {
    recommendations.push(`Add stronger guidance and examples for ${topCategory.label.toLowerCase()} issues because they appear most often.`);
  }
  if (topTag) {
    recommendations.push(`Review prompt and knowledge coverage for the recurring tag "${topTag.label}".`);
  }
  if (rejectedCount > approvedCount) {
    recommendations.push(`Too many items are being rejected. Tighten capture criteria and reviewer notes so useful examples are easier to salvage.`);
  }
  if (datasetCount < approvedCount && approvedCount > 0) {
    recommendations.push(`Promote more approved examples into dataset candidates after notes are cleaned and tags are standardized.`);
  }
  if (items.some((item) => item.riskScore >= 80 && item.status !== 'rejected')) {
    recommendations.push(`High-risk items still need explicit escalation rules and human-review coverage.`);
  }

  return recommendations.slice(0, 6);
}

export function buildAiImprovementInsights(items = []) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const statusCounts = countBy(normalizedItems, (item) => item.status);
  const categoryCounts = toSortedEntries(countBy(
    normalizedItems.filter((item) => item.status === 'pending' || item.status === 'rejected' || item.riskScore >= 60),
    (item) => item.category,
  ));
  const tagCounts = toSortedEntries(countBy(
    normalizedItems
      .filter((item) => item.status === 'pending' || item.status === 'rejected' || item.riskScore >= 60)
      .flatMap((item) => Array.isArray(item.tags) ? item.tags : [])
      .map((tag) => ({ tag })),
    (item) => item.tag,
  ));

  const pendingReview = normalizedItems
    .filter((item) => item.status === 'pending')
    .sort((left, right) => right.riskScore - left.riskScore);
  const approvedItems = normalizedItems.filter((item) => item.status === 'approved');
  const rejectedItems = normalizedItems.filter((item) => item.status === 'rejected');
  const datasetCandidates = normalizedItems.filter((item) => item.status === 'dataset_candidate');
  const recurringFailures = normalizedItems
    .filter((item) => item.status === 'rejected' || item.riskScore >= 70 || item.satisfactionEstimate <= 60)
    .sort((left, right) => (right.riskScore + (100 - right.satisfactionEstimate)) - (left.riskScore + (100 - left.satisfactionEstimate)))
    .slice(0, 6);
  const knowledgeGaps = [...categoryCounts, ...tagCounts]
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);

  const readinessLabel = datasetCandidates.length >= 10 && approvedItems.length >= 15 && pendingReview.length <= 5
    ? 'ai_readiness_ready'
    : 'ai_readiness_in_progress';

  return {
    totalItems: normalizedItems.length,
    statusCounts: {
      pending: statusCounts.pending || 0,
      approved: statusCounts.approved || 0,
      rejected: statusCounts.rejected || 0,
      dataset_candidate: statusCounts.dataset_candidate || 0,
    },
    categoryCounts,
    tagCounts,
    pendingReview,
    approvedItems,
    rejectedItems,
    datasetCandidates,
    recurringFailures,
    knowledgeGaps,
    recommendations: buildRuleBasedRecommendations(normalizedItems, statusCounts, categoryCounts, tagCounts),
    readinessLabel,
  };
}

function buildAiRecommendationPrompt(insights) {
  return [
    'Analyze this BuildSabaidee admin AI review summary and produce 4 concise improvement recommendations.',
    'Focus on knowledge gaps, review workflow, tagging quality, and dataset readiness.',
    `Pending review: ${insights.statusCounts.pending}`,
    `Approved: ${insights.statusCounts.approved}`,
    `Rejected: ${insights.statusCounts.rejected}`,
    `Dataset candidates: ${insights.statusCounts.dataset_candidate}`,
    `Top categories: ${insights.categoryCounts.map((item) => `${item.label} (${item.count})`).join(', ') || 'none'}`,
    `Top tags: ${insights.tagCounts.map((item) => `${item.label} (${item.count})`).join(', ') || 'none'}`,
  ].join('\n');
}

export async function generateAiImprovementRecommendations(adminPlatformSettings, insights) {
  if (!isAdminAiReady(adminPlatformSettings)) return [];

  const response = await sendAdminAiMessage({
    settings: adminPlatformSettings,
    messages: [
      {
        role: 'user',
        content: buildAiRecommendationPrompt(insights),
      },
    ],
  });

  return String(response.text || '')
    .split('\n')
    .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 6);
}
