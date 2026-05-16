# Demo Site — Intentional Bugs Reference

This file documents all bugs planted in `index.html`.
Used to verify TestPilot AI's detection capabilities.

## Accessibility Bugs (6)
- [ ] Missing viewport meta tag
- [ ] No skip navigation link
- [ ] Nav has no aria-label
- [ ] Poor contrast: nav links (#d0e8ff on #4a90d9) — ~2.8:1, fails WCAG AA
- [ ] Footer text (#aaaaaa on white) — ~2.32:1, fails WCAG AA
- [ ] No visible focus indicators on buttons or inputs

## Image Bugs (3)
- [ ] Product 1 image missing alt attribute entirely
- [ ] Product 2 image has empty alt="" (not decorative context)
- [ ] Hero background has no alt equivalent for screen readers

## Form Bugs (6)
- [ ] label `for` attribute mismatches input `id` (newsletter form)
- [ ] Full Name input has no `id` — label unlinked
- [ ] Email input type is "text" not "email"
- [ ] Email input has no `required` attribute
- [ ] Submit button is `type="button"` — form never submits
- [ ] No input `:focus` styles

## Content/Logic Bugs (4)
- [ ] 50% OFF badge but prices show 25% discount ($199.99 → $149.99)
- [ ] Original price not struck through — looks like two competing prices
- [ ] Disabled "Add to Cart" with no Out of Stock label
- [ ] Two CTA buttons both labeled "Click Here" — no differentiation

## UX/Layout Bugs (4)
- [ ] Fixed 3-column grid (320px each) — breaks on tablet/mobile
- [ ] Hero text has no overlay — readability depends on image
- [ ] No hover state on secondary button
- [ ] Logo is not a link to home page

## SEO Bugs (3)
- [ ] Missing description meta tag
- [ ] Contact email is plain text, not a mailto: link
- [ ] No structured data / schema.org for products

**Total planted bugs: 26**
