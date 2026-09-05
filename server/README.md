# MOJ API backend

The backend uses the `pg` driver and raw, parameterized PostgreSQL queries only; it does not use an ORM.

Set `DATABASE_URL` and `JWT_SECRET` in `server/.env`. The exact username `NoobmasterM` is the designated administrator. Apply the SQL files in `prisma/migrations` in chronological order with your PostgreSQL migration tool, including `20260831000000_add_auth_sessions`.

Authentication uses bcrypt (cost 12) password hashes and HTTP-only signed session cookies. Every request checks the corresponding session record and the user's current database role. `POST /api/auth/logout` revokes that record, so a stolen/old cookie cannot be reused after logout.
