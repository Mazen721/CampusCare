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
import {
  AI_INSIGHTS_PROMPT_VERSION,
  AiInsightCache,
} from '../modules/ai/aiInsightCache.model';
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
    nameAr: 'سارة محمود',
    email: 'sara.mahmoud@std.mansnu.edu.eg',
    department: 'Faculty of Economics and Business Administration',
    departmentAr: 'كلية الاقتصاد وإدارة الأعمال',
    contactPhone: '+20 100 555 0211',
  },
  {
    name: 'Omar Khaled',
    nameAr: 'عمر خالد',
    email: 'omar.khaled@std.mansnu.edu.eg',
    department: 'Faculty of Medicine and Surgery',
    departmentAr: 'كلية الطب والجراحة',
    contactPhone: '+20 100 555 0224',
  },
  {
    name: 'Dr. Noha El-Gayar',
    nameAr: 'د. نهى الجيار',
    email: 'n.elgayar@mansnu.edu.eg',
    department: 'Faculty of Engineering',
    departmentAr: 'كلية الهندسة',
    contactPhone: '+20 100 555 0238',
  },
  {
    name: 'Mariam El-Menshawy',
    nameAr: 'مريم المنشاوي',
    email: 'mariam.elmenshawy@std.mansnu.edu.eg',
    department: 'Faculty of Dentistry',
    departmentAr: 'كلية طب الفم والأسنان',
    contactPhone: '+20 100 555 0249',
  },
];

