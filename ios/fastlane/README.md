fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios check

```sh
[bundle exec] fastlane ios check
```

Scan the metadata for common App Store rejection reasons.

### ios screenshot_audit

```sh
[bundle exec] fastlane ios screenshot_audit
```

List the screenshots actually live on App Store Connect, per locale and

device size. deliver's upload retry can leave duplicates behind, so this

is the check after any screenshot push.

### ios testflight_link

```sh
[bundle exec] fastlane ios testflight_link
```

Report the TestFlight beta groups and any public (open) join link.

### ios beta_review_status

```sh
[bundle exec] fastlane ios beta_review_status
```

Show what Beta App Review still needs before an external build can ship:

reviewer contact details, the app-level description, and What to Test.

### ios beta_test_info

```sh
[bundle exec] fastlane ios beta_test_info
```

Fill in the tester-facing TestFlight text: the app-level beta description

and the newest build's What to Test.

e.g. fastlane ios beta_test_info feedback_email:you@example.com

### ios beta_submit

```sh
[bundle exec] fastlane ios beta_submit
```

Set the Beta App Review contact details and submit the newest build for

review. Apple requires all four: first_name, last_name, phone, email.

e.g. fastlane ios beta_submit first_name:Ben last_name:Siegel phone:+15551234567 email:you@example.com

### ios testflight_public_link

```sh
[bundle exec] fastlane ios testflight_public_link
```

Create (or reuse) an external TestFlight group with an open public join

link, attach the newest build, and print the URL for the website.

### ios screenshot_dedupe

```sh
[bundle exec] fastlane ios screenshot_dedupe
```

Delete duplicate screenshots left behind by a deliver upload retry,

keeping one complete copy of each filename and restoring filename order.

### ios release

```sh
[bundle exec] fastlane ios release
```

Attach the newest processed build to the editable App Store version and

submit it for App Review. DRY-RUNS by default and prints what it would

do; only confirm:true actually submits.

e.g. fastlane ios release            # inspect

     fastlane ios release confirm:true

### ios testers

```sh
[bundle exec] fastlane ios testers
```

Count the testers in each TestFlight group -- the number the public

link exists to move.

### ios release_audit

```sh
[bundle exec] fastlane ios release_audit
```

Everything App Review will ask for that TestFlight never did: version

state, build, categories, age rating, pricing, and privacy labels.

### ios release_prep

```sh
[bundle exec] fastlane ios release_prep
```

One-time App Store setup TestFlight never required: age rating (4+),

free pricing, worldwide availability, and the content rights declaration.

### ios privacy_labels

```sh
[bundle exec] fastlane ios privacy_labels
```

Publish the App Privacy nutrition labels from app_privacy_details.json.

Honest and short: account email, name, photos, stories, and the user id,

all for app functionality, linked to the account, nothing for tracking.

### ios promo_text

```sh
[bundle exec] fastlane ios promo_text
```

Update the live listing's promotional text. This is the one store field

Apple lets you change without shipping a new version or a review.

### ios first_use

```sh
[bundle exec] fastlane ios first_use
```

Apple's own timestamps for this app: when the record was created and

when each early build was uploaded. Evidence of first use of the name.

### ios enable_capabilities

```sh
[bundle exec] fastlane ios enable_capabilities
```

Turn on the Developer Portal capabilities the widget and push need.

Additive and idempotent; prints what it changed.

### ios signing_probe

```sh
[bundle exec] fastlane ios signing_probe
```

What can this API key see and do for signing?

### ios internal_build

```sh
[bundle exec] fastlane ios internal_build
```

Attach the newest processed build to the internal tester groups.

Internal testers need no beta review, so this is the fast path to a device.

### ios subscriptions

```sh
[bundle exec] fastlane ios subscriptions
```

Mirror KidCanvas.storekit into App Store Connect: the subscription group,

four products, en-US copy, prices in every territory, availability, and

the Server Notifications V2 URL. Idempotent; safe to re-run.

### ios metadata

```sh
[bundle exec] fastlane ios metadata
```

Upload metadata and screenshots to App Store Connect. No binary.

Options: force:true skips the HTML preview; skip_screenshots:true for text only;

app_version:1.0.1 creates that version on App Store Connect if it does not exist.

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
