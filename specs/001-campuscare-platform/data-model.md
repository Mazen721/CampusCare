# Data Model: CampusCare (13 collections)

Source: MASTER_SPEC section 4. All have `createdAt`/`updatedAt` (timestamps) unless noted. Refs
are ObjectId. Images are `{ url, publicId }`, max 3 per entity.

## Enums (`server/src/config/constants.ts`)

- **Role**: `SUPER_ADMIN | MAINTENANCE_MANAGER | TECHNICIAN | LOST_FOUND_OFFICER | STUDENT_EMPLOYEE`
- **Priority**: `LOW | MEDIUM | HIGH | CRITICAL`
- **Maintenance categories**: Hardware, Software, Network, Electrical, Plumbing, Air Conditioning,
  Furniture, General Maintenance, Other
- **L&F categories**: Electronics, Phones, Laptops, Headphones, Wallets, Bags, Keys, Documents,
  Accessories, Books, Clothing, Other
- **RequestStatus**: `SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | IN_PROGRESS | COMPLETED | CLOSED | REOPENED`
- **WorkOrderStatus**: `PENDING_ASSIGNMENT | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED`
- **ItemStatus**: `OPEN | MATCH_CONFIRMED | CLAIM_UNDER_REVIEW | APPROVED_FOR_HANDOVER | RETURNED | CLOSED`
- **ClaimStatus**: `PENDING_REVIEW | UNDER_VERIFICATION | APPROVED | REJECTED | COMPLETED`
- **MatchStatus**: `SUGGESTED | CONFIRMED | DISMISSED`; **MatchLevel**: `STRONG | POSSIBLE`

## Collections

