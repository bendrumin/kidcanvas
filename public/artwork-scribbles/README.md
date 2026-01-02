# Artwork Scribbles SVG Files

Place your SVG files for the landing page artwork here. **SVG files are preferred over PNGs** because they:
- Scale perfectly at any size
- Have smaller file sizes
- Can be styled with CSS
- Work great for responsive design

## File Naming Convention

Name your SVG files to match the variant names:
- `rainbow.svg`
- `rocket.svg` (note: `rocketship` variant maps to `rocket.svg`)
- `flower.svg`
- `dinosaur.svg`
- `camera.svg`
- `palette.svg`
- `phone.svg`
- `family.svg`
- `grandma.svg`
- `multi-kid.svg`

## SVG Requirements

- **ViewBox**: Should be set (e.g., `viewBox="0 0 60 60"` or similar)
- **Size**: The component will scale them automatically, so any viewBox size works
- **Colors**: Can be hardcoded or use `currentColor` for CSS styling
- **Optimization**: Remove unnecessary metadata, comments, etc. for smaller files

## How It Works

The `ArtworkScribble` component will:
1. **First**: Try to load the SVG file from `/artwork-scribbles/{variant}.svg`
2. **If found**: Use your custom SVG file (scaled to the `size` prop)
3. **If not found**: Fall back to the programmatically generated paths

This means you can:
- ✅ Replace specific variants with your custom SVGs
- ✅ Keep programmatic ones for variants you don't have files for
- ✅ Mix and match as needed
- ✅ Update SVGs anytime without code changes

## Example SVG Structure

```svg
<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
  <!-- Your artwork paths here -->
  <path d="M 10 40 Q 32 22, 58 40" fill="none" stroke="#E91E63" stroke-width="3"/>
  <path d="M 12 42 Q 32 24, 56 42" fill="none" stroke="#9B59B6" stroke-width="3"/>
</svg>
```

## Quick Start

1. Place your SVG files in this directory (`public/artwork-scribbles/`)
2. Name them according to the variant (e.g., `rainbow.svg`, `rocket.svg`)
3. The component will automatically use them on the next page load
4. No code changes needed!

## Testing

After adding SVG files:
1. Restart your dev server (`npm run dev`)
2. Check the landing page - your SVGs should appear automatically
3. If a file doesn't exist, it will gracefully fall back to programmatic paths

