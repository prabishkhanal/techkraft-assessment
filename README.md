# Merchant Portal

Merchant onboarding portal built for the Senior Angular Developer assessment. Sales creates merchant applications, Admin assigns them, and Reviewers record risk decisions. All demo identities, merchants, and financial identifiers are fictional.

## Technology

Angular 22, TypeScript, standalone components, Signals, RxJS, Reactive Forms, Angular Router, Angular Material, and SCSS. Unit tests use Vitest with Angular TestBed. A local Node.js HTTP server provides the mock API and JSON persistence.

## Run locally

Use Node **22.22.3** (`.nvmrc`) and npm **10.9.8**. With a Node version manager, select that version first, then run:

```powershell
npm ci
npm run dev
```

Open http://localhost:4200. The command starts Angular on port 4200 and the local API on port 3000. Stop both with Ctrl+C. Alternatively, run `npm run api` and `npm start` in separate terminals. No global Angular CLI is needed.

The Angular development proxy forwards `/api` to `127.0.0.1:3000`.

Sessions are held in memory; reloading requires login again. Saved applications and risk history persist in the ignored `mock-api/data.local.json`. To reset the dataset, stop the API, delete that file, and restart. Enter fictional data only.

## Demo workflow

1. Choose `sales-user`. Use the dashboard's server-side search, status filter, and pagination, or select **New application**.
2. `/applications/create` starts an unsaved form. The first meaningful edit auto-saves after 800 ms; **Save draft** saves entered values immediately. The API returns an ID and the URL becomes `/applications/:id/edit`, preserving inputs and the current step. Later saves update the same draft.
3. Complete Business, Contact, Financial, and Review, then submit. Monthly volume offers USD 1,000, 5,000, 10,000, 25,000, 50,000, 100,000, and 1,000,000 presets, plus a Custom amount option. Custom values support decimals from USD 1 to 1,000,000,000. Save failures preserve input and offer retry. Leaving with unsaved changes prompts for confirmation.
4. Sign out and choose `admin-user`. Open Assignments and assign the submitted application to `reviewer-user`.
5. Choose `reviewer-user`. Open the assigned application, optionally reveal sensitive values for 15 seconds, and approve/reject with a reason of 10–1,000 characters.
6. Return as Sales to see the final status and risk history. Submitted applications are locked for editing.

`other-sales` and `other-reviewer` are additional identities for checking ownership and assignment isolation. The picker has no passwords and is deliberately demo-only authentication. The API issues opaque random tokens, rather than JWTs.

## Permissions

| Action                         | SALES          | REVIEWER               | ADMIN                |
| ------------------------------ | -------------- | ---------------------- | -------------------- |
| View applications/history      | Own            | Assigned               | All                  |
| Create                         | Yes            | No                     | No                   |
| Edit/submit                    | Own Draft only | No                     | No                   |
| Approve/reject                 | No             | Assigned, pending only | No                   |
| Reveal stored sensitive fields | No             | Assigned               | All                  |
| Assign/reassign/unassign       | No             | No                     | Pending applications |

These are explicit implementation policies where the brief leaves details open. Guards and visible controls support navigation; the API independently checks roles, ownership, assignments, and lifecycle rules.

## Architecture

Angular 22 standalone components use built-in control flow, Signals, `inject()`, Reactive Forms, RxJS, and Angular Material with SCSS. Features load lazily through the router.

| Location                                | Responsibility                                                      |
| --------------------------------------- | ------------------------------------------------------------------- |
| `src/app/core/auth`, `src/app/core/guards` | In-memory session, permissions, route checks, shared refresh |
| `src/app/core/api`, `src/app/core/interceptors` | Typed API contracts, errors, bearer attachment and bounded retry |
| `src/app/features/dashboard`            | Server queries, filters, pagination, loading/error/retry            |
| `src/app/features/application-wizard`   | Typed form, validation, steps, ordered draft saves                  |
| `src/app/features/application-detail`   | Sectioned details, history, protected reveals, decisions            |
| `src/app/features/admin`                | Reviewer assignments                                                |
| `src/app/layout`, `src/app/shared` | Navigation and reusable presentation helpers |
| `mock-api`                              | Local HTTP API, fictional fixtures, authorization, JSON persistence |

Signals hold current UI state; Reactive Forms own input values and validation. Components delegate HTTP contracts to core API services. Templates use Angular's built-in control flow and dependencies use `inject()`.

