# CampusCare: Arabic (default) + English toggle, implementation plan

**Instructions for the implementer:** Do the phases in order. After each phase, run `npm run typecheck` from the repo root and fix every error before moving on. Do not rename routes, API paths, enum values or DB enum values. Translate text only.

## Decisions (already made, do not change)
| Topic | Decision |
|---|---|
| Default language | Arabic (`ar`, RTL). English (`en`, LTR) is available through a toggle |
| Arabic style | Modern Standard Arabic (فصحى مبسطة) |
| English only, never translated | **Person names** (user `name`), **email** values, **password** values. Shown as stored, wrapped in `<bdi>` / `dir="ltr"`. Their *labels* ("الاسم", "البريد الإلكتروني", "كلمة المرور") are translated |
| Server text | Server sends **keys + params**. Client translates them, so old notifications and logs also switch language |
| Bilingual data (EN + AR stored side by side) | Locations (building, floor, room, description), user department, preventive-plan title/description, plus all seeded demo content (requests, work-order notes, lost/found items, claims, feedback). Each English field `X` gets a sibling `XAr`. The UI shows `XAr` when lang = `ar` and it isn't empty, otherwise `X` (see Phase 6) |
| Free text typed by users later | Requests, item reports, comments and notes typed by users are saved once, as typed, and shown as typed in both languages (cannot be auto-translated) |
| AI (Gemini) | Output in the current UI language, cached separately per language |
| Digits | Western digits 0-9 in both languages |
| Font | `IBM Plex Sans Arabic` for `ar`, `Inter` for `en` |
| Toggle | In the AppShell header (next to NotificationBell) and on LoginPage. Saved in `localStorage` key `campuscare.lang` |
| Brand | "CampusCare" stays in Latin letters |
| Week start | Saturday (`weekStartsOn: 6`) in both languages |

---

## Phase 1: i18n infrastructure (client)
1. Install packages in `client`: `npm i i18next react-i18next @radix-ui/react-direction -w client`.
2. Create `client/src/i18n/index.ts`:
   - `i18n.use(initReactI18next).init({ resources: { ar: { translation: ar }, en: { translation: en } }, lng: stored ?? 'ar', fallbackLng: 'ar', interpolation: { escapeValue: false } })`. `stored` = `localStorage.getItem('campuscare.lang')` (inside try/catch; accept only `'ar' | 'en'`).
   - Export `type Lang = 'ar' | 'en'`, `getLang()`, and `setLang(lang)`. `setLang` calls `i18n.changeLanguage`, writes localStorage, and calls `applyDocumentLang(lang)`.
   - `applyDocumentLang(lang)`: sets `document.documentElement.lang = lang`, `document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'`, and `document.title = t('meta.title')`.
   - On language change, also call `queryClient.invalidateQueries()` so server data (seed overlay, AI) is fetched again in the new language.
3. Create `client/src/i18n/locales/ar.ts` and `en.ts`, each `export const ar = {...} as const`. Type `en` as `typeof ar`-shaped (`const en: DeepStringRecord<typeof ar>`) so missing keys fail typecheck. Namespaces as top-level objects: `common, meta, nav, auth, dashboard, requests, workOrders, technicians, preventive, calendar, feedback, locations, lostFound, claims, matches, users, activityLogs, notifications, ai, errors, serverErrors, notif, activity, validation, enums`.
4. `client/src/main.tsx`: `import '@/i18n'` before rendering, then call `applyDocumentLang(getLang())`.
5. `client/src/App.tsx`: wrap in `<DirectionProvider dir={dir}>` (from `@radix-ui/react-direction`), where `dir` comes from `useTranslation().i18n.language`. Set the Toaster `position` to `lang === 'ar' ? 'top-left' : 'top-right'` and add `dir={dir}`.
6. `client/index.html`: `<html lang="ar" dir="rtl">`, Arabic `<title>` "CampusCare — إدارة عمليات الحرم الجامعي" and Arabic meta description. Add `IBM+Plex+Sans+Arabic:wght@400;500;600;700` to the existing Google Fonts URL.
7. `tailwind.config.ts`: `fontFamily.sans: ['Inter', '"IBM Plex Sans Arabic"', 'ui-sans-serif', 'system-ui', 'sans-serif']`. In `index.css` (base layer): `html[lang='ar'] body { font-family: 'IBM Plex Sans Arabic', 'Inter', sans-serif; font-feature-settings: normal; }`. Also `html[lang='ar'] .font-display { font-family: 'IBM Plex Sans Arabic', serif; font-weight: 700; }` (Instrument Serif has no Arabic glyphs).
8. Create `client/src/components/shared/LanguageToggle.tsx`: a ghost `Button` with the `Languages` lucide icon and the label `English` when in ar / `العربية` when in en. It calls `setLang`. `aria-label={t('common.switchLanguage')}`. Place it in `AppShell.tsx` header immediately before `<NotificationBell/>` and in the top corner of `LoginPage.tsx`.

