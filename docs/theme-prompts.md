(format is , theme name, then prompt, and some instruction if need)Software, default light theme ?<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.

Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>

<design-system>
# Software

## Identity

Build an open light page with dark, tightly set sans-serif headings and a clear electric-blue action color. Pair broad reading areas with compact product diagrams, rounded white cards, and two substantial dark passages. Keep the page practical and easy to scan.

## Layout

Open with a wide text column beside a smaller product illustration. The wide layout uses roughly a 1.45:1 split. Place supporting facts in a ruled strip below when the brief provides them. Align subsequent sections to the same content width.

Let short explanations and editorial cards share a pale-grey field. A process and its supporting benefits can share one continuous dark field. Later, a pale comparison and disclosure area can lead into a dark closing and footer. Use background continuity to connect related content, adapting this sequence to the real page.

Available patterns include a three-column feature grid, equal editorial cards, numbered process steps linked across a row, and a heading beside a two-column list. Use these where the content fits. A hero diagram can show several inputs converging on a central product; use actual concepts from the brief rather than invented product screens.

## Typography

Use Host Grotesk for display, headings, quotations, and large figures. Use Instrument Sans for paragraphs, labels, and controls. Load those fonts directly; the typography fallback token alone does not select them. Keep display type bold with tight tracking and compact line-height, while reading text uses the body size and relaxed leading tokens. Give introductory text a wider measure than card descriptions. Keep labels and metadata smaller without reducing their contrast.

## Color and surfaces

Use ground for the near-white page, ground-muted for shared pale fields, and panel for white cards. Ink and ink-secondary carry primary and supporting text. Accent is the electric blue used for actions, small icons, and selected states. Dark fields use field with on-field and on-field-secondary text.

Cards have the panel radius, fine borders, and soft downward shadows. Product diagrams may use a blue center with a slight material gradient, light orbit lines, and small white tiles. Keep this dimensional treatment local; broad reading fields remain quiet.

## Components

Use blue primary buttons and pale outlined secondary buttons. Buttons have a modest corner radius, readable sans labels, and enough padding for touch. Hover lifts them slightly and changes fill; pressing returns them to their resting position. Preserve a visible focus outline.

Comparison cards can share aligned prices and feature lists. A featured card keeps its border and badge when a different option is selected; the chosen control gets the blue fill and explicit selected semantics. For questions, use native disclosures with ruled rows and a plus that rotates when opened. Include these only when the brief requires them.

## Images

Use grayscale editorial photographs in wide crops at the top of white cards, with text beneath. Reserve dimensions and keep the important subject visible. The product illustration can retain blue accents and soft depth. Avoid substituting generic photography for a useful explanation of the customer's product. Portraits are optional; text attributions work within this layout.

## Motion

Use the interaction and easing tokens for brief hover responses. Keep the hero diagram and its connecting lines still. Honor reduced motion by removing transitions and press movement. Do not add a page entrance sequence or continuous decorative animation.

## Responsive behavior

At widths around 1050px, tighten gaps while preserving the column relationships. At 760px and below, stack the hero, prose pairs, editorial cards, process steps, quotations, plans, and disclosure layout. Facts can stay in two columns, as can short feature entries. At 480px, make feature and benefit lists single-column and footer groups two-column. Keep the diagram beneath the opening copy, sized within the container, and preserve every action.

## Design limits

Keep blue attached to meaningful emphasis. Avoid turning every section into a card, adding unrelated accent colors, or filling empty space with fabricated statistics and endorsements. Choose sections from the customer's brief and retain the existing stack, routes, and behavior.

## Authoritative tokens

