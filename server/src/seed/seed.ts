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

export const SEED_PASSWORD = 'CampusCare#2026';

interface SeedUser {
  name: string;
  email: string;
  role: Role;
  department: string;
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
}

interface SeedOptions {
  silent?: boolean;
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
    contactPhone: '+20 100 555 0196',
    specializations: ['Furniture', 'General Maintenance'],
    skills: ['Lecture hall seating repair', 'Carpentry', 'Door & lock hardware'],
    availability: 'OFF_DUTY',
  },
];

const BUILDINGS = [
  {
    name: 'Administration & Central Library Building',
    floors: 4,
    description: 'Executive offices, main auditorium, student affairs, and the Central Library',
  },
  {
    name: 'Engineering & Technological Complex',
    floors: 4,
    description: 'Engineering, Computer Engineering, and Artificial Intelligence labs',
  },
  {
    name: 'Medical Sector Complex',
    floors: 4,
    description: 'Faculties of Medicine, Dentistry, Pharmacy, and Nursing clinics',
  },
  {
    name: 'Humanities & Business Building',
    floors: 4,
    description: 'Lecture halls and seminar rooms for business, economics, and administrative sciences',
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
      contactPhone: '+20 100 555 0100',
    };
  }).filter((user) => user.role !== 'TECHNICIAN');

  return [...demoUsers, ...TECHNICIANS];
}

function buildLocations(): Array<{
  buildingName: string;
  floor: string;
  room: string;
  locationType: 'ROOM';
  description: string;
  isActive: boolean;
}> {
  return BUILDINGS.flatMap((building) =>
    Array.from({ length: building.floors }, (_, floorIndex) => {
      const floorLabel = floorIndex === 0 ? 'Ground Floor' : `Floor ${floorIndex}`;
      const prefix = floorIndex === 0 ? 'G' : `${floorIndex}`;
      return [1, 2, 3].map((roomNumber) => ({
        buildingName: building.name,
        floor: floorLabel,
        room: `${prefix}${String(roomNumber).padStart(2, '0')}`,
        locationType: 'ROOM' as const,
        description: `${building.description} — ${floorLabel}, Room ${prefix}${String(
          roomNumber,
        ).padStart(2, '0')}`,
        isActive: true,
      }));
    }).flat(),
  );
}

/**
 * Wipes the configured database and recreates the Day 1 demo foundation:
 * one account per role, five technicians, and four buildings with rooms.
 * Full demo data is added in Day 6 (T067).
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

    const report: SeedReport = {
      accounts: seedUsers.length,
      technicians: seedUsers.filter((user) => user.role === 'TECHNICIAN').length,
      locations: locations.length,
      buildings: BUILDINGS.length,
    };

    if (!options.silent) {
      console.log('\nCampusCare seed complete');
      console.log('------------------------');
      console.log(`Accounts:    ${report.accounts}`);
      console.log(`Technicians: ${report.technicians}`);
      console.log(`Buildings:   ${report.buildings}`);
      console.log(`Locations:   ${report.locations}`);
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
