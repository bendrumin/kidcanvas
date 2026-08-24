# 🚨 iOS Security Issues & Route Verification

## Executive Summary

**Status:** ❌ **CRITICAL ISSUES FOUND**

Your web app is secure (9.5/10), but the iOS app has **critical security vulnerabilities** that need immediate attention.

**Critical Issues:** 2
**High Priority:** 2
**Medium Priority:** 2

---

## 🔴 CRITICAL ISSUES

### 1. Hardcoded R2 Credentials in iOS Source Code

**File:** [ios/KidCanvas/KidCanvas/KidCanvas/Config.swift](ios/KidCanvas/KidCanvas/KidCanvas/Config.swift)

```swift
static let r2AccessKeyId = "<redacted - see note below>"
static let r2SecretAccessKey = "<redacted - see note below>"
```

> **Redacted 2026-08-23.** The real key pair used to sit here in plaintext, in
> the very document describing the leak, and this repo is public on GitHub.
> Redacting it here does NOT undo the exposure -- both values remain in this
> repo's git history permanently, so they must be treated as compromised and
> rotated in Cloudflare. Nothing uses R2 any more, so deleting the token there
> breaks nothing.

**Why This Is Critical:**
- These credentials are **compiled into your iOS binary**
- Anyone can extract them by decompiling the app
- Attacker can:
  - Upload malicious files to your R2 bucket
  - Delete ALL user artwork
  - Read private family photos
  - Rack up massive storage bills

**Impact:** Complete compromise of your storage layer

**Fix Required:**
```swift
// ❌ NEVER DO THIS
static let r2SecretAccessKey = "46a22a36ef..."

// ✅ DO THIS INSTEAD
// Remove R2 credentials entirely from iOS
// Use the web API endpoints which handle credentials server-side
```

**Action Steps:**
1. Remove `r2AccessKeyId` and `r2SecretAccessKey` from Config.swift
2. Rotate these credentials in Cloudflare immediately
3. Update web app environment variables with new credentials
4. Never put secret keys in mobile apps again

---

### 2. iOS Calls Non-Existent API Endpoints

**File:** [ios/KidCanvas/KidCanvas/KidCanvas/Views/PostItArtworkCardWithActions.swift](ios/KidCanvas/KidCanvas/KidCanvas/Views/PostItArtworkCardWithActions.swift)

**Problem:** iOS app calls endpoints that **don't exist** in your Next.js backend:

```swift
// Line 47 - This endpoint doesn't exist!
POST /api/artworks/{id}/favorite

// Line 71 - This endpoint doesn't exist!
DELETE /api/artworks/{id}
```

**Current Behavior:**
- Favorite button: Silently fails, no error shown to user
- Delete button: Silently fails, artwork not deleted
- Users think features work but they don't

**Web Implementation:**
- Web app uses direct Supabase calls (not API endpoints)
- See [components/artwork/artwork-detail.tsx:134-145](components/artwork/artwork-detail.tsx)

**Fix Required:** Create these API endpoints in your Next.js app

---

## 🟡 HIGH PRIORITY ISSUES

### 3. No Authentication Validation on Upload Endpoint

**File:** [app/api/upload/route.ts](app/api/upload/route.ts)

**Problem:** The upload endpoint trusts `userId` from form data instead of verified auth token.

```typescript
// Line 62 - userId comes from UNTRUSTED form data
const userId = formData.get('userId') as string

// Line 66 - Used without verification
const identifier = getClientIdentifier(request, userId)
```

**iOS sends Bearer token:**
```swift
// Line 634 of UploadSheetView.swift
request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
```

**But the endpoint never verifies it!**

**Attack Scenario:**
1. Attacker intercepts iOS upload request
2. Changes `userId` in form data to victim's ID
3. Uploads artwork on behalf of victim
4. Or exhausts victim's upload quota

**Fix Required:**
```typescript
// Add authentication verification BEFORE processing form data
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()

if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Then validate userId matches authenticated user
const userId = formData.get('userId') as string
if (user.id !== userId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

### 4. Missing File Validation in iOS App

**File:** [ios/KidCanvas/KidCanvas/KidCanvas/Views/UploadSheetView.swift](ios/KidCanvas/KidCanvas/KidCanvas/Views/UploadSheetView.swift)

**iOS Implementation:**
- ❌ No file type validation (only JPEG compression)
- ❌ No file size check before upload
- ❌ No validation of image content

**Web Implementation:**
- ✅ Magic byte validation (checks actual file content)
- ✅ 10MB size limit enforced
- ✅ Only allows JPEG, PNG, WebP

**Risk:**
- iOS can upload 100MB files, wasting bandwidth
- iOS can upload non-image files
- iOS can upload corrupted images

**Fix Required:**
Add validation in iOS before upload:
```swift
// Check file size
guard let fileSize = try? FileManager.default
    .attributesOfItem(atPath: imageURL.path)[.size] as? Int64,
      fileSize < 10_000_000 else {
    // Show error: File too large
    return
}

