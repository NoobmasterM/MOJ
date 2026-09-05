# Relational schema

The schema is in third normal form. User, contest, problem, submission and blog facts each have their own relation; derived display values are not used as foreign keys. JSONB is deliberately retained only for structured problem test cases/examples/tags, which are document-valued content rather than independently queried entities.

| Table | Key and relationships |
|---|---|
| `users` | `id` primary key; `email` and `username` unique; persisted role and profile/statistics attributes. |
| `problemsets` | `id` primary key; `contest_id` nullable FK → `contests.id` and `created_by` nullable FK → `users.id` (both `SET NULL` on deletion). |
| `submissions` | `id` primary key; `userId` FK → `users.id`, `problemsetId` FK → `problemsets.id` (both `CASCADE`). |
| `contests` | `id` primary key. |
| `blogs` | `id` primary key; `author_id` FK → `users.id` (`SET NULL` to preserve posts when an author is removed). |
| `contest_participation` | Composite PK (`user_id`, `contest_id`); bridge between users and contests. |
| `problemset_interaction` | Composite PK (`user_id`, `problemset_id`); bridge between users and problemsets. |
| `auth_sessions` | UUID PK; `user_id` FK → `users.id` (`CASCADE`). |

Checks and defaults are defined in the raw SQL migrations for values such as status, difficulty, positive limits, non-negative counters, and timestamp/counter defaults.
