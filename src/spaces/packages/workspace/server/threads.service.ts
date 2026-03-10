import { eq, and, inArray, asc } from "drizzle-orm";
import {
  messages,
  messageComms,
  commsPeople,
  people,
  comms,
} from "@db/ledger/schema";
import { WorkspaceService } from "@/spaces/packages/workspace/server/workspace-service";
import type {
  PermissionContext,
  DrizzleClient,
} from "@/spaces/packages/workspace/types";

export interface ThreadMessageDTO {
  id: string;
  body: string | null;
  occurredAt: string;
  sender: {
    personId: string | null;
    firstName: string | null;
    lastName: string | null;
    commValue: string;
    role: string | null;
  } | null;
}

export interface ThreadDTO {
  personId: string;
  personName: string;
  companyName: string | null;
  messages: ThreadMessageDTO[];
}

/**
 * Reads SMS threads for a given person by finding all message-type comms
 * linked to the person and fetching associated messages in chronological order.
 */
export class ThreadsService extends WorkspaceService {
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

  /**
   * Returns all SMS messages involving a given person, ordered chronologically.
   * This derives the thread from ledger data rather than requiring an explicit
   * thread membership table.
   */
  async getThreadForPerson(personId: string): Promise<ThreadDTO | null> {
    const tenantId = this.permissionContext.tenantId!;
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!(await this.canRead())) throw new Error("Insufficient permissions");

    const [person] = await this.db
      .select()
      .from(people)
      .where(and(eq(people.id, personId), eq(people.tenantId, tenantId)));

    if (!person) return null;

    const personCommLinks = await this.db
      .select({ commId: commsPeople.commId })
      .from(commsPeople)
      .where(
        and(
          eq(commsPeople.tenantId, tenantId),
          eq(commsPeople.personId, personId),
        ),
      );

    const commIds = personCommLinks.map((r) => r.commId);
    if (commIds.length === 0) {
      return {
        personId,
        personName: [person.firstName, person.lastName].filter(Boolean).join(" "),
        companyName: null,
        messages: [],
      };
    }

    const msgCommLinks = await this.db
      .select({
        messageId: messageComms.messageId,
        commId: messageComms.commId,
        role: messageComms.role,
      })
      .from(messageComms)
      .where(
        and(
          eq(messageComms.tenantId, tenantId),
          inArray(messageComms.commId, commIds),
        ),
      );

    const messageIds = [...new Set(msgCommLinks.map((r) => r.messageId))];
    if (messageIds.length === 0) {
      return {
        personId,
        personName: [person.firstName, person.lastName].filter(Boolean).join(" "),
        companyName: null,
        messages: [],
      };
    }

    const messageRows = await this.db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.tenantId, tenantId),
          inArray(messages.id, messageIds),
        ),
      )
      .orderBy(asc(messages.occurredAt));

    const allMsgCommLinks = await this.db
      .select({
        messageId: messageComms.messageId,
        commId: messageComms.commId,
        role: messageComms.role,
      })
      .from(messageComms)
      .where(
        and(
          eq(messageComms.tenantId, tenantId),
          inArray(messageComms.messageId, messageIds),
        ),
      );

    const allCommIds = [...new Set(allMsgCommLinks.map((r) => r.commId))];
    const commRecords =
      allCommIds.length > 0
        ? await this.db
            .select()
            .from(comms)
            .where(
              and(eq(comms.tenantId, tenantId), inArray(comms.id, allCommIds)),
            )
        : [];
    const commMap = new Map(commRecords.map((c) => [c.id, c]));

    const commPersonLinks = await this.db
      .select()
      .from(commsPeople)
      .where(
        and(
          eq(commsPeople.tenantId, tenantId),
          inArray(commsPeople.commId, allCommIds),
        ),
      );

    const allPersonIds = [
      ...new Set(commPersonLinks.map((r) => r.personId)),
    ];
    const personRecords =
      allPersonIds.length > 0
        ? await this.db
            .select()
            .from(people)
            .where(
              and(
                eq(people.tenantId, tenantId),
                inArray(people.id, allPersonIds),
              ),
            )
        : [];
    const personMap = new Map(personRecords.map((p) => [p.id, p]));

    const threadMessages: ThreadMessageDTO[] = messageRows.map((msg) => {
      const senderLink = allMsgCommLinks.find(
        (l) => l.messageId === msg.id && l.role === "from",
      ) ?? allMsgCommLinks.find((l) => l.messageId === msg.id);

      let sender: ThreadMessageDTO["sender"] = null;
      if (senderLink) {
        const comm = commMap.get(senderLink.commId);
        const personLink = commPersonLinks.find(
          (cp) => cp.commId === senderLink.commId,
        );
        const senderPerson = personLink
          ? personMap.get(personLink.personId)
          : null;

        sender = {
          personId: senderPerson?.id ?? null,
          firstName: senderPerson?.firstName ?? null,
          lastName: senderPerson?.lastName ?? null,
          commValue: comm?.canonicalValue ?? "",
          role: senderLink.role,
        };
      }

      return {
        id: msg.id,
        body: msg.body,
        occurredAt: msg.occurredAt,
        sender,
      };
    });

    return {
      personId,
      personName: [person.firstName, person.lastName].filter(Boolean).join(" "),
      companyName: null,
      messages: threadMessages,
    };
  }

  static create(
    db: DrizzleClient,
    userId: string,
    tenantId: string,
    userRole?: PermissionContext["userRole"],
    memberProfileId?: string | null,
    orgUnitIds?: string[],
    orgUnitPaths?: string[],
  ): ThreadsService {
    return new ThreadsService(db, {
      userId,
      tenantId,
      userRole,
      memberProfileId: memberProfileId ?? undefined,
      orgUnitIds,
      orgUnitPaths,
    });
  }
}
