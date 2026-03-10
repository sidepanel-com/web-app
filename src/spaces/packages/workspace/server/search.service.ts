import { eq, and, or, ilike, sql } from "drizzle-orm";
import { people, companies } from "@db/ledger/schema";
import { WorkspaceService } from "@/spaces/packages/workspace/server/workspace-service";
import type {
  PermissionContext,
  DrizzleClient,
} from "@/spaces/packages/workspace/types";

export interface SearchResultItem {
  id: string;
  type: "person" | "company";
  title: string;
  subtitle: string | null;
}

export interface SearchResults {
  results: SearchResultItem[];
  query: string;
}

export class SearchService extends WorkspaceService {
  constructor(db: DrizzleClient, permissionContext: PermissionContext) {
    super(db, permissionContext);
  }

  async canRead(): Promise<boolean> {
    return !!this.permissionContext.tenantId;
  }

  async canCreate(): Promise<boolean> {
    return false;
  }

  async canUpdate(): Promise<boolean> {
    return false;
  }

  async canDelete(): Promise<boolean> {
    return false;
  }

  async search(query: string, limit = 20): Promise<SearchResults> {
    const tenantId = this.permissionContext.tenantId!;
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!(await this.canRead())) throw new Error("Insufficient permissions");

    const pattern = `%${query}%`;

    const [personRows, companyRows] = await Promise.all([
      this.db
        .select()
        .from(people)
        .where(
          and(
            eq(people.tenantId, tenantId),
            or(
              ilike(people.firstName, pattern),
              ilike(people.lastName, pattern),
              ilike(
                sql`concat(${people.firstName}, ' ', ${people.lastName})`,
                pattern,
              ),
            ),
          ),
        )
        .limit(limit),

      this.db
        .select()
        .from(companies)
        .where(
          and(
            eq(companies.tenantId, tenantId),
            ilike(companies.name, pattern),
          ),
        )
        .limit(limit),
    ]);

    const results: SearchResultItem[] = [
      ...personRows.map((p) => ({
        id: p.id,
        type: "person" as const,
        title: [p.firstName, p.lastName].filter(Boolean).join(" "),
        subtitle: p.bio,
      })),
      ...companyRows.map((c) => ({
        id: c.id,
        type: "company" as const,
        title: c.name,
        subtitle: c.description,
      })),
    ];

    return { results: results.slice(0, limit), query };
  }

  static create(
    db: DrizzleClient,
    userId: string,
    tenantId: string,
    userRole?: PermissionContext["userRole"],
    memberProfileId?: string | null,
    orgUnitIds?: string[],
    orgUnitPaths?: string[],
  ): SearchService {
    return new SearchService(db, {
      userId,
      tenantId,
      userRole,
      memberProfileId: memberProfileId ?? undefined,
      orgUnitIds,
      orgUnitPaths,
    });
  }
}
