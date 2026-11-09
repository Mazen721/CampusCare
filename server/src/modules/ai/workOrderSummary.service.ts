import type { Role } from '../../config/constants';
import { ApiError } from '../../shared/utils/ApiError';
import { getRequestLang } from '../../shared/utils/requestContext';
import { WorkOrder } from '../maintenance/work-orders/workOrder.model';
import { generateGeminiText } from './gemini.client';
import { summaryTextSchema } from './ai.validation';

const SYSTEM_INSTRUCTION =
  'Summarize the maintenance issue in one or two factual sentences. ' +
  'Preserve the meaning of the provided title and description. Add no details, ' +
  'diagnosis, or recommendations. Return plain text only, under 300 characters.';

export interface AiActor {
  id: string;
  role: Role;
}

export type WorkOrderSummaryResponse =
  | {
      available: true;
      text: string;
      generatedAt: Date;
    }
  | {
      available: false;
      message: string;
    };

/**
 * Returns the stored summary when present. Otherwise sends only the work order
 * title and description to Gemini and stores the validated result. Status,
 * priority, and assignment are never modified here.
 */
export async function summarizeWorkOrder(
  actor: AiActor,
  workOrderId: string,
): Promise<WorkOrderSummaryResponse> {
  const workOrder = await WorkOrder.findById(workOrderId);

  if (!workOrder) {
    throw ApiError.notFound('Work order not found', 'workOrderNotFound');
  }

  if (
    actor.role === 'TECHNICIAN' &&
    workOrder.assignedTechnicianId?.toString() !== actor.id
  ) {
    throw ApiError.forbidden(
      'Only the technician assigned to this work order can summarize it',
      'assignedTechnicianSummaryOnly',
    );
  }

  const lang = getRequestLang();

  const existingSummary =
    workOrder.aiSummaries?.[lang] ??
    (lang === 'en' && workOrder.aiSummary ? workOrder.aiSummary : undefined);

  if (existingSummary) {
    return {
      available: true,
      text: existingSummary.text,
      generatedAt: existingSummary.generatedAt,
    };
  }

  const langInstruction =
    lang === 'ar'
      ? 'Write every string value in Modern Standard Arabic. Keep JSON keys in English.'
      : 'Write in English.';
  const systemInstruction = `${SYSTEM_INSTRUCTION} ${langInstruction}`;

  const title = lang === 'ar' && workOrder.titleAr ? workOrder.titleAr : workOrder.title;
  const description =
    lang === 'ar' && workOrder.descriptionAr ? workOrder.descriptionAr : workOrder.description;

  const generated = await generateGeminiText(
    `Title: ${title}\n\nDescription: ${description}`,
    systemInstruction,
  );

  if (!generated.available) {
    return generated;
  }

  const parsed = summaryTextSchema.safeParse(generated.text);
  if (!parsed.success) {
    return {
      available: false,
      message: 'The AI summary returned an unexpected response. Please try again.',
    };
  }

  const generatedAt = new Date();

  // Only write when no summary exists yet for this language, so concurrent requests keep one value.
  const summaryPath = `aiSummaries.${lang}`;
  await WorkOrder.findOneAndUpdate(
    { _id: workOrder._id, [summaryPath]: { $exists: false } },
    { $set: { [summaryPath]: { text: parsed.data, generatedAt } } },
  );

  const stored = await WorkOrder.findById(workOrder._id)
    .select('aiSummaries aiSummary')
    .lean();

  const savedSummary =
    stored?.aiSummaries?.[lang] ??
    (lang === 'en' && stored?.aiSummary ? stored.aiSummary : undefined);

  if (!savedSummary) {
    return {
      available: false,
      message: 'The AI summary could not be saved. Please try again.',
    };
  }

  return {
    available: true,
    text: savedSummary.text,
    generatedAt: savedSummary.generatedAt,
  };
}
