import mongoose from 'mongoose';
import {
  DEMO_ACCOUNTS,
  ROLES,
  type MaintenanceCategory,
  type Role,
  type TechnicianAvailability,
} from '../config/constants';
import { env } from '../config/env';
import { hashPassword } from '../modules/auth/auth.service';
import { User } from '../modules/auth/user.model';
import { Location } from '../modules/locations/location.model';
import { MaintenanceRequest } from '../modules/maintenance/requests/maintenanceRequest.model';
import { WorkOrder } from '../modules/maintenance/work-orders/workOrder.model';
import { PreventivePlan } from '../modules/preventive/preventivePlan.model';
import { ServiceFeedback } from '../modules/maintenance/feedback/serviceFeedback.model';
import { LostFoundItem } from '../modules/lost-found/items/lostFoundItem.model';
import { ItemMatch } from '../modules/lost-found/matches/itemMatch.model';
import { ClaimRequest } from '../modules/lost-found/claims/claimRequest.model';
import { AiInsightCache } from '../modules/ai/aiInsightCache.model';
import { Counter } from '../shared/models/Counter.model';
import { COUNTER_PREFIXES } from '../shared/services/counter.service';
import { Notification } from '../shared/models/Notification.model';
import { ActivityLog } from '../shared/models/ActivityLog.model';
import { seedDemoData, type DemoDataCounts } from './demoData';

export const SEED_PASSWORD = 'CampusCare#2026';

interface SeedUser {
  name: string;
  email: string;
  role: Role;
  department: string;
  departmentAr?: string;
  contactPhone?: string;
  specializations?: MaintenanceCategory[];
  skills?: string[];
  availability?: TechnicianAvailability;
}

interface SeedReport {
  accounts: number;
  technicians: number;
  locations: number;
  buildings: number;
  demo?: DemoDataCounts;
}

interface SeedOptions {
  silent?: boolean;
  /**
   * Adds the full Day 6 demo dataset. Defaults to true outside tests so the
   * earlier phase suites, which assume an otherwise empty workflow, keep a
   * minimal foundation.
   */
  fullDemoData?: boolean;
}

interface IndexableModel {
  createIndexes(): Promise<unknown>;
}

const ALL_MODELS: IndexableModel[] = [
  Counter,
  User,
  Location,
  MaintenanceRequest,
  WorkOrder,
  PreventivePlan,
  ServiceFeedback,
  LostFoundItem,
  ItemMatch,
  ClaimRequest,
  Notification,
  ActivityLog,
  AiInsightCache,
];

const TECHNICIANS: SeedUser[] = [
  {
    name: DEMO_ACCOUNTS.TECHNICIAN.name,
    email: DEMO_ACCOUNTS.TECHNICIAN.email,
    role: 'TECHNICIAN',
    department: DEMO_ACCOUNTS.TECHNICIAN.department,
    departmentAr: DEMO_ACCOUNTS.TECHNICIAN.departmentAr,
    contactPhone: '+20 100 555 0142',
    specializations: ['Electrical', 'Air Conditioning'],
    skills: ['Electrical wiring', 'Distribution boards', 'Power diagnostics'],
    availability: 'AVAILABLE',
  },
  {
    name: 'Mohamed El-Gohary',
    email: 'm.elgohary@mansnu.edu.eg',
    role: 'TECHNICIAN',
    department: 'Engineering Affairs & Maintenance Department',
    departmentAr: 'إدارة الشؤون الهندسية والصيانة',
    contactPhone: '+20 100 555 0188',
    specializations: ['Plumbing', 'General Maintenance'],
    skills: ['Water networks', 'Sanitation maintenance', 'Leak detection'],
    availability: 'AVAILABLE',
  },
  {
    name: 'Karim El-Tantawy',
    email: 'k.eltantawy@mansnu.edu.eg',
    role: 'TECHNICIAN',
    department: 'Information Technology & Digital Transformation Unit',
    departmentAr: 'وحدة تكنولوجيا المعلومات والتحول الرقمي',
    contactPhone: '+20 100 555 0164',
    specializations: ['Hardware', 'Network', 'Software'],
    skills: ['Lab PC maintenance', 'Fiber & LAN cabling', 'Access point configuration'],
    availability: 'BUSY',
  },
  {
    name: 'Ibrahim Abdel-Fattah',
    email: 'i.abdelfattah@mansnu.edu.eg',
    role: 'TECHNICIAN',
    department: 'Engineering Affairs & Maintenance Department',
    departmentAr: 'إدارة الشؤون الهندسية والصيانة',
    contactPhone: '+20 100 555 0127',
    specializations: ['Air Conditioning', 'General Maintenance'],
    skills: ['Central HVAC servicing', 'Chiller maintenance', 'Air handling units'],
    availability: 'AVAILABLE',
  },
  {
    name: 'Sameh Radwan',
    email: 's.radwan@mansnu.edu.eg',
    role: 'TECHNICIAN',
    department: 'General Services & Facilities Management',
    departmentAr: 'إدارة الخدمات العامة والمرافق',
    contactPhone: '+20 100 555 0196',
    specializations: ['Furniture', 'General Maintenance'],
    skills: ['Lecture hall seating repair', 'Carpentry', 'Door & lock hardware'],
    availability: 'OFF_DUTY',
  },
];