## Phase 2: RTL layout
1. In every file in the list below, replace physical classes with logical ones: `ml-`→`ms-`, `mr-`→`me-`, `pl-`→`ps-`, `pr-`→`pe-`, `left-`→`start-`, `right-`→`end-`, `text-left`→`text-start`, `text-right`→`text-end`, `border-l`→`border-s`, `border-r`→`border-e`, `rounded-l*`→`rounded-s*`, `rounded-r*`→`rounded-e*`. Keep the `sm:`/`md:` prefixes. Add `rtl:space-x-reverse` next to any `space-x-*`.
   Files: AppShell, DataTable, FormField, ImageUpload, NotificationBell, Sidebar, ui/alert-dialog, ui/dialog, ui/dropdown-menu, ui/password-input, LoginPage, ItemCard, ItemFilters, CalendarMonthView, CalendarWeekView, FeedbackCard, FeedbackPage, PreventivePlansPage, ReopenRequestDialog, RequestDetailPage, RequestTimeline, ReviewRequestDialog, TechnicianDetailDialog, TechnicianFormDialog, TechniciansPage, AddNoteDialog, AssignWorkOrderDialog, CancelWorkOrderDialog, CompleteWorkOrderDialog, WorkOrderDetailPage, WorkOrdersPage.
   After that, grep `client/src` for `\b(ml|mr|pl|pr|left|right)-` and fix anything left. **Exception:** `left-1/2 -translate-x-1/2` centering in `ui/dialog.tsx` / `alert-dialog.tsx` stays physical.
2. Mobile Sidebar slide-in: `-translate-x-full` → add `rtl:translate-x-full`, and change the anchoring `left-0` → `start-0`.
3. Directional icons (`ChevronLeft/Right`, `ArrowLeft/Right` in pagination, calendar toolbar, back links): add `className="rtl:rotate-180"`.
4. Email and password inputs (LoginPage, UserFormDialog, ChangePasswordForm, `ui/password-input.tsx`): add `dir="ltr"` and `className` `text-start`. Wherever an email is *displayed* (ProfilePage, UsersPage table, AccountSummaryCard, SessionCard, TechnicianDetailDialog), wrap it in `<span dir="ltr">`. Do the same for codes like `MR-2009` / `WO-2002`, phone numbers and **person names** (names are English, so wrap them in `<bdi>` wherever they are rendered: tables, cards, avatars, timeline, assignee selects, dashboard lists, notification params).
5. Recharts (`*Charts.tsx`): wrap each chart's container in `<div dir="ltr">` so the axes don't break, and translate the axis/legend/tooltip labels with `t`.

