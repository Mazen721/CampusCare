import { addDays, addHours, subDays, subHours } from 'date-fns';
import { Types } from 'mongoose';
import {
  DEMO_ACCOUNTS,
  type MaintenanceCategory,
  type Priority,
  type RequestStatus,
  type WorkOrderStatus,
} from '../config/constants';
import { User } from '../modules/auth/user.model';
import { Location } from '../modules/locations/location.model';
import { MaintenanceRequest } from '../modules/maintenance/requests/maintenanceRequest.model';
import {
  WorkOrder,
  type IWorkOrder,
} from '../modules/maintenance/work-orders/workOrder.model';
import { ServiceFeedback } from '../modules/maintenance/feedback/serviceFeedback.model';
import {
  PreventivePlan,
  type IPreventivePlan,
} from '../modules/preventive/preventivePlan.model';
import { LostFoundItem } from '../modules/lost-found/items/lostFoundItem.model';
import { ItemMatch } from '../modules/lost-found/matches/itemMatch.model';
import { ClaimRequest } from '../modules/lost-found/claims/claimRequest.model';
import { AiInsightCache } from '../modules/ai/aiInsightCache.model';
import { Notification } from '../shared/models/Notification.model';
import { ActivityLog } from '../shared/models/ActivityLog.model';

export interface DemoDataCounts {
  requests: number;
  workOrders: number;
  feedback: number;
  preventivePlans: number;
  lostItems: number;
  foundItems: number;
  matches: number;
  claims: number;
  notifications: number;
  activityLogs: number;
  insights: number;
}

const EXTRA_STUDENTS = [
  {
    name: 'Sara Mahmoud',
    email: 'sara.mahmoud@std.mansnu.edu.eg',
    department: 'Faculty of Computers & Information',
  },
  {
    name: 'Omar Khaled',
    email: 'omar.khaled@std.mansnu.edu.eg',
    department: 'Faculty of Medicine',
  },
];

const TECHNICIAN_EMAILS = [
  DEMO_ACCOUNTS.TECHNICIAN.email,
  'm.elgohary@mansnu.edu.eg',
  'k.eltantawy@mansnu.edu.eg',
  'i.abdelfattah@mansnu.edu.eg',
  's.radwan@mansnu.edu.eg',
];

const DEMO_STUDENT_EMAIL = DEMO_ACCOUNTS.STUDENT_EMPLOYEE.email;
const EXTRA_STUDENT_EMAILS = EXTRA_STUDENTS.map((student) => student.email);

interface RequestSpec {
  key: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: RequestStatus;
  requesterEmail: string;
  building: 'Engineering' | 'Administration' | 'Medical' | 'Humanities';
  locationIndex: number;
  daysAgo: number;
  reviewNotes?: string;
  reopenCount?: number;
}

interface WorkOrderSpec {
  requestKey: string;
  status: WorkOrderStatus;
  technicianEmail?: string;
  scheduledStart: Date;
  expectedCompletion: Date;
  actualStart?: Date;
  completedAt?: Date;
  resolutionDetails?: string;
  cancelReason?: string;
  current?: boolean;
}

interface ItemSpec {
  key: string;
  reportType: 'LOST' | 'FOUND';
  itemTitle: string;
  description: string;
  privateIdentificationDetails: string;
  category: 'Electronics' | 'Phones' | 'Laptops' | 'Headphones' | 'Wallets' | 'Bags' | 'Keys' | 'Documents' | 'Accessories' | 'Books' | 'Clothing' | 'Other';
  color?: string;
  brand?: string;
  reporterEmail: string;
  building: 'Engineering' | 'Administration' | 'Medical' | 'Humanities';
  locationIndex: number;
  locationDetails: string;
  occurrenceDaysAgo: number;
  status: 'OPEN' | 'MATCH_CONFIRMED' | 'CLAIM_UNDER_REVIEW' | 'APPROVED_FOR_HANDOVER' | 'RETURNED' | 'CLOSED';
}

interface ClaimSpec {
  itemKey: string;
  linkedLostKey?: string;
  claimantEmail: string;
  claimDescription: string;
  identifyingDetailsProvided: string;
  status: 'PENDING_REVIEW' | 'UNDER_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  verificationNotes?: string;
  rejectionReason?: string;
  reviewed: boolean;
  handover?: {
    receivedByName: string;
    notes?: string;
    handedOverAt: Date;
  };
}

