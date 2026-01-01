# KidCanvas App Icon

This folder contains the app icon design and generation tools.

## Files

- `AppIcon.svg` - Vector source of the app icon
- `generate-icons.sh` - Script to generate PNG icons from source

## Quick Start

### Option 1: Use the SVG (Recommended)

1. Open `AppIcon.svg` in a browser or vector editor
2. Export as PNG at 1024x1024 pixels
3. Save as `AppIcon-1024.png` in this folder
4. Copy to: `ios/KidCanvas/KidCanvas/KidCanvas/Assets.xcassets/AppIcon.appiconset/`

### Option 2: Convert with ImageMagick

```bash
# Install ImageMagick if needed
brew install imagemagick

# Convert SVG to PNG
magick AppIcon.svg -resize 1024x1024 AppIcon-1024.png
```

### Option 3: Use Online Tools

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `AppIcon.svg`
3. Set output size to 1024x1024
4. Download and rename to `AppIcon-1024.png`

## Adding to Xcode

1. Open the Xcode project
2. Navigate to: `KidCanvas/Assets.xcassets/AppIcon`
3. Drag `AppIcon-1024.png` to the 1024x1024 slot
4. Build and run to verify

## Dark Mode & Tinted Icons (iOS 18+)

iOS 18 supports alternate app icons for Dark Mode:

1. **Light Mode** (default): `AppIcon-1024.png`
2. **Dark Mode**: Create `AppIcon-1024-dark.png` with darker background
3. **Tinted Mode**: Create `AppIcon-1024-tinted.png` - monochromatic version

For the dark variant, you could use:
- Same design with darker gradient (#9333EA to #7C3AED)
- Or a darker background color

## Design Notes

The current icon features:
- Pink-to-purple gradient background (#EC4899 → #A855F7)
- White paint palette with colorful paint blobs
- Paintbrush in corner
- Clean, recognizable at small sizes

This matches the web app's branding and color scheme.

