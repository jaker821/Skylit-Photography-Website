# CSS Color Audit & Fix Plan

## Color Pairing Rules
**VALID combinations:**
1. **Dark backgrounds (Black #1a1a1a, Purple #4E2E3A)** → **Light text (White, Cream #F8EEDB)**
2. **Light backgrounds (White, Cream)** → **Dark text (Black, Purple)**

**INVALID combinations to AVOID:**
- Purple text on dark/black backgrounds ❌
- Black text on dark backgrounds ❌  
- Cream/White text on light backgrounds ❌

## Current Variable Mappings
```css
/* Dark Theme Variables */
--background-dark: #1a1a1a         /* DARK */
--card-background: #2a2a2a         /* DARK */
--text-primary: #F8EEDB            /* LIGHT (cream) */
--text-secondary: #b0b0b0          /* LIGHT (gray) */
--accent-gold-light: #EBE0B3       /* LIGHT (gold) */
--primary-purple: #4E2E3A          /* DARK */

/* Legacy Mappings (confusing!) */
--white: #2a2a2a                   /* NOW DARK! */
--black: #F8EEDB                   /* NOW LIGHT! */
```

## Fixed Approach
Instead of using confusing legacy variables, use semantic ones:
- Backgrounds: `--background-dark`, `--card-background`
- Text on dark: `--text-primary` (cream), `--accent-gold-light` (gold), `--text-secondary` (gray)
- Never use purple for text on dark backgrounds!

## Components to Fix
1. All h1-h6 headings → Gold-light (not purple)
2. All cards → Dark backgrounds with cream/gold text
3. All forms → Dark inputs with cream text, gold labels
4. All tables → Cream text on dark backgrounds
5. Buttons → Check each type
6. Dashboard elements → All dark with light text

## Action Items
- Remove ALL `[data-theme='dark']` selectors (no longer needed)
- Replace purple text colors with gold-light on dark backgrounds
- Ensure all cards use `--card-background` with proper text colors
- Fix form inputs to have dark backgrounds with light text




