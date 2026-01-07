import { SelectModel, InsertModel, UpdateModel } from "../types";
import { connections, syncState, rawRecords } from "./schema";

export type Connection = SelectModel<typeof connections>;
export type NewConnection = InsertModel<typeof connections>;
export type UpdateConnection = UpdateModel<typeof connections>;

export type SyncState = SelectModel<typeof syncState>;
export type NewSyncState = InsertModel<typeof syncState>;

export type RawRecord = SelectModel<typeof rawRecords>;
export type NewRawRecord = InsertModel<typeof rawRecords>;