const BUILDINGS = [
  {
    name: 'Administration & Central Library Building',
    nameAr: 'مبنى الإدارة والمكتبة المركزية',
    floors: 4,
    description: 'Executive offices, main auditorium, student affairs, and the Central Library',
    descriptionAr: 'المكاتب التنفيذية، القاعة الرئيسية، شؤون الطلاب، والمكتبة المركزية',
  },
  {
    name: 'Engineering & Technological Complex',
    nameAr: 'مجمع الهندسة والتكنولوجيا',
    floors: 4,
    description: 'Engineering, Computer Engineering, and Artificial Intelligence labs',
    descriptionAr: 'معامل الهندسة وهندسة الحاسبات والذكاء الاصطناعي',
  },
  {
    name: 'Medical Sector Complex',
    nameAr: 'مجمع القطاع الطبي',
    floors: 4,
    description: 'Faculties of Medicine, Dentistry, Pharmacy, and Nursing clinics',
    descriptionAr: 'كليات الطب البشري، طب الأسنان، الصيدلة، وعيادات التمريض',
  },
  {
    name: 'Humanities & Business Building',
    nameAr: 'مبنى العلوم الإنسانية وإدارة الأعمال',
    floors: 4,
    description: 'Lecture halls and seminar rooms for business, economics, and administrative sciences',
    descriptionAr: 'مدرجات وقاعات حلقات البحث للعلوم الإدارية والمالية وإدارة الأعمال',
  },
] as const;

function buildSeedUsers(): SeedUser[] {
  const demoUsers: SeedUser[] = ROLES.map((role) => {
    const account = DEMO_ACCOUNTS[role];
    return {
      name: account.name,
      email: account.email,
      role,
      department: account.department,
      departmentAr: account.departmentAr,
      contactPhone: '+20 100 555 0100',
    };
  }).filter((user) => user.role !== 'TECHNICIAN');

  return [...demoUsers, ...TECHNICIANS];
}