const EXTRA_DEMO_LOCATIONS = [
  {
    buildingName: 'Central Workshops & Laboratories Building',
    buildingNameAr: 'مبنى الورش والمعامل المركزية',
    floor: 'Ground Floor',
    floorAr: 'الطابق الأرضي',
    room: 'Heavy Machinery Workshop G01',
    roomAr: 'ورشة الماكينات الثقيلة G01',
    locationType: 'LAB' as const,
    description: 'Dedicated to heavy engineering machinery, fabrication labs, and technical testing — Ground Floor, Heavy Machinery Workshop G01',
    descriptionAr: 'مخصص للماكينات الهندسية الثقيلة ومعامل التصنيع والاختبارات الفنية — الطابق الأرضي، ورشة الماكينات الثقيلة G01',
    isActive: true,
  },
  {
    buildingName: 'Central Workshops & Laboratories Building',
    buildingNameAr: 'مبنى الورش والمعامل المركزية',
    floor: 'Ground Floor',
    floorAr: 'الطابق الأرضي',
    room: 'Fabrication & Welding Lab G03',
    roomAr: 'معمل التصنيع واللحام G03',
    locationType: 'LAB' as const,
    description: 'Dedicated to heavy engineering machinery, fabrication labs, and technical testing — Ground Floor, Fabrication & Welding Lab G03',
    descriptionAr: 'مخصص للماكينات الهندسية الثقيلة ومعامل التصنيع والاختبارات الفنية — الطابق الأرضي، معمل التصنيع واللحام G03',
    isActive: true,
  },
  {
    buildingName: 'Central Workshops & Laboratories Building',
    buildingNameAr: 'مبنى الورش والمعامل المركزية',
    floor: 'Floor 1',
    floorAr: 'الطابق الأول',
    room: 'Materials Testing Lab 102',
    roomAr: 'معمل اختبار المواد 102',
    locationType: 'LAB' as const,
    description: 'Dedicated to heavy engineering machinery, fabrication labs, and technical testing — Floor 1, Materials Testing Lab 102',
    descriptionAr: 'مخصص للماكينات الهندسية الثقيلة ومعامل التصنيع والاختبارات الفنية — الطابق الأول، معمل اختبار المواد 102',
    isActive: true,
  },
  {
    buildingName: 'Central Workshops & Laboratories Building',
    buildingNameAr: 'مبنى الورش والمعامل المركزية',
    floor: 'Floor 1',
    floorAr: 'الطابق الأول',
    room: 'CNC & Mechatronics Lab 104',
    roomAr: 'معمل التحكم الرقمي والميكاترونكس 104',
    locationType: 'LAB' as const,
    description: 'Dedicated to heavy engineering machinery, fabrication labs, and technical testing — Floor 1, CNC & Mechatronics Lab 104',
    descriptionAr: 'مخصص للماكينات الهندسية الثقيلة ومعامل التصنيع والاختبارات الفنية — الطابق الأول، معمل التحكم الرقمي والميكاترونكس 104',
    isActive: true,
  },
  {
    buildingName: 'Student Activities & Sports Complex',
    buildingNameAr: 'منطقة الأنشطة الطلابية والملاعب الرياضية',
    floor: 'Ground Floor',
    floorAr: 'الطابق الأرضي',
    room: 'Central Student Cafeteria G01',
    roomAr: 'الكافتيريا الطلابية المركزية G01',
    locationType: 'OTHER' as const,
    description: 'Multi-purpose courts, student cafeterias, and social hubs — Ground Floor, Central Student Cafeteria G01',
    descriptionAr: 'الملاعب متعددة الأغراض والكافتيريات الطلابية والمراكز الاجتماعية — الطابق الأرضي، الكافتيريا الطلابية المركزية G01',
    isActive: true,
  },
  {
    buildingName: 'Student Activities & Sports Complex',
    buildingNameAr: 'منطقة الأنشطة الطلابية والملاعب الرياضية',
    floor: 'Ground Floor',
    floorAr: 'الطابق الأرضي',
    room: 'Multi-Purpose Sports Court G05',
    roomAr: 'الملعب الرياضي متعدد الأغراض G05',
    locationType: 'OTHER' as const,
    description: 'Multi-purpose courts, student cafeterias, and social hubs — Ground Floor, Multi-Purpose Sports Court G05',
    descriptionAr: 'الملاعب متعددة الأغراض والكافتيريات الطلابية والمراكز الاجتماعية — الطابق الأرضي، الملعب الرياضي متعدد الأغراض G05',
    isActive: true,
  },
  {
    buildingName: 'Student Activities & Sports Complex',
    buildingNameAr: 'منطقة الأنشطة الطلابية والملاعب الرياضية',
    floor: 'Floor 1',
    floorAr: 'الطابق الأول',
    room: 'Student Union & Activities Hub 101',
    roomAr: 'مقر اتحاد الطلاب والأنشطة 101',
    locationType: 'ROOM' as const,
    description: 'Multi-purpose courts, student cafeterias, and social hubs — Floor 1, Student Union & Activities Hub 101',
    descriptionAr: 'الملاعب متعددة الأغراض والكافتيريات الطلابية والمراكز الاجتماعية — الطابق الأول، مقر اتحاد الطلاب والأنشطة 101',
    isActive: true,
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
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: RequestStatus;
  requesterEmail: string;
  building: 'Engineering' | 'Administration' | 'Medical' | 'Humanities' | 'Workshops' | 'Sports';
  locationIndex: number;
  daysAgo: number;
  equipmentDescription?: string;
  equipmentDescriptionAr?: string;
  reviewNotes?: string;
  reviewNotesAr?: string;
  reopenCount?: number;
}

interface WorkOrderNoteSpec {
  note: string;
  noteAr: string;
  hoursAfterStart?: number;
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
  resolutionDetailsAr?: string;
  cancelReason?: string;
  cancelReasonAr?: string;
  notes?: WorkOrderNoteSpec[];
  aiSummaryEn?: string;
  aiSummaryAr?: string;
  current?: boolean;
}

interface ItemSpec {
  key: string;
  reportType: 'LOST' | 'FOUND';
  itemTitle: string;
  itemTitleAr?: string;
  description: string;
  descriptionAr?: string;
  privateIdentificationDetails: string;
  category: 'Electronics' | 'Phones' | 'Laptops' | 'Headphones' | 'Wallets' | 'Bags' | 'Keys' | 'Documents' | 'Accessories' | 'Books' | 'Clothing' | 'Other';
  color?: string;
  colorAr?: string;
  brand?: string;
  brandAr?: string;
  reporterEmail: string;
  building: 'Engineering' | 'Administration' | 'Medical' | 'Humanities' | 'Workshops' | 'Sports';
  locationIndex: number;
  locationDetails: string;
  locationDetailsAr?: string;
  occurrenceDaysAgo: number;
  status: 'OPEN' | 'MATCH_CONFIRMED' | 'CLAIM_UNDER_REVIEW' | 'APPROVED_FOR_HANDOVER' | 'RETURNED' | 'CLOSED';
}

interface ClaimSpec {
  itemKey: string;
  linkedLostKey?: string;
  claimantEmail: string;
  claimDescription: string;
  claimDescriptionAr?: string;
  identifyingDetailsProvided: string;
  status: 'PENDING_REVIEW' | 'UNDER_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  verificationNotes?: string;
  verificationNotesAr?: string;
  rejectionReason?: string;
  rejectionReasonAr?: string;
  reviewed: boolean;
  handover?: {
    receivedByName: string;
    receivedByNameAr?: string;
    notes?: string;
    notesAr?: string;
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
      skillsAr: [],
    })),
  );

  await Location.insertMany(EXTRA_DEMO_LOCATIONS);

  const users = await User.find({}).select('name nameAr email role').lean();
  const locations = await Location.find({ isActive: true })
    .select('buildingName buildingNameAr floor floorAr room roomAr')
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
      titleAr: 'جهاز العرض لا يعمل في مدرج 101',
      descriptionAr:
        'جهاز العرض المثبت في سقف مدرج 101 بمجمع الكليات الهندسية لا يعمل. يظل مؤشر جهاز التحكم أحمر وتُلقى المحاضرات حالياً باستخدام شاشة متنقلة.',
      title: 'Projector will not power on in Lecture Hall 101',
      description:
        'The ceiling projector in Lecture Hall 101 at the Engineering Complex does not power on. The remote indicator stays red and lectures are currently using a portable screen.',
      category: 'Hardware',
      priority: 'HIGH',
      status: 'SUBMITTED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 0,
      daysAgo: 1,
      equipmentDescription: 'Epson EB-L200F Ceiling Laser Projector (Asset #MNU-AV-104)',
      equipmentDescriptionAr: 'جهاز عرض ليزر سقفي Epson EB-L200F (أصل رقم #MNU-AV-104)',
    },
    {
      key: 'submitted-2',
      titleAr: 'صنبور يسرب المياه في عيادة الأسنان 302',
      descriptionAr:
        'صنبور وحدة التعقيم في عيادة الأسنان 302 بالمجمع الطبي يستمر في التنقيط والحوض يمتلئ ببطء. تتجمع المياه حول الحوض.',
      title: 'Leaking faucet in Dental Clinic 302',
      description:
        'A faucet at the sterilization basin in Dental Clinic 302 keeps dripping and the sink is filling slowly. Water is pooling around the basin.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      status: 'SUBMITTED',
      requesterEmail: EXTRA_STUDENT_EMAILS[3]!,
      building: 'Medical',
      locationIndex: 4,
      daysAgo: 3,
      equipmentDescription: 'Grohe Eurosmart Medical Basin Mixer Tap',
      equipmentDescriptionAr: 'خلاط حوض طبي Grohe Eurosmart بوحدة التعقيم',
    },
    {
      key: 'submitted-3',
      titleAr: 'شبكة الواي فاي تنقطع باستمرار في قاعة المطالعة بالمكتبة المركزية',
      descriptionAr:
        'تنقطع الشبكة اللاسلكية كل بضع دقائق في قاعة المطالعة بالمكتبة المركزية. لا يستطيع الطلاب البقاء على اتصال أثناء الاختبارات الإلكترونية.',
      title: 'Wi-Fi drops repeatedly in the Central Library reading room',
      description:
        'The wireless network disconnects every few minutes in the central library reading room. Students cannot stay connected during online exams.',
      category: 'Network',
      priority: 'HIGH',
      status: 'SUBMITTED',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Administration',
      locationIndex: 8,
      daysAgo: 5,
      equipmentDescription: 'Cisco Catalyst 9120AXI Ceiling Access Point (AP-LIB-202)',
      equipmentDescriptionAr: 'نقطة وصول لاسلكية سقفية Cisco Catalyst 9120AXI (AP-LIB-202)',
    },
    {
      key: 'submitted-4',
      titleAr: 'مقعد مكسور في قاعة سيمينار 103 بمبنى الاقتصاد وإدارة الأعمال',
      descriptionAr:
        'أحد مقاعد قاعة السيمينار 103 به كسر في المسند ويهتز عند الجلوس عليه. ينبغي إزالته أو إصلاحه قبل المحاضرة القادمة.',
      title: 'Broken chair in Seminar Room 103 (Humanities & Business)',
      description:
        'One of the seminar chairs in Seminar Room 103 has a cracked seat and rocks when used. It should be removed or repaired before the next class.',
      category: 'Furniture',
      priority: 'LOW',
      status: 'SUBMITTED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Humanities',
      locationIndex: 2,
      daysAgo: 8,
      equipmentDescription: 'Fixed Lecture Seating Unit Row 2 Seat 08',
      equipmentDescriptionAr: 'وحدة مقاعد دراسية ثابتة — الصف الثاني مقعد 08',
    },
    {
      key: 'under-review-1',
      titleAr: 'مكيف الهواء يصدر صوت احتكاك مرتفعاً في معمل ميكاترونكس 204',
      descriptionAr:
        'وحدة التكييف في معمل ميكاترونكس وذكاء اصطناعي 204 تصدر صوتاً مرتفعاً وتهتز بشدة عند بدء التشغيل.',
      title: 'Air conditioner making a loud grinding noise in Mechatronics Lab 204',
      description:
        'The air conditioning unit in Mechatronics & AI Lab 204 makes a loud grinding noise and vibrates strongly when it starts.',
      category: 'Air Conditioning',
      priority: 'MEDIUM',
      status: 'UNDER_REVIEW',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 6,
      daysAgo: 2,
      equipmentDescription: 'Carrier 36,000 BTU Ceiling Cassette HVAC Unit',
      equipmentDescriptionAr: 'وحدة تكييف كاسيت سقفية Carrier قدرة 36,000 وحدة حرارية',
      reviewNotes: 'Facilities team asked to inspect the compressor mount.',
      reviewNotesAr: 'تم تكليف فريق صيانة المرافق بفحص قاعدة تثبيت الضاغط.',
    },
    {
      key: 'under-review-2',
      titleAr: 'أضواء الممر تومض بالقرب من العيادات الطبية 202',
      descriptionAr:
        'أضواء السقف في ممر مجمع الكليات الطبية تومض باستمرار في المساء. المشكلة تؤثر على الممر المؤدي لعيادات الأسنان.',
      title: 'Corridor lights flicker near Dental Clinics 202',
      description:
        'The ceiling lights in the medical complex corridor flicker constantly in the evening. The issue affects the walkway outside the dental clinics.',
      category: 'Electrical',
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Medical',
      locationIndex: 3,
      daysAgo: 4,
      equipmentDescription: 'Philips CoreLine 60x60 LED Panel Array (Circuit MED-F2-L4)',
      equipmentDescriptionAr: 'كشافات سقف ليد Philips CoreLine 60x60 (دائرة MED-F2-L4)',
      reviewNotes: 'Electrical safety inspection scheduled.',
      reviewNotesAr: 'تمت جدولة فحص السلامة الكهربائية للدائرة.',
    },
    {
      key: 'under-review-3',
      titleAr: 'محطة عمل المحاضر في معمل الذكاء الاصطناعي 304 لا تقلع',
      descriptionAr:
        'يتوقف جهاز المحاضر في معمل 304 عند شعار الشركة المصنعة. تعذر إجراء الجلسة العملية للشبكات العصبية المقررة.',
      title: 'Instructor workstation in AI Lab 304 fails to boot',
      description:
        'The instructor workstation in Mechatronics & AI Lab 304 stops at the manufacturer logo. The lab cannot run the scheduled practical session.',
      category: 'Hardware',
      priority: 'CRITICAL',
      status: 'UNDER_REVIEW',
      requesterEmail: EXTRA_STUDENT_EMAILS[2]!,
      building: 'Engineering',
      locationIndex: 9,
      daysAgo: 6,
      equipmentDescription: 'Dell Precision 3660 Tower Workstation (Tag #MNU-ENG-PC01)',
      equipmentDescriptionAr: 'محطة عمل Dell Precision 3660 Tower (رقم الأصل #MNU-ENG-PC01)',
      reviewNotes: 'Check the storage controller before replacing hardware.',
      reviewNotesAr: 'يرجى فحص وحدة التحكم في التخزين (NVMe RAID) قبل استبدال العتاد.',
    },
    {
      key: 'approved-pending',
      titleAr: 'مبرد المياه يسرب في بهو المكتبة المركزية',
      descriptionAr:
        'مبرد المياه بالقرب من بهو المكتبة المركزية يسرب من الأسفل وتم إيقاف تشغيله. الأرضية لا تزال مبللة.',
      title: 'Water dispenser leaking in the Central Library lobby',
      description:
        'The water dispenser near the central library lobby leaks from the bottom and has been switched off. The floor remains wet.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      status: 'APPROVED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Administration',
      locationIndex: 2,
      daysAgo: 9,
      equipmentDescription: 'Oasis Stainless Steel Mains-Fed Water Cooler',
      equipmentDescriptionAr: 'مبرد مياه ستانلس ستيل متصل بالشبكة ماركة Oasis',
      reviewNotes: 'Approved for plumbing repair.',
      reviewNotesAr: 'تمت الموافقة على الطلب لإصلاح السباكة.',
    },
    {
      key: 'approved-assigned',
      titleAr: 'كابل جهاز العرض يحتاج إلى استبدال في مدرج 201',
      descriptionAr:
        'كابل HDMI الخاص بجهاز عرض قاعة المحاضرات 201 تالف عند طرف التوصيل وتتقطع الصورة عند تحريك الكابل.',
      title: 'Projector cable needs replacement in Lecture Hall 201',
      description:
        'The HDMI cable to the lecture hall projector in Lecture Hall 201 is damaged at the connector and the image cuts out when the cable moves.',
      category: 'Hardware',
      priority: 'LOW',
      status: 'APPROVED',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Humanities',
      locationIndex: 5,
      daysAgo: 10,
      equipmentDescription: ' Kramer 15m Active Optical HDMI 2.0 Podium Cable',
      equipmentDescriptionAr: 'كابل عرض ضوئي Kramer HDMI 2.0 بطول 15 متراً بمنصة المحاضر',
      reviewNotes: 'Approved; replacement cable in stock.',
      reviewNotesAr: 'تمت الموافقة؛ الكابل البديل متوفر في المخزن.',
    },
    {
      key: 'approved-assigned-2',
      titleAr: 'قفل الباب عالق في معمل المهارات الإكلينيكية 204',
      descriptionAr:
        'قفل باب معمل المهارات الإكلينيكية يعلق مع وجود المفتاح بداخله ولا يمكن قفل القاعة بإحكام بعد المحاضرات العملية.',
      title: 'Door lock jammed in Clinical Skills Lab 204',
      description:
        'The door lock in Clinical Skills Lab 204 jams with the key inside and the room cannot be locked securely after practical sessions.',
      category: 'Furniture',
      priority: 'HIGH',
      status: 'APPROVED',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Medical',
      locationIndex: 7,
      daysAgo: 12,
      equipmentDescription: 'Yale Heavy-Duty Mortise Cylinder Lockset',
      equipmentDescriptionAr: 'كالون باب سلندر خدمة شاقة ماركة Yale',
      reviewNotes: 'Approved; locksmith requested.',
      reviewNotesAr: 'تمت الموافقة؛ تم استدعاء فني الأقفال والنجارة.',
    },
    {
      key: 'rejected-1',
      titleAr: 'استبدال شاشة كمبيوتر محمول شخصي',
      descriptionAr:
        'تصدعت شاشة حاسوبي المحمول الشخصي وأرغب في استبدالها من قبل وحدة تكنولوجيا المعلومات قبل عرض مشروعي النهائي.',
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
      equipmentDescription: 'Personal Student Laptop (Non-University Asset)',
      equipmentDescriptionAr: 'حاسوب محمول شخصي للطالب (غير تابع لأصول الجامعة)',
      reviewNotes:
        'Personal devices are outside the maintenance scope. Contact the IT service desk for paid repairs.',
      reviewNotesAr:
        'الأجهزة الشخصية خارج نطاق الصيانة الجامعية. يرجى التواصل مع مكتب الدعم الفني للإصلاحات المدفوعة.',
    },
    {
      key: 'rejected-2',
      titleAr: 'إعادة طلاء جدار قاعة شئون الطلاب G01',
      descriptionAr:
        'الجدار خلف شباك شئون الطلاب به خدش بسيط وسيبدو أفضل بطلاء جديد.',
      title: 'Repaint the Student Affairs Hall G01 wall',
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
      reviewNotesAr: 'مكرر ومُدرج بالفعل ضمن خطة الدهانات الصيفية المجدولة.',
    },
    {
      key: 'in-progress',
      titleAr: 'عطل في تبريد غرفة الخوادم بمعمل الذكاء الاصطناعي 104',
      descriptionAr:
        'حرارة غرفة الخوادم الرئيسية ترتفع بشدة ووحدة التبريد الاحتياطية لا تعمل تلقائياً. درجة حرارة الغرفة تجاوزت الحد الآمن.',
      title: 'Server room cooling failure in AI Lab 104',
      description:
        'The primary server room is overheating and the backup cooling unit is not starting automatically. Room temperature is above the safe threshold.',
      category: 'Air Conditioning',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      requesterEmail: EXTRA_STUDENT_EMAILS[2]!,
      building: 'Engineering',
      locationIndex: 4,
      daysAgo: 7,
      equipmentDescription: 'Schneider Electric InRow Precision Cooling Unit (CRAC-02)',
      equipmentDescriptionAr: 'وحدة تبريد دقيق لغرف الخوادم Schneider Electric InRow (CRAC-02)',
      reviewNotes: 'Emergency repair approved.',
      reviewNotesAr: 'تمت الموافقة الفورية كإصلاح طوارئ حرج.',
    },
    {
      key: 'in-progress-overdue',
      titleAr: 'استبدال محول الشبكة (Switch) في الطابق الثاني بمجمع الهندسة',
      descriptionAr:
        'محول شبكة الطابق الثاني يفصل جميع الاتصالات في أوقات الذروة. تم تسليم الوحدة البديلة وتحتاج إلى التركيب.',
      title: 'Network switch replacement on the second floor (Engineering Complex)',
      description:
        'The second-floor network switch drops all connections during peak hours. A replacement unit has been delivered and needs installation.',
      category: 'Network',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 8,
      daysAgo: 20,
      equipmentDescription: 'Cisco Catalyst 2960X-48TS-L Core Distribution Switch',
      equipmentDescriptionAr: 'محول شبكة مركزي 48 منفذاً Cisco Catalyst 2960X-48TS-L',
      reviewNotes: 'Replacement approved; installation in progress.',
      reviewNotesAr: 'تمت الموافقة على الاستبدال؛ وجارٍ التركيب والبرمجة.',
    },
    {
      key: 'in-progress-2',
      titleAr: 'حوض المعمل المكسور يسرب تحت المنضدة في معمل اختبار المواد 102',
      descriptionAr:
        'الحوض في معمل اختبار المواد بمبنى الورش المركزية يسرب تحت المنضدة وتتعرض الخزانة للتلف بسبب المياه. تم عزل إمدادات المياه.',
      title: 'Broken lab sink leaking under the bench in Materials Testing Lab 102',
      description:
        'The sink in Materials Testing Lab 102 leaks under the bench and the cabinet is becoming water damaged. The water supply has been isolated.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      requesterEmail: EXTRA_STUDENT_EMAILS[2]!,
      building: 'Workshops',
      locationIndex: 2,
      daysAgo: 11,
      equipmentDescription: 'Chemical-Resistant Polypropylene Laboratory Sink Trap',
      equipmentDescriptionAr: 'سيفون حوض معملي بولي بروبيلين مقاوم للكيماويات',
      reviewNotes: 'Approved for plumbing repair.',
      reviewNotesAr: 'تمت الموافقة على الطلب لإصلاح السباكة.',
    },
    {
      key: 'completed-1',
      titleAr: 'صيانة تكييف الهواء في القاعة الكبرى G02',
      descriptionAr:
        'تكييف القاعة الكبرى بمبنى إدارة الجامعة لم يكن يبرد بفاعلية أثناء محاضرات بعد الظهر. طُلبت صيانة كاملة.',
      title: 'Air conditioning servicing in Main Auditorium G02',
      description:
        'The auditorium air conditioning was not cooling effectively during afternoon lectures. A full service was requested.',
      category: 'Air Conditioning',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Administration',
      locationIndex: 1,
      daysAgo: 26,
      equipmentDescription: 'Daikin Central Rooftop Package Unit (RTU-AUD-01)',
      equipmentDescriptionAr: 'وحدة تكييف مركزي مدمجة Daikin للقاعة الكبرى (RTU-AUD-01)',
      reviewNotes: 'Approved for scheduled servicing.',
      reviewNotesAr: 'تمت الموافقة لإجراء الصيانة المجدولة.',
    },
    {
      key: 'completed-2',
      titleAr: 'استبدال مقبس كهرباء تالف في ورشة الماكينات الثقيلة G01',
      descriptionAr:
        'مقبس الكهرباء ثلاثي الطور بجانب طاولة الاختبار يصدر شرراً عند إدخال القابس. تم فصل الدائرة فوراً.',
      title: 'Replace faulty power outlet in Heavy Machinery Workshop G01',
      description:
        'The power outlet beside the testing bench sparks when a plug is inserted. The circuit was isolated immediately.',
      category: 'Electrical',
      priority: 'HIGH',
      status: 'COMPLETED',
      requesterEmail: EXTRA_STUDENT_EMAILS[2]!,
      building: 'Workshops',
      locationIndex: 0,
      daysAgo: 30,
      equipmentDescription: 'Schneider PK PratiKa Industrial 32A Socket Outlet',
      equipmentDescriptionAr: 'مقبس قوى صناعي 32 أمبير Schneider PK PratiKa',
      reviewNotes: 'Approved as an urgent electrical repair.',
      reviewNotesAr: 'تمت الموافقة كإصلاح كهربائي عاجل.',
    },
    {
      key: 'completed-3',
      titleAr: 'إصلاح طاولات الرسم الهندسي في صالة رسم 405',
      descriptionAr:
        'ثلاث طاولات رسم هندسي بها أسطح مفكوكة وبراغي بارزة. طُلب من الطلاب تجنب القاعة لحين إصلاحها.',
      title: 'Repair damaged drafting tables in Drawing Studio 405',
      description:
        'Three drafting tables in Drawing Studio 405 have loose tops and protruding screws. Students have been asked to avoid the studio until repaired.',
      category: 'Furniture',
      priority: 'LOW',
      status: 'COMPLETED',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Engineering',
      locationIndex: 14,
      daysAgo: 34,
      equipmentDescription: 'Adjustable Tilt Architectural Drafting Tables (Set of 3)',
      equipmentDescriptionAr: 'طاولات رسم هندسي ومعماري قابلة للإمالة (عدد 3)',
      reviewNotes: 'Approved for carpentry repair.',
      reviewNotesAr: 'تمت الموافقة لإجراء إصلاحات النجارة والتثبيت.',
    },
    {
      key: 'closed-1',
      titleAr: 'استبدال لمبة جهاز عرض معمل محاكاة الأعمال 106',
      descriptionAr:
        'جهاز العرض في معمل محاكاة الأعمال 106 يُظهر صورة باهتة ويحتاج المصباح للاستبدال قبل الامتحانات العملية.',
      title: 'Lab projector bulb replacement in Business Simulation Lab 106',
      description:
        'The projector in Business Simulation Lab 106 produced a dim image and the bulb needed replacement before the practical exams.',
      category: 'Hardware',
      priority: 'MEDIUM',
      status: 'CLOSED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Humanities',
      locationIndex: 5,
      daysAgo: 40,
      equipmentDescription: 'BenQ MH760 Conference Projector Lamp Module',
      equipmentDescriptionAr: 'وحدة مصباح جهاز عرض BenQ MH760',
      reviewNotes: 'Approved; replacement bulb ordered.',
      reviewNotesAr: 'تمت الموافقة؛ وتم طلب وحدة الإضاءة البديلة.',
    },
    {
      key: 'closed-2',
      titleAr: 'تسريب أنبوب مياه في عيادة الأسنان 102 بالمجمع الطبي',
      descriptionAr:
        'وصلة أنبوب تحت حوض عيادة الأسنان 102 تسرب باستمرار وتسببت في غمر بلاط الأرضية.',
      title: 'Water pipe leak in Dental Clinic 102 (Medical Complex)',
      description:
        'A pipe joint under the sink in Dental Clinic 102 leaked continuously and soaked the floor tiles.',
      category: 'Plumbing',
      priority: 'HIGH',
      status: 'CLOSED',
      requesterEmail: EXTRA_STUDENT_EMAILS[3]!,
      building: 'Medical',
      locationIndex: 4,
      daysAgo: 45,
      equipmentDescription: 'Ritter Ultimate Dental Unit Water Supply Manifold',
      equipmentDescriptionAr: 'وصلة تغذية المياه لوحدة كرسي الأسنان Ritter Ultimate',
      reviewNotes: 'Approved as an urgent plumbing repair.',
      reviewNotesAr: 'تمت الموافقة كإصلاح سباكة عاجل.',
    },
    {
      key: 'closed-3',
      titleAr: 'استبدال فلاتر التكييف المركزي في الكافتيريا الطلابية المركزية G01',
      descriptionAr:
        'وحدة معالجة الهواء في الكافتيريا الطلابية المركزية بمنطقة الأنشطة كانت تنشر الغبار وكانت الفلاتر مستحقة للاستبدال.',
      title: 'HVAC filter replacement in Central Student Cafeteria G01',
      description:
        'The air handling unit in Central Student Cafeteria G01 was circulating dust and the filters were due for replacement.',
      category: 'Air Conditioning',
      priority: 'MEDIUM',
      status: 'CLOSED',
      requesterEmail: EXTRA_STUDENT_EMAILS[1]!,
      building: 'Sports',
      locationIndex: 0,
      daysAgo: 55,
      equipmentDescription: 'MERV-13 Pleated Air Handling Unit Filters (ahu-caf-01)',
      equipmentDescriptionAr: 'فلاتر هواء مطوية MERV-13 لوحدة مناولة الهواء (AHU-CAF-01)',
      reviewNotes: 'Included in the preventive HVAC schedule.',
      reviewNotesAr: 'مُدرج ضمن جدول الصيانة الوقائية للتكييف المركزي.',
    },
    {
      key: 'closed-4',
      titleAr: 'معايرة السبورة الذكية في قاعة سيمينار 203',
      descriptionAr:
        'موضع اللمس في السبورة الذكية كان مزاحاً عن الصورة المعروضة، مما جعل الكتابة غير قابلة للاستخدام.',
      title: 'Smart board calibration in Seminar Room 203',
      description:
        'The smart board touch position was offset from the projected image, making annotations unusable.',
      category: 'Software',
      priority: 'LOW',
      status: 'CLOSED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Humanities',
      locationIndex: 7,
      daysAgo: 65,
      equipmentDescription: 'Promethean ActivPanel 75" Interactive Display',
      equipmentDescriptionAr: 'شاشة تفاعلية ذكية Promethean ActivPanel مقاس 75 بوصة',
      reviewNotes: 'Approved; calibration by the AV team.',
      reviewNotesAr: 'تمت الموافقة؛ ستتم المعايرة بواسطة فريق الدعم الفني والوسائط.',
    },
    {
      key: 'reopened-1',
      titleAr: 'ضوء السقف لا يزال يومض بعد الإصلاح خارج معمل 204',
      descriptionAr:
        'ضوء السقف خارج معمل ميكاترونكس 204 تم إصلاحه الأسبوع الماضي لكنه لا يزال يومض وينطفئ تماماً في بعض الأحيان.',
      title: 'Ceiling light still flickering after repair outside Lab 204',
      description:
        'The ceiling light outside Mechatronics Lab 204 was repaired last week but still flickers and occasionally turns off completely.',
      category: 'Electrical',
      priority: 'HIGH',
      status: 'REOPENED',
      requesterEmail: DEMO_STUDENT_EMAIL,
      building: 'Engineering',
      locationIndex: 5,
      daysAgo: 22,
      equipmentDescription: 'LED Corridor Batten Fixture & Ballast Driver',
      equipmentDescriptionAr: 'كشاف ممر LED مع محول التيار (Driver)',
      reviewNotes: 'Reopened after the requester reported the fault returned.',
      reviewNotesAr: 'أُعيد فتح الطلب بعد إفادة مقدم البلاغ بعودة العطل مرة أخرى.',
      reopenCount: 1,
    },
    {
      key: 'reopened-2',
      titleAr: 'الحوض لا يزال مسدوداً بعد زيارة الصيانة في معمل المهارات 304',
      descriptionAr:
        'حوض معمل المهارات الإكلينيكية 304 يصرف ببطء شديد مجدداً بعد الزيارة السابقة. تتجمع المياه عند فتح الصنبور لأكثر من دقيقة.',
      title: 'Sink still blocked after maintenance visit in Clinical Lab 304',
      description:
        'The sink in Clinical Skills Lab 304 drains very slowly again after the previous visit. Water backs up when the tap runs for more than a minute.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      status: 'REOPENED',
      requesterEmail: EXTRA_STUDENT_EMAILS[0]!,
      building: 'Medical',
      locationIndex: 8,
      daysAgo: 28,
      equipmentDescription: 'Stainless Steel Scrub Sink Drain Line (MED-304)',
      equipmentDescriptionAr: 'خط صرف حوض التعقيم الجراحي الاستانلس ستيل (MED-304)',
      reviewNotes: 'Reopened after the requester reported the blockage returned.',
      reviewNotesAr: 'أُعيد فتح الطلب بعد إفادة مقدم البلاغ بعودة الانسداد.',
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
      titleAr: spec.titleAr,
      description: spec.description,
      descriptionAr: spec.descriptionAr,
      category: spec.category,
      priority: spec.priority,
      locationId: locationId(spec.building, spec.locationIndex),
      equipmentDescription: spec.equipmentDescription,
      equipmentDescriptionAr: spec.equipmentDescriptionAr,
      attachments: [],
      status: spec.status,
      reviewedBy: reviewed ? managerId : undefined,
      reviewedAt,
      reviewNotes: spec.reviewNotes,
      reviewNotesAr: spec.reviewNotesAr,
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
      aiSummaryEn:
        'Mains-fed water cooler in the Central Library lobby is leaking from the lower basin assembly and has been isolated pending plumbing seal replacement.',
      aiSummaryAr:
        'مبرد المياه المتصل بالشبكة في بهو المكتبة المركزية يسرب من الحوض السفلي وتم عزله بانتظار استبدال وصلة مانع التسرب.',
      current: true,
    },
    {
      requestKey: 'approved-assigned',
      status: 'ASSIGNED',
      technicianEmail: TECHNICIAN_EMAILS[0]!,
      scheduledStart: addDays(now, 2),
      expectedCompletion: addHours(addDays(now, 2), 4),
      notes: [
        {
          note: 'Collected replacement 15m optical HDMI cable from central stores; scheduled installation between afternoon lectures.',
          noteAr: 'تم استلام كابل HDMI ضوئي بطول 15 متراً من المخازن المركزية؛ وجدولة التركيب بين محاضرات الفترة المسائية.',
        },
      ],
      aiSummaryEn:
        'Assigned to Hassan El-Sayed to replace the damaged 15m podium HDMI cable in Lecture Hall 201 using stock already drawn from central stores.',
      aiSummaryAr:
        'تم إسناد المهمة إلى حسن السيد لاستبدال كابل العرض التالف بمنصة المحاضر في مدرج 201 باستخدام الكابل البديل المستلم من المخزن.',
      current: true,
    },
    {
      requestKey: 'approved-assigned-2',
      status: 'ASSIGNED',
      technicianEmail: TECHNICIAN_EMAILS[4]!,
      scheduledStart: addDays(now, 3),
      expectedCompletion: addHours(addDays(now, 3), 4),
      notes: [
        {
          note: 'Inspected door cylinder; a new Yale mortise cylinder is ready for installation once the lab schedule clears.',
          noteAr: 'تمت معاينة قلب القفل؛ وتم تجهيز سلندر Yale جديد للتركيب فور انتهاء الجدول العملي بالمعمل.',
        },
      ],
      aiSummaryEn:
        'Assigned to Sameh Radwan to extract the jammed key and install a replacement mortise lock cylinder on Clinical Skills Lab 204.',
      aiSummaryAr:
        'تم إسناد المهمة إلى سامح رضوان لإخراج المفتاح العالق وتركيب سلندر قفل جديد لباب معمل المهارات الإكلينيكية 204.',
      current: true,
    },
    {
      requestKey: 'in-progress',
      status: 'IN_PROGRESS',
      technicianEmail: TECHNICIAN_EMAILS[3]!,
      scheduledStart: hoursAgo(24),
      expectedCompletion: addDays(now, 1),
      actualStart: hoursAgo(20),
      notes: [
        {
          note: 'Activated portable spot cooler to stabilize server rack intake temperature at 21°C.',
          noteAr: 'تم تشغيل وحدة تبريد متنقلة لتثبيت درجة حرارة سحب الهواء لكبائن الخوادم عند 21 درجة مئوية.',
          hoursAfterStart: 1,
        },
        {
          note: 'Diagnosed faulty transfer relay on backup CRAC-02 controller; replacing relay board and testing automatic failover.',
          noteAr: 'تم تشخيص عطل في مرحّل التحويل التلقائي لوحدة التبريد الاحتياطية CRAC-02؛ وجارٍ استبدال اللوحة واختبار التبديل التلقائي.',
          hoursAfterStart: 6,
        },
      ],
      aiSummaryEn:
        'Critical server room cooling repair in progress by Ibrahim Abdel-Fattah. Temporary cooling is active while the CRAC-02 automatic failover relay board is replaced.',
      aiSummaryAr:
        'إصلاح طارئ لتبريد غرفة الخوادم قيد التنفيذ بواسطة إبراهيم عبد الفتاح. تم تأمين التبريد المؤقت وجارٍ استبدال لوحة التبديل التلقائي لوحدة CRAC-02.',
      current: true,
    },
    {
      requestKey: 'in-progress-overdue',
      status: 'IN_PROGRESS',
      technicianEmail: TECHNICIAN_EMAILS[2]!,
      scheduledStart: daysAgo(10),
      expectedCompletion: daysAgo(3),
      actualStart: daysAgo(9),
      notes: [
        {
          note: 'Mounted replacement Cisco 2960X switch in rack 2B and migrated VLAN trunk configuration.',
          noteAr: 'تم تركيب محول الشبكة البديل Cisco 2960X في الكابينة 2B ونقل إعدادات شبكات VLAN.',
          hoursAfterStart: 4,
        },
        {
          note: 'Awaiting maintenance window approval from faculty examination committee to cut over the remaining 16 lab ports.',
          noteAr: 'بانتظار نافذة الصيانة المعتمدة من لجنة الامتحانات بالكلية لتحويل منافذ المعمل الـ 16 المتبقية.',
          hoursAfterStart: 48,
        },
      ],
      aiSummaryEn:
        'Overdue network switch replacement handled by Karim El-Tantawy. Hardware is racked and configured; final port cutover awaits an approved exam-free window.',
      aiSummaryAr:
        'أمر عمل متأخر لاستبدال محول الشبكة بمتابعة كريم الطنطاوي. تم تركيب وبرمجة الوحدة البديلة، ويتبقى التحويل النهائي للمنافذ فور انتهاء فترة الاختبارات.',
      current: true,
    },
    {
      requestKey: 'in-progress-2',
      status: 'IN_PROGRESS',
      technicianEmail: TECHNICIAN_EMAILS[0]!,
      scheduledStart: daysAgo(2),
      expectedCompletion: hoursAgo(2),
      actualStart: hoursAgo(30),
      notes: [
        {
          note: 'Isolated bench water valve, removed cracked polypropylene trap, and dried the cabinet base.',
          noteAr: 'تم غلق محبس المياه الفرعي، وفك السيفون المتصدع، وتجفيف قاعدة الخزانة المعملية.',
          hoursAfterStart: 2,
        },
      ],
      aiSummaryEn:
        'Lab sink leak isolated in Materials Testing Lab 102; replacement chemical-resistant trap is being fitted and pressure-tested.',
      aiSummaryAr:
        'تم عزل تسريب حوض معمل اختبار المواد 102؛ وجارٍ تركيب سيفون جديد مقاوم للكيماويات واختبار عدم وجود تسريب.',
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
      notes: [
        {
          note: 'Measured refrigerant pressures and found pitted contacts on the main compressor contactor.',
          noteAr: 'تم قياس ضغوط الفريون وتبين تآكل نقاط التلامس في كونتاكتور الضاغط الرئيسي.',
          hoursAfterStart: 2,
        },
      ],
      resolutionDetails: 'Replaced the compressor contactor and cleaned the coils.',
      resolutionDetailsAr: 'تم استبدال ملامس الضاغط وتنظيف الملفات.',
      aiSummaryEn:
        'Completed full HVAC service for Main Auditorium G02 by replacing the worn compressor contactor and cleaning condenser coils.',
      aiSummaryAr:
        'تم إنجاز الصيانة الشاملة لتكييف القاعة الكبرى G02 عبر استبدال كونتاكتور الضاغط وتنظيف ملفات المكثف.',
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
      notes: [
        {
          note: 'Locked out breaker W-12 and inspected scorched neutral terminal on bench socket.',
          noteAr: 'تم فصل وتأمين القاطع W-12 وفحص طرف التعادل المحترق في مقبس طاولة الورشة.',
          hoursAfterStart: 1,
        },
      ],
      resolutionDetails: 'Replaced the outlet and verified the circuit under load.',
      resolutionDetailsAr: 'تم استبدال المقبس واختبار الدائرة تحت الحمل.',
      aiSummaryEn:
        'Replaced the sparking industrial socket in Heavy Machinery Workshop G01 and verified thermal stability under full load.',
      aiSummaryAr:
        'تم استبدال المقبس الصناعي التالف في ورشة الماكينات الثقيلة G01 والتحقق من ثبات الجهد والحرارة تحت الحمل الكامل.',
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
      notes: [
        {
          note: 'Re-aligned tilt mechanisms on all three drafting tables and installed lock-nuts.',
          noteAr: 'تمت إعادة ضبط آلية الإمالة في طاولات الرسم الثلاث وتركيب صواميل تثبيت مانعة للارتخاء.',
          hoursAfterStart: 3,
        },
      ],
      resolutionDetails: 'Tightened the desk frames and replaced the damaged screws.',
      resolutionDetailsAr: 'تم إحكام تثبيت هياكل المكاتب واستبدال البراغي التالفة.',
      aiSummaryEn:
        'Restored three architectural drafting tables in Drawing Studio 405 with new fasteners and frame reinforcement.',
      aiSummaryAr:
        'تم إصلاح وتدعيم ثلاث طاولات رسم هندسي في صالة رسم 405 واستبدال كافة البراغي التالفة.',
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
      notes: [
        {
          note: 'Installed OEM BenQ lamp module and cleaned optical dust filter.',
          noteAr: 'تم تركيب وحدة مصباح BenQ أصلية وتنظيف فلتر الغبار الضوئي.',
          hoursAfterStart: 2,
        },
      ],
      resolutionDetails: 'Replaced the projector bulb and reset the lamp timer.',
      resolutionDetailsAr: 'تم استبدال لمبة جهاز العرض وإعادة ضبط مؤقت المصباح.',
      aiSummaryEn:
        'Projector brightness restored in Business Simulation Lab 106 via OEM lamp replacement and optical filter cleaning.',
      aiSummaryAr:
        'تمت استعادة سطوع جهاز العرض في معمل محاكاة الأعمال 106 بعد استبدال المصباح الأصلي وتنظيف الفلتر الضوئي.',
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
      notes: [
        {
          note: 'Replaced cracked compression union and pressure-tested dental unit water supply.',
          noteAr: 'تم استبدال وصلة الضغط المتصدعة واختبار ضغط خط المياه لوحدة الأسنان.',
          hoursAfterStart: 2,
        },
      ],
      resolutionDetails: 'Replaced the pipe joint and sealed the fitting.',
      resolutionDetailsAr: 'تم استبدال وصلة الأنبوب وإحكام إغلاق التركيب.',
      aiSummaryEn:
        'Eliminated water leak in Dental Clinic 102 by replacing the faulty pipe joint and sealing the manifold connection.',
      aiSummaryAr:
        'تم إنهاء تسريب المياه في عيادة الأسنان 102 عبر استبدال وصلة الأنبوب التالفة وإحكام عزل التوصيلات.',
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
      notes: [
        {
          note: 'Installed new MERV-13 pleated filters and sanitized air handling chamber.',
          noteAr: 'تم تركيب فلاتر هواء مطوية جديدة MERV-13 وتطهير غرفة مناولة الهواء.',
          hoursAfterStart: 3,
        },
      ],
      resolutionDetails: 'Replaced both air filters and cleaned the housing.',
      resolutionDetailsAr: 'تم استبدال كلا فلترَي الهواء وتنظيف المبيت.',
      aiSummaryEn:
        'Completed AHU filter replacement and housing sanitization in Central Student Cafeteria G01.',
      aiSummaryAr:
        'تم استبدال فلاتر وحدة مناولة الهواء وتنظيف المبيت بالكامل في الكافتيريا الطلابية المركزية G01.',
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
      notes: [
        {
          note: 'Updated Promethean touch firmware to v4.2 and ran 25-point touch calibration.',
          noteAr: 'تم تحديث البرنامج الثابت للشاشة التفاعلية Promethean إلى الإصدار v4.2 وإجراء معايرة اللمس ذات الـ 25 نقطة.',
          hoursAfterStart: 1,
        },
      ],
      resolutionDetails: 'Recalibrated the touch overlay and updated the driver.',
      resolutionDetailsAr: 'تمت إعادة معايرة طبقة اللمس وتحديث برنامج التشغيل.',
      aiSummaryEn:
        'Resolved touch offset on the Seminar Room 203 smart board through firmware update and multi-point calibration.',
      aiSummaryAr:
        'تم حل مشكلة إزاحة اللمس في السبورة الذكية بقاعة سيمينار 203 عبر تحديث التعريف وإعادة المعايرة الدقيقة.',
      current: true,
    },
    {
      requestKey: 'reopened-1',
      status: 'CANCELLED',
      technicianEmail: TECHNICIAN_EMAILS[0]!,
      scheduledStart: daysAgo(18),
      expectedCompletion: daysAgo(17),
      cancelReason: 'Reopened by the requester after the fault returned.',
      cancelReasonAr: 'أُعيد فتحه بواسطة مقدم الطلب بعد تكرار العطل.',
    },
    {
      requestKey: 'reopened-1',
      status: 'PENDING_ASSIGNMENT',
      scheduledStart: addDays(now, 2),
      expectedCompletion: addHours(addDays(now, 2), 4),
      aiSummaryEn:
        'Reopened electrical fault outside Mechatronics Lab 204 requires full LED ballast driver replacement rather than starter reset.',
      aiSummaryAr:
        'عطل كهربائي معاد فتحه خارج معمل ميكاترونكس 204 يتطلب استبدال محول التيار (Driver) بالكامل لضمان عدم تكرار الوميض.',
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
      resolutionDetailsAr: 'تم تنظيف مجرى الصرف واختبار التصريف.',
    },
    {
      requestKey: 'reopened-2',
      status: 'PENDING_ASSIGNMENT',
      scheduledStart: addDays(now, 4),
      expectedCompletion: addHours(addDays(now, 4), 4),
      aiSummaryEn:
        'Reopened drainage issue in Clinical Skills Lab 304 requires mechanical auger clearing of the main vertical stack.',
      aiSummaryAr:
        'بلاغ صرف معاد فتحه في معمل المهارات الإكلينيكية 304 يتطلب تسليكاً ميكانيكياً لخط الصرف الرئيسي.',
      current: true,
    },
  ];

  const workOrderDocs = workOrderSpecs.map((spec, index) => {
    const request = requestByKey.get(spec.requestKey);
    if (!request) {
      throw new Error(`Seed work order references unknown request ${spec.requestKey}`);
    }

    const assignedTechId = spec.technicianEmail
      ? userId(spec.technicianEmail)
      : undefined;
    const baseNoteTime = spec.actualStart ?? spec.scheduledStart;
    const summaryTime = spec.completedAt ?? spec.actualStart ?? spec.scheduledStart;

    return {
      _id: new Types.ObjectId(),
      workOrderNumber: `WO-${2001 + index}`,
      sourceType: 'REACTIVE' as const,
      maintenanceRequestId: request._id,
      assignedTechnicianId: assignedTechId,
      title: request.title,
      titleAr: request.titleAr,
      description: request.description,
      descriptionAr: request.descriptionAr,
      category: request.category,
      priority: request.priority,
      locationId: request.locationId,
      status: spec.status,
      scheduledStart: spec.scheduledStart,
      expectedCompletion: spec.expectedCompletion,
      actualStart: spec.actualStart,
      completedAt: spec.completedAt,
      technicianNotes: (spec.notes ?? []).map((n, noteIdx) => ({
        note: n.note,
        noteAr: n.noteAr,
        authorId: assignedTechId ?? managerId,
        createdAt: addHours(baseNoteTime, n.hoursAfterStart ?? noteIdx + 1),
        isSystem: false,
      })),
      ...(spec.aiSummaryEn && spec.aiSummaryAr
        ? {
            aiSummary: {
              text: spec.aiSummaryEn,
              generatedAt: summaryTime,
            },
            aiSummaries: {
              en: {
                text: spec.aiSummaryEn,
                generatedAt: summaryTime,
              },
              ar: {
                text: spec.aiSummaryAr,
                generatedAt: summaryTime,
              },
            },
          }
        : {}),
      resolutionDetails: spec.resolutionDetails,
      resolutionDetailsAr: spec.resolutionDetailsAr,
      cancelReason: spec.cancelReason,
      cancelReasonAr: spec.cancelReasonAr,
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
      commentAr: 'تم إصلاح جهاز العرض في نفس اليوم وكان المعمل جاهزاً للامتحانات.',
    },
    {
      requestKey: 'closed-2',
      rating: 4,
      comment: 'The leak stopped, although the floor took a while to dry.',
      commentAr: 'توقف التسريب، على الرغم من أن الأرضية استغرقت بعض الوقت لتجف.',
    },
    {
      requestKey: 'closed-3',
      rating: 5,
      comment: 'The library air feels much cleaner after the filter replacement.',
      commentAr: 'الهواء في المكتبة أنقى بكثير بعد استبدال الفلاتر.',
    },
    {
      requestKey: 'closed-4',
      rating: 3,
      comment: 'Calibration helped, but the touch screen is still slightly offset at the edges.',
      commentAr: 'ساعدت المعايرة، لكن شاشة اللمس ما زالت مزاحة قليلاً عند الحواف.',
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
      commentAr: spec.commentAr,
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
      titleAr: 'فحص فلاتر التكييف الأسبوعي',
      description:
        'Inspect and clean the air handling unit filters in the central library and record the pressure drop.',
      descriptionAr:
        'فحص وتنظيف فلاتر وحدة معالجة الهواء في المكتبة المركزية وتسجيل فرق الضغط.',
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
      titleAr: 'اختبار إضاءة الطوارئ الشهري',
      description:
        'Test all emergency lights and exit signs in the engineering complex and replace failed batteries.',
      descriptionAr:
        'اختبار جميع كشافات الطوارئ ولوحات الخروج في مجمع الهندسة واستبدال البطاريات التالفة.',
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
      titleAr: 'تنظيف خزانات المياه ربع السنوي',
      description:
        'Drain, clean and disinfect the reserve water tanks in the medical complex.',
      descriptionAr:
        'تصريف وتنظيف وتطهير خزانات المياه الاحتياطية في المجمع الطبي.',
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
    titleAr: 'تنظيف خزانات المياه ربع السنوي',
    description: planDocs[2]!.description,
    descriptionAr: planDocs[2]!.descriptionAr,
    category: planDocs[2]!.category,
    priority: planDocs[2]!.priority,
    locationId: planDocs[2]!.locationId,
    status: 'COMPLETED' as const,
    scheduledStart: daysAgo(8),
    expectedCompletion: addHours(daysAgo(8), 6),
    actualStart: addHours(daysAgo(8), 1),
    completedAt: addHours(daysAgo(8), 7),
    technicianNotes: [
      {
        note: 'Completed chlorination and verified residual chlorine at 0.5 ppm across Medical Complex reserve tanks.',
        noteAr: 'تم إتمام التطهير بالكلور والتحقق من تركيز الكلور المتبقي عند 0.5 جزء في المليون بخزانات المجمع الطبي.',
        authorId: technicianIds[1]!,
        createdAt: addHours(daysAgo(8), 5),
        isSystem: false,
      },
    ],
    aiSummary: {
      text: 'Preventive quarterly cleaning and disinfection of the Medical Sector Complex reserve water tanks completed on schedule by Mohamed El-Gohary.',
      generatedAt: addHours(daysAgo(8), 7),
    },
    aiSummaries: {
      en: {
        text: 'Preventive quarterly cleaning and disinfection of the Medical Sector Complex reserve water tanks completed on schedule by Mohamed El-Gohary.',
        generatedAt: addHours(daysAgo(8), 7),
      },
      ar: {
        text: 'تم إنجاز الصيانة الوقائية ربع السنوية لتنظيف وتطهير خزانات المياه الاحتياطية بمجمع الكليات الطبية في موعدها بواسطة محمد الجوهري.',
        generatedAt: addHours(daysAgo(8), 7),
      },
    },
    resolutionDetails: 'Tanks drained, scrubbed and disinfected; water quality checked.',
    resolutionDetailsAr: 'تم تصريف الخزانات وفركها وتطهيرها؛ وفحص جودة المياه.',
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
      itemTitleAr: 'حقيبة ظهر North Face سوداء',
      descriptionAr:
        'فُقدت بالقرب من معمل الهندسة بعد محاضرة بعد الظهر. الحقيبة بها ميدالية مفاتيح زرقاء داخل الجيب الأمامي.',
      colorAr: 'أسود',
      brandAr: 'North Face',
      locationDetailsAr: 'مقعد خارج معمل 204',
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
      itemTitleAr: 'حقيبة ظهر North Face سوداء',
      descriptionAr:
        'عُثر عليها بالقرب من معمل الهندسة وبداخل الجيب الأمامي ميدالية مفاتيح زرقاء ومذكرات ميكاترونكس.',
      colorAr: 'أسود',
      brandAr: 'North Face',
      locationDetailsAr: 'مكتب استقبال معمل 204',
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
      itemTitleAr: 'زجاجة ماء زرقاء من الفولاذ المقاوم للصدأ',
      descriptionAr:
        'فقدت زجاجة ماء زرقاء من الفولاذ مع غطاء به صدمة في مكان ما بين الكافتيريا والمكتبة.',
      colorAr: 'أزرق',
      brandAr: 'Thermos',
      locationDetailsAr: 'منطقة جلوس الكافتيريا',
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
      itemTitleAr: 'زجاجة ماء زرقاء من الفولاذ المقاوم للصدأ',
      descriptionAr:
        'عُثر على زجاجة ماء زرقاء من الفولاذ مع غطاء به صدمة على طاولة دراسة بالمكتبة.',
      colorAr: 'أزرق',
      brandAr: 'Thermos',
      locationDetailsAr: 'طاولة دراسة بالطابق الثاني بالمكتبة',
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
      itemTitleAr: 'آيفون 13 فضي',
      descriptionAr:
        'فقدت هاتف iPhone 13 فضياً في جراب شفاف بالقرب من مدخل المجمع الطبي. شاشة القفل تعرض صورة قطة.',
      colorAr: 'فضي',
      brandAr: 'Apple',
      locationDetailsAr: 'درج المدخل الرئيسي',
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
      itemTitleAr: 'آيفون 13 فضي',
      descriptionAr:
        'عُثر على هاتف iPhone 13 فضي في جراب شفاف عند مدخل المجمع الطبي. الهاتف مغلق.',
      colorAr: 'فضي',
      brandAr: 'Apple',
      locationDetailsAr: 'مكتب الأمن عند المدخل الرئيسي',
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
      itemTitleAr: 'مجموعة مفاتيح بميدالية حمراء',
      descriptionAr:
        'فقدت مجموعة من ثلاثة مفاتيح بميدالية بلاستيكية حمراء بالقرب من مبنى العلوم الإنسانية.',
      colorAr: 'فضي',
      locationDetailsAr: 'البوابة الرئيسية لمبنى العلوم الإنسانية',
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
      itemTitleAr: 'مجموعة مفاتيح بميدالية حمراء',
      descriptionAr:
        'عُثر على مجموعة من ثلاثة مفاتيح بميدالية بلاستيكية حمراء عند بوابة مبنى العلوم الإنسانية.',
      colorAr: 'فضي',
      locationDetailsAr: 'مكتب الأمن',
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
      itemTitleAr: 'مظلة كحلية',
      descriptionAr:
        'فقدت مظلة كحلية بمقبض خشبي في بهو المكتبة.',
      colorAr: 'كحلي',
      locationDetailsAr: 'بهو المكتبة',
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
      itemTitleAr: 'مظلة كحلية',
      descriptionAr:
        'عُثر على مظلة كحلية بمقبض خشبي بالقرب من مدخل المكتبة.',
      colorAr: 'كحلي',
      locationDetailsAr: 'مدخل المكتبة',
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
      itemTitleAr: 'بطاقة هوية جامعية',
      descriptionAr:
        'فقدت بطاقة هوية طالب في حافظة شفافة في مكان ما بمبنى العلوم الإنسانية.',
      locationDetailsAr: 'ممر قاعات المحاضرات',
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
      itemTitleAr: 'بطاقة هوية جامعية',
      descriptionAr:
        'عُثر على بطاقة هوية طالب في حافظة شفافة على أرضية ممر العلوم الإنسانية.',
      locationDetailsAr: 'استقبال كلية العلوم الإنسانية',
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
      itemTitleAr: 'سترة جامعية رمادية (Hoodie)',
      descriptionAr:
        'تركت سترة جامعية رمادية في قاعة استذكار الهندسة. بها بقعة حبر صغيرة على الكم.',
      colorAr: 'رمادي',
      locationDetailsAr: 'قاعة استذكار 2',
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
      itemTitleAr: 'سترة جامعية رمادية (Hoodie)',
      descriptionAr:
        'عُثر على سترة جامعية رمادية على كرسي في قاعة استذكار الهندسة.',
      colorAr: 'رمادي',
      locationDetailsAr: 'قاعة استذكار 2',
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
      itemTitleAr: 'كتاب هياكل البيانات',
      descriptionAr:
        'فقدت كتاب هياكل البيانات في المكتبة. اسم عمر خالد مكتوب داخل الغلاف.',
      locationDetailsAr: 'قاعة القراءة بالمكتبة',
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
      itemTitleAr: 'كتاب هياكل البيانات',
      descriptionAr:
        'عُثر على كتاب هياكل البيانات متروكاً على مكتب في المكتبة بعد وقت الإغلاق.',
      locationDetailsAr: 'قاعة القراءة بالمكتبة',
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
      itemTitleAr: 'ذاكرة فلاش 32 جيجابايت USB',
      descriptionAr:
        'فقدت ذاكرة فلاش USB سوداء بغطاء أحمر بالقرب من طابعات معمل الحاسب.',
      colorAr: 'أسود',
      locationDetailsAr: 'منطقة طابعات معمل الحاسب',
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
      itemTitleAr: 'ذاكرة فلاش 32 جيجابايت USB',
      descriptionAr:
        'عُثر على ذاكرة فلاش USB سوداء بغطاء أحمر بجوار طابعات معمل الحاسب.',
      colorAr: 'أسود',
      locationDetailsAr: 'منطقة طابعات معمل الحاسب',
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
    itemTitleAr: spec.itemTitleAr,
    description: spec.description,
    descriptionAr: spec.descriptionAr,
    privateIdentificationDetails: spec.privateIdentificationDetails,
    category: spec.category,
    color: spec.color,
    colorAr: spec.colorAr,
    brand: spec.brand,
    brandAr: spec.brandAr,
    locationId: locationId(spec.building, spec.locationIndex),
    locationDetails: spec.locationDetails,
    locationDetailsAr: spec.locationDetailsAr,
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
      claimDescriptionAr:
        'هذه حقيبتي. تركتها على المقعد خارج معمل 204 وأدركت فقدانها بعد المحاضرة.',
      verificationNotesAr: 'تمت مطابقة الحروف الأولى وميدالية المفاتيح مع التفاصيل الخاصة في بلاغ العثور.',
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
      claimDescriptionAr:
        'فقدت هاتف iPhone فضي بالقرب من المدخل الطبي. به جراب شفاف وصورة قطتي على شاشة القفل.',
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
      claimDescriptionAr:
        'هذه بطاقة هويتي الجامعية. سقطت من ملفي في مكان ما بممر العلوم الإنسانية.',
      verificationNotesAr: 'تمت مطابقة الصورة ورقم الطالب الجامعي.',
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
      claimDescriptionAr:
        'هذه مفاتيحي. فقدتها عند بوابة العلوم الإنسانية والميدالية الحمراء عليها الحروف الأولى من اسمي.',
      verificationNotesAr: 'تطابقت المفاتيح مع الوصف واستلمها المالك.',
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
        receivedByNameAr: 'سارة محمود',
        notes: 'Student ID checked and signed at the security office.',
        notesAr: 'تم التحقق من البطاقة الجامعية والتوقيع في مكتب الأمن.',
        handedOverAt: daysAgo(2, 15),
      },
    },
    {
      itemKey: 'found-umbrella',
      claimDescriptionAr:
        'أعتقد أن هذه المظلة ملكي. فقدت مظلة كحلية في مكان ما حول المكتبة الأسبوع الماضي.',
      rejectionReasonAr:
        'لم تتطابق التفاصيل التعريفية المقدمة مع التفاصيل الخاصة في بلاغ العثور.',
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
    claimDescriptionAr: spec.claimDescriptionAr,
    identifyingDetailsProvided: spec.identifyingDetailsProvided,
    supportingEvidence: [],
    status: spec.status,
    verificationNotes: spec.verificationNotes,
    verificationNotesAr: spec.verificationNotesAr,
    rejectionReason: spec.rejectionReason,
    rejectionReasonAr: spec.rejectionReasonAr,
    reviewedBy: spec.reviewed ? officerId : undefined,
    reviewedAt: spec.reviewed ? daysAgo(3) : undefined,
    handover: spec.handover
      ? {
          receivedByName: spec.handover.receivedByName,
          receivedByNameAr: spec.handover.receivedByNameAr,
          handedOverBy: officerId,
          notes: spec.handover.notes,
          notesAr: spec.handover.notesAr,
          handedOverAt: spec.handover.handedOverAt,
        }
      : undefined,
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
      message: 'MR-2008 was approved. Work order WO-2001 has been created.',
      titleKey: 'requestApproved',
      messageKey: 'requestApprovedMsg',
      params: { code: 'MR-2008', workOrderCode: 'WO-2001' },
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
      message: 'Work order WO-2007 was completed. Please review and confirm resolution.',
      titleKey: 'requestCompleted',
      messageKey: 'requestCompletedMsg',
      params: { workOrderCode: 'WO-2007' },
      relatedEntityType: 'WorkOrder',
      relatedEntityId: workOrderDocs[6]!._id,
      linkUrl: '/maintenance/requests',
      isRead: false,
      createdAt: hoursAgo(30),
    },
    {
      userId: demoStudentId,
      type: 'CLAIM_APPROVED',
      title: 'Claim approved',
      message: 'Your claim CLM-2003 was approved. Contact the Lost & Found Office to arrange the handover.',
      titleKey: 'claimApproved',
      messageKey: 'claimApprovedMsg',
      params: { code: 'CLM-2003' },
      relatedEntityType: 'ClaimRequest',
      relatedEntityId: claimDocs[2]!._id,
      linkUrl: '/lost-found/claims',
      isRead: false,
      createdAt: hoursAgo(44),
    },
    {
      userId: demoStudentId,
      type: 'REQUEST_REOPENED',
      title: 'Work order reopened',
      message: 'Request MR-2023 was reopened: Fault returned. Work order WO-2015 is back in your assigned queue.',
      titleKey: 'workOrderReopened',
      messageKey: 'workOrderReopenedMsg',
      params: { code: 'MR-2023', workOrderCode: 'WO-2015', reason: { en: 'Fault returned', ar: 'تكرار العطل' } },
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
      message: 'MR-2001 · Projector will not power on in Lecture Hall 101 · Engineering & Technological Complex A & B, Ground Floor, Lecture Hall G01',
      titleKey: 'newRequestSubmitted',
      messageKey: 'newRequestSubmittedMsg',
      params: {
        code: 'MR-2001',
        title: {
          en: 'Projector will not power on in Lecture Hall 101',
          ar: 'جهاز العرض لا يعمل في مدرج 101',
        },
        building: {
          en: 'Engineering & Technological Complex A & B',
          ar: 'مجمع الكليات الهندسية والتكنولوجية',
        },
        floor: {
          en: 'Ground Floor',
          ar: 'الطابق الأرضي',
        },
        room: {
          en: 'Lecture Hall G01',
          ar: 'مدرج G01',
        },
      },
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
      titleKey: 'workOrderOverdue',
      messageKey: 'workOrderOverdueMsg',
      params: { code: 'WO-2005' },
      relatedEntityType: 'WorkOrder',
      relatedEntityId: workOrderDocs[4]!._id,
      linkUrl: '/maintenance/work-orders',
      isRead: false,
      createdAt: hoursAgo(12),
    },
    {
      userId: officerId,
      type: 'CLAIM_PENDING',
      title: 'New claim submitted',
      message: 'Claim CLM-2002 was submitted for found item LF-2006.',
      titleKey: 'claimSubmitted',
      messageKey: 'claimSubmittedMsg',
      params: { code: 'CLM-2002', itemCode: 'LF-2006' },
      relatedEntityType: 'ClaimRequest',
      relatedEntityId: claimDocs[1]!._id,
      linkUrl: '/lost-found/claims',
      isRead: false,
      createdAt: hoursAgo(9),
    },
    {
      userId: officerId,
      type: 'MATCH_SUGGESTED',
      title: 'Possible match confirmed',
      message: 'A found item matching your lost report LF-2005 was confirmed. Submit a claim to verify ownership.',
      titleKey: 'matchConfirmed',
      messageKey: 'matchConfirmedMsg',
      params: { code: 'LF-2005' },
      relatedEntityType: 'ItemMatch',
      relatedEntityId: matchDocs[2]!._id,
      linkUrl: '/lost-found/matches',
      isRead: true,
      createdAt: hoursAgo(32),
    },
    {
      userId: technicianIds[0]!,
      type: 'WORK_ORDER_ASSIGNED',
      title: 'Work order assigned',
      message: 'You have been assigned work order WO-2002.',
      titleKey: 'workOrderAssigned',
      messageKey: 'workOrderAssignedMsg',
      params: { code: 'WO-2002' },
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
      description: 'Created Student/Employee account Sara Mahmoud (sara.mahmoud@std.mansnu.edu.eg)',
      descriptionKey: 'userCreated',
      params: {
        role: { en: 'Student/Employee', ar: 'طالب / موظف' },
        name: { en: 'Sara Mahmoud', ar: 'سارة محمود' },
        email: EXTRA_STUDENT_EMAILS[0]!,
      },
      metadata: { role: 'STUDENT_EMPLOYEE' },
      createdAt: daysAgo(12),
    },
    {
      actorId: managerId,
      action: 'REQUEST_APPROVED',
      entityType: 'MaintenanceRequest',
      entityId: requestByKey.get('approved-assigned')!._id,
      description: 'Approved maintenance request MR-2009 and created work order WO-2002',
      descriptionKey: 'requestApproved',
      params: { code: 'MR-2009', workOrderCode: 'WO-2002' },
      metadata: { workOrderNumber: 'WO-2002' },
      createdAt: daysAgo(10),
    },
    {
      actorId: managerId,
      action: 'WORK_ORDER_ASSIGNED',
      entityType: 'WorkOrder',
      entityId: workOrderDocs[1]!._id,
      description: 'Assigned work order WO-2002 to Hassan El-Sayed',
      descriptionKey: 'workOrderAssigned',
      params: {
        code: 'WO-2002',
        name: { en: 'Hassan El-Sayed', ar: 'حسن السيد' },
      },
      metadata: { technician: 'Hassan El-Sayed' },
      createdAt: daysAgo(9),
    },
    {
      actorId: technicianIds[0]!,
      action: 'WORK_ORDER_STARTED',
      entityType: 'WorkOrder',
      entityId: workOrderDocs[5]!._id,
      description: 'Technician started work order WO-2006',
      descriptionKey: 'workOrderStarted',
      params: { code: 'WO-2006' },
      metadata: { status: 'IN_PROGRESS' },
      createdAt: daysAgo(2),
    },
    {
      actorId: technicianIds[0]!,
      action: 'WORK_ORDER_COMPLETED',
      entityType: 'WorkOrder',
      entityId: workOrderDocs[7]!._id,
      description: 'Technician completed work order WO-2008',
      descriptionKey: 'workOrderCompleted',
      params: { code: 'WO-2008' },
      metadata: { status: 'COMPLETED' },
      createdAt: daysAgo(27),
    },
    {
      actorId: managerId,
      action: 'PREVENTIVE_PLAN_CREATED',
      entityType: 'PreventivePlan',
      entityId: duePlanId,
      description: 'Created preventive plan Weekly HVAC filter inspection (Weekly)',
      descriptionKey: 'preventivePlanCreated',
      params: {
        title: {
          en: 'Weekly HVAC filter inspection',
          ar: 'فحص فلاتر التكييف الأسبوعي',
        },
        recurrence: { en: 'Weekly', ar: 'أسبوعياً' },
      },
      metadata: { recurrenceType: 'WEEKLY' },
      createdAt: daysAgo(16),
    },
    {
      actorId: managerId,
      action: 'PREVENTIVE_WORK_ORDER_GENERATED',
      entityType: 'WorkOrder',
      entityId: preventiveWorkOrder._id,
      description: 'Generated preventive work order WO-2018 from plan Quarterly water tank cleaning',
      descriptionKey: 'preventiveWorkOrderGenerated',
      params: {
        code: 'WO-2018',
        title: {
          en: 'Quarterly water tank cleaning',
          ar: 'تنظيف خزانات المياه ربع السنوي',
        },
      },
      metadata: { schedule: 'quarterly' },
      createdAt: daysAgo(8),
    },
    {
      actorId: officerId,
      action: 'MATCH_CONFIRMED',
      entityType: 'ItemMatch',
      entityId: matchDocs[0]!._id,
      description: 'Confirmed match between LF-2001 and LF-2002',
      descriptionKey: 'matchConfirmed',
      params: { lostCode: 'LF-2001', foundCode: 'LF-2002' },
      metadata: { score: 94, level: 'STRONG' },
      createdAt: daysAgo(7),
    },
    {
      actorId: officerId,
      action: 'CLAIM_APPROVED',
      entityType: 'ClaimRequest',
      entityId: claimDocs[2]!._id,
      description: 'Approved claim CLM-2003 for LF-2012',
      descriptionKey: 'claimApproved',
      params: { code: 'CLM-2003', itemCode: 'LF-2012' },
      metadata: { status: 'APPROVED' },
      createdAt: daysAgo(3),
    },
    {
      actorId: officerId,
      action: 'HANDOVER_COMPLETED',
      entityType: 'ClaimRequest',
      entityId: claimDocs[3]!._id,
      description: 'Recorded handover for claim CLM-2004 to Sara Mahmoud',
      descriptionKey: 'handoverCompleted',
      params: {
        code: 'CLM-2004',
        name: { en: 'Sara Mahmoud', ar: 'سارة محمود' },
      },
      metadata: { receivedByName: 'Sara Mahmoud' },
      createdAt: daysAgo(2),
    },
    {
      actorId: adminId,
      action: 'LOCATION_UPDATED',
      entityType: 'Location',
      entityId: locationId('Administration', 0),
      description: 'Updated location Administration & Central Library Building, Ground Floor, Student Affairs Hall G01',
      descriptionKey: 'locationUpdated',
      params: {
        building: {
          en: 'Administration & Central Library Building',
          ar: 'مبنى إدارة الجامعة والمكتبة المركزية',
        },
        floor: {
          en: 'Ground Floor',
          ar: 'الطابق الأرضي',
        },
        room: {
          en: 'Student Affairs Hall G01',
          ar: 'قاعة شئون الطلاب G01',
        },
      },
      metadata: { building: 'Administration & Central Library Building' },
      createdAt: daysAgo(1),
    },
    {
      actorId: managerId,
      action: 'REQUEST_REOPENED',
      entityType: 'MaintenanceRequest',
      entityId: requestByKey.get('reopened-1')!._id,
      description: 'Reopened request MR-2023: Fault returned',
      descriptionKey: 'requestReopened',
      params: {
        code: 'MR-2023',
        reason: { en: 'Fault returned', ar: 'تكرار العطل' },
      },
      metadata: { reopenCount: 1 },
      createdAt: hoursAgo(18),
    },
  ];

  await ActivityLog.insertMany(activityLogDocs);

  // ---------------------------------------------------------------------------
  // Cached AI insight (read-only on the admin dashboard)
  // ---------------------------------------------------------------------------
  const sharedInsightBase = {
    period: '7d' as const,
    promptVersion: AI_INSIGHTS_PROMPT_VERSION,
    generatedAt: daysAgo(1, 7),
    rangeStart: daysAgo(8, 7),
    rangeEnd: daysAgo(1, 7),
    stats: {
      period: '7d',
      requests: { total: 6, previousTotal: 5, changePercent: 20, openBacklog: 5 },
      workOrders: { active: 5, completed: 1, overdue: 1, averageResolutionHours: 8.4 },
      topCategories: [
        { category: 'Hardware', count: 2 },
        { category: 'Plumbing', count: 2 },
        { category: 'Electrical', count: 1 },
      ],
    },
    model: 'gemini-2.5-flash',
    createdAt: daysAgo(1, 7),
    updatedAt: daysAgo(1, 7),
  };

  await AiInsightCache.insertMany([
    {
      ...sharedInsightBase,
      scope: 'MAINTENANCE' as const,
      lang: 'ar' as const,
      insights: {
        observations: [
          'تشكل مشكلات العتاد والسباكة غالبية الطلبات خلال هذه الفترة.',
          'تجاوز أمر العمل WO-2005 تاريخ إكماله المتوقع في مجمع الهندسة.',
        ],
        repeatedPatterns: [
          'تتكرر طلبات مجمع الهندسة حول تجهيزات المختبرات وشبكات المعامل.',
          'تسجل مباني المكتبة والإدارة بلاغات متكررة بشأن أنظمة التكييف.',
        ],
        operationalRisks: [
          'تأخر استبدال محول الشبكة في WO-2005 لدى كريم الطنطاوي قد يسبب انقطاع الاتصال خلال أوقات الذروة.',
          'تبريد غرفة الخوادم يمثل أعلى خطر تشغيلي حالياً.',
        ],
        preventiveRecommendations: [
          'تقديم موعد فحص فلاتر التكييف في المكتبة بإشراف إبراهيم عبد الفتاح.',
          'جدولة فحص دوري لمعدات الشبكة قبل بدء الامتحانات.',
        ],
      },
    },
    {
      ...sharedInsightBase,
      scope: 'MAINTENANCE' as const,
      lang: 'en' as const,
      insights: {
        observations: [
          'Hardware and plumbing issues account for most requests in this period.',
          'Work order WO-2005 is past its expected completion date in the Engineering complex.',
        ],
        repeatedPatterns: [
          'Engineering complex requests cluster around laboratory equipment and lab networking.',
          'Library and administration areas report recurring climate-control issues.',
        ],
        operationalRisks: [
          'Overdue network switch replacement WO-2005 assigned to Karim El-Tantawy may affect connectivity during peak hours.',
          'Server room cooling remains the highest operational risk.',
        ],
        preventiveRecommendations: [
          'Bring forward the HVAC filter inspection for the library with Ibrahim Abdel-Fattah.',
          'Schedule a network hardware health check before the next exam period.',
        ],
      },
    },
    {
      ...sharedInsightBase,
      scope: 'ADMIN' as const,
      lang: 'ar' as const,
      insights: {
        observations: [
          'تضم منظومة جامعة المنصورة الأهلية (MNU) 13 حساباً (منها 5 فنيين) و58 موقعاً نشطاً موزعة على 6 مبانٍ ومجمعات جامعية، مع 24 طلب صيانة و18 بلاغ مفقودات ومعثورات.',
          'سجل مجمع الكليات الهندسية والتكنولوجية أعلى كثافة نشاط مشترك بين بلاغات الصيانة والمفقودات تلاه مبنى إدارة الجامعة والمكتبة المركزية ومجمع الكليات الطبية.',
        ],
        repeatedPatterns: [
          'تتركز بلاغات المفقودات المفتوحة (9 أغراض) في الهواتف والحقائب والأجهزة الإلكترونية داخل مجمع الكليات الهندسية ومجمع الكليات الطبية.',
          'الفني كريم الطنطاوي في حالة انشغال (BUSY) وسامح رضوان خارج الدوام (OFF_DUTY)، بينما تتركز المهام الحرجة على الشبكات والتكييف المركزي.',
        ],
        operationalRisks: [
          'تجاوز أمران للعمل (منها WO-2005) موعد الإنجاز المتوقع، كما توجد خطة صيانة وقائية مستحقة (فحص فلاتر التكييف الأسبوعي) بانتظار التوليد.',
          'يوجد تطابقان مقترحان للمفقودات (مثل LF-2003 وLF-2004) وطلبات استلام قيد المراجعة والتحقق (CLM-2001 وCLM-2002) وطلب معتمد بانتظار التسليم (CLM-2003).',
        ],
        preventiveRecommendations: [
          'توجيه أ. أحمد الدسوقي (مسؤول المفقودات) لحسم التطابقات المقترحة واستكمال التحقق والتسليم لطلبات الاستلام CLM-2001 وCLM-2002 وCLM-2003.',
          'متابعة م. محمود المتولي (مدير الصيانة) لتوليد خطة فحص فلاتر التكييف المستحقة وإعادة موازنة مهام الشبكات المتأخرة قبل ذروة الاختبارات.',
        ],
      },
    },
    {
      ...sharedInsightBase,
      scope: 'ADMIN' as const,
      lang: 'en' as const,
      insights: {
        observations: [
          'The Mansoura National University (MNU) platform spans 13 accounts (including 5 technicians) and 58 active locations across 6 campus buildings, with 24 maintenance requests and 18 lost & found reports.',
          'Engineering & Technological Complex A & B records the highest combined maintenance and lost & found activity, followed by Administration & Central Library and the Medical Sector Complex.',
        ],
        repeatedPatterns: [
          'Open lost & found items (9 reports) cluster around phones, bags, and electronics in the Engineering and Medical complexes.',
          'Technician Karim El-Tantawy is marked BUSY and Sameh Radwan is OFF_DUTY while critical workload concentrates in Network and Air Conditioning.',
        ],
        operationalRisks: [
          'Two work orders (including WO-2005) are overdue, and the Weekly HVAC filter inspection preventive plan is past due for generation.',
          'Two suggested item matches (including LF-2003 / LF-2004) and active ownership claims (CLM-2001, CLM-2002, and approved CLM-2003 awaiting handover) need officer action.',
        ],
        preventiveRecommendations: [
          'Direct Ahmed El-Desouky (Lost & Found Officer) to review pending match suggestions and complete verification and handover for CLM-2001, CLM-2002, and CLM-2003.',
          'Coordinate with Eng. Mahmoud El-Metwally (Maintenance Manager) to generate the due library HVAC preventive work order and clear overdue network work order WO-2005.',
        ],
      },
    },
  ]);

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
