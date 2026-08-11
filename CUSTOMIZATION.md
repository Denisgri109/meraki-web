# Owner customization (web)

How an owner changes copy, imagery and colours on the site, and how the code
enforces that only an owner can.

## Where content lives

Every customizable value is one row in the Supabase `global_settings` table
(`key` → `value`). RLS restricts writes to owners:

- `global_settings_public_read` — anyone may read
- `global_settings_owner_insert` / `_update` / `_delete` — `is_owner_user(auth.uid())`

A tampered client cannot write content even if it bypassed the UI. The
client-side `canEdit` checks are affordances and error messages, not security.

### Key namespaces

| Prefix | Scope |
|---|---|
| `landing.*`, `portal.*` | Public landing pages and the section chooser |
| `about.*`, `contact.*`, `getapp.*` | Static marketing pages |
| `dashboard.*` | Signed-in app headers (see `src/lib/dashboardContent.ts`) |
| `brand.*`, `footer.*`, `image.*` | Branding — **shared with the mobile app** |
| `support.*`, `faq_items`, `support_settings` | Support page and FAQ — **shared** |
| `legal.*` | Terms and Privacy bodies — **shared** |
| `theme.*` | Colour tokens (web only; see below) |

Because `/beauty/*` and `/pilates/*` re-render the `/dashboard/*` pages through
`SectionPageWrapper`, wiring a `dashboard.*` key once covers all three sections.

## How an owner edits

1. Toggle **Edit** (`EditModeToggle`) to turn on Visual Edit Mode.
2. Editable text gains a pink hover ring; clicking opens an inline editor with
   save, cancel, and — once a custom value exists — restore-to-default.
   Editable images gain Replace and Reset buttons.
3. The floating `EditToolbar` offers the **Settings Drawer**
   (`CustomizeDrawer`: Colors / Text / Images / Reset), a **Client View**
   preview (`?preview=client`), and a section-level reset.
4. Saves publish immediately. Other tabs, other devices and the mobile app pick
   the change up over Supabase Realtime.

## Components

| File | Purpose |
|---|---|
| `contexts/EditContext.tsx` | Content map, owner gating, optimistic writes with rollback, realtime sync, loading flag |
| `contexts/ThemeContext.tsx` | Colour tokens → CSS custom properties, preset palettes, validation |
| `components/editable/EditableText.tsx` | Inline text editing with restore-to-default |
| `components/editable/EditableImage.tsx` | Replace / reset an image |
| `components/editable/EditableLegalBody.tsx` | Whole-document Terms / Privacy override |
| `components/editable/EditToolbar.tsx` | Floating owner toolbar |
| `components/CustomizeDrawer.tsx` | Central editor for colours, text, images and resets |
| `lib/dashboardContent.ts` | Registry of dashboard header keys, labels and defaults |

## Semantics worth knowing

- **Empty means default.** `getContent` treats a missing *or empty* stored value
  as "no override", so clearing a field restores the shipped copy rather than
  rendering blank.
- **Reset deletes the row.** `clearContent(key)` removes the override entirely.
  Storing the fallback as a value would pin the text to today's default and stop
  future default changes from ever reaching it.
- **Failed saves roll back to the previous value**, not to empty — the database
  still holds the old customization, so the UI must show it.
- **Theme values are validated.** `isValidThemeColor` accepts hex, `rgb()`,
  `rgba()`, `hsl()`, `hsla()`, `transparent`, `currentColor` and `inherit`.
  Anything else is refused before it is persisted and ignored before it reaches
  `style.setProperty`, so a malformed row cannot break every visitor's CSS.

## Adding a new editable string

For a dashboard page:

1. Add `{ key, label, fallback }` to the right group in
   `src/lib/dashboardContent.ts`.
2. Replace the literal in the page:
   ```tsx
   <EditableText contentKey="dashboard.shop.title" fallback="Curated Beauty Products" as="h1" className="…" />
   ```

The field then appears in CustomizeDrawer's Text tab automatically and is
covered by the "Dashboard Headers" reset section.

For landing/marketing copy, add the field to `TEXT_GROUPS` in
`CustomizeDrawer.tsx` and use the same `EditableText` call.

## Guarantees under test

- `src/contexts/EditContext.test.tsx` — owner gating, rollback semantics,
  empty-means-default, `clearContent` success/failure/permission paths
- `src/components/__tests__/editable.test.tsx` — non-owners get no edit
  affordance; reset deletes rather than overwrites; restore-to-default appears
  only when customized
- `src/contexts/__tests__/themeColor.test.ts` — colour validator accepts every
  shipped default and preset, rejects CSS injection attempts
- `src/lib/dashboardContent.test.ts` — registry has no duplicate or mis-namespaced keys