## Phase 3: Translate all client text
1. Go through **every** `.tsx`/`.ts` in `client/src` (117 tsx files). Replace every user-visible string (JSX text, `placeholder`, `aria-label`, `title`, button labels, toast messages, `PageHeader` props, empty/error/loading state text, `ConfirmDialog` text, table headers) with `t('namespace.key')` via `const { t } = useTranslation()`. For interpolation use `t('requests.count', { count })`. For plurals use i18next `_zero/_one/_two/_few/_many/_other` keys (Arabic needs all six; English needs `_one/_other`).
2. `navigation.ts`: change `label: string` to `labelKey: string`, and render it with `t(item.labelKey)` in Sidebar.
3. `dashboard/roleOverview.ts` and any other config arrays holding text: same `labelKey`/`descriptionKey` pattern.
4. **Enums:** add an `enums` namespace keyed by the raw value: `enums.role.SUPER_ADMIN`, `enums.status.SUBMITTED` (one shared map covering all statuses listed in `StatusBadge.tsx`), `enums.priority.*`, `enums.maintenanceCategory['Air Conditioning']` (key = exact server value), `enums.lostFoundCategory.*`, `enums.reportType.*`, `enums.sourceType.*`, `enums.recurrence.*`, `enums.availability.*`, `enums.locationType.*`, `enums.matchLevel.*`.
   - Replace `humanizeEnum` in `lib/labels.ts` with `enumLabel(group, value)`, which returns `i18n.t(\`enums.${group}.${value}\`, { defaultValue: humanize(value) })`. Update all 15 callers (ActivityLogsPage, Manager/Officer/TechnicianCharts, ClaimsTable, HandoversPage, ItemFilters, ReportsTable, MatchSuggestionsPage, CalendarToolbar, PreventivePlanFormDialog, RequestDetailSections, RequestQueuePage, RequestsListPage).
   - `StatusBadge`, `PriorityBadge`, `ReportTypeBadge`: remove the hard-coded `label` and use `enumLabel`.
   - Everywhere categories/roles are rendered in `<select>`/options (forms, filters), show `enumLabel(...)` but keep the raw value as `value`.
5. **Zod schemas** (`reportItemSchema.ts`, `claimFormSchema.ts`, and every inline schema in dialogs/forms): turn them into factories `createXSchema(t: TFunction)` that use `t('validation.minChars', { field: t('lostFound.itemTitle'), min: 3 })`. Build them in the component with `useMemo(() => createXSchema(t), [t])`. Keep the exported `type` by using `z.infer<ReturnType<typeof createXSchema>>`.
6. `lib/api.ts`: network error → `i18n.t('errors.network')`, fallback → `i18n.t('errors.requestFailed', { status })`.

## Phase 4: Dates and numbers
1. `lib/utils.ts` `formatDate`: locale = `getLang() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US'`. Add `formatNumber(n)` using the same locale and use it for stat cards.
2. Create `lib/dateLocale.ts`: `export const dateFnsLocale = () => (getLang() === 'ar' ? arEG : enUS)` (from `date-fns/locale`). Pass `{ locale: dateFnsLocale() }` to every `format`, `formatDistanceToNow`, `startOfWeek`, `endOfWeek` call (NotificationBell, ReportItemForm, calendar.utils, CalendarMonthView, CalendarPage, CalendarToolbar, CalendarWeekView). If `arEG` prints Eastern digits, post-process with `.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))` inside a helper `fmt()`.
3. Calendar: set `weekStartsOn: 6` in every week function, and generate the weekday header from the locale starting Saturday. The server `calendar.service.ts` must use the same week start if it computes week ranges.

