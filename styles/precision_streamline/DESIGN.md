---
name: Precision Streamline
colors:
  surface: '#fdf7ff'
  surface-dim: '#ded8e0'
  surface-bright: '#fdf7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2fa'
  surface-container: '#f2ecf4'
  surface-container-high: '#ece6ee'
  surface-container-highest: '#e6e0e9'
  on-surface: '#1d1b20'
  on-surface-variant: '#494551'
  inverse-surface: '#322f35'
  inverse-on-surface: '#f5eff7'
  outline: '#7a7582'
  outline-variant: '#cbc4d2'
  surface-tint: '#6750a4'
  primary: '#4f378a'
  on-primary: '#ffffff'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#cfbcff'
  secondary: '#63597c'
  on-secondary: '#ffffff'
  secondary-container: '#e1d4fd'
  on-secondary-container: '#645a7d'
  tertiary: '#765b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fdf7ff'
  on-background: '#1d1b20'
  surface-variant: '#e6e0e9'
typography:
  display-lg:
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 1.5rem
  section-gap: 4rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style
The design system focuses on utility and speed, catering to professionals, developers, and casual users who need to process images without friction. The personality is efficient, reliable, and invisible—getting out of the way to let the user’s content take center stage.

The aesthetic blends **Minimalism** with **Modern Corporate** sensibilities. It prioritizes clarity through generous whitespace, high-contrast action areas, and a structured layout that guides the eye from upload to download. The interface utilizes a multi-theme strategy to adapt to different user environments: 
- **Clean Professional** for standard web workflows.
- **Modern Dark** for creative/late-night environments.
- **Soft Minimalist** for lifestyle and casual use cases.

## Colors
This design system employs a theme-switching architecture. 

1. **Primary Color:** Used for the main "Convert" or "Download" actions and the active state of the drag-and-drop zone.
2. **Surface Color:** Elevated containers (cards, toolbars) use the surface token to differentiate from the background.
3. **Contrast:** High-contrast ratios are maintained for all action buttons to ensure they remain the focal point of the utilitarian flow.

## Typography
Typography scales based on the active theme to match the brand personality.

- **Inter (Professional):** Tight tracking and neutral forms for a data-dense, functional feel.
- **Montserrat (Dark):** Increased weight in headings to punch through dark backgrounds.
- **Outfit (Soft):** Utilizes the font's natural roundness to create a friendly, approachable tool.

For all themes, the "Display" type is reserved for the landing page hero, while "Headline" and "Body" drive the functional optimization interface.

## Layout & Spacing
The layout follows a **Fixed Grid** model for the central tool area to ensure the processing queue remains organized and legible.

- **Central Column:** The main tool interface is restricted to a 1200px container, centered horizontally.
- **Vertical Rhythm:** A base 8px unit drives all padding and margins. 
- **The "Tool Stage":** The primary interaction area (Dropzone or Settings) uses a 4rem top/bottom margin to separate it from navigation and footer elements.
- **Mobile:** On devices below 768px, the layout collapses to a single-column fluid flow with 1rem side margins.

## Elevation & Depth
This design system uses **Tonal Layers** rather than heavy shadows to indicate hierarchy.

- **Base Level:** The background color of the chosen theme.
- **Interactive Level:** Tools and cards use the "Surface" color with a subtle 1px border (color-mixed with the primary color at 10% opacity).
- **Active State:** The drag-and-drop zone, when an image is hovered over the browser, utilizes a primary-colored glow (15% opacity) to provide immediate feedback.
- **Shadows:** Use only one "Ambient" shadow for the primary action buttons: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`.

## Shapes
The shape language shifts slightly based on the theme, but maintains a core "Rounded" logic (0.5rem base radius).

- **Standard Elements:** Inputs, cards, and small buttons use 0.5rem.
- **Large Components:** The primary drag-and-drop zone and main action buttons use `rounded-xl` (1.5rem) to signify their importance and create a modern "app-like" feel.
- **Pills:** Progress bar tracks and status badges use a fully rounded (pill) shape for clarity.

## Components

### Drag-and-Drop Area
The hero of the application. It must feature a thick dashed border (2px width, 8px dash array). 
- **Default:** Neutral border color, background matches surface.
- **Active/Hover:** Border changes to the Primary color; background gains a 5% tint of the Primary color.
- **Iconography:** A large centered icon representing "Upload" or "Images".

### Action Buttons
High-contrast "Mega Buttons" for the final processing step.
- **Style:** Solid background (Primary Color), White text (or Background color if Primary is very light).
- **Size:** Minimum height of 56px, bold typography, `rounded-xl`.
- **Interaction:** 10% darkening on hover, subtle 2px scale down on click.

### Progress Bars
- **Track:** A neutral, low-opacity version of the text color.
- **Fill:** Solid Primary color.
- **Animation:** Smooth ease-in-out transition for percentage updates.

### Image Chips
Small thumbnails representing the queue. 
- **Style:** 64x64px thumbnails with a "Delete" (X) icon appearing on hover.
- **Details:** File name and size displayed below or to the right in `label-sm`.

### Settings Inputs
- **Toggle/Radio:** Used for choosing output formats (JPG, PNG, WebP). These should be styled as segmented controls rather than standard dropdowns for speed.