// Validate is actually an image
guard UIImage(contentsOfFile: imageURL.path) != nil else {
    // Show error: Invalid image
    return
}
```

---

## 🟠 MEDIUM PRIORITY ISSUES

### 5. Missing iOS Features

Features that work on web but not on iOS:

| Feature | Web | iOS | Impact |
|---------|-----|-----|--------|
| AI Tagging | ✅ Works | ❌ Not implemented | Users can't auto-tag from iOS |
| Favorite Artwork | ✅ Works | ❌ Broken (missing endpoint) | Users can't save favorites |
| Delete Artwork | ✅ Works | ❌ Broken (missing endpoint) | Users can't delete mistakes |
| Voice Notes | ✅ Works | ⚠️ Unclear | May not be wired up |

---

### 6. Inconsistent API Design

**Problem:** Web and iOS use different approaches:

**Web:**
- Direct Supabase calls for favorites/delete
- API endpoints for upload/voice/AI

**iOS:**
- Tries to use API endpoints for everything
- But endpoints don't exist

**Fix:** Choose one approach and be consistent:

**Option A: API-First (Recommended)**
- Create all missing endpoints
- Both platforms use API
- Easier to add rate limiting, validation, logging

**Option B: Supabase-First**
- Remove API endpoint calls from iOS
- Use Supabase directly like web does
- Harder to add server-side validation

---

## ✅ What iOS Does RIGHT

1. **Secure Token Storage**
   - Uses iOS Keychain correctly
   - Requires biometric auth
   - `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` flag

2. **Sends Bearer Tokens**
   - Properly includes authentication headers
   - Just needs backend to validate them

3. **Basic Error Handling**
   - Shows loading states
   - Handles network errors

---

## 📋 Action Plan

### Immediate (Do Now)

1. **Remove R2 credentials from iOS**
   ```swift
   // Delete these lines from Config.swift:
   static let r2AccessKeyId = "..."
   static let r2SecretAccessKey = "..."
   ```

2. **Rotate R2 credentials**
   - Go to Cloudflare dashboard
   - Generate new access keys
   - Update environment variables on Vercel/hosting
   - Delete old keys

3. **Add auth validation to upload endpoint**
   - Verify Bearer token before processing form data
   - Match userId to authenticated user

### This Week

4. **Create missing API endpoints**
   ```typescript
   // app/api/artworks/[id]/favorite/route.ts
   POST /api/artworks/{id}/favorite

   // app/api/artworks/[id]/route.ts
   DELETE /api/artworks/{id}
   ```

5. **Add file validation to iOS**
   - File size check before upload
   - Image format validation

### Next Sprint

6. **Add AI tagging to iOS**
   - Endpoint already exists and is secure
   - Just need iOS UI

7. **Add iOS error handling**
   - Show actual errors when favorite/delete fail
   - Don't silently fail

8. **Standardize API design**
   - Decide: API-first or Supabase-first?
   - Update both platforms consistently

---

## 🧪 Testing Checklist

Before deploying iOS fixes:

- [ ] R2 credentials removed from Config.swift
- [ ] Old R2 credentials rotated in Cloudflare
- [ ] Upload endpoint validates Bearer token
- [ ] Upload endpoint rejects mismatched userId
- [ ] iOS shows error when upload fails
- [ ] Favorite button works in iOS
- [ ] Delete button works in iOS
- [ ] File size > 10MB rejected in iOS
- [ ] Can still upload valid images

---

## 📊 Security Score Comparison

| Platform | Score | Critical Issues |
|----------|-------|-----------------|
| **Web** | 9.5/10 ⭐ | 0 |
| **iOS** | 4/10 ⚠️ | 2 |
| **Overall** | 6.75/10 | 2 |

---

## 🔐 Security Best Practices for Mobile Apps

**Never Do This:**
- ❌ Store API keys in mobile app code
- ❌ Store secret keys in mobile app code
- ❌ Trust data from client without server validation
- ❌ Skip file validation on client side

**Always Do This:**
- ✅ Store credentials server-side only
- ✅ Validate auth tokens on every request
- ✅ Validate file size/type on client AND server
- ✅ Show clear errors when operations fail
- ✅ Use iOS Keychain for user tokens
- ✅ Require biometric auth for sensitive data

---

## 📁 Files to Review/Modify

### Immediate Changes:
- `ios/KidCanvas/KidCanvas/KidCanvas/Config.swift` - Remove R2 credentials
- `app/api/upload/route.ts` - Add auth validation
- Cloudflare Dashboard - Rotate credentials

### New Files to Create:
- `app/api/artworks/[id]/favorite/route.ts` - Favorite endpoint
- `app/api/artworks/[id]/route.ts` - Delete endpoint

### iOS Files to Update:
- `ios/KidCanvas/KidCanvas/KidCanvas/Views/UploadSheetView.swift` - Add validation
- `ios/KidCanvas/KidCanvas/KidCanvas/Views/PostItArtworkCardWithActions.swift` - Add error handling

---

**Date:** January 10, 2026
**Severity:** CRITICAL - Immediate action required
**Estimated Fix Time:** 2-4 hours

Once these issues are fixed, your iOS app will match the web app's 9.5/10 security score.
