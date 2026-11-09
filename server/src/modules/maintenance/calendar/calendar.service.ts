import { endOfMonth, startOfMonth } from 'date-fns';
import { Types, type FilterQuery } from 'mongoose';
import type { Role, WorkOrderStatus } from '../../../config/constants';
import { WorkOrder, type IWorkOrder } from '../work-orders/workOrder.model';
import type { CalendarQuery } from './calendar.validation';

export interface CalendarActor {
  id: string;
  role: Role;
}

export interface SerializedCalendarWorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  titleAr?: string;
  status: WorkOrderStatus;
  sourceType: IWorkOrder['sourceType'];
  priority: IWorkOrder['priority'];
  category: IWorkOrder['category'];
  scheduledStart?: Date;
  expectedCompletion?: Date;
  completedAt?: Date;
  overdue: boolean;
  assignedTechnician: {
    id: string;
    name: string;
    availability?: string;
  } | null;
  location: {
    id: string;
    buildingName: string;
    buildingNameAr?: string;
    floor: string;
    floorAr?: string;
    room: string;
    roomAr?: string;
  } | null;
}

interface PopulatedCalendarWorkOrder {
  _id: Types.ObjectId;
  workOrderNumber: string;
  title: string;
  titleAr?: string;
  status: WorkOrderStatus;
  sourceType: IWorkOrder['sourceType'];
  priority: IWorkOrder['priority'];
  category: IWorkOrder['category'];
  scheduledStart?: Date;
  expectedCompletion?: Date;
  completedAt?: Date;
  assignedTechnicianId?:
    | {
        _id: Types.ObjectId;
        name: string;
        availability?: string;
      }
    | null;
  locationId?:
    | {
        _id: Types.ObjectId;
        buildingName: string;
        buildingNameAr?: string;
        floor: string;
        floorAr?: string;
        room: string;
        roomAr?: string;
      }
    | null;
}

function serializeCalendarWorkOrder(
  workOrder: PopulatedCalendarWorkOrder,
  now: number,
): SerializedCalendarWorkOrder {
  const technician = workOrder.assignedTechnicianId;
  const location = workOrder.locationId;

  const isOpenState =
    workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED';
  const overdue = Boolean(
    isOpenState &&
      workOrder.expectedCompletion &&
      new Date(workOrder.expectedCompletion).getTime() < now,
  );

  return {
    id: workOrder._id.toString(),
    workOrderNumber: workOrder.workOrderNumber,
    title: workOrder.title,
    titleAr: workOrder.titleAr,
    status: workOrder.status,
    sourceType: workOrder.sourceType,
    priority: workOrder.priority,
    category: workOrder.category,
    scheduledStart: workOrder.scheduledStart,
    expectedCompletion: workOrder.expectedCompletion,
    completedAt: workOrder.completedAt,
    overdue,
    assignedTechnician:
      technician && technician._id
        ? {
            id: technician._id.toString(),
            name: technician.name,
            availability: technician.availability,
          }
        : null,
    location:
      location && location._id
        ? {
            id: location._id.toString(),
            buildingName: location.buildingName,
            buildingNameAr: location.buildingNameAr,
            floor: location.floor,
            floorAr: location.floorAr,
            room: location.room,
            roomAr: location.roomAr,
          }
        : null,
  };
}

/**
 * Calendar data positioned by scheduledStart to expectedCompletion. Technicians
 * are always limited to their own work orders; managers and admins can filter
 * by technician. Overdue work orders are flagged for red highlighting.
 */
export async function getCalendar(
  actor: CalendarActor,
  query: CalendarQuery,
): Promise<{
  data: SerializedCalendarWorkOrder[];
  from: Date;
  to: Date;
}> {
  const now = new Date();
  const from = query.from ?? startOfMonth(now);
  const to = query.to ?? endOfMonth(now);

  const filter: FilterQuery<IWorkOrder> = {
    $and: [
      { scheduledStart: { $lte: to } },
      { expectedCompletion: { $gte: from } },
    ],
  };

  if (actor.role === 'TECHNICIAN') {
    filter.assignedTechnicianId = new Types.ObjectId(actor.id);
  } else if (query.technicianId) {
    filter.assignedTechnicianId = new Types.ObjectId(query.technicianId);
  }

  if (query.status) {
    filter.status = query.status;
  }

  const documents = await WorkOrder.find(filter)
    .populate('assignedTechnicianId', 'name availability')
    .populate('locationId', 'buildingName buildingNameAr floor floorAr room roomAr')
    .sort({ scheduledStart: 1, expectedCompletion: 1 })
    .lean<PopulatedCalendarWorkOrder[]>();

  return {
    data: documents.map((document) =>
      serializeCalendarWorkOrder(document, now.getTime()),
    ),
    from,
    to,
  };
}
