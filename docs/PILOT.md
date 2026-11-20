# Pilot access

Pilot access lets Cris walk one person through the whole road before paid membership opens. With it on, that
account can tick steps 2 to 7, "Get your page online" and "Open your small shop" on their own Golden Road. Without
it, those steps show a "Members" lock.

It does not open Breezy's step-by-step help for steps 2 to 7. That help is not built yet; the pilot does those
steps with Cris on calls.

## Turning it on for one account

The switch is `bb_pilot: true` in the account's `app_metadata` in Supabase (project `bigbreezoe-members`). An
account cannot set `app_metadata` for itself, so only Cris can turn it on.

In the Supabase dashboard, open SQL Editor and run this with the person's sign-in email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"bb_pilot": true}'::jsonb
where email = 'person@example.com';
```

The person sees it the next time they load a page while signed in.

## Turning it off

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data - 'bb_pilot'
where email = 'person@example.com';
```

Their ticked steps stay saved on their account.

## What it is not

It is a display switch in the browser, not a paywall. Nothing private sits behind it. When paid membership opens,
access will need a real check on the server.

Related: [Docs index](INDEX.md), [Site rules](RULES.md)
