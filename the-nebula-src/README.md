# The Nebula — source

A private story library for six readers: **Ara, Chey, Chin, Kosca, Mae and Otep**.
Each reader owns one Library of Notion-style "worlds" they can write in. Everyone
can visit every Library, but can only edit their own.

- Live site: https://cheymae.github.io/self-projects/the-nebula/
- Design: Figma → *Passion Project* → page **Desktop Version**
- Stack: React + Vite, [BlockNote](https://www.blocknotejs.org/) editor, Supabase (Auth, Postgres, Storage)

## How it's hosted

GitHub Pages serves this repo's `main` branch. `npm run build` writes the static
site into [`../the-nebula/`](../the-nebula/), which is committed so Pages can serve it.
Routes use `#/…` so deep links work without server rewrites.

## Supabase setup (one time)

Project: `ceelownmdkgttsglwgkx`

1. **Run the schema** — SQL Editor → New query → paste [`supabase/schema.sql`](supabase/schema.sql) → Run.
   This creates the tables, Row Level Security rules, and the `media` image bucket (2 MB limit).
2. **Turn off public sign-ups** — Authentication → Sign In / Providers → disable
   *Allow new users to sign up*. Only the six readers should exist.
3. **Create the six readers** — Authentication → Users → Add user → Create new user,
   tick *Auto Confirm User*, and use these sign-in addresses (they never receive mail):

   | Library | Sign-in email |
   | --- | --- |
   | Ara | `nebula.ara@example.com` |
   | Chey | `nebula.chey@example.com` |
   | Chin | `nebula.chin@example.com` |
   | Kosca | `nebula.kosca@example.com` |
   | Mae | `nebula.mae@example.com` |
   | Otep | `nebula.otep@example.com` |

   Choose each reader's password there and share it with them privately. Readers
   sign in by picking their name and typing that password.

To change a password later: Authentication → Users → the user → Reset / update password.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # writes ../the-nebula/
```

The Supabase URL and publishable key live in `src/lib/supabase.ts`. The publishable
key is meant to be public; never put the secret / service_role key in this app.
