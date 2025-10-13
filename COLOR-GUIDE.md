# Color Customization Guide

## Current Color Scheme

The website currently uses placeholder colors for the dark purple and gold theme. When you provide the exact RGB color codes, update the CSS variables in `src/App.css`.

## Where to Update Colors

Open `src/App.css` and find the `:root` section at the top of the file (around line 6-20).

### Current Placeholder Colors

```css
:root {
  /* Primary Colors - Dark Purple */
  --primary-purple: #3d1a52;           /* Main purple color */
  --primary-purple-dark: #2b1139;      /* Darker shade for backgrounds */
  --primary-purple-light: #5a2772;     /* Lighter shade for accents */
  --primary-purple-lighter: #7c3b96;   /* Even lighter for hover states */
  
  /* Accent Colors - Gold */
  --accent-gold: #d4af37;              /* Main gold color */
  --accent-gold-dark: #b8941f;         /* Darker gold for contrast */
  --accent-gold-light: #f0d86d;        /* Lighter gold for highlights */
  --accent-gold-lighter: #f8e9a8;      /* Even lighter for backgrounds */
}
```

## How to Convert RGB to Hex

If you receive RGB values like `rgb(61, 26, 82)`, you can convert to hex:

**Option 1: Online Converter**
- Visit: https://www.rgbtohex.net/
- Enter your RGB values
- Copy the hex code

**Option 2: Manual Calculation**
- RGB(61, 26, 82) = #3D1A52
- Each RGB value converts to two hex digits

## Example Update

If you receive:
- **Dark Purple**: RGB(75, 30, 95) 
- **Gold**: RGB(218, 165, 32)

Update the CSS to:
```css
:root {
  --primary-purple: #4b1e5f;
  --accent-gold: #daa520;
}
```

For the lighter and darker variations, you can:
1. Use an online tool: https://coolors.co/
2. Or I can generate them for you once you provide the main colors

## Where Colors Are Used

### Primary Purple
- Navigation bar active links
- Headings and titles
- Buttons and CTAs
- Footer background
- Page headers

### Gold
- Logo gradient
- Accent highlights
- Button borders
- Links on hover
- Badge backgrounds

## Need Help?

Once you provide the RGB codes, I can:
1. Generate all the color variations (light/dark shades)
2. Update the entire color scheme automatically
3. Ensure proper contrast for accessibility

Just provide the colors in any format:
- RGB: rgb(R, G, B)
- Hex: #RRGGBB
- Or even just a description/color name

## Quick Reference

**Files to update:**
- `src/App.css` - Line 6-20 (main color variables)

**After updating:**
1. Save the file
2. Refresh your browser
3. The entire site will update with new colors automatically!

All colors are controlled by CSS variables, so changing them once updates the entire website. 🎨

