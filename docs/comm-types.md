I have drafted a specification for the communication types and their data structures. This table includes the JSON shape for storage, the "canonical" value used for uniqueness, and the normalization rules for each.

You can paste this into `docs/comm-types.md` to get us started:

```markdown
# Communication Type Specifications

This document defines the standardized JSON structures and uniqueness rules for the `comms` table.

| Type         | JSON `value` Structure                                     | Canonical Value (Uniqueness) | Normalization Rules                                                       |
| :----------- | :--------------------------------------------------------- | :--------------------------- | :------------------------------------------------------------------------ |
| **Email**    | `{ "address": "string" }`                                  | `address`                    | Lowercase, trim whitespace.                                               |
| **Phone**    | `{ "number": "string", "sms": boolean, "voice": boolean }` | `number`                     | E.164 format (e.g., +15551234567). Strip formatting characters `( ) - .`. |
| **LinkedIn** | `{ "id": "string", "url": "string" }`                      | `id`                         | Extract persistent ID or vanity username from URL. Trim whitespace.       |
| **Slack**    | `{ "handle": "string", "workspace": "string" }`            | `workspace` + `handle`       | Lowercase handle and workspace.                                           |
| **WhatsApp** | `{ "number": "string" }`                                   | `number`                     | E.164 format. Strip formatting.                                           |
| **Calendar** | `{ "url": "string" }`                                      | `url`                        | Trim whitespace, normalize protocol (https).                              |
| **Other**    | `{ "label": "string", "value": "string" }`                 | `value`                      | Trim whitespace.                                                          |

## Implementation Notes

### 1. The `canonical_value` Column

To enforce uniqueness efficiently in the database, we will use a separate `canonical_value` (Text) column in the `comms` table.

- **Uniqueness Constraint**: `UNIQUE(tenant_id, type, canonical_value)`
- **Benefit**: Allows us to keep rich metadata in the `value` (JSONB) column (like `sms: true` for phones) while ensuring the core identifier remains unique.

### 2. Phone Numbers

- **E.164**: We will store numbers with the country code (e.g., `+1...`).
- **Validation**: Ensure the number is valid before saving. The `sms` and `voice` flags default to `true` unless specified.

### 3. LinkedIn

- **The "ID"**: Since LinkedIn URLs can change or contain tracking parameters, we prioritize the username/ID part of the path as the canonical key to prevent duplicate records for the same profile with different URL parameters.
```

### Questions for refinement:

1.  **Email Key**: You suggested `{ value: "" }` for emails. Should we use `{ address: "" }` to be more descriptive, or do you prefer the generic `{ value: "" }`?
2.  **LinkedIn ID extraction**: Do you want the system to automatically try to parse the ID from a provided URL, or should the user provide the ID and URL separately in the form?
3.  **Phone Country Code**: Are we assuming a default (like US/Canada +1) if one isn't provided, or should the UI/Validation force a country code?

Once you're happy with this table, let me know and we can move to Agent mode to update the schema and validation logic.
