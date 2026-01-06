# Communication Type Specifications

This document defines the standardized data structures, normalization rules, and uniqueness constraints for all communication methods in the `comms` table.

## The Dual-Column Strategy

To balance rich metadata with strict database integrity, every communication record uses two distinct columns:

| Column                | Type    | Role                                                                                     |
| :-------------------- | :------ | :--------------------------------------------------------------------------------------- |
| **`value`**           | `jsonb` | **Storage & UI.** Stores the full object with metadata (flags, raw URLs, display names). |
| **`canonical_value`** | `text`  | **Uniqueness & Lookup.** A normalized, flat string used for the unique index.            |

**Constraint**: `UNIQUE(tenant_id, type, canonical_value)`

---

## Communication Types Table

| Type         | JSON `value` Structure                                         | Canonical Value        | Purpose                                                   |
| :----------- | :------------------------------------------------------------- | :--------------------- | :-------------------------------------------------------- |
| **Email**    | `{ "address": "string" }`                                      | Lowercase address      | Primary identifier for People/Companies and Meeting Sync. |
| **Phone**    | `{ "number": "string", "sms": boolean, "voice": boolean }`     | E.164 number           | Normalized phone identity with capability flags.          |
| **LinkedIn** | `{ "vanityName": "string", "url": "string", "urn": "string" }` | `vanityName`           | Profile identity based on the public URL identifier.      |
| **Slack**    | `{ "handle": "string", "workspace": "string" }`                | `workspace` + `handle` | Team-specific chat identifier.                            |
| **WhatsApp** | `{ "number": "string" }`                                       | E.164 number           | Direct messaging identifier.                              |
| **Other**    | `{ "label": "string", "value": "string" }`                     | Raw value              | Catch-all for custom links or identifiers.                |

---

## Detailed Examples & Rules

### 1. Email

Email is the "primary key" for human identity in the system.

- **Normalization**: Trim whitespace and lowercase.
- **Example**:
  - **Input**: `Eligeske@gmail.com`
  - **`canonical_value`**: `eligeske@gmail.com`
  - **`value`**: `{ "address": "eligeske@gmail.com" }`

### 2. Phone

Phone numbers must be stored in E.164 format to ensure global uniqueness and compatibility with SMS/Voice APIs.

- **Normalization**: Strip `( ) - .` and spaces. Prepend `+` and country code.
- **Example**:
  - **Input**: `(555) 123-4567` (assuming US/Canada)
  - **`canonical_value`**: `+15551234567`
  - **`value`**: `{ "number": "+15551234567", "sms": true, "voice": true }`

### 3. LinkedIn

Identities are tied to the vanity name found in the URL.

- **Extraction**: For `linkedin.com/in/john-doe-123/`, the vanity name is `john-doe-123`.
- **Uniqueness**: We use the `vanityName` as the key. If a `urn` (API ID) is discovered later via the LinkedIn API, it is appended to the JSON `value` but does **not** replace the `canonical_value`.
- **Example**:
  - **Input URL**: `https://www.linkedin.com/in/eligeske/`
  - **`canonical_value`**: `eligeske`
  - **`value`**: `{ "vanityName": "eligeske", "url": "https://...", "urn": "urn:li:person:ABC123XYZ" }`

### 4. Slack

Slack handles are unique within a specific workspace.

- **Normalization**: Lowercase both handle and workspace.
- **Example**:
  - **`canonical_value`**: `acme-hq:eligeske`
  - **`value`**: `{ "handle": "eligeske", "workspace": "acme-hq" }`

### 5. Other

Used for custom labels like "Personal Website" or "GitHub".

- **Example**:
  - **`canonical_value`**: `https://github.com/eligeske`
  - **`value`**: `{ "label": "GitHub", "value": "https://github.com/eligeske" }`

---

## Implementation Notes

### Calendar & Meeting Sync

We do **not** use a dedicated `calendar` comm type.

1.  **Backend Sync**: The meeting sync engine uses the **Email** comm type to resolve meeting participants to People or Companies.
2.  **Meeting Ownership**: If a meeting originates from a synced calendar, the `owner_comm_id` on the `meetings` table points to the owner's **Email** record.
3.  **Booking Links**: If a user has a Calendly or SavvyCal link, it should be stored as an **Other** comm type with a descriptive label.