function daysAgo(days: number, hour = 9): Date {
  const date = subDays(new Date(), days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function hoursAgo(hours: number): Date {
  return subHours(new Date(), hours);
}

function pick<T>(values: T[], index: number): T {
  const value = values[index % values.length];
  if (!value) {
    throw new Error('Seed requires at least one value in the collection');
  }
  return value;
}

/**
 * Creates the Day 6 demo dataset: maintenance workflow history, preventive
 * plans, lost & found records, claims, notifications, activity logs and one
 * cached AI insight. Users and locations must already exist.
 */
export async function seedDemoData(passwordHash: string): Promise<DemoDataCounts> {
  const now = new Date();

  await User.insertMany(
    EXTRA_STUDENTS.map((student) => ({
      ...student,
      role: 'STUDENT_EMPLOYEE',
      passwordHash,
      isActive: true,
      specializations: [],
      skills: [],
    })),
  );

  const users = await User.find({}).select('name email role').lean();
  const locations = await Location.find({ isActive: true })
    .select('buildingName floor room')
    .lean();

  const userId = (email: string): Types.ObjectId => {
    const user = users.find((entry) => entry.email === email);
    if (!user) throw new Error(`Seed user not found: ${email}`);
    return user._id;
  };

  const locationId = (
    building: RequestSpec['building'],
    index: number,
  ): Types.ObjectId => {
    const matching = locations.filter((location) =>
      location.buildingName.includes(building),
    );
    return pick(matching, index)._id;
  };

  const managerId = userId(DEMO_ACCOUNTS.MAINTENANCE_MANAGER.email);
  const adminId = userId(DEMO_ACCOUNTS.SUPER_ADMIN.email);
  const officerId = userId(DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email);
  const demoStudentId = userId(DEMO_STUDENT_EMAIL);
  const technicianIds = TECHNICIAN_EMAILS.map(userId);

  // ---------------------------------------------------------------------------
  // Maintenance requests
  // ---------------------------------------------------------------------------
  const requestSpecs: RequestSpec[] = [
    {
      key: 'submitted-1',
      title: 'Projector will not power on in Lecture Hall A',
      description:
        'The ceiling projector in Lecture Hall A does not power on. The remote indicator stays red and lectures are currently using a portable screen.',
      category: 'Hardware',
      priority: 'HIGH',
      status: 'SUBMITTED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 0,
      daysAgo: 1,
    },
    {
      key: 'submitted-2',
      title: 'Leaking faucet in ground-floor washroom',
      description:
        'A faucet in the medical complex ground-floor washroom keeps dripping and the sink is filling slowly. Water is pooling around the basin.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      status: 'SUBMITTED',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Medical',
      locationIndex: 4,
      daysAgo: 3,
    },
    {
      key: 'submitted-3',
      title: 'Wi-Fi drops repeatedly in the library reading room',
      description:
        'The wireless network disconnects every few minutes in the central library reading room. Students cannot stay connected during online exams.',
      category: 'Network',
      priority: 'HIGH',
      status: 'SUBMITTED',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Administration',
      locationIndex: 8,
      daysAgo: 5,
    },
    {
      key: 'submitted-4',
      title: 'Broken chair in the humanities seminar room',
      description:
        'One of the seminar chairs has a cracked seat and rocks when used. It should be removed before the next class.',
      category: 'Furniture',
      priority: 'LOW',
      status: 'SUBMITTED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Humanities',
      locationIndex: 2,
      daysAgo: 8,
    },
    {
      key: 'under-review-1',
      title: 'Air conditioner making a loud grinding noise',
      description:
        'The air conditioning unit in the engineering computer lab makes a loud grinding noise and vibrates strongly when it starts.',
      category: 'Air Conditioning',
      priority: 'MEDIUM',
      status: 'UNDER_REVIEW',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 6,
      daysAgo: 2,
      reviewNotes: 'Facilities team asked to inspect the compressor mount.',
    },
    {
      key: 'under-review-2',
      title: 'Corridor lights flicker near the medical clinics',
      description:
        'The ceiling lights in the medical complex corridor flicker constantly in the evening. The issue affects the walkway outside the clinics.',
      category: 'Electrical',
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Medical',
      locationIndex: 3,
      daysAgo: 4,
      reviewNotes: 'Electrical safety inspection scheduled.',
    },
    {
      key: 'under-review-3',
      title: 'Teaching lab PC fails to boot',
      description:
        'The instructor workstation in Computer Lab 2 stops at the manufacturer logo. The lab cannot run the scheduled networking practical.',
      category: 'Hardware',
      priority: 'CRITICAL',
      status: 'UNDER_REVIEW',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Engineering',
      locationIndex: 9,
      daysAgo: 6,
      reviewNotes: 'Check the storage controller before replacing hardware.',
    },
    {
      key: 'approved-pending',
      title: 'Water dispenser leaking in the library lobby',
      description:
        'The water dispenser near the library lobby leaks from the bottom and has been switched off. The floor remains wet.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      status: 'APPROVED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Administration',
      locationIndex: 2,
      daysAgo: 9,
      reviewNotes: 'Approved for plumbing repair.',
    },
    {
      key: 'approved-assigned',
      title: 'Projector cable needs replacement in Lecture Hall B',
      description:
        'The HDMI cable to the lecture hall projector is damaged at the connector and the image cuts out when the cable moves.',
      category: 'Hardware',
      priority: 'LOW',
      status: 'APPROVED',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Humanities',
      locationIndex: 5,
      daysAgo: 10,
      reviewNotes: 'Approved; replacement cable in stock.',
    },
    {
      key: 'approved-assigned-2',
      title: 'Door lock jammed in the medical seminar room',
      description:
        'The seminar room door lock jams with the key inside and the room cannot be locked securely after lectures.',
      category: 'Furniture',
      priority: 'HIGH',
      status: 'APPROVED',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Medical',
      locationIndex: 7,
      daysAgo: 12,
      reviewNotes: 'Approved; locksmith requested.',
    },
    {
      key: 'rejected-1',
      title: 'Personal laptop screen replacement',
      description:
        'My personal laptop screen cracked and I would like the IT unit to replace it before my final project presentation.',
      category: 'Hardware',
      priority: 'LOW',
      status: 'REJECTED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 2,
      daysAgo: 14,
      reviewNotes:
        'Personal devices are outside the maintenance scope. Contact the IT service desk for paid repairs.',
    },
    {
      key: 'rejected-2',
      title: 'Repaint the student affairs office wall',
      description:
        'The wall behind the student affairs counter has a small scuff and would look better with a fresh coat of paint.',
      category: 'General Maintenance',
      priority: 'LOW',
      status: 'REJECTED',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Administration',
      locationIndex: 3,
      daysAgo: 18,
      reviewNotes: 'Duplicate of the scheduled summer repainting programme.',
    },
    {
      key: 'in-progress',
      title: 'Server room cooling failure',
      description:
        'The primary server room is overheating and the backup cooling unit is not starting automatically. Room temperature is above the safe threshold.',
      category: 'Air Conditioning',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Engineering',
      locationIndex: 4,
      daysAgo: 7,
      reviewNotes: 'Emergency repair approved.',
    },
    {
      key: 'in-progress-overdue',
      title: 'Network switch replacement on the second floor',
      description:
        'The second-floor network switch drops all connections during peak hours. A replacement unit has been delivered and needs installation.',
      category: 'Network',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 8,
      daysAgo: 20,
      reviewNotes: 'Replacement approved; installation in progress.',
    },
    {
      key: 'in-progress-2',
      title: 'Broken lab sink leaking under the bench',
      description:
        'The sink in the medical lab leaks under the bench and the cabinet is becoming water damaged. The water supply has been isolated.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Medical',
      locationIndex: 6,
      daysAgo: 11,
      reviewNotes: 'Approved for plumbing repair.',
    },
    {
      key: 'completed-1',
      title: 'Air conditioning servicing in Lecture Hall C',
      description:
        'The lecture hall air conditioning was not cooling effectively during afternoon lectures. A full service was requested.',
      category: 'Air Conditioning',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Administration',
      locationIndex: 1,
      daysAgo: 26,
      reviewNotes: 'Approved for scheduled servicing.',
    },
    {
      key: 'completed-2',
      title: 'Replace faulty power outlet in Engineering Lab 3',
      description:
        'The power outlet beside the lab bench sparks when a plug is inserted. The circuit was isolated immediately.',
      category: 'Electrical',
      priority: 'HIGH',
      status: 'COMPLETED',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Engineering',
      locationIndex: 3,
      daysAgo: 30,
      reviewNotes: 'Approved as an urgent electrical repair.',
    },
    {
      key: 'completed-3',
      title: 'Repair damaged desks in the humanities study room',
      description:
        'Three study desks have loose tops and protruding screws. Students have been asked to avoid the room until repaired.',
      category: 'Furniture',
      priority: 'LOW',
      status: 'COMPLETED',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Humanities',
      locationIndex: 7,
      daysAgo: 34,
      reviewNotes: 'Approved for carpentry repair.',
    },
    {
      key: 'closed-1',
      title: 'Lab projector bulb replacement',
      description:
        'The projector in Computer Lab 1 produced a dim image and the bulb needed replacement before the practical exams.',
      category: 'Hardware',
      priority: 'MEDIUM',
      status: 'CLOSED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 1,
      daysAgo: 40,
      reviewNotes: 'Approved; replacement bulb ordered.',
    },
    {
      key: 'closed-2',
      title: 'Restroom pipe leak in the medical complex',
      description:
        'A pipe joint under the restroom sink leaked continuously and soaked the floor tiles.',
      category: 'Plumbing',
      priority: 'HIGH',
      status: 'CLOSED',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Medical',
      locationIndex: 1,
      daysAgo: 45,
      reviewNotes: 'Approved as an urgent plumbing repair.',
    },
    {
      key: 'closed-3',
      title: 'HVAC filter replacement in the library',
      description:
        'The library air handling unit was circulating dust and the filters were due for replacement.',
      category: 'Air Conditioning',
      priority: 'MEDIUM',
      status: 'CLOSED',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Administration',
      locationIndex: 5,
      daysAgo: 55,
      reviewNotes: 'Included in the preventive HVAC schedule.',
    },
    {
      key: 'closed-4',
      title: 'Smart board calibration in Seminar Room 2',
      description:
        'The smart board touch position was offset from the projected image, making annotations unusable.',
      category: 'Software',
      priority: 'LOW',
      status: 'CLOSED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Humanities',
      locationIndex: 1,
      daysAgo: 65,
      reviewNotes: 'Approved; calibration by the AV team.',
    },
    {
      key: 'reopened-1',
      title: 'Ceiling light still flickering after repair',
      description:
        'The ceiling light outside Engineering Lab 2 was repaired last week but still flickers and occasionally turns off completely.',
      category: 'Electrical',
      priority: 'HIGH',
      status: 'REOPENED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 5,
      daysAgo: 22,
      reviewNotes: 'Reopened after the requester reported the fault returned.',
      reopenCount: 1,
    },
    {
      key: 'reopened-2',
      title: 'Sink still blocked after maintenance visit',
      description:
        'The medical lab sink drains very slowly again after the previous visit. Water backs up when the tap runs for more than a minute.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      status: 'REOPENED',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Medical',
      locationIndex: 8,
      daysAgo: 28,
      reviewNotes: 'Reopened after the requester reported the blockage returned.',
      reopenCount: 1,
    },
  ];

  const requestDocs = requestSpecs.map((spec, index) => {
    const createdAt = daysAgo(spec.daysAgo);
    const reviewed = spec.status !== 'SUBMITTED';
    const reviewedAt = reviewed ? addHours(createdAt, 6) : undefined;

    return {
      _id: new Types.ObjectId(),
      requestNumber: `MR-${2001 + index}`,
      requesterId: userId(spec.requesterEmail),
      title: spec.title,
      description: spec.description,
      category: spec.category,
      priority: spec.priority,
      locationId: locationId(spec.building, spec.locationIndex),
      attachments: [],
      status: spec.status,
      reviewedBy: reviewed ? managerId : undefined,
      reviewedAt,
      reviewNotes: spec.reviewNotes,
      currentWorkOrderId: undefined as Types.ObjectId | undefined,
      reopenCount: spec.reopenCount ?? 0,
      createdAt,
      updatedAt: reviewedAt ?? createdAt,
    };
  });

  const requestByKey = new Map(
    requestSpecs.map((spec, index) => [spec.key, requestDocs[index]!]),
  );

  const workOrderSpecs: WorkOrderSpec[] = [
    {
      requestKey: 'approved-pending',
      status: 'PENDING_ASSIGNMENT',
      scheduledStart: addDays(now, 1),
      expectedCompletion: addHours(addDays(now, 1), 4),
      current: true,
    },
    {
      requestKey: 'approved-assigned',
      status: 'ASSIGNED',
      technicianEmail: TECHNICIAN_EMAILS[0]!,
      scheduledStart: addDays(now, 2),
      expectedCompletion: addHours(addDays(now, 2), 4),
      current: true,
    },
    {
      requestKey: 'approved-assigned-2',
      status: 'ASSIGNED',
      technicianEmail: TECHNICIAN_EMAILS[4]!,
      scheduledStart: addDays(now, 3),
      expectedCompletion: addHours(addDays(now, 3), 4),
      current: true,
    },
    {
      requestKey: 'in-progress',
      status: 'IN_PROGRESS',
      technicianEmail: TECHNICIAN_EMAILS[3]!,
      scheduledStart: hoursAgo(24),
      expectedCompletion: addDays(now, 1),
      actualStart: hoursAgo(20),
      current: true,
    },
    {
      requestKey: 'in-progress-overdue',
      status: 'IN_PROGRESS',
      technicianEmail: TECHNICIAN_EMAILS[2]!,
      scheduledStart: daysAgo(10),
      expectedCompletion: daysAgo(3),
      actualStart: daysAgo(9),
      current: true,
    },
    {
      requestKey: 'in-progress-2',
      status: 'IN_PROGRESS',
      technicianEmail: TECHNICIAN_EMAILS[0]!,
      scheduledStart: daysAgo(2),
      expectedCompletion: hoursAgo(2),
      actualStart: hoursAgo(30),
      current: true,
    },
    {
      requestKey: 'completed-1',
      status: 'COMPLETED',
      technicianEmail: TECHNICIAN_EMAILS[3]!,
      scheduledStart: daysAgo(24),
      expectedCompletion: daysAgo(23),
      actualStart: addHours(daysAgo(24), 4),
      completedAt: daysAgo(23),
      resolutionDetails: 'Replaced the compressor contactor and cleaned the coils.',
      current: true,
    },
    {
      requestKey: 'completed-2',
      status: 'COMPLETED',
      technicianEmail: TECHNICIAN_EMAILS[0]!,
      scheduledStart: daysAgo(28),
      expectedCompletion: daysAgo(27),
      actualStart: addHours(daysAgo(28), 4),
      completedAt: daysAgo(27),
      resolutionDetails: 'Replaced the outlet and verified the circuit under load.',
      current: true,
    },
    {
      requestKey: 'completed-3',
      status: 'COMPLETED',
      technicianEmail: TECHNICIAN_EMAILS[4]!,
      scheduledStart: daysAgo(32),
      expectedCompletion: daysAgo(31),
      actualStart: addHours(daysAgo(32), 4),
      completedAt: daysAgo(31),
      resolutionDetails: 'Tightened the desk frames and replaced the damaged screws.',
      current: true,
    },
    {
      requestKey: 'closed-1',
      status: 'COMPLETED',
      technicianEmail: TECHNICIAN_EMAILS[2]!,
      scheduledStart: daysAgo(38),
      expectedCompletion: daysAgo(37),
      actualStart: addHours(daysAgo(38), 4),
      completedAt: daysAgo(37),
      resolutionDetails: 'Replaced the projector bulb and reset the lamp timer.',
      current: true,
    },
    {
      requestKey: 'closed-2',
      status: 'COMPLETED',
      technicianEmail: TECHNICIAN_EMAILS[1]!,
      scheduledStart: daysAgo(43),
      expectedCompletion: daysAgo(42),
      actualStart: addHours(daysAgo(43), 4),
      completedAt: daysAgo(42),
      resolutionDetails: 'Replaced the pipe joint and sealed the fitting.',
      current: true,
    },
    {
      requestKey: 'closed-3',
      status: 'COMPLETED',
      technicianEmail: TECHNICIAN_EMAILS[3]!,
      scheduledStart: daysAgo(52),
      expectedCompletion: daysAgo(51),
      actualStart: addHours(daysAgo(52), 4),
      completedAt: daysAgo(51),
      resolutionDetails: 'Replaced both air filters and cleaned the housing.',
      current: true,
    },
    {
      requestKey: 'closed-4',
      status: 'COMPLETED',
      technicianEmail: TECHNICIAN_EMAILS[2]!,
      scheduledStart: daysAgo(61),
      expectedCompletion: daysAgo(60),
      actualStart: addHours(daysAgo(61), 4),
      completedAt: daysAgo(60),
      resolutionDetails: 'Recalibrated the touch overlay and updated the driver.',
      current: true,
    },
    {
      requestKey: 'reopened-1',
      status: 'CANCELLED',
      technicianEmail: TECHNICIAN_EMAILS[0]!,
      scheduledStart: daysAgo(18),
      expectedCompletion: daysAgo(17),
      cancelReason: 'Reopened by the requester after the fault returned.',
    },
    {
      requestKey: 'reopened-1',
      status: 'PENDING_ASSIGNMENT',
      scheduledStart: addDays(now, 2),
      expectedCompletion: addHours(addDays(now, 2), 4),
      current: true,
    },
    {
      requestKey: 'reopened-2',
      status: 'COMPLETED',
      technicianEmail: TECHNICIAN_EMAILS[1]!,
      scheduledStart: daysAgo(25),
      expectedCompletion: daysAgo(24),
      actualStart: addHours(daysAgo(25), 4),
      completedAt: daysAgo(24),
      resolutionDetails: 'Cleared the trap and tested the drain.',
    },
    {
      requestKey: 'reopened-2',
      status: 'PENDING_ASSIGNMENT',
      scheduledStart: addDays(now, 4),
      expectedCompletion: addHours(addDays(now, 4), 4),
      current: true,
    },
  ];

  const workOrderDocs = workOrderSpecs.map((spec, index) => {
    const request = requestByKey.get(spec.requestKey);
    if (!request) {
      throw new Error(`Seed work order references unknown request ${spec.requestKey}`);
    }

    return {
      _id: new Types.ObjectId(),
      workOrderNumber: `WO-${2001 + index}`,
      sourceType: 'REACTIVE' as const,
      maintenanceRequestId: request._id,
      assignedTechnicianId: spec.technicianEmail
        ? userId(spec.technicianEmail)
        : undefined,
      title: request.title,
      description: request.description,
      category: request.category,
      priority: request.priority,
      locationId: request.locationId,
      status: spec.status,
      scheduledStart: spec.scheduledStart,
      expectedCompletion: spec.expectedCompletion,
      actualStart: spec.actualStart,
      completedAt: spec.completedAt,
      technicianNotes: [],
      resolutionDetails: spec.resolutionDetails,
      cancelReason: spec.cancelReason,
      createdAt: spec.scheduledStart,
      updatedAt: spec.completedAt ?? spec.actualStart ?? spec.scheduledStart,
    };
  });

  const currentWorkOrderByRequest = new Map<string, Types.ObjectId>();
  workOrderSpecs.forEach((spec, index) => {
    if (spec.current) {
      currentWorkOrderByRequest.set(spec.requestKey, workOrderDocs[index]!._id);
    }
  });

  requestSpecs.forEach((spec, index) => {
    const currentWorkOrderId = currentWorkOrderByRequest.get(spec.key);
    if (currentWorkOrderId) {
      requestDocs[index]!.currentWorkOrderId = currentWorkOrderId;
    }
  });

  await MaintenanceRequest.insertMany(requestDocs);
  await WorkOrder.insertMany(workOrderDocs);

  const feedbackSpecs = [
    {
      requestKey: 'closed-1',
      rating: 5,
      comment: 'The projector was fixed the same day and the lab was ready for exams.',
    },
    {
      requestKey: 'closed-2',
      rating: 4,
      comment: 'The leak stopped, although the floor took a while to dry.',
    },
    {
      requestKey: 'closed-3',
      rating: 5,
      comment: 'The library air feels much cleaner after the filter replacement.',
    },
    {
      requestKey: 'closed-4',
      rating: 3,
      comment: 'Calibration helped, but the touch screen is still slightly offset at the edges.',
    },
  ];

  const feedbackDocs = feedbackSpecs.map((spec) => {
    const request = requestByKey.get(spec.requestKey)!;
    const workOrder = workOrderDocs.find(
      (entry) =>
        entry.maintenanceRequestId.equals(request._id) &&
        entry.status === 'COMPLETED',
    )!;

    return {
      maintenanceRequestId: request._id,
      workOrderId: workOrder._id,
      technicianId: workOrder.assignedTechnicianId!,
      requesterId: request.requesterId,
      rating: spec.rating,
      comment: spec.comment,
      createdAt: addHours(workOrder.completedAt ?? now, 20),
    };
  });

  await ServiceFeedback.insertMany(feedbackDocs);

  // ---------------------------------------------------------------------------
  // Preventive maintenance
  // ---------------------------------------------------------------------------
  const duePlanId = new Types.ObjectId();
  const futurePlanId = new Types.ObjectId();
  const inactivePlanId = new Types.ObjectId();

  const planDocs: Array<IPreventivePlan & { _id: Types.ObjectId }> = [
    {
      _id: duePlanId,
      title: 'Weekly HVAC filter inspection',
      description:
        'Inspect and clean the air handling unit filters in the central library and record the pressure drop.',
      category: 'Air Conditioning',
      priority: 'MEDIUM',
      locationId: locationId('Administration', 0),
      assignedTechnicianId: technicianIds[3]!,
      recurrenceType: 'WEEKLY',
      startDate: daysAgo(16),
      nextScheduledDate: subDays(now, 2),
      expectedDurationHours: 2,
      isActive: true,
      createdBy: managerId,
      createdAt: daysAgo(16),
      updatedAt: daysAgo(16),
    },
    {
      _id: futurePlanId,
      title: 'Monthly emergency lighting test',
      description:
        'Test all emergency lights and exit signs in the engineering complex and replace failed batteries.',
      category: 'Electrical',
      priority: 'HIGH',
      locationId: locationId('Engineering', 1),
      assignedTechnicianId: technicianIds[0]!,
      recurrenceType: 'MONTHLY',
      startDate: daysAgo(20),
      nextScheduledDate: addDays(now, 10),
      expectedDurationHours: 3,
      isActive: true,
      createdBy: managerId,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      _id: inactivePlanId,
      title: 'Quarterly water tank cleaning',
      description:
        'Drain, clean and disinfect the reserve water tanks in the medical complex.',
      category: 'Plumbing',
      priority: 'CRITICAL',
      locationId: locationId('Medical', 0),
      assignedTechnicianId: technicianIds[1]!,
      recurrenceType: 'CUSTOM_DAYS',
      recurrenceIntervalDays: 90,
      startDate: daysAgo(98),
      nextScheduledDate: addDays(now, 82),
      lastGeneratedDate: daysAgo(8),
      expectedDurationHours: 6,
      isActive: false,
      createdBy: managerId,
      createdAt: daysAgo(98),
      updatedAt: daysAgo(8),
    },
  ];

  await PreventivePlan.insertMany(planDocs);

  const preventiveWorkOrder = {
    _id: new Types.ObjectId(),
    workOrderNumber: `WO-${2001 + workOrderDocs.length}`,
    sourceType: 'PREVENTIVE' as const,
    preventivePlanId: inactivePlanId,
    assignedTechnicianId: technicianIds[1]!,
    title: 'Quarterly water tank cleaning',
    description: planDocs[2]!.description,
    category: planDocs[2]!.category,
    priority: planDocs[2]!.priority,
    locationId: planDocs[2]!.locationId,
    status: 'COMPLETED' as const,
    scheduledStart: daysAgo(8),
    expectedCompletion: addHours(daysAgo(8), 6),
    actualStart: addHours(daysAgo(8), 1),
    completedAt: addHours(daysAgo(8), 7),
    technicianNotes: [],
    resolutionDetails: 'Tanks drained, scrubbed and disinfected; water quality checked.',
    createdAt: daysAgo(8),
    updatedAt: addHours(daysAgo(8), 7),
  };

  await WorkOrder.collection.insertOne(preventiveWorkOrder);

  // ---------------------------------------------------------------------------
  // Lost & found
  // ---------------------------------------------------------------------------
  const itemSpecs: ItemSpec[] = [
    {
      key: 'lost-backpack',
      reportType: 'LOST',
      itemTitle: 'Black North Face backpack',
      description:
        'Lost near the engineering lab after the afternoon lecture. The backpack has a blue keychain inside the front pocket.',
      privateIdentificationDetails:
        'Initials Y.E. written under the flap and a blue keychain in the front pocket.',
      category: 'Bags',
      color: 'Black',
      brand: 'North Face',
      reporterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 2,
      locationDetails: 'Bench outside Lab 204',
      occurrenceDaysAgo: 30,
      status: 'MATCH_CONFIRMED',
    },
    {
      key: 'found-backpack',
      reportType: 'FOUND',
      itemTitle: 'Black North Face backpack',
      description:
        'Found near the engineering lab with a blue keychain inside the front pocket and lecture notes for Mechatronics.',
      privateIdentificationDetails:
        'Initials Y.E. written under the flap and a blue keychain in the front pocket.',
      category: 'Bags',
      color: 'Black',
      brand: 'North Face',
      reporterEmail: DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email,
      building: 'Engineering',
      locationIndex: 2,
      locationDetails: 'Lab 204 reception desk',
      occurrenceDaysAgo: 29,
      status: 'CLAIM_UNDER_REVIEW',
    },
    {
      key: 'lost-bottle',
      reportType: 'LOST',
      itemTitle: 'Blue stainless water bottle',
      description:
        'Lost a blue stainless steel water bottle with a dented lid somewhere between the cafeteria and the library.',
      privateIdentificationDetails: 'Dented lid and a faded engineering faculty sticker.',
      category: 'Other',
      color: 'Blue',
      brand: 'Thermos',
      reporterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Administration',
      locationIndex: 6,
      locationDetails: 'Cafeteria seating area',
      occurrenceDaysAgo: 12,
      status: 'OPEN',
    },
    {
      key: 'found-bottle',
      reportType: 'FOUND',
      itemTitle: 'Blue stainless water bottle',
      description:
        'Found a blue stainless steel bottle with a dented lid on a library study table.',
      privateIdentificationDetails: 'Dented lid and a faded engineering faculty sticker.',
      category: 'Other',
      color: 'Blue',
      brand: 'Thermos',
      reporterEmail: DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email,
      building: 'Administration',
      locationIndex: 9,
      locationDetails: 'Library second-floor study table',
      occurrenceDaysAgo: 9,
      status: 'OPEN',
    },
    {
      key: 'lost-phone',
      reportType: 'LOST',
      itemTitle: 'Silver iPhone 13',
      description:
        'Lost a silver iPhone 13 in a clear case near the medical complex entrance. The lock screen shows a photo of a cat.',
      privateIdentificationDetails:
        'IMEI ending 4812, clear case with a cat wallpaper and a small crack on the corner.',
      category: 'Phones',
      color: 'Silver',
      brand: 'Apple',
      reporterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Medical',
      locationIndex: 5,
      locationDetails: 'Main entrance steps',
      occurrenceDaysAgo: 18,
      status: 'MATCH_CONFIRMED',
    },
    {
      key: 'found-phone',
      reportType: 'FOUND',
      itemTitle: 'Silver iPhone 13',
      description:
        'Found a silver iPhone 13 in a clear case at the medical complex entrance. The phone is switched off.',
      privateIdentificationDetails:
        'IMEI ending 4812, clear case with a cat wallpaper and a small crack on the corner.',
      category: 'Phones',
      color: 'Silver',
      brand: 'Apple',
      reporterEmail: DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email,
      building: 'Medical',
      locationIndex: 5,
      locationDetails: 'Security desk at the main entrance',
      occurrenceDaysAgo: 17,
      status: 'CLAIM_UNDER_REVIEW',
    },
    {
      key: 'lost-keys',
      reportType: 'LOST',
      itemTitle: 'Bunch of keys with a red tag',
      description:
        'Lost a bunch of three keys with a red plastic tag near the humanities building.',
      privateIdentificationDetails:
        'Red tag marked M.A. and a small brass key for a bicycle lock.',
      category: 'Keys',
      color: 'Silver',
      reporterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Humanities',
      locationIndex: 4,
      locationDetails: 'Humanities building main gate',
      occurrenceDaysAgo: 36,
      status: 'RETURNED',
    },
    {
      key: 'found-keys',
      reportType: 'FOUND',
      itemTitle: 'Bunch of keys with a red tag',
      description:
        'Found a bunch of three keys with a red plastic tag at the humanities building gate.',
      privateIdentificationDetails:
        'Red tag marked M.A. and a small brass key for a bicycle lock.',
      category: 'Keys',
      color: 'Silver',
      reporterEmail: DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email,
      building: 'Humanities',
      locationIndex: 4,
      locationDetails: 'Security office',
      occurrenceDaysAgo: 35,
      status: 'RETURNED',
    },
    {
      key: 'lost-umbrella',
      reportType: 'LOST',
      itemTitle: 'Navy blue umbrella',
      description:
        'Lost a navy blue umbrella with a wooden handle in the library lobby.',
      privateIdentificationDetails: 'Wooden handle with a small white scratch and a black strap.',
      category: 'Other',
      color: 'Navy blue',
      reporterEmail: DEMO_STUDENT_EMAIL,
      building: 'Administration',
      locationIndex: 4,
      locationDetails: 'Library lobby',
      occurrenceDaysAgo: 15,
      status: 'OPEN',
    },
    {
      key: 'found-umbrella',
      reportType: 'FOUND',
      itemTitle: 'Navy blue umbrella',
      description:
        'Found a navy blue umbrella with a wooden handle near the library entrance.',
      privateIdentificationDetails: 'Wooden handle with a small white scratch and a black strap.',
      category: 'Other',
      color: 'Navy blue',
      reporterEmail: DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email,
      building: 'Administration',
      locationIndex: 4,
      locationDetails: 'Library entrance',
      occurrenceDaysAgo: 14,
      status: 'OPEN',
    },
    {
      key: 'lost-id',
      reportType: 'LOST',
      itemTitle: 'Student ID card',
      description:
        'Lost a student ID card in a transparent holder somewhere in the humanities building.',
      privateIdentificationDetails:
        'Student ID 2023-1187 issued to Sara Mahmoud and a small passport photo inside the holder.',
      category: 'Documents',
      reporterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Humanities',
      locationIndex: 8,
      locationDetails: 'Lecture hall corridor',
      occurrenceDaysAgo: 6,
      status: 'OPEN',
    },
    {
      key: 'found-id',
      reportType: 'FOUND',
      itemTitle: 'Student ID card',
      description:
        'Found a student ID card in a transparent holder on the floor of the humanities corridor.',
      privateIdentificationDetails:
        'Student ID 2023-1187 issued to Sara Mahmoud and a small passport photo inside the holder.',
      category: 'Documents',
      reporterEmail: DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email,
      building: 'Humanities',
      locationIndex: 8,
      locationDetails: 'Humanities reception',
      occurrenceDaysAgo: 5,
      status: 'APPROVED_FOR_HANDOVER',
    },
    {
      key: 'lost-hoodie',
      reportType: 'LOST',
      itemTitle: 'Grey university hoodie',
      description:
        'Left a grey university hoodie in the engineering study room. It has a small ink stain on the sleeve.',
      privateIdentificationDetails: 'Drawstring missing on the left side and an ink stain on the cuff.',
      category: 'Clothing',
      color: 'Grey',
      reporterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Engineering',
      locationIndex: 6,
      locationDetails: 'Study room 2',
      occurrenceDaysAgo: 4,
      status: 'OPEN',
    },
    {
      key: 'found-hoodie',
      reportType: 'FOUND',
      itemTitle: 'Grey university hoodie',
      description:
        'Found a grey university hoodie on a chair in the engineering study room.',
      privateIdentificationDetails: 'Drawstring missing on the left side and an ink stain on the cuff.',
      category: 'Clothing',
      color: 'Grey',
      reporterEmail: DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email,
      building: 'Engineering',
      locationIndex: 6,
      locationDetails: 'Study room 2',
      occurrenceDaysAgo: 3,
      status: 'OPEN',
    },
    {
      key: 'lost-textbook',
      reportType: 'LOST',
      itemTitle: 'Data structures textbook',
      description:
        'Lost a data structures textbook in the library. The name Omar Khaled is written inside the cover.',
      privateIdentificationDetails: 'Name Omar Khaled inside the cover and highlighted chapter 4.',
      category: 'Books',
      reporterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Administration',
      locationIndex: 7,
      locationDetails: 'Library reading room',
      occurrenceDaysAgo: 25,
      status: 'OPEN',
    },
    {
      key: 'found-textbook',
      reportType: 'FOUND',
      itemTitle: 'Data structures textbook',
      description:
        'Found a data structures textbook left on a library desk after closing time.',
      privateIdentificationDetails: 'Name Omar Khaled inside the cover and highlighted chapter 4.',
      category: 'Books',
      reporterEmail: DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email,
      building: 'Administration',
      locationIndex: 7,
      locationDetails: 'Library reading room',
      occurrenceDaysAgo: 24,
      status: 'CLOSED',
    },
    {
      key: 'lost-usb',
      reportType: 'LOST',
      itemTitle: '32 GB USB drive',
      description:
        'Lost a black USB drive with a red cap near the computer lab printers.',
      privateIdentificationDetails: 'Serial ending 7461 and a red plastic cap.',
      category: 'Electronics',
      color: 'Black',
      reporterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 7,
      locationDetails: 'Computer lab printer area',
      occurrenceDaysAgo: 50,
      status: 'CLOSED',
    },
    {
      key: 'found-usb',
      reportType: 'FOUND',
      itemTitle: '32 GB USB drive',
      description:
        'Found a black USB drive with a red cap beside the computer lab printers.',
      privateIdentificationDetails: 'Serial ending 7461 and a red plastic cap.',
      category: 'Electronics',
      color: 'Black',
      reporterEmail: DEMO_ACCOUNTS.LOST_FOUND_OFFICER.email,
      building: 'Engineering',
      locationIndex: 7,
      locationDetails: 'Computer lab printer area',
      occurrenceDaysAgo: 49,
      status: 'OPEN',
    },
  ];

  const itemDocs = itemSpecs.map((spec, index) => ({
    _id: new Types.ObjectId(),
    reportNumber: `LF-${2001 + index}`,
    reportType: spec.reportType,
    itemTitle: spec.itemTitle,
    description: spec.description,
    privateIdentificationDetails: spec.privateIdentificationDetails,
    category: spec.category,
    color: spec.color,
    brand: spec.brand,
    locationId: locationId(spec.building, spec.locationIndex),
    locationDetails: spec.locationDetails,
    occurrenceDate: daysAgo(spec.occurrenceDaysAgo, 12),
    images: [],
    reporterId: userId(spec.reporterEmail),
    status: spec.status,
    createdAt: daysAgo(spec.occurrenceDaysAgo, 13),
    updatedAt: daysAgo(Math.max(0, spec.occurrenceDaysAgo - 1), 13),
  }));

  const itemByKey = new Map(
    itemSpecs.map((spec, index) => [spec.key, itemDocs[index]!]),
  );

  await LostFoundItem.insertMany(itemDocs);

  const matchSpecs = [
    { lost: 'lost-backpack', found: 'found-backpack', score: 94, level: 'STRONG', status: 'CONFIRMED' },
    { lost: 'lost-bottle', found: 'found-bottle', score: 66, level: 'POSSIBLE', status: 'SUGGESTED' },
    { lost: 'lost-phone', found: 'found-phone', score: 89, level: 'STRONG', status: 'SUGGESTED' },
    { lost: 'lost-keys', found: 'found-keys', score: 96, level: 'STRONG', status: 'CONFIRMED' },
    { lost: 'lost-umbrella', found: 'found-umbrella', score: 58, level: 'POSSIBLE', status: 'DISMISSED' },
  ] as const;

  const matchDocs = matchSpecs.map((spec) => ({
    _id: new Types.ObjectId(),
    lostItemId: itemByKey.get(spec.lost)!._id,
    foundItemId: itemByKey.get(spec.found)!._id,
    score: spec.score,
    level: spec.level,
    breakdown: {
      category: 1,
      location: spec.level === 'STRONG' ? 0.9 : 0.5,
      date: spec.level === 'STRONG' ? 0.9 : 0.4,
      color: 1,
      brand: spec.level === 'STRONG' ? 0.9 : 0.3,
      keywords: spec.level === 'STRONG' ? 0.9 : 0.5,
    },
    status: spec.status,
    reviewedBy: spec.status === 'SUGGESTED' ? undefined : officerId,
    reviewedAt: spec.status === 'SUGGESTED' ? undefined : daysAgo(2),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  }));

  await ItemMatch.insertMany(matchDocs);

  const claimSpecs: ClaimSpec[] = [
    {
      itemKey: 'found-backpack',
      linkedLostKey: 'lost-backpack',
      claimantEmail: DEMO_STUDENT_EMAIL,
      claimDescription:
        'This is my backpack. I left it on the bench outside Lab 204 and realised it was missing after the lecture.',
      identifyingDetailsProvided:
        'My initials are under the flap and there is a blue keychain in the front pocket.',
      status: 'UNDER_VERIFICATION',
      verificationNotes: 'Initials and keychain checked against the private details on the found report.',
      reviewed: true,
    },
    {
      itemKey: 'found-phone',
      linkedLostKey: 'lost-phone',
      claimantEmail: EXTRA_STUDENT_EMAILS[1]!,
      claimDescription:
        'I lost my silver iPhone near the medical entrance. It has a clear case and a photo of my cat on the lock screen.',
      identifyingDetailsProvided:
        'The IMEI ends in 4812 and there is a small crack on the bottom corner.',
      status: 'PENDING_REVIEW',
      reviewed: false,
    },
    {
      itemKey: 'found-id',
      claimantEmail: EXTRA_STUDENT_EMAILS[0]!,
      claimDescription:
        'This is my student ID card. It slipped out of my folder somewhere in the humanities corridor.',
      identifyingDetailsProvided:
        'The card is issued to Sara Mahmoud and the holder contains my passport photo.',
      status: 'APPROVED',
      verificationNotes: 'Photo and student number matched.',
      reviewed: true,
    },
    {
      itemKey: 'found-keys',
      linkedLostKey: 'lost-keys',
      claimantEmail: EXTRA_STUDENT_EMAILS[0]!,
      claimDescription:
        'These are my keys. I lost them at the humanities gate and the red tag has my initials on it.',
      identifyingDetailsProvided: 'Red tag marked M.A. and a brass bicycle key.',
      status: 'COMPLETED',
      verificationNotes: 'Keys matched the description and the owner collected them.',
      reviewed: true,
      handover: {
        receivedByName: 'Sara Mahmoud',
        notes: 'Student ID checked and signed at the security office.',
        handedOverAt: daysAgo(2, 15),
      },
    },
    {
      itemKey: 'found-umbrella',
      linkedLostKey: 'lost-umbrella',
      claimantEmail: EXTRA_STUDENT_EMAILS[1]!,
      claimDescription:
        'I think this umbrella is mine. I lost a navy blue one somewhere around the library last week.',
      identifyingDetailsProvided: 'It is navy blue with a wooden handle.',
      status: 'REJECTED',
      rejectionReason:
        'The identifying details did not match the private details on the found report.',
      reviewed: true,
    },
  ];

  const claimDocs = claimSpecs.map((spec, index) => ({
    _id: new Types.ObjectId(),
    claimNumber: `CLM-${2001 + index}`,
    itemId: itemByKey.get(spec.itemKey)!._id,
    linkedLostItemId: spec.linkedLostKey
      ? itemByKey.get(spec.linkedLostKey)!._id
      : undefined,
    claimantId: userId(spec.claimantEmail),
    claimDescription: spec.claimDescription,
    identifyingDetailsProvided: spec.identifyingDetailsProvided,
    supportingEvidence: [],
    status: spec.status,
    verificationNotes: spec.verificationNotes,
    rejectionReason: spec.rejectionReason,
    reviewedBy: spec.reviewed ? officerId : undefined,
    reviewedAt: spec.reviewed ? daysAgo(3) : undefined,
    handover: spec.handover,
    createdAt: daysAgo(5, 10 + index),
    updatedAt: daysAgo(2, 12),
  }));

  await ClaimRequest.insertMany(claimDocs);

  // ---------------------------------------------------------------------------
  // Notifications and activity logs
  // ---------------------------------------------------------------------------
  const notificationDocs = [
    {
      userId: demoStudentId,
      type: 'REQUEST_APPROVED',
      title: 'Maintenance request approved',
      message: 'MR-2008 was approved and a work order has been created.',
      relatedEntityType: 'MaintenanceRequest',
      relatedEntityId: requestByKey.get('approved-pending')!._id,
      linkUrl: '/maintenance/requests',
      isRead: false,
      createdAt: hoursAgo(20),
    },
    {
      userId: demoStudentId,
      type: 'WORK_ORDER_COMPLETED',
      title: 'Work order completed',
      message: 'WO-2007 was completed. Please confirm the repair from your request.',
      relatedEntityType: 'WorkOrder',
      relatedEntityId: workOrderDocs[6]!._id,
      linkUrl: '/maintenance/requests',
      isRead: false,
      createdAt: hoursAgo(30),
    },
    {
      userId: demoStudentId,
      type: 'CLAIM_APPROVED',
      title: 'Claim approved for handover',
      message: 'Your claim CLM-2003 was approved. Visit the Lost & Found office to collect the item.',
      relatedEntityType: 'ClaimRequest',
      relatedEntityId: claimDocs[2]!._id,
      linkUrl: '/lost-found/claims',
      isRead: false,
      createdAt: hoursAgo(44),
    },
    {
      userId: demoStudentId,
      type: 'REQUEST_REOPENED',
      title: 'Request reopened',
      message: 'MR-2023 was reopened and a new work order is waiting for assignment.',
      relatedEntityType: 'MaintenanceRequest',
      relatedEntityId: requestByKey.get('reopened-1')!._id,
      linkUrl: '/maintenance/requests',
      isRead: true,
      createdAt: hoursAgo(70),
    },
    {
      userId: managerId,
      type: 'REQUEST_SUBMITTED',
      title: 'New maintenance request',
      message: 'A new HIGH priority request was submitted for the engineering complex.',
      relatedEntityType: 'MaintenanceRequest',
      relatedEntityId: requestByKey.get('submitted-1')!._id,
      linkUrl: '/maintenance/requests/queue',
      isRead: false,
      createdAt: hoursAgo(5),
    },
    {
      userId: managerId,
      type: 'WORK_ORDER_OVERDUE',
      title: 'Work order overdue',
      message: 'WO-2005 has passed its expected completion date.',
      relatedEntityType: 'WorkOrder',
      relatedEntityId: workOrderDocs[4]!._id,
      linkUrl: '/maintenance/work-orders',
      isRead: false,
      createdAt: hoursAgo(12),
    },
    {
      userId: officerId,
      type: 'CLAIM_PENDING',
      title: 'New claim awaiting review',
      message: 'CLM-2002 was submitted for a found phone.',
      relatedEntityType: 'ClaimRequest',
      relatedEntityId: claimDocs[1]!._id,
      linkUrl: '/lost-found/claims',
      isRead: false,
      createdAt: hoursAgo(9),
    },
    {
      userId: officerId,
      type: 'MATCH_SUGGESTED',
      title: 'New possible match',
      message: 'A STRONG match was suggested between a lost phone and a found phone.',
      relatedEntityType: 'ItemMatch',
      relatedEntityId: matchDocs[2]!._id,
      linkUrl: '/lost-found/matches',
      isRead: true,
      createdAt: hoursAgo(32),
    },
    {
      userId: technicianIds[0]!,
      type: 'WORK_ORDER_ASSIGNED',
      title: 'New work order assigned',
      message: 'WO-2002 is assigned to you and scheduled for tomorrow.',
      relatedEntityType: 'WorkOrder',
      relatedEntityId: workOrderDocs[1]!._id,
      linkUrl: '/maintenance/work-orders',
      isRead: false,
      createdAt: hoursAgo(16),
    },
  ];

  await Notification.insertMany(notificationDocs);

  const activityLogDocs = [
    {
      actorId: adminId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: userId(EXTRA_STUDENT_EMAILS[0]!),
      description: 'Created student account for Sara Mahmoud',
      metadata: { role: 'STUDENT_EMPLOYEE' },
      createdAt: daysAgo(12),
    },
    {
      actorId: managerId,
      action: 'REQUEST_APPROVED',
      entityType: 'MaintenanceRequest',
      entityId: requestByKey.get('approved-assigned')!._id,
      description: 'Approved maintenance request MR-2009 and created work order WO-2002',
      metadata: { workOrderNumber: 'WO-2002' },
      createdAt: daysAgo(10),
    },
    {
      actorId: managerId,
      action: 'WORK_ORDER_ASSIGNED',
      entityType: 'WorkOrder',
      entityId: workOrderDocs[1]!._id,
      description: 'Assigned work order WO-2002 to Hassan El-Sayed',
      metadata: { technician: 'Hassan El-Sayed' },
      createdAt: daysAgo(9),
    },
    {
      actorId: technicianIds[0]!,
      action: 'WORK_ORDER_STARTED',
      entityType: 'WorkOrder',
      entityId: workOrderDocs[5]!._id,
      description: 'Started work order WO-2006',
      metadata: { status: 'IN_PROGRESS' },
      createdAt: daysAgo(2),
    },
    {
      actorId: technicianIds[0]!,
      action: 'WORK_ORDER_COMPLETED',
      entityType: 'WorkOrder',
      entityId: workOrderDocs[7]!._id,
      description: 'Completed work order WO-2008 and recorded resolution details',
      metadata: { status: 'COMPLETED' },
      createdAt: daysAgo(27),
    },
    {
      actorId: managerId,
      action: 'PREVENTIVE_PLAN_CREATED',
      entityType: 'PreventivePlan',
      entityId: duePlanId,
      description: 'Created preventive plan Weekly HVAC filter inspection',
      metadata: { recurrenceType: 'WEEKLY' },
      createdAt: daysAgo(16),
    },
    {
      actorId: managerId,
      action: 'PREVENTIVE_WORK_ORDER_GENERATED',
      entityType: 'WorkOrder',
      entityId: preventiveWorkOrder._id,
      description: 'Generated preventive work order from the quarterly tank cleaning plan',
      metadata: { schedule: 'quarterly' },
      createdAt: daysAgo(8),
    },
    {
      actorId: officerId,
      action: 'MATCH_CONFIRMED',
      entityType: 'ItemMatch',
      entityId: matchDocs[0]!._id,
      description: 'Confirmed the STRONG match for the black North Face backpack',
      metadata: { score: 94, level: 'STRONG' },
      createdAt: daysAgo(7),
    },
    {
      actorId: officerId,
      action: 'CLAIM_APPROVED',
      entityType: 'ClaimRequest',
      entityId: claimDocs[2]!._id,
      description: 'Approved claim CLM-2003 after verifying the student ID card',
      metadata: { status: 'APPROVED' },
      createdAt: daysAgo(3),
    },
    {
      actorId: officerId,
      action: 'HANDOVER_COMPLETED',
      entityType: 'ClaimRequest',
      entityId: claimDocs[3]!._id,
      description: 'Recorded handover for claim CLM-2004',
      metadata: { receivedByName: 'Sara Mahmoud' },
      createdAt: daysAgo(2),
    },
    {
      actorId: adminId,
      action: 'LOCATION_UPDATED',
      entityType: 'Location',
      entityId: locationId('Administration', 0),
      description: 'Updated the description of a library room',
      metadata: { building: 'Administration & Central Library Building' },
      createdAt: daysAgo(1),
    },
    {
      actorId: managerId,
      action: 'REQUEST_REOPENED',
      entityType: 'MaintenanceRequest',
      entityId: requestByKey.get('reopened-1')!._id,
      description: 'Reopened request MR-2023 and created a replacement work order',
      metadata: { reopenCount: 1 },
      createdAt: hoursAgo(18),
    },
  ];

  await ActivityLog.insertMany(activityLogDocs);

  // ---------------------------------------------------------------------------
  // Cached AI insight (read-only on the admin dashboard)
  // ---------------------------------------------------------------------------
  const insightCache = {
    period: '7d' as const,
    generatedAt: daysAgo(1, 7),
    rangeStart: daysAgo(8, 7),
    rangeEnd: daysAgo(1, 7),
    stats: {
      period: '7d',
      requests: { total: 6, previousTotal: 5, changePercent: 20 },
      workOrders: { active: 5, completed: 1, overdue: 1, averageResolutionHours: 8.4 },
      topCategories: [
        { category: 'Hardware', count: 2 },
        { category: 'Plumbing', count: 2 },
        { category: 'Electrical', count: 1 },
      ],
    },
    insights: {
      observations: [
        'Hardware and plumbing issues account for most requests in this period.',
        'One work order is past its expected completion date.',
      ],
      repeatedPatterns: [
        'Engineering complex requests cluster around laboratory equipment.',
        'Library and administration areas report recurring climate-control issues.',
      ],
      operationalRisks: [
        'The overdue network switch replacement may affect connectivity during peak hours.',
        'Server room cooling remains the highest operational risk.',
      ],
      preventiveRecommendations: [
        'Bring forward the HVAC filter inspection for the library.',
        'Schedule a network hardware health check before the next exam period.',
      ],
    },
    model: 'gemini-2.5-flash',
    createdAt: daysAgo(1, 7),
    updatedAt: daysAgo(1, 7),
  };

  await AiInsightCache.insertMany([insightCache]);

  return {
    requests: requestDocs.length,
    workOrders: workOrderDocs.length + 1,
    feedback: feedbackDocs.length,
    preventivePlans: planDocs.length,
    lostItems: itemDocs.filter((item) => item.reportType === 'LOST').length,
    foundItems: itemDocs.filter((item) => item.reportType === 'FOUND').length,
    matches: matchDocs.length,
    claims: claimDocs.length,
    notifications: notificationDocs.length,
    activityLogs: activityLogDocs.length,
    insights: 1,
  };
}