function buildLocations(): Array<{
  buildingName: string;
  buildingNameAr: string;
  floor: string;
  floorAr: string;
  room: string;
  roomAr: string;
  locationType: 'ROOM';
  description: string;
  descriptionAr: string;
  isActive: boolean;
}> {
  return BUILDINGS.flatMap((building) =>
    Array.from({ length: building.floors }, (_, floorIndex) => {
      const floorLabel = floorIndex === 0 ? 'Ground Floor' : `Floor ${floorIndex}`;
      const floorLabelAr = floorIndex === 0 ? 'الطابق الأرضي' : `الطابق ${floorIndex}`;
      const prefix = floorIndex === 0 ? 'G' : `${floorIndex}`;
      return [1, 2, 3].map((roomNumber) => {
        const roomCode = `${prefix}${String(roomNumber).padStart(2, '0')}`;
        return {
          buildingName: building.name,
          buildingNameAr: building.nameAr,
          floor: floorLabel,
          floorAr: floorLabelAr,
          room: roomCode,
          roomAr: roomCode,
          locationType: 'ROOM' as const,
          description: `${building.description} — ${floorLabel}, Room ${roomCode}`,
          descriptionAr: `${building.descriptionAr} — ${floorLabelAr}، غرفة ${roomCode}`,
          isActive: true,
        };
      });
    }).flat(),
  );
}

/**
 * Wipes the configured database and recreates the demo foundation: one account
 * per role, five technicians, four buildings with rooms, and (unless running
 * under NODE_ENV=test without an explicit override) the full Day 6 workflow,
 * preventive, Lost & Found, notification, log and insight dataset.
 */
export async function seedDatabase(options: SeedOptions = {}): Promise<SeedReport> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed script refuses to run when NODE_ENV=production');
  }

  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) {
    await mongoose.connect(env.MONGODB_URI);
  }

  try {
    await mongoose.connection.dropDatabase();

    // Recreate every collection and index explicitly after the drop.
    for (const model of ALL_MODELS) {
      await model.createIndexes();
    }

    // Counter has no secondary indexes, so initialise it explicitly to keep all
    // 13 collections present immediately after seeding.
    await Counter.insertMany(COUNTER_PREFIXES.map((_id) => ({ _id, seq: 0 })));

    const passwordHash = await hashPassword(SEED_PASSWORD);
    const seedUsers = buildSeedUsers();

    await User.insertMany(
      seedUsers.map((user) => ({
        ...user,
        passwordHash,
        isActive: true,
        specializations: user.specializations ?? [],
        skills: user.skills ?? [],
      })),
    );

    const locations = buildLocations();
    await Location.insertMany(locations);

    const includeDemoData = options.fullDemoData ?? process.env.NODE_ENV !== 'test';
    const demo = includeDemoData ? await seedDemoData(passwordHash) : undefined;
    const accountCount = await User.countDocuments({});
    const technicianCount = await User.countDocuments({ role: 'TECHNICIAN' });
    const buildingNames = await Location.distinct('buildingName');

    const report: SeedReport = {
      accounts: accountCount,
      technicians: technicianCount,
      locations: locations.length,
      buildings: buildingNames.length,
      demo,
    };

    if (!options.silent) {
      console.log('\nCampusCare seed complete');
      console.log('------------------------');
      console.log(`Accounts:    ${report.accounts}`);
      console.log(`Technicians: ${report.technicians}`);
      console.log(`Buildings:   ${report.buildings}`);
      console.log(`Locations:   ${report.locations}`);
      if (report.demo) {
        console.log(`Requests:    ${report.demo.requests}`);
        console.log(`Work orders: ${report.demo.workOrders}`);
        console.log(`Plans:       ${report.demo.preventivePlans}`);
        console.log(
          `Lost/found:  ${report.demo.lostItems} lost, ${report.demo.foundItems} found`,
        );
        console.log(`Claims:      ${report.demo.claims}`);
        console.log(`Matches:     ${report.demo.matches}`);
        console.log(`Logs:        ${report.demo.activityLogs}`);
      }
      console.log(`\nDemo password: ${SEED_PASSWORD}\n`);
      console.log('Demo accounts:');
      for (const role of ROLES) {
        const account = DEMO_ACCOUNTS[role];
        console.log(`  ${role.padEnd(20)} ${account.email.padEnd(28)} ${account.name}`);
      }
      console.log('');
    }

    return report;
  } finally {
    if (ownsConnection) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  void seedDatabase()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error('[campuscare] seed failed', error);
      process.exit(1);
    });
}
