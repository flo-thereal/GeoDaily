# Remove Redundant Page Headers

## Context
The Atlas (Explore), Profile, and Settings pages each have a sticky `<header>` bar at the top that duplicates content already present in the hero section below it. These headers add visual noise without providing unique value. The bottom nav + sidebar already handle navigation, so the headers are unnecessary.

## Changes

### 1. `src/pages/Profile.tsx` — Remove header entirely
- **Remove** lines 131–141: the `<header>` block with "Explorer Profile" label and tiny avatar
- **Change** the wrapping `<>` fragment to just the content `<div>` (no fragment needed)
- The hero section (lines 145–182) already shows a large avatar, name, level badge, and streak — fully covers what the header showed

### 2. `src/pages/Settings.tsx` — Remove header entirely
- **Remove** lines 159–171: the `<header>` block with "Settings" label, non-functional hamburger button, and person icon
- **Change** the wrapping `<>` fragment to just the content `<div>` (no fragment needed)
- The hero section (lines 192–196) already shows "Configure Your Atlas Experience"

### 3. `src/pages/Explore.tsx` — Remove sticky header, move search bar inline
- **Remove** lines 78–92: the sticky `<header>` wrapper containing the search bar
- **Add** the search input as its own row between the hero section and the filters bar (between the `</section>` closing the hero and the `<section>` for filters)
- Style it consistently: centered, max-w-md, same input styling as before but without the sticky header container

## Verification
- `npm run lint` (tsc --noEmit)
- `npm run test`
- Manual check: all three pages should no longer have a sticky header bar; content should flow directly from the top of the scroll area
- Explore page: search bar should appear below the "Country Atlas" hero, above the region filter pills