| Concern | Implementation choice |
| --- | --- |
| Dashboard reads | `switchMap` replaces obsolete queries; the API filters permitted records before pagination |
| Draft writes | An 800 ms debounce reduces traffic; `concatMap` serializes creation and updates |
| Save recovery | Errors are caught inside the queue; form values remain intact and later saves can proceed |
| Unsaved state | Revision tracking distinguishes the saved snapshot from newer edits |
| Submission | Save the latest snapshot before requesting the status transition |
| Create-to-edit navigation | A shared route matcher retains the live wizard when the first saved ID changes the URL |
| Token refresh | `shareReplay` shares one in-flight refresh across concurrent 401 responses |

## Mock API

All paths below have the `/api` prefix. Protected endpoints require a server-issued bearer token.

| Method      | Path                                              | Purpose                                         |
| ----------- | ------------------------------------------------- | ----------------------------------------------- |
| POST        | `/auth/login`                                     | Select a fixed demo identity                    |
| POST        | `/auth/refresh`                                   | Rotate refresh token and return new tokens      |
| GET         | `/applications?search=&status=&page=1&pageSize=5` | Authorized, server-filtered page                |
| POST        | `/applications`                                   | Create an owned draft                           |
| GET / PATCH | `/applications/:id`                               | Read permitted application / update owned draft |
| POST        | `/applications/:id/submit`                        | Validate and lock draft                         |
| GET         | `/applications/:id/history`                       | Risk history                                    |
| GET         | `/applications/:id/sensitive`                     | Authorized reveal                               |
| POST        | `/applications/:id/decision`                      | Assigned reviewer decision                      |
| GET         | `/reviewers`                                      | Admin reviewer list                             |
| POST        | `/applications/:id/assignment`                    | Admin assignment; `null` unassigns              |

Access tokens expire after 45 seconds, refresh tokens after one hour. Login and refresh return `accessTokenExpiresAt` (Unix milliseconds). Before sending a protected request, the interceptor refreshes if the token expires within five seconds. Concurrent calls wait for the same refresh, avoiding requests with a known-expired token. Unexpected 401 responses still share one refresh and retry once; a failed retry never starts a loop. A late 401 for an old token uses the refreshed token. Refresh failure clears the matching session, fails waiting requests, and requests navigation to login. Unsaved-change confirmation can delay navigation.

## Security and CSP

Normal API responses mask tax and bank identifiers. The protected reveal endpoint provides raw fictional values only to permitted reviewers/admins. Sales can enter replacement values without retrieving stored values. Tokens and reveals never go into browser storage. Memory-only storage reduces persistence exposure, but an active XSS attack could still issue requests or access runtime data.

Production builds enable Angular's `security.autoCsp`; the generated index includes a script Content Security Policy. CSP restricts executable scripts and helps reduce XSS risk. It complements Angular template escaping and API authorization. Hosting-specific CSP headers and runtime-style nonce configuration remain deployment concerns. Fonts load from Google Fonts.

## Verify

```powershell
npm run build
npm test -- --watch=false
npm run test:api
```

Angular's native test builder runs Vitest with Angular TestBed. API integration tests use Node's test runner and an isolated in-memory dataset.

Latest automated verification passed: **production build, 105 Angular tests across 31 spec files, and 8 API integration tests**. Coverage includes restoring saved drafts and empty-draft feedback, numeric monthly-volume input, preset/custom amounts, field validation, draft debounce and ordering, creation failure/retry, route reuse, permissions, masking/reveal, concurrent refresh, and the draft-to-review lifecycle.

Browser layout, keyboard, screen-reader, and full manual workflow checks remain outstanding. To inspect refresh manually, wait over 45 seconds after login and open a detail page: one refresh should complete before its application and history calls are sent. A 401 can still occur for unexpected server rejection; one refresh/retry handles it. Restarting the mock API clears its token maps and requires login again. Automated tests cover expiry, concurrency, PATCH retries, and refresh failure deterministically.

## Scope and limitations

- Authentication is a fixed demo identity picker with memory-only sessions. Reloading requires login again.
- The mock API binds to loopback and persists fictional records in local JSON. It is intended for local assessment use.
- Draft ordering applies within one wizard; multi-tab conflict resolution and offline persistence are not implemented.
- Dashboard counts and Socket.IO updates are optional enhancements and are omitted.

## AI assistance

I defined focused skills and scoped instructions to guide AI assistance across architecture and design review, Angular component boundaries, reactive state and RxJS flows, forms, authorization, and testing. These provided a structured way to discuss design choices and trade-offs against the assignment requirements.

OpenAI Codex supported that process with design feedback, implementation suggestions and generated code, regression tests, debugging, and documentation updates. Verification used the production build, Angular TestBed/Vitest tests, and mock API integration tests described above.

I remain responsible for the submitted code, its design decisions, and explaining or modifying the implementation during review.
