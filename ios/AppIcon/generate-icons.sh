#!/bin/bash

# App Icon Generator for KidCanvas
# Requires: ImageMagick (brew install imagemagick)
# 
# Usage: 
# 1. Place your 1024x1024 source icon as "AppIcon-1024.png" in this folder
# 2. Run: ./generate-icons.sh
# 3. Copy generated icons to Xcode Assets.xcassets/AppIcon.appiconset/

SOURCE="AppIcon-1024.png"
OUTPUT_DIR="./output"

if [ ! -f "$SOURCE" ]; then
    echo "Error: Please provide a 1024x1024 source icon named 'AppIcon-1024.png'"
    echo ""
    echo "You can create one using:"
    echo "- Figma, Sketch, or Adobe Illustrator"
    echo "- Online tools like https://www.appicon.co/"
    echo ""
    echo "Design tips for KidCanvas icon:"
    echo "- Use the pink-to-purple gradient (#EC4899 to #A855F7)"
    echo "- Include a paint palette or crayon element"
    echo "- Keep it simple - it should be recognizable at 29x29"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Generating iOS app icons..."

# iOS App Icon (single 1024x1024 for iOS 14+)
magick "$SOURCE" -resize 1024x1024 "$OUTPUT_DIR/AppIcon-1024.png"

# For older Xcode/iOS versions, you might need these sizes:
# iPhone Notification 20pt
magick "$SOURCE" -resize 40x40 "$OUTPUT_DIR/Icon-20@2x.png"
magick "$SOURCE" -resize 60x60 "$OUTPUT_DIR/Icon-20@3x.png"

# iPhone Settings 29pt  
magick "$SOURCE" -resize 58x58 "$OUTPUT_DIR/Icon-29@2x.png"
magick "$SOURCE" -resize 87x87 "$OUTPUT_DIR/Icon-29@3x.png"

# iPhone Spotlight 40pt
magick "$SOURCE" -resize 80x80 "$OUTPUT_DIR/Icon-40@2x.png"
magick "$SOURCE" -resize 120x120 "$OUTPUT_DIR/Icon-40@3x.png"

# iPhone App 60pt
magick "$SOURCE" -resize 120x120 "$OUTPUT_DIR/Icon-60@2x.png"
magick "$SOURCE" -resize 180x180 "$OUTPUT_DIR/Icon-60@3x.png"

# iPad Notifications 20pt
magick "$SOURCE" -resize 20x20 "$OUTPUT_DIR/Icon-20.png"
magick "$SOURCE" -resize 40x40 "$OUTPUT_DIR/Icon-20@2x-ipad.png"

# iPad Settings 29pt
magick "$SOURCE" -resize 29x29 "$OUTPUT_DIR/Icon-29.png"
magick "$SOURCE" -resize 58x58 "$OUTPUT_DIR/Icon-29@2x-ipad.png"

# iPad Spotlight 40pt
magick "$SOURCE" -resize 40x40 "$OUTPUT_DIR/Icon-40.png"
magick "$SOURCE" -resize 80x80 "$OUTPUT_DIR/Icon-40@2x-ipad.png"

# iPad App 76pt
magick "$SOURCE" -resize 76x76 "$OUTPUT_DIR/Icon-76.png"
magick "$SOURCE" -resize 152x152 "$OUTPUT_DIR/Icon-76@2x.png"

# iPad Pro App 83.5pt
magick "$SOURCE" -resize 167x167 "$OUTPUT_DIR/Icon-83.5@2x.png"

# App Store 1024pt
magick "$SOURCE" -resize 1024x1024 "$OUTPUT_DIR/Icon-1024.png"

echo ""
echo "✅ Icons generated in $OUTPUT_DIR/"
echo ""
echo "Next steps:"
echo "1. Open Xcode"
echo "2. Go to KidCanvas > Assets.xcassets > AppIcon"
echo "3. Drag AppIcon-1024.png to the 'iOS 1024pt' slot"
echo "4. For older iOS support, add the other sizes too"

