import i18n, { getLang } from './index';

export const KNOWN_AR_BY_EN: Record<string, string> = {
  // MNU Demo Accounts, Technicians, Faculty & Students
  'Eng. Tarek El-Shenawy': 'م. طارق الشناوي',
  'Eng. Mahmoud El-Metwally': 'م. محمود المتولي',
  'Ahmed El-Desouky': 'أ. أحمد الدسوقي',
  'Dr. Noha El-Gayar': 'د. نهى الجيار',
  'Youssef El-Ashry': 'يوسف العشري',
  'Karim El-Tantawy': 'كريم الطنطاوي',
  'Hassan El-Sayed': 'حسن السيد',
  'Ibrahim Abdel-Fattah': 'إبراهيم عبد الفتاح',
  'Mohamed El-Gohary': 'محمد الجوهري',
  'Sameh Radwan': 'سامح رضوان',
  'Sara Mahmoud': 'سارة محمود',
  'Omar Khaled': 'عمر خالد',
  'Mariam El-Menshawy': 'مريم المنشاوي',
  System: 'النظام',

  // MNU Departments
  'Information Technology & Digital Transformation Unit':
    'وحدة تكنولوجيا المعلومات والتحول الرقمي',
  'Engineering Affairs & Maintenance Department':
    'الإدارة العامة للشئون الهندسية والصيانة',
  'University Security, Safety & Lost and Found Office':
    'إدارة الأمن الجامعي والسلامة — مكتب المفقودات',
  'General Services & Facilities Management':
    'إدارة الشئون الإدارية والخدمات الداخلية',
  'Faculty of Engineering (Level 3 Mechatronics)':
    'كلية الهندسة (المستوى الثالث — ميكاترونكس)',
  'Faculty of Engineering (Mechatronics)': 'كلية الهندسة (ميكاترونكس)',
  'Faculty of Engineering': 'كلية الهندسة',
  'Faculty of Medicine and Surgery': 'كلية الطب والجراحة',
  'Faculty of Dentistry': 'كلية طب الفم والأسنان',
  'Faculty of Economics and Business Administration':
    'كلية الاقتصاد وإدارة الأعمال',

  // MNU Buildings & Floors
  'Administration & Central Library Building':
    'مبنى إدارة الجامعة والمكتبة المركزية',
  'Engineering & Technological Complex A & B':
    'مجمع الكليات الهندسية والتكنولوجية',
  'Engineering & Technological Complex': 'مجمع الكليات الهندسية والتكنولوجية',
  'Medical Sector Complex A & B': 'مجمع الكليات الطبية',
  'Medical Sector Complex': 'مجمع الكليات الطبية',
  'Humanities & Business Building':
    'مبنى العلوم الإنسانية والاقتصاد وإدارة الأعمال',
  'Central Workshops & Laboratories Building': 'مبنى الورش والمعامل المركزية',
  'Student Activities & Sports Complex':
    'منطقة الأنشطة الطلابية والملاعب الرياضية',
  'Ground Floor': 'الطابق الأرضي',
  'Floor 1': 'الطابق الأول',
  'Floor 2': 'الطابق الثاني',
  'Floor 3': 'الطابق الثالث',
  'Floor 4': 'الطابق الرابع',

  // Technician Skills
  'Electrical wiring': 'التمديدات الكهربائية',
  'Distribution boards': 'لوحات التوزيع الكهربائية',
  'Power diagnostics': 'تشخيص أعطال الطاقة',
  'Water networks': 'شبكات المياه',
  'Sanitation maintenance': 'صيانة الصرف الصحي',
  'Leak detection': 'كشف التسريبات',
  'Lab PC maintenance': 'صيانة حواسيب المعامل',
  'Fiber & LAN cabling': 'كابلات الألياف والشبكات المحلية',
  'Access point configuration': 'إعداد نقاط الوصول اللاسلكية',
  'Central HVAC servicing': 'صيانة التكييف المركزي',
  'Chiller maintenance': 'صيانة المبردات المركزية (Chillers)',
  'Air handling units': 'وحدات مناولة الهواء',
  'Lecture hall seating repair': 'إصلاح مقاعد المدرجات',
  Carpentry: 'أعمال النجارة والأثاث',
  'Door & lock hardware': 'صيانة الأبواب والأقفال',
};

export function pickLang(en?: string | null, ar?: string | null): string {
  if (getLang() === 'ar') {
    if (ar?.trim()) return ar;
    if (en?.trim() && KNOWN_AR_BY_EN[en.trim()]) {
      return KNOWN_AR_BY_EN[en.trim()]!;
    }
  }
  return en ?? '';
}

export function resolveParams(
  params?: Record<string, unknown> | null,
): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const resolved: Record<string, string | number> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val && typeof val === 'object' && ('en' in val || 'ar' in val)) {
      const bilingual = val as { en?: string | null; ar?: string | null };
      resolved[key] = pickLang(bilingual.en, bilingual.ar);
    } else if (typeof val === 'string') {
      resolved[key] = pickLang(val);
    } else if (typeof val === 'number') {
      resolved[key] = val;
    }
  }
  return resolved;
}

export function tr<T extends object>(obj: T | null | undefined, field: keyof T & string): string {
  if (!obj) return '';
  const rec = obj as Record<string, unknown>;
  return pickLang(rec[field] as string | undefined, rec[`${field}Ar`] as string | undefined);
}

export interface FormattableLocation {
  buildingName: string;
  buildingNameAr?: string;
  floor: string;
  floorAr?: string;
  room: string;
  roomAr?: string;
}

const BARE_ROOM_CODE_RE = /^[A-Za-z]?\d+[A-Za-z]?$/;

export function formatLocation(loc?: FormattableLocation | null): string {
  if (!loc) return '';
  const building = pickLang(loc.buildingName, loc.buildingNameAr);
  const floor = pickLang(loc.floor, loc.floorAr);
  const room = pickLang(loc.room, loc.roomAr);
  if (!BARE_ROOM_CODE_RE.test(room.trim())) {
    const sep = getLang() === 'ar' ? '، ' : ', ';
    return [building, floor, room].filter(Boolean).join(sep);
  }
  return i18n.t('locations.format', { building, floor, room });
}