| CSS variable | Value |
| --- | --- |
| --dp-color-ground | #fcfcfd |
| --dp-color-ink | #16191f |
| --dp-color-ink-secondary | #454c58 |
| --dp-color-ground-muted | #f3f4f6 |
| --dp-color-rule | #dde0e6 |
| --dp-color-accent | #074ce0 |
| --dp-color-field | #16191f |
| --dp-color-on-field | #fcfcfd |
| --dp-color-on-field-secondary | #d0d4dd |
| --dp-color-panel | #ffffff |
| --dp-color-on-accent | #ffffff |
| --dp-typography-fallback | sans-serif |
| --dp-typography-body | 16px |
| --dp-typography-interface | 15px |
| --dp-typography-small | 14px |
| --dp-typography-metadata | 13px |
| --dp-typography-label | 12px |
| --dp-typography-body-leading | 1.6 |
| --dp-spacing-grid-gap | 24px |
| --dp-radius-panel | 12px |
| --dp-border-hairline | 1px |
| --dp-motion-interaction | 160ms |
| --dp-motion-easing | ease-out |
</design-system>
</prompt>
Modern Dark , keep as default dark theme with a toggle button in the landing page.<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.
Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>
<design-system>
# Modern Dark
## Identity
Use a near-black page, quiet grey reading text, and bright white statements. Broad pools of white light reveal a small number of opaque graphite objects. Keep the typography regular and precise. A tiny mint signal can identify a live or selected state; it is not a general accent color.
## Layout
Work on a twelve-column grid with a shared maximum width and generous gutters. Let a large opening statement occupy most of the left side while a narrower product object sits to the right, partially sharing its space. Keep the object clear of readable copy. A ruled row of facts can anchor the bottom of this opening when the brief supplies useful facts.
Carry the same column edges through the page. Available arrangements include an unequal open feature grid, one large editorial image beside two smaller image-and-text rows, and alternating pairs of explanatory text and framed product views. Give section headings more space than the compact information beneath them. A large closing statement can share its field with a cropped graphite object and a softer pool of white light. Use a ruled footer with clearly grouped links.
Use only the sections and interface views the customer needs. The decorative chart, bars, and nodes are examples of a product object, not required application features or data.
## Typography
Use Geist for display and reading, and Geist Mono for labels, dates, numerical values, and short notes. The aliases "Modern Dark Grotesk" and "Modern Dark Mono" refer to those faces. Keep large type at regular weight with tight tracking: the opening display scales from 44px to 104px with leading near one. Section titles are smaller, while body copy stays relaxed. Distinguish leading phrases with bright text and supporting phrases with a readable grey; do not fade essential information into the background.
## Color and surfaces
The ground token is the darkest field. Panel and hairline roles separate opaque surfaces without bright outlines. Use bright for titles and primary actions, read for paragraphs, and meta for small supporting text. Restrict live to small status marks with an accompanying label or state.
White light may fall across the hero and closing object through soft radial gradients. Product objects can have subtle grey material gradients. Keep ordinary reading areas flat. Use the small panel radius for imagery and frames, and the pill radius for buttons; these serve different roles.
## Components
Use compact pill buttons with a white filled primary action and a dark outlined secondary action. Hover changes fill or border; focus remains a visible offset outline. Frame product views as opaque graphite panels. Keep functional interface content truthful and legible.
When comparisons are needed, use aligned columns with a quiet filled featured column. Show selection separately with a labeled control and a small signal. Disclosures use a numbered gutter, question, and plus/minus within ruled rows. These are available patterns, not required sections.
## Images
Use grayscale editorial photography with restrained contrast and slightly darkened image fields. A lead image can use a tall 4:5 crop, with square supporting images beside summaries. Small round grayscale portraits can identify real people. Preserve recognizable subjects and reserve image dimensions. Product screenshots should communicate the customer's actual product rather than reproduce abstract sample charts.
## Motion
Use the duration and easing tokens for brief control color changes. The white lighting is static. Do not add pointer-following light, staged entrances, floating panels, or animated decorative charts.
## Responsive behavior
Respond to the containing block. At 1180px, reduce gutters and give the opening copy the full grid width. Around 900px, simplify multi-column arrangements, use two-column facts and short-entry grids, and stack comparison options. At 560px, use the narrow gutter, single-column entries and quotations, and images above their text with wider crops. Scale decorative objects without covering copy. Keep the complete footer and all actions available.
## Design limits
Keep large areas neutral and opaque. Avoid colored glows, translucent glass, heavy display weights, and decorative motion. Do not invent metrics, testimonials, application states, or extra sections to fill the available patterns.
## Authoritative tokens
| CSS variable | Value |
| --- | --- |
| --dp-color-ground | #050505 |
| --dp-color-panel | #0e0e0e |
| --dp-color-hairline | #222222 |
| --dp-color-hairline-2 | #303030 |
| --dp-color-bright | #f2f2f2 |
| --dp-color-read | #a6a9ad |
| --dp-color-meta | #8a8d91 |
| --dp-color-live | #3fd6c6 |
| --dp-color-inverse-ink | #0a0a0a |
| --dp-color-dim | #96999d |
| --dp-typography-face | "Modern Dark Grotesk", "Helvetica Neue", Arial, sans-serif |
| --dp-typography-mono | "Modern Dark Mono", "SFMono-Regular", Menlo, monospace |
| --dp-spacing-gutter | 48px |
| --dp-spacing-gap | 24px |
| --dp-spacing-max | 1360px |
| --dp-radius-panel | 6px |
| --dp-radius-pill | 999px |
| --dp-border-hairline | 1px |
| --dp-motion-duration | 120ms |
| --dp-motion-ease | ease-out |
</design-system>
</prompt>Cyberpunk<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.
Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>
<design-system>
# Cyberpunk
## Identity
Use a near-black field, electric green signals, hard white headings, and dense monospaced records. Small cyan and magenta offsets suggest interference. Keep that interference static and local so the reading remains clear.
## Layout
Run a thin green signal rail along the main content with small section markers. Open with a large uppercase title and a compact geometric signal object to its right. Put descriptive copy and actions below, followed by a tightly ruled facts row when facts are available.
Carry the rail into unequal two-column sections: a narrower introduction beside a wider matrix, list, or record. Related process and benefit content can share a continuous track. An editorial group can pair one large image with smaller image-and-text entries beside it. Use horizontal comparison records instead of a row of rounded cards. Finish with another large green statement and a compact directory footer.
Let the brief determine the sections and their order. Barcodes, identifiers, channel labels, and diagram elements are optional decorative marks; they must not masquerade as real security or product status.
## Typography
Use IBM Plex Sans for display and headings, bound to "Cyberpunk Plex Sans", and IBM Plex Mono for reading, metadata, and controls, bound to "Cyberpunk Plex Mono". Set major statements in semibold uppercase with tight tracking and compact leading. The wide opening title scales from 68px to 138px. Keep explanatory paragraphs smaller and regularly spaced. Restrict displaced color copies or cuts to short display elements; body text remains intact.
## Color and surfaces
Ground is nearly black. Ink is hard white; ink-body and ink-muted carry reading and supporting text. Accent is green for rails, primary actions, signals, and selected states. Registration cyan and interference magenta appear sparingly at corners, small icons, or short fractures. Plate is a slightly raised dark field, with line and control-line supplying its boundaries.
Keep square geometry, fine rules, clipped corners, and occasional stepped edges. A faint static scanline overlay or a small green glow can mark a signal, but neither should reduce text contrast. Avoid broad multicolor lighting.
## Components
Use compact uppercase monospaced actions. A green primary button can have diagonally clipped opposing corners; secondary actions are ruled or outlined. Hover responds immediately through inversion or a brighter edge. Press movement is a small direct offset, with no easing. Keep an offset focus outline visible outside clipped shapes.
Feature matrices use open ruled cells. Process rows connect numbered markers along a vertical track. Comparisons use broad rows with separate identity, terms, and feature columns; selection adds a green inset edge and a filled control indicator. Disclosures use thin separators and a clear open/closed marker. Include these patterns only when needed.
## Images
Use grayscale photographs with modest added contrast. Keep image subjects recognizable beneath any fine static scanlines. A lead image may have a clipped corner, while smaller images sit beside concise text records. Reserve dimensions and adjust each crop for its subject. The interface does not need portraits, video, or a photographic hero.
## Motion
Keep the signal objects, fractures, and scanlines still. The interaction token is immediate. Do not add flashing glitches, animated noise, parallax, or timed text reveals. State changes should be readable without motion.
## Responsive behavior
At 1050px, tighten the main split, reduce the signal object, and let comparison details move beneath their identity and terms. At 700px, stack the section introduction above its content, collapse matrices and record groups, and retain a narrow green rail. The opening title scales down and supporting facts can remain in two columns. Small editorial entries can keep a thumbnail beside text. Stack comparison rows internally and use two-column footer groups.
## Design limits
Keep interference away from important copy and controls. Avoid rounded cards, large neon gradients, moving glitches, and fabricated terminal output. Use only the customer's actual claims, features, and states; the signal vocabulary does not require a fictional hacking narrative.
## Authoritative tokens
| CSS variable | Value |
| --- | --- |
| --dp-color-ground | #020303 |
| --dp-color-accent | #38ff8e |
| --dp-color-interference | #ff65d8 |
| --dp-color-registration | #65f8ff |
| --dp-color-ink | #f8fffa |
| --dp-color-ink-body | #d3dbd5 |
| --dp-color-ink-muted | #c2cbc5 |
| --dp-color-plate | #090e0b |
| --dp-color-line | #304c3b |
| --dp-color-control-line | #659579 |
| --dp-typography-display | "Cyberpunk Plex Sans", sans-serif |
| --dp-typography-mono | "Cyberpunk Plex Mono", monospace |
| --dp-typography-small | 14px |
| --dp-typography-label | 12px |
| --dp-typography-metadata | 11px |
| --dp-spacing-gutter | clamp(22px, 4.5cqi, 72px) |
| --dp-spacing-column-gap | 50px |
| --dp-radius-control | 0 |
| --dp-border-hairline | 1px |
| --dp-motion-interaction | 0s |
</design-system>
</prompt>claymorphism<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.
Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>
<design-system>
# Claymorphism
## Identity
Use soft, inflated forms with broad light from the upper left. Dark plum-grey text sits on pink cushions, cream reading trays, and pastel mint, lavender, butter-yellow, and pale-blue objects. Rounded edges and inset shading should make the forms feel molded, while the text remains crisp and flat.
## Layout
Open with a large pink cushion carrying the headline and actions on the left and a cluster of rounded objects on the right. Shapes can overlap within their reserved area. Keep the opening copy unobstructed. Small supporting facts can occupy individual pastel cushions beneath it.
Group related content inside a shared cream tray with generous internal space. Within it, use an unequal feature arrangement: one larger item beside smaller explanations, then an editorial shelf with a lead story and compact supporting rows. A lavender decision tray can hold broad horizontal comparison shelves and disclosures. Return to pink for the closing, then cream for the footer.
Use these arrangements according to the brief. Keep the larger containers distinct from the smaller objects inside them; do not isolate every paragraph in its own cushion. Sculptures, factual rows, and comparisons are available patterns rather than content obligations.
## Typography
Use Instrument Sans throughout, bound to "Claymorphism Instrument". Set the main title in bold with tight tracking and a compact line-height; the wide title scales from 54px to 94px. Keep section headings bold but smaller. Reading text uses the body size and reading-leading tokens. Small labels and captions should remain dark enough to read against their pastel background. Avoid rounded novelty fonts competing with the shapes.
## Color and surfaces
Ground supplies the pale surrounding page. Accent supplies the pink lead and emphasized comparison shelf. Surface is cream; the support, compare, warm, and cool roles supply mint, lavender, yellow, and blue. Use ink and ink-secondary for text.
Combine a broad outer shadow with a light inset along the upper-left edge and a darker inset on the lower-right edge. Keep this light direction consistent across trays, buttons, and objects. Use the larger tray radius for shared containers, the surface radius for cushions, and the control radius for pill buttons. Text should not inherit blurred shadows.
## Components
Buttons are thick pills with inset highlights and a soft grounding shadow. Hover raises them slightly; pressing lowers and compresses them. Ghost actions can remain plain text beside the primary button. Keep visible focus separate from the shading.
Use broad horizontal shelves for comparisons, with identity and price, feature details, and an action. A pink featured shelf stays pink independently of the selected control. Selection can use a recessed dot plus pressed semantics. Disclosures are smaller cream cushions with a recessed circular plus/minus. Use real labels and content for every control.
## Images
Place editorial images in rounded inset wells inside cream cards. Keep natural image color and crop for the subject. A lead story can have a larger image above its text, with supporting stories using image-and-text rows. Round portraits may identify named authors or speakers, reusing the same portrait for the same person. Abstract molded shapes are decorative and need no invented product meaning.
## Motion
Use the interaction token for short hover and press responses. The sculpture is static. Remove movement and transitions for reduced motion. Avoid floating loops, bouncing ornaments, or staggered page entrances.
## Responsive behavior
At 1100px, tighten gaps, scale the sculpture, and let comparison actions move beneath the identity column. At 760px, place the sculpture below the headline, use two-column fact cushions, stack prose and stories, and turn steps into a vertical sequence. Keep the shared trays visible. At 460px, reduce decorative forms further, use single-column feature details and comparison lists, and retain two-column footer groups where they fit. Required text and actions must never be hidden by the sculpture.
## Design limits
Keep forms soft but opaque and readable. Avoid glass, sharp metallic edges, flat unshaded pastel rectangles, and shadows that muddy small text. Do not invent plans, social proof, or metrics to populate the available shelves.
## Authoritative tokens
| CSS variable | Value |
| --- | --- |
| --dp-color-ground | #f1f2fa |
| --dp-color-ink | #383139 |
| --dp-color-ink-secondary | #48404b |
| --dp-color-accent | #f6a3ca |
| --dp-color-surface-support | #c0efdc |
| --dp-color-surface-compare | #ded0f9 |
| --dp-color-surface-warm | #f9e7a8 |
| --dp-color-surface-cool | #c5e5fb |
| --dp-color-surface | #fffdf7 |
| --dp-typography-face | "Claymorphism Instrument", sans-serif |
| --dp-typography-body | 16px |
| --dp-typography-small | 15px |
| --dp-typography-metadata | 13px |
| --dp-typography-caption | 12px |
| --dp-typography-reading-leading | 1.55 |
| --dp-typography-emphasis | 700 |
| --dp-spacing-gap | 24px |
| --dp-spacing-gap-compact | 20px |
| --dp-spacing-paragraph-gap | 18px |
| --dp-radius-surface | 38px |
| --dp-radius-tray | 70px |
| --dp-radius-control | 999px |
| --dp-radius-disclosure | 25px |
| --dp-border-focus-width | 3px |
| --dp-motion-interaction | 180ms |
</design-system>
</prompt>ORGANIC<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.
Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>
<design-system>
# Organic
## Identity
Build a shared worktable of sand-colored paper, irregular shapes, dark brown type, moss, and fired clay. The page feels assembled from broad sheets and gathered objects. Serif headings and subdued photography keep it readable beneath the uneven edges.
## Layout
Use a generous split opening: a compact serif statement and actions beside a loose arrangement of flat organic forms. A pale facts tray can overlap the opening's base. Give its corners different curves so it feels like a separate sheet laid across the composition.
Let related reading and feature lists share one clay field. A process and its supporting benefits can occupy a continuous moss basin, with large light numbers and sparse dividing lines. Use uneven image proportions, slightly tilted paper quotations, and broad horizontal comparison rows where the content calls for them. Close with another quiet arrangement of shapes above a stone-colored footer.
Keep these as useful composition patterns. The brief determines the sections, their order, and whether facts, quotes, or comparisons belong at all.
## Typography
Use Source Serif 4 for medium-weight statements and headings, bound to "Organic Source Serif". Use Instrument Sans for reading and controls, bound to "Organic Instrument Sans". Headings have tight tracking and compact line spacing, with an opening scale of 46px to 70px on wide layouts. Keep paragraphs comfortably spaced and narrower than the full colored field. Small sans labels and large serif numbers provide secondary hierarchy.
## Color and surfaces
Sand is the page ground; paper is the lighter raised sheet. Dark brown ink carries reading. Moss and fired clay form large fields, while terracotta, stone, and dried grass supply a few smaller shapes. Maintain light text on the darker fields.
Keep a faint continuous paper grain beneath the content. Use irregular rounded silhouettes with modest rotations. Shapes should have broad, calm edges, and overlaps should leave text clear. Avoid making every object the same blob or applying an identical card treatment to each section.
## Components
Use softly rounded, solid moss actions with a quieter outlined or text alternative. Hover can change the fill; press can compress slightly. Keep visible focus outside the control edge.
Features sit in open lists with small drawn symbols. Numbered steps use large figures and simple separators. Optional comparison rows divide identity, details, and action across a shared width. A featured row can stay moss while selection adds a distinct inset outline. Disclosures use clear ruled rows and visible open states.
## Images
Choose photographs of real materials, objects, or places. Apply a mild sepia cast and reduce saturation so they sit with the earth palette. Scene images can fill irregular crops; isolated objects need enough space to retain their silhouette. Slight image rotation is useful when the surrounding reading remains upright. Supply meaningful alternative text and keep decorative forms hidden from assistive technology.
## Motion
Use the brief interaction timing for color changes and a small pressed scale. Keep the page arrangement and organic forms still. Respect reduced motion by removing transitions and transforms from interactive feedback.
## Responsive behavior
At 1000px, tighten the major splits and spacing. At 700px, stack the opening, reading sections, images, steps, quotes, and comparison contents. Facts can remain in two columns. Remove quotation rotations to give small-screen reading a straight edge, while restrained image tilts can remain. Preserve the clay and moss groups as continuous fields, and keep footer links in two columns.
## Design limits
Avoid glossy gradients, glass, bright synthetic greens, excessive leaves, and deep floating shadows. Uneven edges must not compromise alignment or hit areas. Use the customer's real subject and claims; earth colors do not imply environmental credentials.
## Authoritative tokens
| CSS variable | Value |
| --- | --- |
| --dp-color-ground | #eee6d6 |
| --dp-color-surface | #f5eddf |
| --dp-color-ink | #29251d |
| --dp-color-primary | #35422d |
| --dp-color-field | #694737 |
| --dp-color-art-accent | #ad7d62 |
| --dp-color-surface-muted | #ddd5c3 |
| --dp-color-highlight | #b9b28b |
| --dp-color-ink-muted | #443b2f |
| --dp-typography-display | "Organic Source Serif", Georgia, serif |
| --dp-typography-reading | "Organic Instrument Sans", sans-serif |
| --dp-typography-body | 16px |
| --dp-typography-reading-small | 15px |
| --dp-typography-control | 14px |
| --dp-typography-caption | 13px |
| --dp-typography-metadata | 12px |
| --dp-typography-reading-leading | 1.8 |
| --dp-spacing-content-gap | 24px |
| --dp-radius-control | 27px 19px 29px 16px / 22px 26px 19px 29px |
| --dp-border-hairline | 1px |
| --dp-motion-interaction | 240ms ease |
</design-system>
</prompt>Playful<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.
Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>
<design-system>
# Playful Geometric
## Identity
Use an activity-book composition with outlined geometric pieces, warm paper, white reading areas, and violet, pink, amber, and mint accents. Broad rounded containers, visible hard offsets, and bold friendly type give the page its character.
## Layout
Open with a slightly wider text column beside a static assembly of colorful shapes. Give the opening statement substantial scale and leave clear space around the actions. A fact strip can sit across layered mint and outlined bases.
Group related explanation, features, and editorial images inside a shared white book shape with violet offset backing and a small colored tab. Use a numbered process strip with a connecting line when sequence matters. Benefits can share a pale-mint panel, while quotations use speech-like panels. Broad comparison tickets are available for choices. A mint back-cover shape can hold the closing statement with sparse geometric confetti around its edges. Inset a dark slate footer into that cover, using pale text and a broad curved top.
Choose these patterns according to the brief. The design does not require educational content, a fixed section count, or sample prices and quotes.
## Typography
Use Host Grotesk for heavy statements and headings, bound to "PlayfulGeometricDisplay". Use Instrument Sans for reading, labels, and controls, bound to "PlayfulGeometricReading". Wide opening headings scale from 62px to 102px, with compact leading and tight tracking. Keep paragraphs relaxed and substantially smaller. Large numbered shapes can mark a sequence without making every label oversized.
## Color and surfaces
Use warm pale paper as ground and white for the main book's reading area. Deep blue-grey supplies both ink and outlines. Violet is the main action color; pink, amber, and mint divide decorative pieces and selected supporting regions.
Use clearly visible outlines and hard offset shadows. Main panels have broad rounded silhouettes; small geometric pieces can be circles, triangles, arches, or blocks. Keep enough open ground between pieces to read their shapes. Avoid spreading every accent equally across every section.
## Components
Actions are rounded outlined controls with a colored fill and a firm offset shadow. Hover lifts slightly; press reduces the offset. Keep focus visible beyond the shadow.
Feature entries belong to the shared book grid. Numbered steps can sit on differently shaped badges along a connecting strip. Optional comparison tickets separate the choice, details, and action horizontally. Selection can add a pale-violet fill and violet shadow; keep any featured marker independent. Disclosures use open/close marks and readable outlined rows.
## Images
Use natural-color photographs with varied arched or rounded silhouettes and colored hard shadows. Stagger the group rather than making every image identical. Preserve the subject inside the crop and avoid layering shapes over meaningful details. Reserve image dimensions and provide useful alternative text. Decorative geometric pieces should not be announced as content.
## Motion
Use brief hover lifts and pressed feedback for controls. Keep the shape assembly, book layers, connecting strip, and confetti still. Remove transitions and transforms for reduced motion.
## Responsive behavior
At 1100px, tighten wide grids and geometric spacing. At 760px, stack the opening, book contents, editorial images, steps, quotes, and comparison internals. Preserve the book silhouette with narrower insets and smaller offsets. Facts and footer groups can remain in two columns. At very narrow widths, reduce control and heading sizes without shrinking readable labels or losing the outlined edge.
## Design limits
Keep geometry sparse enough to explain the composition. Avoid childish clip art, animated confetti, blurred shadows, glass, and a different card shape for every sentence. The customer's content supplies the tone; color and shapes should not introduce invented claims or a compulsory playful voice.
## Authoritative tokens
| CSS variable | Value |
| --- | --- |
| --dp-color-ground | #fffdf5 |
| --dp-color-panel | #ffffff |
| --dp-color-ink | #253044 |
| --dp-color-outline | #252b3a |
| --dp-color-accent | #6434df |
| --dp-color-accent-secondary | #ff78c5 |
| --dp-color-accent-warm | #ffd05b |
| --dp-color-accent-fresh | #9bf1cd |
| --dp-color-field-soft | #e9fff5 |
| --dp-color-selection | #f1ebff |
| --dp-color-rule-muted | #b8b6c5 |
| --dp-typography-display | "PlayfulGeometricDisplay", sans-serif |
| --dp-typography-reading | "PlayfulGeometricReading", sans-serif |
| --dp-typography-reading-compact | 16px |
| --dp-typography-label | 14px |
| --dp-typography-metadata | 13px |
| --dp-typography-reading-leading | 1.65 |
| --dp-spacing-gap-compact | 12px |
| --dp-radius-corner | 17px |
| --dp-border-outline-width | 3px |
| --dp-border-detail-width | 2px |
| --dp-motion-interaction | 180ms |
</design-system>
</prompt>sketch<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.
Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>
<design-system>
# Sketch
## Identity
Use a shared working sheet with warm paper, handwritten text, pencil-like drawings, blue notes, red corrections, and yellow highlights. Slightly uneven lines and taped references give the page a drawn quality, while consistent spacing keeps it easy to read.
## Layout
Open with a large handwritten statement beside a smaller cluster of notes and a simple line drawing. An irregular underline and a hand-drawn arrow can direct attention toward the main action. Facts, when useful, sit beneath a drawn bracket.
Arrange longer reading as open thoughts with generous space between them. Features can use small line illustrations beside notes, with a little vertical staggering on wide layouts. Editorial images look like taped references, and a process can sit on a slightly darker irregular paper strip with circled numbers and connecting arrows. Quotes can use outlined speech notes; comparisons can use broad horizontal rows with one highlighted sheet. End with a large red statement above a lightly divided footer.
Use only the content groups the brief calls for. The working-sheet treatment does not require team doodles, fabricated comments, prices, or a fixed sequence of sections.
## Typography
Use Working Sheet Marker for large statements and headings, bound to "Sketch Working Marker". Use Working Sheet Hand for reading, bound to "Sketch Working Hand". These are separate original drawn fonts. Keep the marker face heavier and the hand face large enough for continuous reading; its base is intentionally larger than a typical sans body face. If these font files are unavailable, choose a legible handwritten pair with the same weight distinction and reassess the line breaks.
Keep lines loosely spaced and headings slightly irregular. Avoid tight typesetting that makes the handwriting run together. Small rotations belong to selected notes or headings, not every paragraph.
## Color and surfaces
Warm paper carries dark pencil ink. Muted ink supports secondary text; erased-line grey supplies quiet rules. Blue marks annotations, red marks actions and emphasis, and pale yellow supplies highlights. Lighter scraps distinguish a few notes and image mounts.
Use faint paper grain, uneven thin strokes, irregular corner curves, and small hard offsets. Tape can have torn ends and partial transparency. Keep the page mostly open paper, with each scrap or highlight serving a clear reading purpose.
## Components
Buttons have irregular outlined edges and a small pencil or red offset shadow. Hover can straighten or tilt them slightly while compressing the shadow; press settles onto the page. Use a clear dashed blue focus outline.
Features and benefits pair small drawings or checks with text. Optional comparison rows use yellow behind the featured choice, while selection changes the action's treatment separately. Disclosures use hand-drawn marks with an obvious open state. Keep real button, link, and disclosure semantics beneath the drawn appearance.
## Images
Use natural-color photographs or artwork inside pale paper mounts, with small rotations and a tape strip near the edge. Contain artwork when its margins matter; crop scenes around the subject. Preserve the photograph's detail instead of converting every image into a drawing. Reserve dimensions, provide useful alternative text, and hide decorative tape, arrows, and doodles from assistive technology.
## Motion
Use very brief changes for button tilt and pressed depth. Keep handwriting, arrows, paper, and sketches still. Reduced motion removes transforms and transitions while preserving visible state feedback. Do not animate strokes drawing themselves across the page.
## Responsive behavior
Start with a single-column working sheet, two-column facts, and two-column footer groups. At 680px, features and references can form two-column groups, facts expand across a row, and comparisons gain a second column. At 1050px, use the full split opening, staggered reference row, horizontal process, and wider comparison ledger. On small screens, reduce rotations and decorative offsets, let notes stack, and keep handwritten reading text generously sized.
## Design limits
Avoid illegible cursive, heavy crumpled-paper textures, dense doodle borders, and polished geometric cards. Drawn marks should direct attention or group content. They must not obscure text, alter the reading order, or make controls look unfinished.
## Authoritative tokens
| CSS variable | Value |
| --- | --- |
| --dp-color-ground | #f7f2e7 |
| --dp-color-ink | #38352f |
| --dp-color-ink-muted | #514d44 |
| --dp-color-line | #b3ac9d |
| --dp-color-accent | #9e3a2e |
| --dp-color-annotation | #344c69 |
| --dp-color-highlight | #f0dfa0 |
| --dp-color-scrap | #fcf8ef |
| --dp-typography-reading-face | "Sketch Working Hand", cursive |
| --dp-typography-display-face | "Sketch Working Marker", cursive |
| --dp-typography-body | 24px |
| --dp-typography-reading | 23px |
| --dp-typography-detail | 21px |
| --dp-spacing-item-gap | 16px |
| --dp-radius-control | 9px 4px 17px 5px / 4px 12px 5px 9px |
| --dp-border-fine-stroke | 1.5px |
| --dp-motion-control | 100ms |
</design-system>
INDUSTRIAL</prompt><prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.
Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>
<design-system>
# Industrial
## Identity
Build one continuous instrument chassis in cool grey, with recessed dark screens, raised keys, engraved-style labels, and small orange indicators. The physical depth comes from consistent highlights and shadows, while the content remains ordinary readable text and recognizable controls.
## Layout
Contain the page in a broad rounded housing with a narrow vertical seam and numbered bays. Open with a large heading beside a compact control assembly: vent slots, a circular dial-shaped action, and a secondary key. A recessed facts display can sit below the opening.
Give related content shared hardware-like panels. Features can occupy an inset matrix within a raised deck; editorial images sit in recessed wells. Numbered steps can connect across the chassis. Benefits and quotations can share a dark output deck, while optional comparisons use removable-looking horizontal modules inside a recessed tray. A pale closing bay and the footer remain part of the same housing.
Choose the content groups the brief needs. The treatment does not require fabricated live readings, machine specifications, prices, or operational status.
## Typography
Use Host Grotesk for headings and reading, bound to "Industrial Host". Use IBM Plex Mono for small labels and technical-looking metadata, bound to "Industrial Plex". Headings are bold with tight tracking; the opening scales from 54px to 106px on wider layouts and uses compact leading. Reading text stays much smaller with clear spacing. Keep small monospaced labels brief and readable.
## Color and surfaces
Chassis is the main cool-grey ground. Raised is the lighter key and panel material; well is the darker recessed material. Use dark ink and slate labels on these areas. Field is the deep screen color, with distinct light roles for primary and secondary text. Orange identifies a few indicators and action details.
Light falls from the upper left. Raised parts have a pale top edge and a darker lower edge; recesses reverse that depth. Mild grey gradients can describe the housing and dial. Use small key corners within the larger rounded case. Screws, vents, and grooves should explain its construction without covering reading.
## Components
Navigation uses a bank of raised keys. Main actions can be rectangular keys or one circular dial-shaped button with a clear label and symbol. Hover lifts slightly; press sinks into the housing and changes the shadow. Keep focus visible outside the physical edge. A dial shape remains a button unless the project actually needs a rotary input.
Optional comparison modules use an inset pressed key and orange selection lamp, alongside a textual selected state. Featured emphasis is separate. Disclosures have raised plus/minus keys; open content stays in the reading bay. Decorative indicators must not imply a real system state.
## Images
Use grayscale photographs placed inside recessed rectangular wells with a small inset rim. Preserve complete subjects with containment where needed, including visible margins around objects or artwork. Reserve image dimensions and describe meaningful subjects in alternative text. Vents and screws are decorative.
## Motion
Use short key and dial transitions with a slight settling ease. Keep the chassis, meters, vents, and indicators still. Respect reduced motion by removing movement from hover and press while retaining clear depth and color changes.
## Responsive behavior
At 1100px, narrow the opening's control column and simplify comparison modules. At 760px, stack the large content areas and turn the control assembly into a horizontal unit beneath the heading. Facts remain in two columns; features, stories, steps, benefits, quotes, and comparisons become vertical. Keep the housing edge and bay numbering at a smaller scale, with two-column footer groups. At 370px, reduce the dial assembly and stack comparison details further.
## Design limits
Keep physical decoration subordinate to content and interaction. Avoid glossy chrome, rust, hazard stripes everywhere, animated fake telemetry, and unlabeled switches. Recessed reading areas need strong contrast; texture and shadows must not muddy the text.
## Authoritative tokens
| CSS variable | Value |
| --- | --- |
| --dp-color-chassis | #cbd0d2 |
| --dp-color-raised | #e7eaeb |
| --dp-color-well | #b6bec2 |
| --dp-color-ink | #181e22 |
| --dp-color-label | #414b52 |
| --dp-color-field | #20272b |
| --dp-color-on-field | #f2f4f4 |
| --dp-color-on-field-muted | #d8dee1 |
| --dp-color-accent | #f15b22 |
| --dp-typography-sans | "Industrial Host", sans-serif |
| --dp-typography-mono | "Industrial Plex", monospace |
| --dp-typography-body | 17px |
| --dp-typography-reading | 16px |
| --dp-typography-metadata | 13px |
| --dp-typography-label | 11px |
| --dp-spacing-column-gap | 25px |
| --dp-spacing-compact-gap | 12px |
| --dp-radius-key | 4px |
| --dp-radius-circular | 50% |
| --dp-border-hairline | 1px |
| --dp-motion-navigation | 130ms |
| --dp-motion-key | 140ms |
| --dp-motion-dial | 150ms |
| --dp-motion-settle | cubic-bezier(0.3, 0.7, 0.4, 1.25) |
</design-system>
</prompt>RETRO<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.
Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>
<design-system>
# Retro
## Identity
Use an overcrowded desktop of offset windows, hard bevels, grey frames, white reading wells, and bright yellow, navy, pink, and teal fields. The familiar window furniture gives the page structure. Large contemporary sans headings keep the main message readable within it.
## Layout
Arrange the wide page on a twelve-column grid with windows that begin and end on different columns. Open with a broad yellow launch window beside a compact monitor-like facts panel. A bright pink strip can span beneath them.
Continue with overlapping readme-like text, a capability window with its own side panel, and a teal field of smaller editorial windows. A setup sequence can use numbered steps and a segmented progress motif. Benefits can occupy yellow; genuine quotations can appear as guestbook entries inside a pink patterned region. Optional comparisons use horizontal rows within a shared window. Close with a smaller dialog above a broad footer with folder-like link headings.
Keep the reading order clear through the offset composition. The brief decides which windows and content types exist; decorative application names, sample interface values, prices, and quotes are optional.
## Typography
Use Host Grotesk for heavy display headings, bound to "Retro Display". Use IBM Plex Sans for reading and interface labels, bound to "Retro Interface", and IBM Plex Mono for compact metadata, bound to "Retro Mono". The opening is uppercase, tightly tracked, and close-set, scaling from 62px to 94px on wider layouts. Keep paragraphs at a comfortable reading size. Do not turn all text into a tiny pixel font.
## Color and surfaces
Grey forms the window frame. Use white for inset reading areas, black for ink, navy for title bars, and teal for selected desktop regions. Yellow, purple, and pink carry strong local emphasis. Links can use a saturated blue hover state.
A fine tiled grey desktop can show between the windows. Use square corners, hard black offsets, and white top-left bevels opposed by dark bottom-right edges. Inset wells reverse the edge treatment. Keep large color fields flat and avoid soft shadows or blurred overlays.
## Components
Buttons resemble raised keys with clear labels and squared bevels. Pressing moves the key slightly and reverses its depth. Preserve a visible keyboard focus treatment.
Window title bars can name real content groups. Any close, minimize, folder, or navigation symbol presented as a control must have a real action and accessible label; otherwise make the ornament clearly decorative. Optional comparison selections use a purple pressed key, with a featured marker kept separate. Disclosures retain recognizable open/close behavior inside their window.
## Images
Use natural-color photographs in small inset picture windows. Keep crops direct and subjects recognizable. If genuine author or customer portraits exist, use compact square avatars beside their attribution and reuse each person's image consistently. Portraits and guestbook entries are not required. Reserve dimensions and supply meaningful alternative text.
## Motion
Controls use immediate pressed feedback. A decorative ticker arrow can shift in two small steps at a slow repeating cadence; keep the text beside it still. Disable that repetition for reduced motion. Do not simulate loading, error dialogs, or system alerts unless they describe a real state.
## Responsive behavior
At 1050px, tighten side panels and move comparison details beneath their main row. At 760px, stack the opening, readme, and major windows while retaining small horizontal offsets. Editorial windows can become image-and-text rows; steps and guestbook entries stack. At 480px, stack editorial contents, features, and benefits, and reduce decorative offsets. Facts and footer groups can remain in two columns. Keep bevels crisp and labels comfortably tappable.
## Design limits
Avoid distressed vintage textures, sepia filters, rounded modern cards, and fake operating-system behavior. Preserve the desktop's compact density without forcing tiny type, overlapping essential content, or horizontal page overflow.
## Authoritative tokens
| CSS variable | Value |
| --- | --- |
| --dp-color-window | #d4d4d4 |
| --dp-color-ink | #000000 |
| --dp-color-bevel-dark | #808080 |
| --dp-color-bevel-light | #ffffff |
| --dp-color-accent | #6600ff |
| --dp-color-highlight | #ffff00 |
| --dp-color-link-hover | #0000ff |
| --dp-color-desktop | #008080 |
| --dp-color-emphasis | #ff00b8 |
| --dp-color-titlebar | #000080 |
| --dp-typography-interface | "Retro Interface", sans-serif |
| --dp-typography-display | "Retro Display", sans-serif |
| --dp-typography-mono | "Retro Mono", monospace |
| --dp-typography-body | 16px |
| --dp-typography-supporting | 15px |
| --dp-typography-label | 12px |
| --dp-typography-body-leading | 1.4 |
| --dp-spacing-pane-inset | 5px |
| --dp-spacing-item-gap | 10px |
| --dp-radius-control | 0 |
| --dp-border-frame | 2px |
| --dp-border-rule | 1px |
| --dp-motion-ticker-cycle | 1s |
</design-system>
</prompt>