## Phase 5: Server sends keys, client translates
1. **Send language to the server:** in `client/src/lib/api.ts` `request()`, set the header `Accept-Language: getLang()`. On the server, create `shared/middleware/language.ts`, which parses the header into `'ar' | 'en'` (default `'ar'`), sets `req.lang`, and runs `next()` inside `requestContext.run({ lang }, next)`, where `shared/utils/requestContext.ts` exports an `AsyncLocalStorage<{ lang: 'ar'|'en' }>` and `getRequestLang()`. Register it in `app.ts` before the routes. Add `lang` to the Express `Request` type declaration.
2. **Errors:** extend `shared/utils/ApiError.ts` with optional `messageKey?: string` and `params?: Record<string, string|number>`. Every factory (`notFound`, `forbidden`, `badRequest`, `conflict`, `unauthorized`, …) takes them as optional extra args. Update all ~127 call sites to pass a key, e.g. `ApiError.notFound('Work order not found', 'workOrderNotFound')`, keeping the English message as fallback. `errorHandler.ts` adds `messageKey` and `params` to `error`. For `ZodError`, set `messageKey: 'validationFailed'`. Generic 500 → `'internal'`, route 404 → `'routeNotFound'`, multer → `'uploadTooLarge'`/`'uploadInvalid'`.
   Client: `ApiError` gets `messageKey`/`params`. Add a helper `getErrorMessage(err)` in `lib/api.ts` that returns `i18n.t(\`serverErrors.${key}\`, { ...params, defaultValue: err.message })`. Replace every `toast.error(error.message)` / `ErrorState message={error.message}` with `getErrorMessage(error)`. Add every key to both `serverErrors` locales.
3. **Notifications:** add `titleKey?: string`, `messageKey?: string`, `params?: Mixed` to `shared/models/Notification.model.ts` and to `SerializedNotification`. In claim/match/request/workOrder services (14 `title:` sites), pass keys like `titleKey: 'claimApproved'`, `messageKey: 'claimApprovedMsg'`, `params: { itemTitle, code }`, keeping the English `title`/`message`. Client (NotificationBell and any notification list): `t(\`notif.${titleKey}\`, { ...resolveParams(params), defaultValue: title })`.
   - **Params convention (also used for activity logs):** a param whose value is bilingual data is sent as `{ en: string, ar?: string }` (e.g. `location: { en: loc.buildingName, ar: loc.buildingNameAr }`, `itemTitle: { en: item.itemTitle, ar: item.itemTitleAr }`). Names, emails and codes are plain strings. The client helper `resolveParams(params)` in `client/src/i18n/localize.ts` replaces every `{en, ar}` object with `pickLang(v.en, v.ar)`.
4. **Activity logs:** same pattern on `shared/models/ActivityLog.model.ts`: `descriptionKey?`, `params?`. Update every log-creating call. `ActivityLogsPage` renders `t(\`activity.${descriptionKey}\`, { ...resolveParams(params), defaultValue: description })`. Example: `location.service.ts` lines ~141/175/201 → `descriptionKey: 'locationCreated' | 'locationUpdated' | 'locationDeactivated'`, `params: { building: { en, ar }, floor: { en, ar }, room: { en, ar } }`.
5. **Success messages** returned by the server (e.g. change-password `{ message }`): add `messageKey`, and have the client translate it.

## Phase 6: Bilingual data (EN + AR fields)
**Rule:** every bilingual English field `X` gets an optional sibling string field `XAr` (same `trim`/`maxlength`). The English field stays the primary one: unique indexes, sorting, matching and validation all keep using it. The server **always returns both** `X` and `XAr`; the **client** decides which one to show. Never write Arabic into `X`. Person names, emails and passwords get **no** `Ar` field.

