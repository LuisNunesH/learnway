---
version: alpha
name: "Dragonfly Dark Typographic"
description: "Dragonfly is a crypto/Web3 venture capital firm whose site is built on a pure black (#000000) canvas with a single high-voltage orange (#fa4c14) brand accent. The hero is dominated by a full-viewport-width wordmark rendered in an oversized grotesque at ~185px, creating an unmistakable typographic identity. Navigation is a compact dark pill with a frosted-glass-like off-white tint (rgba(242,242,242,0.06)), housing monospaced micro-labels and a \"MENU\" trigger. Corner letters (D, R, A, G, O, N, F, L, Y) in a serif typeface are scattered at viewport edges as decorative glyphs. The palette is deliberately minimal: near-black, off-white, orange, and a mid-grey for secondary text. No shadows, no border radii beyond a single 4px token, and no gradients. pure flat, high-contrast, editorial-meets-crypto aesthetic."
colors:
  black-canvas: "#000000"
  pink-accent: "#ec39b6"
  purple-accent: "#5014fa"
  dragonfly-orange: "#fa4c14"
  mid-grey: "#7d7d7d"
  off-white: "#f2f2f2"
typography:
  hero-display-grotesque:
    fontFamily: "NON Natural Grotesk"
    fontSize: "152.5px"
    fontWeight: "400"
    lineHeight: "152.5px"
    letterSpacing: "-6.4px"
  hero-display-roman:
    fontFamily: "FK Roman Standard"
    fontSize: "185.5px"
    fontWeight: "300"
    lineHeight: "166.95px"
    letterSpacing: "-12.24px"
  section-heading:
    fontFamily: "NON Natural Grotesk"
    fontSize: "39px"
    fontWeight: "400"
    lineHeight: "39px"
    letterSpacing: "-1.6px"
  sub-display-roman:
    fontFamily: "FK Roman Standard"
    fontSize: "40px"
    fontWeight: "300"
    lineHeight: "36px"
    letterSpacing: "-0.8px"
  mid-roman:
    fontFamily: "FK Roman Standard"
    fontSize: "85.5px"
    fontWeight: "300"
    lineHeight: "61.56px"
    letterSpacing: "-5.28px"
  body-roman:
    fontFamily: "FK Roman Standard"
    fontSize: "24px"
    fontWeight: "300"
    lineHeight: "33.6px"
    letterSpacing: "-0.48px"
  body-grotesque:
    fontFamily: "NON Natural Grotesk"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "16px"
  body-roman-small:
    fontFamily: "FK Roman Standard"
    fontSize: "16px"
    fontWeight: "300"
    lineHeight: "22.4px"
    letterSpacing: "-0.32px"
  mono-label:
    fontFamily: "NON Natural Mono"
    fontSize: "10px"
    fontWeight: "400"
    lineHeight: "10px"
    letterSpacing: "0.4px"
  serif-decorative:
    fontFamily: "Times New Roman"
    fontSize: "16px"
    fontWeight: "400"
rounded:
  pill-sm: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  nav-padding: "12px"
  lg: "24px"
  xl: "48px"
  2xl: "88px"
  section: "180px"
  column: "386px"
  wide: "483px"
---

## Overview

