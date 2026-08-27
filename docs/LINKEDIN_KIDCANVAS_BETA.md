# LinkedIn post, KidCanvas open beta + tech stack

Status when posting: **open beta is APPROVED and live**, the TestFlight link
admits testers right now. Web app live at kidcanvas.app. Post any time.

**LinkedIn has no formatted text.** The body below is plain text on purpose , 
no bold, no markdown, one unwrapped line per paragraph, because LinkedIn keeps
every newline and publishes asterisks literally.

Tag the companies (type @ and pick them) on the first mention of Supabase and
Claude Code, tags are what put the post in front of their DevRel teams.


## Draft (paste-ready, everything inside the fence)

```
My kid said her drawing was "a rainbow dinosaur that eats sunshine." A week later the drawing was still on the fridge, and the sentence was gone forever.

That's the actual problem. Every app in this space saves the artwork. Nobody saves what the kid SAID about it, and that's the part you can't get back.

So I built KidCanvas: scan the drawing (the scanner finds the page and squares it up), write down the story in their words while you still remember it, and share both to a private family feed where grandparents can react and comment. No accounts for kids, ever. As of today the iOS open beta is live: https://testflight.apple.com/join/7nT5CzWQ

The stack, for the builders:

→ SwiftUI for the iOS app. Native document scanning, dark mode, local notification nudges before birthdays and quiet weeks.

→ Supabase is the entire backend: Postgres, Auth, Storage. Row-level security isn't a feature I use, it IS the authorization layer, the iOS app talks straight to Postgres and RLS decides what every query can see. No API server between the app and the database.

→ Next.js on Vercel for the web app and the family share pages.

→ Playwright for the web, Maestro driving a real simulator for iOS, and fastlane lanes for everything App Store Connect, from screenshots to beta review, the whole release is scripted.

→ Claude Code as the engineering partner. Not autocomplete. The unglamorous work that actually ships products: auditing what my RLS policies really allowed versus what my docs claimed, finding that my contact form had never once worked because my own CSP blocked it, catching a payment bypass before it ever billed anyone.

The lesson that cost me the most: your documentation lies. Mine said the storage bucket was locked down. The database said any signed-in user could write into any family's folder. The fix took ten minutes. FINDING it required asking the database instead of trusting the changelog. Query pg_policies, not your memory.

KidCanvas is free for your first 50 artworks. iPhone beta: https://testflight.apple.com/join/7nT5CzWQ, or start on the web at kidcanvas.app

If you try it with your kids' art, I genuinely want to hear what confused you. That feedback is worth more than any feature I could build this week.

#buildinpublic #iOS #SwiftUI #Supabase #ClaudeCode #indiedev #parenting
```


## Notes before posting

- The "rainbow dinosaur" opener is the same hook as the site's hero, good,
  that's brand consistency, not repetition.
- Deliberately not claimed: "nothing like this exists." Keepy does voice
  stories; our defensible edge is written-searchable stories + the family feed.
  Don't let a commenter win that point.
- The security paragraph is a feature, not a confession: pre-launch audit,
  zero real users at the time, fixed and verified. Builders respect it; it's
  also the paragraph Supabase's DevRel is most likely to reshare.
- On "sponsored": real sponsorship from a post is a lottery ticket. What's
  actually likely: Supabase's community team reshares good RLS war stories,
  and that reach is the realistic win. Tag them, don't pitch them.
- Reply to every comment in the first 2 hours, LinkedIn's algorithm weights
  early conversation heavily.
- The back-to-school three-app draft (LINKEDIN_BACK_TO_SCHOOL.md) still works
  as a follow-up in a week or two. Don't post both the same week.
