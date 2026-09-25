# Classy Captures — Felt.

## Design recommendation

Build the portfolio around one emotional idea: **Felt.** The photographs should bring visitors close to the people in them. Keep the language short and specific; allow the imagery to carry the mood. The line underneath the concept is: **For everything you felt. And everything you missed.** This is a proposed creative direction, not an existing brand claim.

## What the references contribute

| Reference | Feedback / observed pattern | Application to Classy Captures |
| --- | --- | --- |
| [Vivek Krishnan](https://vivekkrishnan.com/) | A single narrative word, unscripted; images and motion reinforce it | Use the original concept Felt., with short changing phrases and restrained motion |
| [House on the Clouds](https://www.houseontheclouds.com/) | Photography and films presented as the main experience | Large image areas, generous space and separate photography/film destinations |
| [Wedding Bells](https://weddingbellsstories.com/) | Full-screen photographic opening and visual story navigation | Open with the team's own work and retain clear routes into the portfolio |
| [Stories by RG](https://www.storiesbyrg.com/) | Strong narrative plus repeated image-led paths to different collections | Four prominent image gateways, each opening a dedicated page |
| [Current Classy Captures](https://classycaptures.com/) | Natural moments, presence, a 30-year legacy, weddings/pre-weddings/portraits/films | Preserve the established service scope and authentic portfolio; refine hierarchy and wording |

Reference sites inform composition and navigation only. Do not reuse their photographs, copy, testimonials or celebrity associations.

## Homepage sequence and exact proposed copy

1. **Opening — 90% of the viewport.** One emotionally legible landscape photograph from Classy Captures. An approved short film can replace the still when available. White overlaid wordmark and minimal navigation. Large italic “Felt.” with rotating phrases “in a glance.” / “in an embrace.” / “all over again.” Caption: “Wedding photography & films · Bengaluru & beyond”. Clear pause control and scroll cue.
2. **The point of view.** Eyebrow: “01 / The way we see it”. Heading: “Some things are too important to pose.” Body: “The hands that find each other. The laugh that interrupts a vow. The people who make it yours. We stay close to the feeling, so you can stay in the moment.”
3. **Multiple paths through images.** Eyebrow: “02 / Find your story”. Four large, staggered images linking to Weddings, Pre-weddings, Films and Portraits. Make the whole image and caption clickable, with visible text labels and an arrow.
4. **The experience.** Dark olive section: “A little direction. A lot of being yourself.” Link to Our approach. Explain how the team helps people feel comfortable without overwhelming the photographs with sales copy.
5. **Invitation.** “Tell us what you’re dreaming of.” Link to the inquiry page, with verified email, telephone and Instagram contact options.

## Page map

| URL | Content and action |
| --- | --- |
| `/` | Narrative introduction and four image gateways |
| `/weddings` | Wedding collection, accessible photo viewer, inquiry link |
| `/pre-weddings` | Couple sessions, photo viewer, inquiry link |
| `/portraits` | Portrait collection, photo viewer, inquiry link |
| `/films` | Verified films where available; clear film inquiry and offered formats |
| `/about` | Philosophy, existing legacy, what working together feels like |
| `/inquire` | Name, email, optional phone/date, location, service, message and consent |
| `/privacy` | Concise description of inquiry data handling |

Later, after client approval, curated individual wedding stories can live at `/stories/<slug>`. Each requires an approved couple name, location, narrative, ordered images and related film. The demo must not invent these details.

## Visual specification

- Warm paper `#F5F2EA`, ink `#242820`, olive `#72745B`, beige `#D5CBB9`.
- Cormorant Garamond for expressive headings; Inter for navigation and body copy.
- Desktop hero title approximately 160px, mobile 100px; fluid scaling without horizontal overflow.
- Generous spacing and asymmetrical image sizing; no rounded card grid or heavy shadows.
- Photographs retain their natural palette. Use a subtle dark overlay only where required for white hero text.
- Desktop navigation: Stories, Films, Our approach, Inquire. Mobile uses a labelled, keyboard-accessible menu.
- Restrained fades; no scroll hijacking. Respect reduced-motion preferences and provide a pause control.

## Assets and content

Use only the team's existing portfolio images in the demo. Record their original URLs in the asset manifest. Optimize locally to WebP; reserve dimensions to prevent layout shift; eagerly load the hero and lazy-load later images. A short 15–25 second approved showreel with a matching poster is the preferred final hero. A still-image treatment is the truthful fallback until a usable video source is verified. Never substitute another photographer's reel or an AI-generated wedding for client work.

The Instagram handle is linked directly rather than using a fragile scraped social feed. No invented awards, client quotes, staff biographies or couple identities.

## Firebase and Vercel demo

Vercel serves the React/Vite frontend and a serverless inquiry endpoint. Firebase Firestore stores submitted inquiries through the server; public client reads and writes are denied. Credentials stay in server environment variables. The endpoint validates all inputs and provides honest failures. The demo does not send emails or WhatsApp messages automatically. The deployed demo is marked noindex to avoid competing with the existing site.

## Delegation contract

User-approved model: GPT-5.6 Sol (the initially requested 5.6 Astra is unavailable). Three bounded agents handle original asset selection, the frontend, and the Firebase endpoint. The parent owns this specification, dependency configuration, integration, visual review and Vercel deployment. Frontend instructions include the exact copy, color values, page map and interaction requirements above. Asset and backend changes are confined to separate files. Any divergence must be reported and resolved during integration.

## Review criteria

Review at desktop and mobile widths. Every visual gateway must open its matching route; direct route loading must work. Check photograph loading, navigation, image viewer, keyboard focus, reduced motion and the inquiry's success/error behavior. Verify Firebase persistence with a clearly marked synthetic test inquiry when credentials are configured. Verify the final Vercel URL. Before replacing the current live site, have the photography team approve the selected images, final showreel, copy, privacy wording and any individual wedding details.
