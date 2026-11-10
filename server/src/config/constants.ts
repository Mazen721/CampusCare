export const ROLES = [
  'SUPER_ADMIN',
  'MAINTENANCE_MANAGER',
  'TECHNICIAN',
  'LOST_FOUND_OFFICER',
  'STUDENT_EMPLOYEE',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  MAINTENANCE_MANAGER: 'Maintenance Manager',
  TECHNICIAN: 'Technician',
  LOST_FOUND_OFFICER: 'Lost & Found Officer',
  STUDENT_EMPLOYEE: 'Student / Employee',
};

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const MAINTENANCE_CATEGORIES = [
  'Hardware',
  'Software',
  'Network',
  'Electrical',
  'Plumbing',
  'Air Conditioning',
  'Furniture',
  'General Maintenance',
  'Other',
] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const LOST_FOUND_CATEGORIES = [
  'Electronics',
  'Phones',
  'Laptops',
  'Headphones',
  'Wallets',
  'Bags',
  'Keys',
  'Documents',
  'Accessories',
  'Books',
  'Clothing',
  'Other',
] as const;
export type LostFoundCategory = (typeof LOST_FOUND_CATEGORIES)[number];

export const REQUEST_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
  'REOPENED',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const WORK_ORDER_STATUSES = [
  'PENDING_ASSIGNMENT',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const ITEM_STATUSES = [
  'OPEN',
  'MATCH_CONFIRMED',
  'CLAIM_UNDER_REVIEW',
  'APPROVED_FOR_HANDOVER',
  'RETURNED',
  'CLOSED',
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const CLAIM_STATUSES = [
  'PENDING_REVIEW',
  'UNDER_VERIFICATION',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const MATCH_STATUSES = ['SUGGESTED', 'CONFIRMED', 'DISMISSED'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MATCH_LEVELS = ['STRONG', 'POSSIBLE'] as const;
export type MatchLevel = (typeof MATCH_LEVELS)[number];

export const REPORT_TYPES = ['LOST', 'FOUND'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const SOURCE_TYPES = ['REACTIVE', 'PREVENTIVE'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const RECURRENCE_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DAYS'] as const;
export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

export const TECHNICIAN_AVAILABILITIES = ['AVAILABLE', 'BUSY', 'OFF_DUTY'] as const;
export type TechnicianAvailability = (typeof TECHNICIAN_AVAILABILITIES)[number];

export const LOCATION_TYPES = ['BUILDING', 'FLOOR', 'ROOM', 'LAB', 'OTHER'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const IMAGE_MAX_COUNT = 3;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface DemoAccount {
  email: string;
  name: string;
  nameAr: string;
  department: string;
  departmentAr?: string;
}

export const DEMO_ACCOUNTS: Record<Role, DemoAccount> = {
  SUPER_ADMIN: {
    email: 't.elshenawy@mansnu.edu.eg',
    name: 'Eng. Tarek El-Shenawy',
    nameAr: 'م. طارق الشناوي',
    department: 'Information Technology & Digital Transformation Unit',
    departmentAr: 'وحدة تكنولوجيا المعلومات والتحول الرقمي',
  },
  MAINTENANCE_MANAGER: {
    email: 'm.elmetwally@mansnu.edu.eg',
    name: 'Eng. Mahmoud El-Metwally',
    nameAr: 'م. محمود المتولي',
    department: 'Engineering Affairs & Maintenance Department',
    departmentAr: 'الإدارة العامة للشئون الهندسية والصيانة',
  },
  TECHNICIAN: {
    email: 'h.elsayed@mansnu.edu.eg',
    name: 'Hassan El-Sayed',
    nameAr: 'حسن السيد',
    department: 'Engineering Affairs & Maintenance Department',
    departmentAr: 'الإدارة العامة للشئون الهندسية والصيانة',
  },
  LOST_FOUND_OFFICER: {
    email: 'a.eldesouky@mansnu.edu.eg',
    name: 'Ahmed El-Desouky',
    nameAr: 'أ. أحمد الدسوقي',
    department: 'University Security, Safety & Lost and Found Office',
    departmentAr: 'إدارة الأمن الجامعي والسلامة — مكتب المفقودات',
  },
  STUDENT_EMPLOYEE: {
    email: 'youssef.elashry@std.mansnu.edu.eg',
    name: 'Youssef El-Ashry',
    nameAr: 'يوسف العشري',
    department: 'Faculty of Engineering (Level 3 Mechatronics)',
    departmentAr: 'كلية الهندسة (المستوى الثالث — ميكاترونكس)',
  },
};
