# Color Guide - Skylit Photography

## Single Dark Theme Color Scheme

The website now uses a single, unified dark color scheme featuring purple, gold, cream, and black.

## Color Palette

### Primary Colors

**Purple**
- `--primary-purple: #4E2E3A` - RGB(78, 46, 58) - Main purple
- `--primary-purple-dark: #3A2229` - Darker variation
- `--primary-purple-light: #6B4051` - Lighter variation
- `--primary-purple-lighter: #8A5A6F` - Even lighter variation

**Gold**
- `--accent-gold: #DFD08F` - RGB(223, 208, 143) - Main gold
- `--accent-gold-dark: #C4B56B` - Darker variation
- `--accent-gold-light: #EBE0B3` - Lighter variation
- `--accent-gold-lighter: #F3ECCE` - Even lighter variation

**Cream**
- `--cream-white: #F8EEDB` - RGB(248, 238, 219) - Main cream color
- `--cream-white-dark: #F0E4C8` - Slightly darker cream

### Dark Theme Colors

**Backgrounds**
- `--background-dark: #1a1a1a` - Main dark background
- `--background-darker: #0f0f0f` - Darker sections
- `--card-background: #2a2a2a` - Card backgrounds
- `--card-background-light: #353535` - Lighter card backgrounds

**Text**
- `--text-primary: #F8EEDB` - Primary text (cream)
- `--text-secondary: #b0b0b0` - Secondary text
- `--text-dark: #1a1a1a` - For use on light backgrounds

**Borders**
- `--border-color: rgba(223, 208, 143, 0.2)` - Gold-tinted borders

### Semantic Colors

- `--success: #4caf50` - Success states
- `--warning: #ff9800` - Warning states
- `--error: #f44336` - Error states
- `--info: #2196f3` - Info states

## Color Usage

### Headings
- Color: `--accent-gold-light` (#EBE0B3)
- Stand out against dark backgrounds

### Body Text
- Primary: `--text-primary` (cream #F8EEDB)
- Secondary: `--text-secondary` (gray #b0b0b0)

### Buttons
- Primary: Purple gradient background with gold accents
- Secondary: Gold background with dark text
- Hover: Enhanced gold glow

### Cards & Containers
- Background: `--card-background` (#2a2a2a)
- Border: `--border-color` (gold-tinted)
- Hover: Gold border highlight

### Navigation
- Background: Dark with transparency
- Links: Cream text
- Active/Hover: Gold highlights
- Logo: Gold gradient

### Forms
- Background: `--card-background-light`
- Labels: Gold
- Borders: Gold-tinted
- Focus: Gold accent

## Accessibility

All color combinations meet WCAG AA standards:
- Text contrast ratio: Minimum 4.5:1
- Large text: Minimum 3:1
- Interactive elements: Clearly distinguishable

## Where Colors Are Defined

All colors are CSS variables defined in `src/App.css` at the `:root` level (lines 6-46).

## Updating Colors

To change the color scheme:

1. Open `src/App.css`
2. Find the `:root` section
3. Update the CSS variable values
4. Save and refresh - all changes apply site-wide!

Example:
```css
:root {
  --accent-gold: #YOUR_NEW_COLOR;
}
```

The entire website will update automatically since all styles use these CSS variables.