Dragonfly is a crypto/Web3 venture capital firm whose site is built on a pure black (#000000) canvas with a single high-voltage orange (#fa4c14) brand accent. The hero is dominated by a full-viewport-width wordmark rendered in an oversized grotesque at ~185px, creating an unmistakable typographic identity. Navigation is a compact dark pill with a frosted-glass-like off-white tint (rgba(242,242,242,0.06)), housing monospaced micro-labels and a "MENU" trigger. Corner letters (D, R, A, G, O, N, F, L, Y) in a serif typeface are scattered at viewport edges as decorative glyphs. The palette is deliberately minimal: near-black, off-white, orange, and a mid-grey for secondary text. No shadows, no border radii beyond a single 4px token, and no gradients. pure flat, high-contrast, editorial-meets-crypto aesthetic.

**Signature traits:**
- Dual typeface system: Pairs NON Natural Grotesk and FK Roman Standard across the type hierarchy.
- Tight geometric corners: Near-square geometry with corner radii capped around 4px.

## Colors

The palette uses 10 validated color tokens across 2 theme profiles. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **surface-background** maps to `black-canvas`: Role "background" is grounded by usage context "Full-page background, nav bar background, primary surface across all sections".
- **action-text** maps to `off-white`: Role "text" is grounded by usage context "Primary foreground text, nav labels, link text, UI element foreground".
- **content-text** maps to `dragonfly-orange`: Role "text" is grounded by usage context "Hero wordmark fill, nav indicator dots, key accent elements".
- **content-background** maps to `pink-accent`: Role "background" is grounded by usage context "Localized accent in header zone, rare highlight".

### Dark Theme

### Text Scale
- **Dragonfly Orange** (#fa4c14): Hero wordmark fill, nav indicator dots, key accent elements. Role: text. {authored: rgb(250, 76, 20), space: rgb}
- **Mid Grey** (#7d7d7d): Secondary/muted text, footer labels, subdued UI text. Role: text. {authored: rgb(125, 125, 125), space: rgb}
- **Off-White** (#f2f2f2): Primary foreground text, nav labels, link text, UI element foreground. Role: text. {authored: rgb(242, 242, 242), space: rgb, alpha: 0.06}

### Surface & Shadows
- **Black Canvas** (#000000): Full-page background, nav bar background, primary surface across all sections. Role: background. {authored: rgb(0, 0, 0), space: rgb}
- **Pink Accent** (#ec39b6): Localized accent in header zone, rare highlight. Role: background. {authored: rgb(236, 57, 182), space: rgb}
- **Purple Accent** (#5014fa): Localized accent in header zone, rare highlight. Role: background. {authored: rgb(80, 20, 250), space: rgb}

### Light Theme

### Text Scale
- **Dragonfly Orange** (#fa4c14): Hero wordmark and accent elements. Role: text. {authored: rgb(250, 76, 20), space: rgb}
- **Mid Grey** (#7d7d7d): Secondary text, footer labels. Role: text. {authored: rgb(125, 125, 125), space: rgb}
- **Off-White** (#f2f2f2): Primary foreground text across both themes. Role: text. {authored: rgb(242, 242, 242), space: rgb, alpha: 0.06}

### Surface & Shadows
- **Black Canvas** (#000000): Full-page background — site does not switch to a light surface; CSSOM data identical to dark theme. Role: background. {authored: rgb(0, 0, 0), space: rgb}

## Typography

Typography uses NON Natural Grotesk, FK Roman Standard, NON Natural Mono, Times New Roman across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Mixes NON Natural Grotesk and FK Roman Standard and NON Natural Mono and Times New Roman for visual contrast. Weight range spans regular, light. Sizes range from 10px to 185.5px.

### Font Roles
- **Headline Font**: NON Natural Grotesk
- **Body Font**: NON Natural Grotesk

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Primary hero wordmark / brand display at viewport scale | NON Natural Grotesk | 152.5px | 400 | 152.5px | -6.4px | NON Natural Grotesk, sans | Extracted token |
| Alternate hero display wordmark, large editorial headline | FK Roman Standard | 185.5px | 300 | 166.95px | -12.24px | FK Roman Standard, sans-serif | Extracted token |
| Section-level headings and sub-display text | NON Natural Grotesk | 39px | 400 | 39px | -1.6px | NON Natural Grotesk, sans | Extracted token |
| Editorial sub-display, pull quotes | FK Roman Standard | 40px | 300 | 36px | -0.8px | FK Roman Standard, sans-serif | Extracted token |
| Mid-scale display / animated number or stat | FK Roman Standard | 85.5px | 300 | 61.56px | -5.28px | FK Roman Standard, sans-serif | Extracted token |
| Body copy, article text, descriptive paragraphs | FK Roman Standard | 24px | 300 | 33.6px | -0.48px | FK Roman Standard, sans-serif | Extracted token |
| UI body text, nav labels, general interface copy | NON Natural Grotesk | 16px | 400 | 16px | normal | NON Natural Grotesk, sans | Extracted token |
| Small body copy, captions, footnotes | FK Roman Standard | 16px | 300 | 22.4px | -0.32px | FK Roman Standard, sans-serif | Extracted token |
| Micro UI labels, status indicators, nav decorative text | NON Natural Mono | 10px | 400 | 10px | 0.4px | NON Natural Mono, monospace | Extracted token |
| Corner decorative letterforms, fallback serif glyphs | Times New Roman | 16px | 400 | normal | normal | Times New Roman | Extracted token |

## Layout

Responsive system uses 3 breakpoint tier(s): mobile, tablet, desktop.

This system uses a 4px base grid with scale values 4, 8, 12, 24, 48, 88, 180, 386, 483.

### Responsive Strategy
- **mobile (<= 799px)**: Constrain layout for small viewports and prioritize vertical stacking.
- **tablet (>= 640px)**: Increase spacing and column structure for medium-width viewports.
- **desktop (>= 1024px)**: Expand layout density and horizontal composition for wide viewports.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| xs | 4px | 4 | Extracted spacing token |
| sm | 8px | 8 | Extracted spacing token |
| md | 12px | 12 | Extracted spacing token |
| lg | 24px | 24 | Extracted spacing token |
| xl | 48px | 48 | Extracted spacing token |
| 2xl | 88px | 88 | Extracted spacing token |
| section | 180px | 180 | Extracted spacing token |
| column | 386px | 386 | Extracted spacing token |
| wide | 483px | 483 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| n/a | 0 | No validated shadow payload |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | backdrop-filter | blur(6px) ; blur(2px) ; blur(4px) |
| Light | outline-color | rgb(242, 242, 242) ; rgb(125, 125, 125) ; rgb(0, 0, 0) |
| Light | outline-width | 3px |
| Light | outline-offset | 0px |
| Light | transform | matrix(0, -1, 1, 0, -4, 16) ; matrix(0, 1, -1, 0, 10, -10) ; matrix(0, 1, -1, 0, 10, 2) |
| Dark | backdrop-filter | blur(6px) ; blur(2px) ; blur(4px) |
| Dark | outline-color | rgb(242, 242, 242) ; rgb(125, 125, 125) ; rgb(0, 0, 0) |
| Dark | outline-width | 3px |
| Dark | outline-offset | 0px |
| Dark | transform | matrix(0, -1, 1, 0, -4, 16) ; matrix(0, 1, -1, 0, 10, -10) ; matrix(0, 1, -1, 0, 10, 2) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| pill-sm | 4px | 4 | Subtle corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| pill-sm | 4px | px |

## Components

(none detected)

## Do's and Don'ts

Guardrails protect Dual typeface system, Tight geometric corners without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Breakpoint 1 | <= 799px | (max-width: 799px) |
| Mobile | >= 640px | (min-width: 640px) |
| Tablet | >= 800px | (hover: hover) and (pointer: fine) and (min-width: 800px) |
| Desktop | >= 1024px | (min-width: 1024px) |
| Breakpoint 5 | Unknown | (hover: hover) and (pointer: fine) |

## Agent Prompt Guide

### Example Component Prompts
- Create button component using validated primary color role and spacing tokens.
- Create card component with mapped radius role and evidence-backed elevation.
- Create form input component using inferred typography hierarchy and border roles.

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.
