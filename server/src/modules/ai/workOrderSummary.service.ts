import type { Role } from '../../config/constants';
import { ApiError } from '../../shared/utils/ApiError';
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

  if (workOrder.aiSummary) {
    return {
      available: true,
      text: workOrder.aiSummary.text,
      generatedAt: workOrder.aiSummary.generatedAt,
    };
  }

  const generated = await generateGeminiText(
    `Title: ${workOrder.title}\n\nDescription: ${workOrder.description}`,
    SYSTEM_INSTRUCTION,
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

  // Only write when no summary exists yet, so concurrent requests keep one value.
  await WorkOrder.findOneAndUpdate(
    { _id: workOrder._id, aiSummary: { $exists: false } },
    { $set: { aiSummary: { text: parsed.data, generatedAt } } },
  );

  const stored = await WorkOrder.findById(workOrder._id).select('aiSummary').lean();

  if (!stored?.aiSummary) {
    return {
      available: false,
      message: 'The AI summary could not be saved. Please try again.',
    };
  }

  return {
    available: true,
    text: stored.aiSummary.text,
    generatedAt: stored.aiSummary.generatedAt,
  };
}
