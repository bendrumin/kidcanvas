# LinkedIn post — back to school, three apps

Status when posting: **ChoreStar 1.5 is live on the App Store**; **SnapSweep**
and **KidCanvas** are in TestFlight. Don't imply the latter two are shipped.

---

## Draft

Back-to-school week turned my phone into a disaster zone, so I did what any
reasonable person does: I built three apps instead of cleaning up once.

They turn out to be the same problem in three costumes — the household runs on
paper and pictures, and none of it is organized.

**ChoreStar** — the morning routine. Kids have their own login (no email, just
a family code and a PIN), so they run their own checklists, earn allowance, and
stop asking me what's next. Version 1.5 is live on the App Store now.

**KidCanvas** — the backpack. Every day it produces another masterpiece, the
fridge fills up, and you feel guilty recycling any of it. It scans artwork into
a private family gallery — and it asks for the *story*, because "it's a rainbow
that ate a dinosaur" is the part you forget by next week. In TestFlight.

**SnapSweep** — the camera roll. My kids took roughly 200 photos of the carpet,
a thumb, and the dog's left ear. It finds every blurry and accidental shot on
device and clears them in one pass. Also in TestFlight.

The pattern I didn't expect: the same family shows up in all three. Chores in
the morning, artwork in the afternoon, and a camera roll that needs saving from
both of them. Eventually the kid profiles should just be shared between them —
add a child once, not three times.

What I learned building all of this in a few weeks, working with AI as the
implementation partner:

→ **Shipping is the hard part, not coding.** The App Store submission, the
account-deletion requirement, the privacy labels, the screenshots — that's
where weekends go.

→ **Test on the real thing.** An automated pass on the simulator caught a hang
in my photo scanner that no amount of code review would have: an Apple
framework that simply never returns on a simulator, freezing the whole scan.

→ **Delete more than you add.** I removed an AI feature that was cooking my
CPU for marginal value, and cut a cloud storage provider entirely. Both apps
got faster, cheaper, and simpler to reason about.

→ **Your old notes lie.** I had 45 planning documents claiming features were
"done" that were never built. Verify against the code, not the changelog.

If you're a parent who wants to try KidCanvas or SnapSweep in TestFlight,
comment "beta" and I'll send you a link.

ChoreStar is on the App Store today: chorestar.app

#buildinpublic #iOS #SwiftUI #indiedev #parenting #backtoschool

---

## Notes before posting

- Swap the TestFlight CTA for a real link if you have public TestFlight URLs;
  otherwise "comment beta" is the right ask.
- The "eventually shared kid profiles" line is honest as an intention. Don't
  upgrade it to a promise until the ChoreStar → KidCanvas import exists.
- If you'd rather have one clean hook: lead with the SnapSweep line ("my kids
  took 200 photos of the carpet"). It's the most relatable of the three.
- Length is deliberately long-form; LinkedIn rewards it. For a shorter cut,
  keep the three app paragraphs and the four lessons, drop the pattern
  paragraph.