### 6.1 Fields to add (server model + TS interface + serializer + client type)
| Model file | New fields |
|---|---|
| `locations/location.model.ts` | `buildingNameAr`, `floorAr`, `roomAr`, `descriptionAr` |
| `auth/user.model.ts` | `departmentAr` (NOT `nameAr`) |
| `preventive/preventivePlan.model.ts` | `titleAr`, `descriptionAr` (use the model's real field names for title/description) |
| `maintenance/requests/maintenanceRequest.model.ts` | `titleAr`, `descriptionAr` |
| `maintenance/work-orders/workOrder.model.ts` | `XAr` for each free-text field (e.g. note text, completion notes, cancel reason) |
| `lost-found/items/lostFoundItem.model.ts` | `itemTitleAr`, `descriptionAr`, `locationDetailsAr`, `colorAr`, `brandAr` |
| `lost-found/claims/claimRequest.model.ts` | `XAr` for each free-text field shown in the UI (not private ID details) |
| `maintenance/feedback/serviceFeedback.model.ts` | `commentAr` (use the real comment field name) |

Only Locations, User.department and PreventivePlan get **form inputs** for the Arabic value (6.3). The other models' `Ar` fields are filled **only by the seed**, so user-created records leave them empty and fall back to what the user typed.

### 6.2 Server: make sure the `Ar` fields reach the client
1. Add each `XAr` next to `X` in every serializer/projection that outputs `X`: `location.service.ts` (~line 38), `item.projection.ts` (~lines 11, 39, 80), `dashboard.service.ts` (~lines 123, 801, 823), and every request/work-order/claim/match/preventive/feedback/user/technician serializer. Find them with `grep -rn "buildingName\|department\|itemTitle\|description" server/src`.
2. Every `.populate(...)` select string that lists `buildingName floor room` must also list `buildingNameAr floorAr roomAr` (`claim.service.ts:124`, `item.service.ts:61`, `match.service.ts:65`, `dashboard.service.ts:705`, and any others found by grep). Do the same for populates selecting `department` (add `departmentAr`). Populates selecting `name` stay unchanged.
3. Aggregations grouping by building (`dashboard.service.ts` ~lines 293, 334, 568, 581): change `$group: { _id: '$location.buildingName', ... }` to `$group: { _id: '$location._id', name: { $first: '$location.buildingName' }, nameAr: { $first: '$location.buildingNameAr' }, count: { $sum: 1 } }`. Return `{ name, nameAr, count }` to the client, and update the matching client type in `types/dashboard.ts`. Line 547 `Location.distinct('buildingName')` is only used for a count, so leave it.
4. Validation (`location.validation.ts`, `user.validation.ts`, `preventive.validation.ts`): add `buildingNameAr: z.string().trim().min(1).max(120)` (**required** when creating a location), and make `floorAr`/`roomAr` (max 40), `descriptionAr` (max 500), `departmentAr` (max 120), `titleAr`/`descriptionAr` optional. Update schemas get them through `.partial()` automatically.
5. Search: in `location.service.ts` (~line 97) add `{ buildingNameAr: pattern }` to the `$or`. In `item.service.ts` (~line 236), filter building with `$or` on `buildingName` and `buildingNameAr`. Free-text item search should also match `itemTitleAr`/`descriptionAr` where a regex `$or` exists. The Mongo `$text` index stays English-only.
6. Matching (`matching.service.ts`, `matching.runner.ts`) stays on the English fields. No change.
7. Editing seeded records: if a user edits field `X` of a record that has `XAr` (requests, items, etc.), set `XAr` to `undefined` (`$unset`) in the same update so the new text shows in both languages. This doesn't apply to the forms that edit `XAr` themselves (6.3).

### 6.3 Client
1. Create `client/src/i18n/localize.ts`:
   ```ts
   export function pickLang(en?: string | null, ar?: string | null): string {
     return getLang() === 'ar' && ar?.trim() ? ar : (en ?? '');
   }
   export function tr<T extends object>(obj: T | null | undefined, field: keyof T & string): string {
     if (!obj) return '';
     const rec = obj as Record<string, unknown>;
     return pickLang(rec[field] as string | undefined, rec[`${field}Ar`] as string | undefined);
   }
   export function formatLocation(loc?: { buildingName: string; buildingNameAr?: string; floor: string; floorAr?: string; room: string; roomAr?: string } | null): string
   // ar: "مبنى/قاعة {building}، الطابق {floor}، غرفة {room}" via t('locations.format', ...); en: "{building}, Floor {floor}, Room {room}"
   ```
   Components must use `useTranslation()` so they re-render on language change.
2. Add the optional `XAr?: string` fields to the client types: `types/locations.ts`, `users.ts`, `auth.ts` (user.departmentAr), `preventive.ts`, `maintenance.ts`, `workOrders.ts`, `lostFound.ts`, `claims.ts`, `feedback.ts`, `technicians.ts`, `calendar.ts`, `dashboard.ts`.
3. Replace every display of a bilingual field with `tr(obj, 'field')` or `formatLocation(...)`. Files (from grep): Sidebar, ProfilePage, AccountSummaryCard, TechnicianDashboard, LocationsPage, ClaimDetailPage, ClaimForm, ItemCard, ItemDetailPage, ReportItemForm, ReportsTable, MatchSuggestionsPage, CalendarWorkOrderChip, PreventivePlansPage, PreventivePlanFormDialog, NewRequestPage, RequestDetailPage, RequestDetailSections, RequestQueuePage, RequestsListPage, TechnicianDetailDialog, TechnicianFormDialog, WorkOrderDetailPage, WorkOrdersPage, UsersPage, every dashboard chart/list that shows a building, and every location `<select>` option (the option label uses `formatLocation`, the value stays `id`). Also replace displays of `itemTitle`, request `title`, `description`, `department`, feedback comment, etc. **Do not** wrap `user.name` in `tr()`.
4. Forms with Arabic inputs:
   - `LocationFormDialog.tsx`: add inputs in a 2-column grid, English on one side and Arabic on the other: `buildingName` / `buildingNameAr` (both required), `floor` / `floorAr`, `room` / `roomAr`, `description` / `descriptionAr` (textarea). Arabic inputs get `dir="rtl"` and English inputs `dir="ltr"`, whatever the UI language is. Labels: `t('locations.buildingNameEn')` = "اسم المبنى (إنجليزي)" / `t('locations.buildingNameAr')` = "اسم المبنى (عربي)", etc. Prefill all of them when editing. Update the zod schema and `CreateLocationInput`.
   - `UserFormDialog.tsx` and `TechnicianFormDialog.tsx`: add `departmentAr` (optional, `dir="rtl"`) next to `department`. `name` stays a single field with `dir="ltr"` and the helper text `t('users.nameEnglishHint')` = "يُكتب الاسم بالإنجليزية".
   - `PreventivePlanFormDialog.tsx`: add optional `titleAr` and `descriptionAr`.
   - The other forms (new request, report item, claim, notes, feedback) stay single-field and save what the user types.

### 6.4 Seed (`seed/demoData.ts`, `seed/seed.ts`, `config/constants.ts`)
1. Person names stay English (`DEMO_ACCOUNTS[*].name` and `EXTRA_STUDENTS[*].name` stay as they are). Emails stay as they are.
2. Add `departmentAr` to `DemoAccount` and every seeded user, e.g. `'Faculty of Engineering (Mechatronics)'` → `'كلية الهندسة (ميكاترونكس)'`, `'Engineering Affairs & Maintenance Department'` → `'إدارة الشؤون الهندسية والصيانة'`, `'University Security, Safety & Lost and Found Office'` → `'مكتب أمن وسلامة الجامعة والمفقودات'`, `'Information Technology & Digital Transformation Unit'` → `'وحدة تكنولوجيا المعلومات والتحول الرقمي'`, `'Faculty of Computers & Information'` → `'كلية الحاسبات والمعلومات'`.
3. Every seeded location gets `buildingNameAr`, `floorAr`, `roomAr`, `descriptionAr` (e.g. "Lecture Hall A" → "مدرج A", "Ground Floor" → "الطابق الأرضي", "Engineering Building" → "مبنى كلية الهندسة"). Keep Latin letters/numbers in codes like A, 101.
4. Every seeded request, work order note, preventive plan, lost/found item, claim and feedback gets the matching `XAr` fields with natural MSA translations (e.g. "Projector will not power on in Lecture Hall A" → "جهاز العرض لا يعمل في مدرج A").
5. Seeded notifications and activity logs use `titleKey`/`messageKey`/`descriptionKey` + params following the `{ en, ar }` convention from Phase 5.
6. Run `npm run seed` again and check that both languages show correctly.

## Phase 7: AI in the current language
1. `maintenanceInsights.service.ts` / `workOrderSummary.service.ts`: read `getRequestLang()`. Append to the system instruction: `lang==='ar' ? 'Write every string value in Modern Standard Arabic. Keep JSON keys in English.' : 'Write in English.'`
2. `aiInsightCache.model.ts`: add `lang` to the schema and to the cache lookup/unique index (`lang` + existing key fields). Work orders: replace the single `aiSummary` with `aiSummaries: { en?: aiSummarySchema, ar?: aiSummarySchema }`. Read and write `aiSummaries[lang]`, and map the old `aiSummary` to `en` on read for backward compatibility. Update the serializer to return `aiSummary: wo.aiSummaries?.[lang]`.

## Phase 8: Checks
1. `npm run typecheck` and `npm run build` pass. `npm run test` passes (update tests that assert English error messages so they assert `messageKey` instead).
2. Grep `client/src` for leftover English JSX text: `>\s*[A-Z][a-z]+` and `(placeholder|aria-label|title)="[A-Za-z]`. Every hit must be a `t()` call, a brand name, an email, or a code.
3. Manual pass in **both** languages for every role (use the demo logins): login, sidebar, every page, every dialog, form validation errors, toasts, notifications, activity log, calendar (week starts Saturday), charts, AI insights, empty and error states. In Arabic: the layout mirrors, email/password fields are LTR, digits are Western, the font is IBM Plex Sans Arabic. Toggling the language updates everything without a reload, and the choice persists after refresh.

4. Bilingual data checks: create a location with EN and AR names, then check it in a request form, an item report, a dashboard chart and the locations table in both languages. A location created before the change (no AR value) shows its English name in Arabic mode. User names and emails look the same in both languages. A request typed by a user shows exactly as typed in both languages.

## Appendix: Arabic glossary (use these exact terms everywhere)
| English | Arabic |
|---|---|
| Dashboard | لوحة التحكم |
| Maintenance request | طلب صيانة |
| Work order | أمر عمل |
| Technician | فني |
| Preventive maintenance plan | خطة صيانة وقائية |
| Calendar | التقويم |
| Service feedback | تقييم الخدمة |
| Locations / Building / Floor / Room | المواقع / المبنى / الطابق / الغرفة |
| Lost & Found | المفقودات والمعثورات |
| Lost item / Found item | غرض مفقود / غرض معثور عليه |
| Report | بلاغ |
| Claim | طلب استلام |
| Handover | التسليم |
| Match suggestions | المطابقات المقترحة |
| Users | المستخدمون |
| Activity logs | سجل النشاط |
| Notifications | الإشعارات |
| Profile | الملف الشخصي |
| Sign in / Sign out | تسجيل الدخول / تسجيل الخروج |
| Email / Password | البريد الإلكتروني / كلمة المرور |
| Change password | تغيير كلمة المرور |
| Super Admin | مدير النظام |
| Maintenance Manager | مدير الصيانة |
| Lost & Found Officer | مسؤول المفقودات |
| Student / Employee | طالب / موظف |
| Priority: Low / Medium / High / Critical | منخفضة / متوسطة / عالية / حرجة |
| Submitted / Under review / Approved / Rejected | مُقدَّم / قيد المراجعة / مُعتمد / مرفوض |
| In progress / Completed / Closed / Reopened | قيد التنفيذ / مكتمل / مغلق / أُعيد فتحه |
| Pending assignment / Assigned / Cancelled | بانتظار التعيين / تم التعيين / ملغى |
| Open / Returned | مفتوح / تم الإرجاع |
| Save / Cancel / Edit / Delete / Search / Filter | حفظ / إلغاء / تعديل / حذف / بحث / تصفية |
| AI insights / AI summary | رؤى الذكاء الاصطناعي / ملخص بالذكاء الاصطناعي |
