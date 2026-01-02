# Fix Missing Supabase Package Products

If you're seeing errors about missing package products (PostgREST, Functions, Supabase, Auth, Storage, Realtime), follow these steps:

## Quick Fix (Recommended)

1. **Open the project in Xcode**
   ```bash
   open ios/KidCanvas/KidCanvas/KidCanvas.xcodeproj
   ```

2. **Reset Package Caches**
   - In Xcode: `File` → `Packages` → `Reset Package Caches`
   - Wait for it to complete

3. **Resolve Package Versions**
   - In Xcode: `File` → `Packages` → `Resolve Package Versions`
   - Wait for packages to download

4. **Clean Build Folder**
   - Press `Cmd + Shift + K` (or `Product` → `Clean Build Folder`)

5. **Build the project**
   - Press `Cmd + B` to build

## If That Doesn't Work

### Option 1: Re-add the Package

1. In Xcode, select the project in the navigator
2. Select the **KidCanvas** target
3. Go to the **Package Dependencies** tab
4. Remove the existing `supabase-swift` package (if present)
5. Click the **+** button to add a package
6. Enter: `https://github.com/supabase/supabase-swift`
7. Select version: **Up to Next Major Version** with **2.5.1** minimum
8. Add these products to the **KidCanvas** target:
   - ✅ Supabase
   - ✅ Auth
   - ✅ PostgREST
   - ✅ Storage
   - ✅ Realtime
   - ✅ Functions

### Option 2: Check Package Repository URL

The project should use:
- **Repository URL**: `https://github.com/supabase/supabase-swift`
- **Version**: `2.5.1` or higher

If the URL in your project is different, update it:
1. Select project → Package Dependencies
2. Select `supabase-swift`
3. Click the info icon
4. Update the URL if needed

### Option 3: Manual Package Resolution

1. Close Xcode
2. Delete these folders:
   ```bash
   rm -rf ios/KidCanvas/KidCanvas/KidCanvas.xcodeproj/project.xcworkspace/xcshareddata/swiftpm
   ```
3. Reopen Xcode
4. Xcode will automatically resolve packages

## Verify It's Working

After fixing, you should see:
- ✅ No red errors in the project navigator
- ✅ All package products listed under "Package Dependencies" in the target settings
- ✅ Project builds successfully (`Cmd + B`)

## Common Issues

**Issue**: "Package product 'X' not found"
- **Solution**: Make sure the product is added to the target's "Frameworks, Libraries, and Embedded Content"

**Issue**: "Repository not found"
- **Solution**: Check your internet connection and verify the URL is correct

**Issue**: "Version conflict"
- **Solution**: Update to the latest compatible version or use "Up to Next Major Version"

