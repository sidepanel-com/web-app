import { eq, and, inArray, desc, sql, or, getTableColumns } from "drizzle-orm";
import {
  activities,
  emails,
  meetings,
  calls,
  messages,
  commsPeople,
  peopleCompanies,
  people,
  companies,
} from "@db/ledger/schema";
import { WorkspaceService } from "@/spaces/packages/workspace/server/workspace-service";
import type {
  PermissionContext,
  DrizzleClient,
  ActivityDTO,
  ActivityDetailDTO,
  ActivityFilters,
  PaginatedActivities,
  ActivityPersonRef,
  ActivityCompanyRef,
  ActivityType,
  EmailSourceDTO,
  MeetingSourceDTO,
  CallSourceDTO,
  MessageSourceDTO,
} from "@/spaces/packages/workspace/types";

const COMM_ACTIVITY_TYPES: ActivityType[] = ["email", "meeting", "call", "message"];
const activityColumns = getTableColumns(activities);

function truncate(text: string | null | undefined, max = 120): string | null {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export class ActivitiesService extends WorkspaceService {
  constructor(db: DrizzleClient, permissionContext: PermissionContext) {
    super(db, permissionContext);
  }

  async canRead(): Promise<boolean> {
    return !!this.permissionContext.tenantId;
  }

  async canCreate(): Promise<boolean> {
    return await this.hasPermission("create");
  }

  async canUpdate(_entityId: string): Promise<boolean> {
    return await this.hasPermission("update");
  }

  async canDelete(_entityId: string): Promise<boolean> {
    return await this.hasPermission("delete");
  }

  async getActivities(filters: ActivityFilters = {}): Promise<PaginatedActivities> {
    const tenantId = this.permissionContext.tenantId!;
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!(await this.canRead())) throw new Error("Insufficient permissions");

    const _scope = this.getScope();
    const limit = Math.min(filters.limit ?? 50, 100);
    const offset = filters.offset ?? 0;

    const conditions = [eq(activities.tenantId, tenantId)];

    if (filters.type) {
      conditions.push(eq(activities.type, filters.type));
    } else {
      conditions.push(inArray(activities.type, COMM_ACTIVITY_TYPES));
    }

    let activityRows: (typeof activities.$inferSelect)[];
    let total: number;

    if (filters.personId) {
      const { rows, count } = await this.getActivitiesForPerson(
        tenantId,
        filters.personId,
        conditions,
        limit,
        offset,
      );
      activityRows = rows;
      total = count;
    } else if (filters.companyId) {
      const { rows, count } = await this.getActivitiesForCompany(
        tenantId,
        filters.companyId,
        conditions,
        limit,
        offset,
      );
      activityRows = rows;
      total = count;
    } else {
      const result = await this.fetchActivitiesWithCount(conditions, limit, offset);
      activityRows = result.rows;
      total = result.count;
    }

    const dtos = await this.resolveActivityDTOs(tenantId, activityRows);

    return { activities: dtos, total, limit, offset };
  }

  async getActivityById(activityId: string): Promise<ActivityDetailDTO | null> {
    const tenantId = this.permissionContext.tenantId!;
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!(await this.canRead())) throw new Error("Insufficient permissions");

    const [row] = await this.db
      .select()
      .from(activities)
      .where(and(eq(activities.id, activityId), eq(activities.tenantId, tenantId)));

    if (!row) return null;

    const [dto] = await this.resolveActivityDTOs(tenantId, [row]);
    if (!dto) return null;

    const source = await this.resolveSource(row);

    return { ...dto, source };
  }

  /**
   * Single query: rows + total via window function, replacing two separate queries.
   */
  private async fetchActivitiesWithCount(
    conditions: ReturnType<typeof eq>[],
    limit: number,
    offset: number,
  ) {
    const rows = await this.db
      .select({
        ...activityColumns,
        _total: sql<number>`count(*) over()`.mapWith(Number),
      })
      .from(activities)
      .where(and(...conditions))
      .orderBy(desc(activities.occurredAt))
      .limit(limit)
      .offset(offset);

    const count = rows[0]?._total ?? 0;
    return { rows, count };
  }

  /**
   * Resolves activities scoped to a specific person by finding all comms
   * linked to that person and filtering activities by actorCommId or actorPersonId.
   */
  private async getActivitiesForPerson(
    tenantId: string,
    personId: string,
    baseConditions: ReturnType<typeof eq>[],
    limit: number,
    offset: number,
  ) {
    const personCommLinks = await this.db
      .select({ commId: commsPeople.commId })
      .from(commsPeople)
      .where(
        and(eq(commsPeople.tenantId, tenantId), eq(commsPeople.personId, personId)),
      );

    const commIds = personCommLinks.map((r) => r.commId);

    const personFilter =
      commIds.length > 0
        ? or(
            inArray(activities.actorCommId, commIds),
            eq(activities.actorPersonId, personId),
          )
        : eq(activities.actorPersonId, personId);

    const allConditions = [...baseConditions, personFilter!];
    return this.fetchActivitiesWithCount(allConditions, limit, offset);
  }

  /**
   * Resolves activities scoped to a company by finding all people linked to
   * the company, then all comms linked to those people.
   */
  private async getActivitiesForCompany(
    tenantId: string,
    companyId: string,
    baseConditions: ReturnType<typeof eq>[],
    limit: number,
    offset: number,
  ) {
    const companyPeopleLinks = await this.db
      .select({ personId: peopleCompanies.personId })
      .from(peopleCompanies)
      .where(
        and(
          eq(peopleCompanies.tenantId, tenantId),
          eq(peopleCompanies.companyId, companyId),
        ),
      );

    const personIds = companyPeopleLinks.map((r) => r.personId);

    if (personIds.length === 0) {
      return { rows: [], count: 0 };
    }

    const personCommLinks = await this.db
      .select({ commId: commsPeople.commId })
      .from(commsPeople)
      .where(
        and(
          eq(commsPeople.tenantId, tenantId),
          inArray(commsPeople.personId, personIds),
        ),
      );

    const commIds = personCommLinks.map((r) => r.commId);

    const scopeFilter =
      commIds.length > 0
        ? or(
            inArray(activities.actorCommId, commIds),
            inArray(activities.actorPersonId, personIds),
          )
        : inArray(activities.actorPersonId, personIds);

    const allConditions = [...baseConditions, scopeFilter!];
    return this.fetchActivitiesWithCount(allConditions, limit, offset);
  }

  /**
   * Batch-resolves activity rows into ActivityDTO objects using parallel query waves:
   *   Wave 1: source data + comm→person links (parallel)
   *   Wave 2: people + people→companies (parallel, depends on wave 1)
   *   Wave 3: companies (depends on wave 2)
   */
  private async resolveActivityDTOs(
    tenantId: string,
    rows: (typeof activities.$inferSelect)[],
  ): Promise<ActivityDTO[]> {
    if (rows.length === 0) return [];

    const sourcesByType = this.groupSourceIds(rows);
    const actorCommIds = rows
      .filter((r) => r.actorCommId)
      .map((r) => r.actorCommId!);
    const actorPersonIds = rows
      .filter((r) => r.actorPersonId)
      .map((r) => r.actorPersonId!);

    // Wave 1: sources + comm→person links (independent, run in parallel)
    const [sourceMaps, commPersonRecords] = await Promise.all([
      this.batchFetchSources(sourcesByType),
      actorCommIds.length > 0
        ? this.db
            .select()
            .from(commsPeople)
            .where(
              and(
                eq(commsPeople.tenantId, tenantId),
                inArray(commsPeople.commId, actorCommIds),
              ),
            )
        : Promise.resolve([] as (typeof commsPeople.$inferSelect)[]),
    ]);

    const resolvedPersonIds = new Set<string>();
    for (const r of commPersonRecords) resolvedPersonIds.add(r.personId);
    for (const pid of actorPersonIds) resolvedPersonIds.add(pid);
    const allPersonIds = [...resolvedPersonIds];

    // Wave 2: people + people→companies (both depend only on personIds, run in parallel)
    const [personRecords, personCompanyRecords] = await Promise.all([
      allPersonIds.length > 0
        ? this.db
            .select()
            .from(people)
            .where(
              and(
                eq(people.tenantId, tenantId),
                inArray(people.id, allPersonIds),
              ),
            )
        : Promise.resolve([] as (typeof people.$inferSelect)[]),
      allPersonIds.length > 0
        ? this.db
            .select()
            .from(peopleCompanies)
            .where(
              and(
                eq(peopleCompanies.tenantId, tenantId),
                inArray(peopleCompanies.personId, allPersonIds),
              ),
            )
        : Promise.resolve([] as (typeof peopleCompanies.$inferSelect)[]),
    ]);
    const personMap = new Map(personRecords.map((p) => [p.id, p]));

    // Wave 3: companies (depends on peopleCompanies result)
    const companyIds = [...new Set(personCompanyRecords.map((r) => r.companyId))];
    const companyRecords =
      companyIds.length > 0
        ? await this.db
            .select()
            .from(companies)
            .where(
              and(
                eq(companies.tenantId, tenantId),
                inArray(companies.id, companyIds),
              ),
            )
        : [];
    const companyMap = new Map(companyRecords.map((c) => [c.id, c]));

    return rows.map((row) => {
      const personRef = this.resolvePersonForRow(
        row,
        commPersonRecords,
        personMap,
      );
      const companyRef = personRef
        ? this.resolveCompanyForPerson(
            personRef.id,
            row.occurredAt,
            personCompanyRecords,
            companyMap,
          )
        : null;

      const { title, snippet } = this.deriveTitleSnippet(row, sourceMaps);

      return {
        id: row.id,
        type: row.type as ActivityType,
        title,
        snippet,
        occurredAt: row.occurredAt,
        accessLevel: row.accessLevel,
        person: personRef,
        company: companyRef,
        sourceId: row.sourceId,
        metadata: row.metadata,
      };
    });
  }

  private resolvePersonForRow(
    row: typeof activities.$inferSelect,
    commPersonRecords: (typeof commsPeople.$inferSelect)[],
    personMap: Map<string, typeof people.$inferSelect>,
  ): ActivityPersonRef | null {
    if (row.actorPersonId) {
      const p = personMap.get(row.actorPersonId);
      if (p) return { id: p.id, firstName: p.firstName, lastName: p.lastName };
    }

    if (row.actorCommId) {
      const matching = commPersonRecords.filter(
        (r) =>
          r.commId === row.actorCommId &&
          r.startAt <= row.occurredAt &&
          (r.endAt === null || r.endAt >= row.occurredAt),
      );
      const best = matching.find((r) => r.isPrimary) ?? matching[0];
      if (best) {
        const p = personMap.get(best.personId);
        if (p)
          return { id: p.id, firstName: p.firstName, lastName: p.lastName };
      }

      const fallback = commPersonRecords.filter(
        (r) => r.commId === row.actorCommId,
      );
      const fallbackBest = fallback.find((r) => r.isPrimary) ?? fallback[0];
      if (fallbackBest) {
        const p = personMap.get(fallbackBest.personId);
        if (p)
          return { id: p.id, firstName: p.firstName, lastName: p.lastName };
      }
    }

    return null;
  }

  private resolveCompanyForPerson(
    personId: string,
    occurredAt: string,
    personCompanyRecords: (typeof peopleCompanies.$inferSelect)[],
    companyMap: Map<string, typeof companies.$inferSelect>,
  ): ActivityCompanyRef | null {
    const temporal = personCompanyRecords.filter(
      (r) =>
        r.personId === personId &&
        r.startAt <= occurredAt &&
        (r.endAt === null || r.endAt >= occurredAt),
    );
    const best = temporal.find((r) => r.isPrimary) ?? temporal[0];
    if (best) {
      const c = companyMap.get(best.companyId);
      if (c) return { id: c.id, name: c.name };
    }

    const fallback = personCompanyRecords.filter(
      (r) => r.personId === personId,
    );
    const fallbackBest = fallback.find((r) => r.isPrimary) ?? fallback[0];
    if (fallbackBest) {
      const c = companyMap.get(fallbackBest.companyId);
      if (c) return { id: c.id, name: c.name };
    }

    return null;
  }

  private groupSourceIds(rows: (typeof activities.$inferSelect)[]) {
    const emailIds: string[] = [];
    const meetingIds: string[] = [];
    const callIds: string[] = [];
    const messageIds: string[] = [];

    for (const r of rows) {
      if (!r.sourceId) continue;
      switch (r.type) {
        case "email":
          emailIds.push(r.sourceId);
          break;
        case "meeting":
          meetingIds.push(r.sourceId);
          break;
        case "call":
          callIds.push(r.sourceId);
          break;
        case "message":
          messageIds.push(r.sourceId);
          break;
      }
    }

    return { emailIds, meetingIds, callIds, messageIds };
  }

  private async batchFetchSources(ids: {
    emailIds: string[];
    meetingIds: string[];
    callIds: string[];
    messageIds: string[];
  }) {
    const [emailRows, meetingRows, callRows, messageRows] = await Promise.all([
      ids.emailIds.length > 0
        ? this.db
            .select()
            .from(emails)
            .where(inArray(emails.id, ids.emailIds))
        : Promise.resolve([]),
      ids.meetingIds.length > 0
        ? this.db
            .select()
            .from(meetings)
            .where(inArray(meetings.id, ids.meetingIds))
        : Promise.resolve([]),
      ids.callIds.length > 0
        ? this.db
            .select()
            .from(calls)
            .where(inArray(calls.id, ids.callIds))
        : Promise.resolve([]),
      ids.messageIds.length > 0
        ? this.db
            .select()
            .from(messages)
            .where(inArray(messages.id, ids.messageIds))
        : Promise.resolve([]),
    ]);

    return {
      emails: new Map(emailRows.map((e) => [e.id, e])),
      meetings: new Map(meetingRows.map((m) => [m.id, m])),
      calls: new Map(callRows.map((c) => [c.id, c])),
      messages: new Map(messageRows.map((m) => [m.id, m])),
    };
  }

  private deriveTitleSnippet(
    row: typeof activities.$inferSelect,
    sourceMaps: Awaited<ReturnType<typeof this.batchFetchSources>>,
  ): { title: string; snippet: string | null } {
    if (!row.sourceId) {
      return { title: row.type, snippet: null };
    }

    switch (row.type) {
      case "email": {
        const e = sourceMaps.emails.get(row.sourceId);
        return {
          title: e?.subject || "Email",
          snippet: truncate(e?.body),
        };
      }
      case "meeting": {
        const m = sourceMaps.meetings.get(row.sourceId);
        return {
          title: m?.title || "Meeting",
          snippet: truncate(m?.description),
        };
      }
      case "call": {
        const c = sourceMaps.calls.get(row.sourceId);
        const dur = c?.durationSeconds ? `${c.durationSeconds}s` : null;
        return {
          title: "Call",
          snippet: dur ? `Duration: ${dur}` : null,
        };
      }
      case "message": {
        const m = sourceMaps.messages.get(row.sourceId);
        return {
          title: "SMS",
          snippet: truncate(m?.body),
        };
      }
      default:
        return { title: row.type, snippet: null };
    }
  }

  private async resolveSource(
    row: typeof activities.$inferSelect,
  ): Promise<EmailSourceDTO | MeetingSourceDTO | CallSourceDTO | MessageSourceDTO | null> {
    if (!row.sourceId) return null;

    switch (row.type) {
      case "email": {
        const [e] = await this.db
          .select()
          .from(emails)
          .where(eq(emails.id, row.sourceId));
        if (!e) return null;
        return {
          kind: "email",
          id: e.id,
          subject: e.subject,
          body: e.body,
          occurredAt: e.occurredAt,
        };
      }
      case "meeting": {
        const [m] = await this.db
          .select()
          .from(meetings)
          .where(eq(meetings.id, row.sourceId));
        if (!m) return null;
        return {
          kind: "meeting",
          id: m.id,
          title: m.title,
          description: m.description,
          startAt: m.startAt,
          endAt: m.endAt,
        };
      }
      case "call": {
        const [c] = await this.db
          .select()
          .from(calls)
          .where(eq(calls.id, row.sourceId));
        if (!c) return null;
        return {
          kind: "call",
          id: c.id,
          durationSeconds: c.durationSeconds,
          recordingUrl: c.recordingUrl,
          occurredAt: c.occurredAt,
        };
      }
      case "message": {
        const [m] = await this.db
          .select()
          .from(messages)
          .where(eq(messages.id, row.sourceId));
        if (!m) return null;
        return {
          kind: "message",
          id: m.id,
          body: m.body,
          occurredAt: m.occurredAt,
        };
      }
      default:
        return null;
    }
  }

  static create(
    db: DrizzleClient,
    userId: string,
    tenantId: string,
    userRole?: PermissionContext["userRole"],
    memberProfileId?: string | null,
    orgUnitIds?: string[],
    orgUnitPaths?: string[],
  ): ActivitiesService {
    return new ActivitiesService(db, {
      userId,
      tenantId,
      userRole,
      memberProfileId: memberProfileId ?? undefined,
      orgUnitIds,
      orgUnitPaths,
    });
  }
}
