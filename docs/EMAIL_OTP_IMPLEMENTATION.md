# GTD-GoWork — Corporate Email OTP registration

Status: implementation planned; NOT enabled in production.

## Agreed flow
1. First-time user authenticates with LINE OAuth.
2. Enter EmpID; verify against employee master.
3. Send one-time code to `<EmpID>@egat.co.th` (confirmed by project owner for all employees).
4. Verify OTP; bind LINE User ID to EmpID.
5. In Account Settings, optionally link Google and Facebook.
6. Subsequent logins use any linked provider, no OTP required.

## Security requirements
- Generate OTP with cryptographically secure randomness; 6 digits.
- Expire after 5 minutes, single-use; store keyed hash, never plaintext.
- Bind challenge to authenticated LINE User ID + EmpID; verify server-side.
- Limit resend to 60 seconds, attempts to 5; rate limit by LINE account, EmpID and IP.
- Generic failure responses to prevent employee enumeration.
- Prevent two provider identities claiming the same EmpID, including concurrent requests.
- Do not trust a client-side `verified` flag; final registration must consume a server-validated challenge.
- Restrict email recipient to a server-constructed organizational address, not user input.
- Record audit events without logging OTP.
- Require fresh verification for high-risk account replacement/unlinking.
- Ensure OTP state is durable across Vercel instances; do not use in-memory Map.
- Check actual corporate mailbox format and whether external transactional mail can reach it.
- Confirm sending provider and verified sender domain; set required Vercel Preview env vars before enabling.
- Existing LINE-registered employees remain valid and must not re-register.
- Retain existing production flow until end-to-end staging tests pass.

## Integration notes
Current code:
- `app/components/account-registration.tsx` collects EmpID + surname suffix.
- `app/api/account/register/route.ts` checks surname suffix and writes mapping.
- `lib/google-sheets.ts` has `findEmployeeForRegistration`, `findLineEmployee`, `findActiveMappingByEmpId`, `createLineEmployeeMapping`.
- Google/Facebook linking is already implemented in staging.

## Rollout checklist
- [x] Confirm EGAT email address format (EmpID@egat.co.th) with project owner.
- [ ] Verify delivery from external sender to EGAT inboxes.
- [ ] Select transactional email service and verify sender domain.
- [ ] Implement durable OTP challenge store and rate limiting.
- [ ] Add request/verify/consume endpoints with secure atomic consumption.
- [ ] Replace surname suffix form on staging.
- [ ] Test valid/invalid/expired/replayed/rate-limited OTP and duplicate/concurrent registration.
- [ ] Test LINE + Google + Facebook identity resolution and user/admin permissions.
- [ ] Production approval and deployment only after successful staging tests.

## Staging implementation status (2026-10-08)
- [x] Email format confirmed and GmailApp delivery to EGAT tested manually.
- [x] Registration UI and Next.js OTP request/verify gateway committed to staging.
- [x] Apps Script source in `scripts/GTD-GoWork-OTP.gs` committed; NOT deployed.
- [ ] Deploy Apps Script as Web App under `gtdgowork@gmail.com`; configure Script Property `OTP_SCRIPT_SECRET`.
- [ ] Configure matching `OTP_SCRIPT_SECRET` and `OTP_SCRIPT_URL` on Vercel staging/Preview only. Never put secret in browser code or chat.
- [ ] Review challenge entropy, bounded nonce storage, persistent abuse throttling and concurrent EmpID binding before public tests.
- [ ] Verify staging build, complete end-to-end tests with an unregistered test EmpID.
- [ ] Production remains unchanged.
