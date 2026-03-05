import type { DrizzleClient, PermissionContext } from "@/spaces/packages/workspace/types";
import {
  resolveWorkspaceScope,
  type ScopeConstraints,
} from "@/spaces/permissions/server/scope-resolver";
import { LedgerWriteService } from "@/spaces/ledger/server/ledger-write.service";

/**
 * Base class for workspace projection services.
 *
 * Owns scope resolution and ledger write delegation so that concrete
 * services (PeopleService, CompaniesService, …) never import from the
 * platform layer directly.
 */
export abstract class WorkspaceService {
  protected db: DrizzleClient;
  protected permissionContext: PermissionContext;
  protected ledger: LedgerWriteService;
  private _scope: ScopeConstraints | null = null;

  constructor(db: DrizzleClient, permissionContext: PermissionContext) {
    this.db = db;
    this.permissionContext = permissionContext;
    this.ledger = new LedgerWriteService(db);
  }

  protected getScope(): ScopeConstraints {
    if (!this._scope) {
      this._scope = resolveWorkspaceScope(this.permissionContext);
    }
    return this._scope;
  }

  abstract canRead(entityId?: string): Promise<boolean>;
  abstract canCreate(): Promise<boolean>;
  abstract canUpdate(entityId: string): Promise<boolean>;
  abstract canDelete(entityId: string): Promise<boolean>;

  protected async hasPermission(
    permission: string,
    _entityId?: string,
  ): Promise<boolean> {
    const { userRole, customPermissions } = this.permissionContext;

    if (customPermissions?.[permission]) {
      return customPermissions[permission];
    }

    switch (userRole) {
      case "owner":
        return true;
      case "admin":
        return !["delete_tenant", "transfer_ownership"].includes(permission);
      case "member":
        return ["read", "create", "update_own"].includes(permission);
      case "viewer":
        return permission === "read";
      default:
        return false;
    }
  }
}
