# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview
This project is called **McGill Marketplace**.
It is a **McGill-only marketplace** where verified McGill users can:
- buy and sell items
- offer tutoring
- offer local student services
- message each other safely inside the platform
The platform should feel:
- trusted
- student-first
- clean
- fast
- local
- simple to use
Core differentiator:
**Only verified McGill users can participate.**
McGill email verification is a core product rule, not an optional feature.
---
## Product goals
The product should solve these use cases first:
1. Students buying and selling textbooks
2. Students buying and selling furniture
3. Students finding tutors
4. Students hiring local student services
Do not broaden scope unnecessarily.
Do not prioritize edge-case features over core marketplace functionality.
---
## Core product rules
- Users must verify with a valid McGill email before posting, messaging, or offering services
- No guest posting
- Trust and safety are more important than feature count
- Keep the MVP lean and launchable
- Build for real student usage, not demo-only polish
- Prefer boring, reliable solutions over flashy complexity
---
## MVP features
Build and refine these first:
- McGill email sign-up and verification
- user profiles with verified badge
- create/edit/delete listings
- categories for goods and services
- search and filters
- in-app messaging
- reviews / ratings
- report / moderation tools
- admin moderation panel
Nice-to-have features should not distract from the above.
---
## Tech preferences
Preferred stack:
- Next.js
- TypeScript
- Supabase
- Tailwind CSS
Use:
- Supabase Auth for authentication
- Supabase Postgres for data
- Supabase Storage for images
- Supabase Realtime only where it actually improves UX
Avoid adding unnecessary dependencies.
Avoid overengineering.
Prefer server-side validation for anything trust-related.
---
## UX principles
- Mobile-first layout
- Clean, modern UI
- Fast listing creation
- Fast browsing
- Minimal friction
- Obvious trust indicators
- Clear category structure
- Strong empty states
- Strong form validation
- No cluttered dashboards unless they solve a real workflow need
The design should feel more trusted and more relevant than Facebook Marketplace for McGill students.
---
## Data and trust model
Treat trust as a first-class system.
Important trust indicators:
- verified McGill email
- profile completion
- account age
- reviews
- listing history
- response rate
- report history
Do not make trust-dependent actions available to unverified users.
---
## Coding standards
- Use TypeScript strictly
- Keep components modular and readable
- Avoid giant files
- Prefer explicit naming over clever naming
- Write reusable UI components only when reuse is real
- Keep business logic out of presentation components when possible
- Validate all user input on the server
- Handle loading, empty, and error states properly
- Never hardcode secrets
- Never expose private keys in client code
---
## Workflow instructions
When working on a task, always follow this order unless told otherwise:
1. Understand the request and the relevant part of the codebase
2. Inspect existing files before editing
3. Make a short plan
4. Implement the smallest solid version
5. Check for type errors, lint issues, and broken imports
6. Review for edge cases
7. Summarize what changed and any remaining issues
Do not make large speculative changes without clear justification.
---
## Verification / double-checking rules
Before considering a task complete, always do the following when applicable:
- run type checks
- run linting
- run tests if tests exist
- verify imports are correct
- verify routes compile
- verify forms validate bad input
- verify auth and permission logic
- verify no obvious mobile UI breakage
- verify no placeholder text remains
- verify no fake data is accidentally shipped
If a command cannot be run, say so clearly and explain why.
Do not claim something works unless it was actually checked.
---
## What to avoid
Do not:
- invent requirements that were not requested
- silently change product scope
- add complicated architecture too early
- add payment systems in MVP unless explicitly requested
- use mock logic in production paths
- leave TODOs in critical flows unless clearly flagged
- claim "production-ready" without checking major flows
---
## Marketplace-specific guidance
For listing flows:
- optimize for speed and clarity
- image upload should be simple
- category selection should be intuitive
- price entry should be frictionless
- pickup/location information should be easy to add
For service flows:
- let users describe service, rate, availability, and area served
- make trust indicators visible
- keep service posting just as easy as item posting
For moderation:
- make reporting easy
- make suspicious listings easy to review
- design admin tooling for speed, not beauty
---
## Communication style
When presenting work:
- be concise
- be honest
- do not exaggerate confidence
- clearly separate what was verified from what was assumed
- mention tradeoffs when relevant
- flag any security or trust concerns immediately
---
## Definition of done
A task is only done when:
- the requested change is implemented
- the code is consistent with the existing codebase
- the implementation has been checked for obvious breakage
- any relevant commands were run and results reported honestly
- the result supports the McGill Marketplace product direction
