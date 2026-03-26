# Firebase Auth roles for BuildSabaidee

Trusted review permissions use Firebase custom claims.

## Source of truth

- `request.auth.token.role`
- fallback bridge only for existing admin user:
  - `request.auth.token.admin == true`
  - `request.auth.token.platformOwner == true`
  - `request.auth.token.email == admin@buildsabaidee.app`

## Roles used now

- Reviewer roles:
  - `admin`
  - `manager`
  - `project_manager`
  - `site_manager`
  - `supervisor`
  - `contractor`
- Read-only roles for review:
  - `owner`
  - `supplier`
  - `worker`
  - `general_worker`
  - `skilled_worker`
  - `foreman`

## Assign a role claim

1. Set Google application credentials for a Firebase Admin service account.
2. Run:

```powershell
node scripts/setFirebaseRoleClaim.mjs owner@buildsabaidee.app owner
node scripts/setFirebaseRoleClaim.mjs admin@buildsabaidee.app admin
node scripts/setFirebaseRoleClaim.mjs manager@example.com project_manager
```

3. Ask the user to sign out and sign back in so the token refreshes.

## Frontend behavior

- Firebase-authenticated users resolve their dashboard access from the same trusted claim.
- Demo logins still exist as a temporary bridge for non-Firebase roles that have not been migrated yet.
