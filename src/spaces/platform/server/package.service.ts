import { eq, and } from "drizzle-orm";
import { tenantPackages } from "@db/platform/schema";
import type { DrizzleClient } from "./db";

/** Known package IDs. Extend as new packages are added. */
export const KNOWN_PACKAGES = ["workspace"] as const;
export type PackageId = (typeof KNOWN_PACKAGES)[number];

export interface PackageState {
  packageId: string;
  enabled: boolean;
}

export class PackageService {
  constructor(private db: DrizzleClient) {}

  /**
   * Get all package states for a tenant.
   * Packages without a row default to enabled (workspace) so new tenants work out of the box.
   */
  async getPackageStates(tenantId: string): Promise<PackageState[]> {
    const rows = await this.db
      .select({
        packageId: tenantPackages.packageId,
        enabled: tenantPackages.enabled,
      })
      .from(tenantPackages)
      .where(eq(tenantPackages.tenantId, tenantId));

    const stateMap = new Map(rows.map((r) => [r.packageId, r.enabled]));

    return KNOWN_PACKAGES.map((id) => ({
      packageId: id,
      enabled: stateMap.get(id) ?? true,
    }));
  }

  /**
   * Check if a single package is enabled for a tenant.
   */
  async isPackageEnabled(tenantId: string, packageId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ enabled: tenantPackages.enabled })
      .from(tenantPackages)
      .where(
        and(
          eq(tenantPackages.tenantId, tenantId),
          eq(tenantPackages.packageId, packageId),
        ),
      )
      .limit(1);

    return row?.enabled ?? true;
  }

  /**
   * Set the enabled state for a package. Upserts the row.
   */
  async setPackageEnabled(
    tenantId: string,
    packageId: string,
    enabled: boolean,
  ): Promise<PackageState> {
    const [existing] = await this.db
      .select({ id: tenantPackages.id })
      .from(tenantPackages)
      .where(
        and(
          eq(tenantPackages.tenantId, tenantId),
          eq(tenantPackages.packageId, packageId),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .update(tenantPackages)
        .set({ enabled })
        .where(eq(tenantPackages.id, existing.id));
    } else {
      await this.db.insert(tenantPackages).values({
        tenantId,
        packageId,
        enabled,
      });
    }

    return { packageId, enabled };
  }

  /**
   * Return just the enabled package IDs for a tenant.
   */
  async getEnabledPackageIds(tenantId: string): Promise<string[]> {
    const states = await this.getPackageStates(tenantId);
    return states.filter((s) => s.enabled).map((s) => s.packageId);
  }
}
