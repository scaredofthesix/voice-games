# Sprint 1 Review - Customer Review Summary

- **Date:** 19 June 2026
- **Participants:** Team 40, Customer
- **Artifacts shown:** live MVP v1 build (home, game selection, voice play, results, Bubble
  Popper at the new slower speed), Product Backlog (GitHub issues + labels), Sprint 1
  milestone, roadmap.

## Permissions (asked at the start)

- Publish a cleaned English transcript in the public repo: **granted**.
- Record the meeting: **granted** (recording kept private, shared with instructors via Moodle).

## Scope reviewed and increment

- Planned MVP v1 = five Must-Have stories: US-01 start, US-02 choose game, US-04 voice
  control, US-07 results, US-08 reliable recognition. **All five demonstrated and accepted.**
- The three issues raised at the Week 2 review were all fixed and shown: Bubble Popper speed,
  recognition stability, and removal of the placeholder game slot.

## Customer feedback and decisions

- **Accepted** the MVP v1 increment; no rework requested on the shipped scope.
- **US-11** "create/define a custom word list" -> reword to **"upload"**.
- Add a story for **playing with built-in words without uploading** (now US-18).
- **US-10** progress: confirm a single source of truth - per-word stats pooled across all
  lists and all games. Add a **CSV export** sub-story for teachers (now US-19).
- **US-09** pronunciation: be specific that it is the **English** word (for imitation);
  Russian audio (for understanding, not imitation) is separate (US-15). Keep them as two stories.
- **US-06** immediate feedback: reword to "immediately practise mispronounced words";
  confirmed **Should Have** (aggregated parent view lives in US-10).
- **US-12** difficulty: stays **Could Have**; in practice driven by the uploaded word list.
- **US-03** and **US-05** (Must Have, previously unlabelled) -> add to **MVP v2**.
- **MVP v2** should add about **four more games** (we ship two), prototyped early and polished
  weekly; exact count depends on the v2 deadline.
- New **phrase-based translation game** wanted (Russian-to-English, Doodle Jump style) -> now
  US-20, MVP v3 candidate.

## Action points

- [x] Apply all backlog wording/label/scope changes to the issues and `docs/user-stories.md`.
- [x] Create US-18, US-19, US-20 and the "four more games" tracking issue (#54).
- [x] Publish this summary and the sanitized transcript; share the recording via Moodle.
- [ ] Collect four game ideas in a shared Doc for the customer to comment on (boss-fight seeded).
- [ ] Agree a regular meeting slot (customer suggested Fridays / a weekly Innopolis slot).

## Risks

- Recognition accuracy with real children's voices is still unproven (target 80-90%).
- The MVP v2 game count depends on a deadline that is not set yet.
