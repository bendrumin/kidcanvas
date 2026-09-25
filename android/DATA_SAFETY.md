# Play Console: Data safety answers for KidCanvas (Android)

What the Android app collects, worked out from the code in this directory and
the shared Supabase schema, so the form can be filled in without guessing.
Mirrors `ios/fastlane/app_privacy_details.json`, plus one thing iOS does not
have: the ML Kit document scanner's own diagnostics.

Last checked against the code on 2026-09-24. Re-check whenever a dependency or
a table is added.

## Top-level answers

| Question | Answer | Why |
|---|---|---|
| Does your app collect or share any of the required user data types? | Yes | Accounts, artwork, stories, comments |
| Is all of the user data collected by your app encrypted in transit? | Yes | Supabase is HTTPS only; Android blocks cleartext at targetSdk 28+; ML Kit reports over HTTPS |
| Do you provide a way for users to request that their data is deleted? | Yes | In-app: Profile, Delete account (calls `delete_my_account`, removes storage files for families the user owns). On the web: kidcanvas.app, Settings |
| Is data shared with third parties? | No | Supabase hosts the data as our service provider, which Play does not count as sharing. Google says ML Kit does not transfer its diagnostics to third parties |

## Data types collected

| Play category | Data type | Collected | Shared | Optional? | Purposes | Where it comes from |
|---|---|---|---|---|---|---|
| Personal info | Name | Yes | No | Required | App functionality, Account management | `full_name` in auth metadata at sign-up; member nicknames |
| Personal info | Email address | Yes | No | Required | App functionality, Account management | Sign-in and sign-up |
| Personal info | User IDs | Yes | No | Required | App functionality, Account management | Supabase auth user id, stored on artwork, comments, reactions, memberships |
| Personal info | Other info | Yes | No | Optional | App functionality | Children's first names and optional birth dates (`children` table), family name |
| Photos and videos | Photos | Yes | No | Optional | App functionality | Artwork images uploaded to the `artworks` storage bucket |
| App activity | Other user-generated content | Yes | No | Optional | App functionality | Artwork titles, stories, comments, reactions |
| App info and performance | Diagnostics | Yes | No | Required | Analytics | Collected by the ML Kit SDK (device model, OS, app version, latency, error codes). See Google's ML Kit data disclosure page |
| Device or other IDs | Device or other IDs | Yes | No | Required | Analytics | ML Kit's per-installation identifier for diagnostics |

"Optional" means the app works without the person providing it: a
grandparent can join and only react. Name, email and user id are required
because there is no use of the app without an account.

The ML Kit rows are there because the scanner SDK reports its own usage to
Google (source: developers.google.com/ml-kit/android-data-disclosure,
"Data collected in all features"). They are not our analytics and we never
see them, but Play counts data collected by SDKs in the app. The image being
scanned is processed on the device and is not part of what ML Kit sends.

## Not collected

Location, contacts, calendar, messages, audio, health and fitness, financial
info, web browsing history, installed apps, and files other than the image the
person picks. The app requests only the INTERNET permission; the scanner and
the photo picker need no camera or storage permission.

## Related Play Console answers

- **Target audience and content:** 18 and over. The app is for parents and
  relatives; children do not use it or have accounts. Choosing an age group
  under 13 would put the app under the Families policy, which does not fit.
- **Content rating questionnaire:** users can interact with each other
  (comments) and share user-provided content (artwork) within invite-only
  family groups. No public sharing.
- **User-generated content policy:** owners and parents can delete any comment
  in their family and remove members; authors can delete their own comments;
  anyone can leave a family. There is no public content and no discovery of
  strangers. Reports go to support@kidcanvas.app.
- **Ads:** No ads.
- **Account deletion URL:** Play asks for a web page that explains how to
  delete an account without the app. See the checklist in README.md.
- **Backups:** app backups and device transfer are disabled so a saved
  session cannot be restored onto another phone.
