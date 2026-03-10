import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  V1ApiService,
  type V1ApiHandlers,
} from "@/spaces/platform/server/v1-api-service";
import { ActivitiesService } from "@/spaces/packages/workspace/server/activities.service";
import { LedgerWriteService } from "@/spaces/ledger/server/ledger-write.service";

const schemas = {
  GET: z.object({
    type: z.enum(["email", "meeting", "call", "message"]).optional(),
    personId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  }),
  POST: z
    .object({
      type: z.enum(["email", "meeting", "call", "message"]),
      actorCommId: z.string().uuid(),
      actorPersonId: z.string().uuid().optional(),
      occurredAt: z.string().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      startAt: z.string().optional(),
      endAt: z.string().optional(),
      icalUid: z.string().optional(),
      ownerCommId: z.string().uuid().optional(),
      durationSeconds: z.string().optional(),
      participantCommIds: z.array(z.string().uuid()).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === "email" && !data.subject) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "subject is required for email activities",
          path: ["subject"],
        });
      }
      if (data.type === "meeting") {
        if (!data.startAt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "startAt is required for meeting activities",
            path: ["startAt"],
          });
        }
        if (!data.endAt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endAt is required for meeting activities",
            path: ["endAt"],
          });
        }
      }
      if (data.type === "message" && !data.body) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "body is required for message activities",
          path: ["body"],
        });
      }
    }),
};

const handlers: V1ApiHandlers<typeof schemas> = {
  GET: async ({
    db,
    requestData,
    apiUser,
    tenantId,
    userRole,
    memberProfileId,
    orgUnitIds,
    orgUnitPaths,
  }) => {
    const service = ActivitiesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined,
      memberProfileId,
      orgUnitIds,
      orgUnitPaths,
    );

    return await service.getActivities(requestData);
  },

  POST: async ({
    db,
    requestData,
    apiUser,
    tenantId,
    userRole,
    memberProfileId,
    orgUnitIds,
    orgUnitPaths,
  }) => {
    const activitiesService = ActivitiesService.create(
      db,
      apiUser.supabaseUserId,
      tenantId,
      userRole || undefined,
      memberProfileId,
      orgUnitIds,
      orgUnitPaths,
    );

    if (!(await activitiesService.canCreate())) {
      throw new Error("Insufficient permissions to create activity");
    }

    const ledger = new LedgerWriteService(db);
    const now = requestData.occurredAt ?? new Date().toISOString();

    let sourceId: string | undefined;

    switch (requestData.type) {
      case "email": {
        const email = await ledger.insertEmail(tenantId, {
          subject: requestData.subject!,
          body: requestData.body,
          occurredAt: now,
        });
        sourceId = email.id;
        await ledger.linkEmailComm(tenantId, email.id, requestData.actorCommId, "from");
        for (const commId of requestData.participantCommIds ?? []) {
          await ledger.linkEmailComm(tenantId, email.id, commId, "to");
        }
        break;
      }
      case "meeting": {
        const meeting = await ledger.insertMeeting(tenantId, {
          icalUid: requestData.icalUid ?? crypto.randomUUID(),
          ownerCommId: requestData.ownerCommId ?? requestData.actorCommId,
          title: requestData.title,
          description: requestData.description,
          startAt: requestData.startAt!,
          endAt: requestData.endAt!,
        });
        sourceId = meeting.id;
        await ledger.linkMeetingComm(tenantId, meeting.id, requestData.actorCommId, "organizer");
        for (const commId of requestData.participantCommIds ?? []) {
          await ledger.linkMeetingComm(tenantId, meeting.id, commId, "attendee");
        }
        break;
      }
      case "call": {
        const call = await ledger.insertCall(tenantId, {
          durationSeconds: requestData.durationSeconds,
          occurredAt: now,
        });
        sourceId = call.id;
        await ledger.linkCallComm(tenantId, call.id, requestData.actorCommId, "from");
        for (const commId of requestData.participantCommIds ?? []) {
          await ledger.linkCallComm(tenantId, call.id, commId, "to");
        }
        break;
      }
      case "message": {
        const message = await ledger.insertMessage(tenantId, {
          body: requestData.body!,
          occurredAt: now,
        });
        sourceId = message.id;
        await ledger.linkMessageComm(tenantId, message.id, requestData.actorCommId, "from");
        for (const commId of requestData.participantCommIds ?? []) {
          await ledger.linkMessageComm(tenantId, message.id, commId, "to");
        }
        break;
      }
    }

    const activity = await ledger.insertActivity(tenantId, {
      type: requestData.type,
      sourceId,
      actorCommId: requestData.actorCommId,
      actorPersonId: requestData.actorPersonId,
      occurredAt: now,
    });

    return activity;
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return new V1ApiService(handlers, schemas).run(req, res);
}