| # | Model | Key fields | Indexes |
| --- | --- | --- | --- |
| 1 | **Counter** (no timestamps) | `_id` string (`MR`,`WO`,`LF`,`CLM`), `seq` | `_id` |
| 2 | **User** | `name`, `email` (lowercase), `passwordHash` **select:false**, `role`, `department`, `contactPhone`, `isActive`; TECH: `specializations[]`, `skills[]`, `availability` (`AVAILABLE\|BUSY\|OFF_DUTY`) | `{email:1}` unique; `{role:1,isActive:1}` |
| 3 | **Location** | `buildingName`, `floor`, `room`, `locationType` (`BUILDING\|FLOOR\|ROOM\|LAB\|OTHER`), `description`, `isActive` | `{buildingName:1,floor:1,room:1}` unique |
| 4 | **MaintenanceRequest** | `requestNumber`, `requesterId`→User, `title`, `description`, `category`, `priority`, `locationId`→Location, `equipmentDescription?`, `attachments[]` (≤3), `status`, `reviewedBy`, `reviewedAt`, `reviewNotes`, `currentWorkOrderId`→WorkOrder, `reopenCount` (default 0) | `{requestNumber:1}` unique; `{requesterId:1,createdAt:-1}`; `{status:1,priority:1,createdAt:-1}`; `{locationId:1}` |
| 5 | **WorkOrder** | `workOrderNumber`, `sourceType` (`REACTIVE\|PREVENTIVE`), `maintenanceRequestId` (required if REACTIVE), `preventivePlanId` (required if PREVENTIVE), `assignedTechnicianId`, `title`, `description`, `category`, `priority`, `locationId`, `status`, `aiSummary{text,generatedAt}`, `scheduledStart`, `expectedCompletion`, `actualStart`, `completedAt`, `technicianNotes[]{note,authorId,createdAt,isSystem}`, `resolutionDetails`, `cancelReason` | `{workOrderNumber:1}` unique; `{assignedTechnicianId:1,status:1}`; `{status:1,expectedCompletion:1}`; `{maintenanceRequestId:1}`; **`{preventivePlanId:1,scheduledStart:1}` `{unique:true, partialFilterExpression:{preventivePlanId:{$type:'objectId'}}}`** (not sparse) |
| 6 | **PreventivePlan** | `title`, `description`, `category`, `priority`, `locationId`, `assignedTechnicianId?`, `recurrenceType` (`DAILY\|WEEKLY\|MONTHLY\|CUSTOM_DAYS`), `recurrenceIntervalDays` (required if CUSTOM_DAYS, ≥1), `startDate`, `nextScheduledDate`, `lastGeneratedDate`, `expectedDurationHours`, `isActive`, `createdBy` | `{isActive:1,nextScheduledDate:1}` |
| 7 | **ServiceFeedback** (createdAt only) | `maintenanceRequestId`, `workOrderId`, `technicianId`, `requesterId`, `rating` 1–5, `comment` ≤500 | **`{maintenanceRequestId:1}` unique**; `{technicianId:1}` |
| 8 | **LostFoundItem** | `reportNumber`, `reportType` (`LOST\|FOUND`), `itemTitle`, `description` (public), `privateIdentificationDetails` **select:false**, `category`, `color?`, `brand?`, `locationId`, `locationDetails`, `occurrenceDate`, `images[]` (≤3), `reporterId`, `status` | `{reportNumber:1}` unique; `{reportType:1,status:1,category:1}`; text `{itemTitle:'text',description:'text'}`; `{occurrenceDate:1}` |
| 9 | **ItemMatch** | `lostItemId`, `foundItemId`, `score`, `level`, `breakdown{category,location,date,color,brand,keywords}`, `status`, `reviewedBy`, `reviewedAt` | **`{lostItemId:1,foundItemId:1}` unique**; `{status:1}` |
| 10 | **ClaimRequest** | `claimNumber`, `itemId` (FOUND item), `linkedLostItemId?` (claimant's own LOST), `claimantId`, `claimDescription`, `identifyingDetailsProvided`, `supportingEvidence[]` (≤3), `status`, `verificationNotes` (officer-only), `rejectionReason`, `reviewedBy`, `reviewedAt`, `handover{receivedByName,handedOverBy,notes,handedOverAt}` | `{claimNumber:1}` unique; `{itemId:1,status:1}`; `{claimantId:1}` |
| 11 | **Notification** (createdAt only) | `userId`, `type`, `title`, `message`, `relatedEntityType`, `relatedEntityId`, `linkUrl`, `isRead` | `{userId:1,isRead:1,createdAt:-1}` |
| 12 | **ActivityLog** (createdAt only, immutable) | `actorId`, `action`, `entityType`, `entityId`, `description`, `metadata` | `{createdAt:-1}`; `{entityType:1,entityId:1}` |
| 13 | **AiInsightCache** | `period` (`7d\|30d`), `generatedAt`, `rangeStart`, `rangeEnd`, `stats`, `insights{observations[],repeatedPatterns[],operationalRisks[],preventiveRecommendations[]}`, `model` | `{period:1}` unique |

Notes: `rejectionReason` on ClaimRequest stores the claimant-visible reason (section 6.4: "rejection
needs a reason shown to the claimant"), kept separate from officer-only `verificationNotes`.
Service rule: one active (not REJECTED/COMPLETED) claim per claimant per item.

## State machines

### Request (MASTER_SPEC 5.2)
| From | To | Actor | Side effects |
| --- | --- | --- | --- |
| SUBMITTED | UNDER_REVIEW | MGR | notify requester |
| SUBMITTED, UNDER_REVIEW | APPROVED | MGR | **txn**: create WO (PENDING_ASSIGNMENT, REACTIVE) only if no non-cancelled WO linked; set `currentWorkOrderId`; notify |
| SUBMITTED, UNDER_REVIEW | REJECTED | MGR (notes req.) | notify; terminal |
| APPROVED | IN_PROGRESS | SYSTEM (WO start) | – |
| APPROVED, IN_PROGRESS, REOPENED | UNDER_REVIEW | SYSTEM (WO cancel) | notify managers |
| IN_PROGRESS | COMPLETED | SYSTEM (WO complete) | notify requester |
| COMPLETED | CLOSED | owner / MGR | notify; feedback prompt; terminal |
| COMPLETED | REOPENED | owner / MGR (reason req.) | **txn**: WO COMPLETED→ASSIGNED, resolution → system note, clear `completedAt`/`resolutionDetails`, `reopenCount++`, notify tech |
| REOPENED | IN_PROGRESS | SYSTEM (WO start) | – |
| REOPENED | CLOSED | MGR | terminal |

### Work Order (5.3)
| From | To | Actor | Rules |
| --- | --- | --- | --- |
| PENDING_ASSIGNMENT | ASSIGNED | MGR | tech active & not OFF_DUTY; `scheduledStart`, `expectedCompletion > scheduledStart` |
| ASSIGNED | ASSIGNED | MGR | reassign/reschedule; notify old + new tech |
| ASSIGNED | IN_PROGRESS | assigned TECH | set `actualStart` if unset; sync request |
| IN_PROGRESS | COMPLETED | assigned TECH | `resolutionDetails` required; `completedAt`; sync request |
| any non-terminal | CANCELLED | MGR (reason req.) | REACTIVE: request → UNDER_REVIEW |
| COMPLETED | ASSIGNED | SYSTEM (reopen) | – |

### Item (6.2)
| From | To | Trigger |
| --- | --- | --- |
| OPEN | MATCH_CONFIRMED | officer confirms match (both items) |
| OPEN, MATCH_CONFIRMED | CLAIM_UNDER_REVIEW | first claim on FOUND item |
| CLAIM_UNDER_REVIEW | APPROVED_FOR_HANDOVER | claim approved; other pending claims auto-rejected |
| CLAIM_UNDER_REVIEW | OPEN | last active claim rejected |
| APPROVED_FOR_HANDOVER | RETURNED | handover (linked LOST also RETURNED) |
| any except RETURNED | CLOSED | officer, or reporter of own LOST |

### Claim (6.4)
| From | To | Actor |
| --- | --- | --- |
| PENDING_REVIEW | UNDER_VERIFICATION | OFF |
| UNDER_VERIFICATION | APPROVED | OFF (**txn** with item + auto-reject others) |
| PENDING_REVIEW, UNDER_VERIFICATION | REJECTED | OFF (reason req.) or SYSTEM (auto-reject) |
| APPROVED | COMPLETED | OFF handover (**txn**) |

## Matching config (`matching.config.ts`, section 6.3)
Weights: category 25, location 20, date 20, color 10, brand 10, keywords 15. Thresholds: STRONG ≥ 80,
POSSIBLE ≥ 60. Hard filters: incompatible category (unless either `Other`); found date > 24 h
before lost date. Color/brand excluded from denominator when either side is missing.
