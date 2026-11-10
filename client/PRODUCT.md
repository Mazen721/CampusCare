# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

CampusCare is used by people at Mansoura National University (MNU). Five roles stay, and each person only does their own job:

- Students and employees report maintenance problems and lost or found items, then follow their own requests, claims, and reports.
- Maintenance managers review requests, assign technicians, and track the work.
- Technicians carry out the work orders assigned to them.
- Lost-and-found officers review match suggestions, check claims against private details, and record handovers.
- The super admin creates accounts, manages locations, and reads the activity log. Managers may create technician accounts. Nobody else can sign themselves up.

The first screens to redesign are the login page, then the student and employee screens. The order for the other roles’ screens is still open.

## Product Purpose

CampusCare is Mansoura National University’s tool for two jobs in one place: getting something on campus fixed, and getting a lost item back to its owner. It exists so those jobs move through a recorded path instead of informal messages. Success means a person can sign in, see only their own work, and carry a maintenance issue or a lost item through to a recorded outcome.

The committed institution is Mansoura National University (MNU).

## Positioning

It is the university’s own operations tool, not a public listings board. Maintenance and lost and found run in the same signed-in product. A maintenance request becomes a work order only through review. A lost-and-found match is a suggestion, not proof of ownership: an officer checks a claim against private details before anything is handed over. Those private details stay hidden from everyone except the reporter, an officer, and the admin.

## Operating Context

People use it in a browser while signed in. Places are shared records of building, floor, and room.

Maintenance runs from a student’s or employee’s request, through a manager’s review, into a work order a technician completes, and back to the requester to confirm or reopen. Lost and found runs from a lost or found report, through a suggested match, a claim, an officer’s check, and a recorded handover.

Notifications stay inside the product. The admin keeps users, locations, and an activity log. Arabic is the default language; English is also available. Arabic is laid out right to left.

The detailed rules already written in `MASTER_SPEC.md` and `specs/001-campuscare-platform/spec.md` are the current product behavior this record is summarizing.

## Capabilities and Constraints

Keep both modules, all five roles, admin-created accounts (no self-registration), and the privacy rule for lost-and-found details.

The current visual design is not a commitment. Replace it. Keep the jobs, the roles, both languages, and the privacy rules.

The login page is the first screen to replace. Student and employee screens come next. Whether manager, technician, officer, and admin screens are redesigned after that is undecided.

The committed institution is Mansoura National University (MNU). No separate accessibility standard was chosen.

## Brand Commitments

The product name is CampusCare for Mansoura National University (MNU). The committed brand assets are `client/public/Mansoura National University Emblem.png` and `client/public/Mansoura National University Entrance.png` (`client/public/favicon.svg` remains as the browser favicon).

## Evidence on Hand

- `MASTER_SPEC.md` and `specs/001-campuscare-platform/spec.md` — the written product behavior.
- `client/src/i18n/locales/ar.ts` and `client/src/i18n/locales/en.ts` — the Arabic and English copy.
- `client/public/Mansoura National University Emblem.png`, `client/public/Mansoura National University Entrance.png`, and `client/public/favicon.svg` — the MNU emblem, entrance photograph, and favicon.
- Demo accounts for the five roles can be created by the project’s seed script. They are demo data, not evidence of a live campus.

Do not invent testimonials, unverified campus photography, usage numbers, or press.

## Product Principles

- Maintenance and lost and found stay one product.
- Each person only reaches the work their role allows.
- Private identification details are shown only to the reporter, lost-and-found officers, and the admin.
- Arabic and English both have to work, including right-to-left Arabic.
- Replace the current look. The jobs, roles, languages, and privacy rules stay.

## Accessibility & Inclusion

The product must work in Arabic, laid out right to left, and in English. Arabic is the default. No further accessibility standard was set.
