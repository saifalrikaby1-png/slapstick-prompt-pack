# Slapstick Prompt Pack

> Turn a simple cartoon gag into a continuity-safe, production-ready short-video pack for Reels, TikTok, YouTube, and AI video platforms.

Slapstick Prompt Pack is a creator-focused production workspace for building family-friendly animated shorts. A creator supplies the cast, prop, trap, platform, model, ratio, music, and vocal direction; the app returns a structured production pack containing cinematic prompts, synchronized timelines, audio direction, publishing copy, retention guidance, and quality checks.

Built for **OpenAI Build Week / Devpost**.

## Live Demo

- **Live app:** Coming after deployment
- **Demo video:** Coming after recording
- **Repository:** Coming after GitHub upload

## The problem

Producing a consistent AI-generated cartoon short requires much more than one video prompt. Creators must keep character identity, colors, scale, roles, props, framing, timing, sound, music, captions, and platform requirements aligned across many tools.

That manual coordination creates recurring problems:

- characters duplicate, morph, change color, or switch roles;
- start frames, video action, and end frames contradict one another;
- prompts ignore the selected ratio, duration, platform, or video model;
- music and sound effects fail to match visible action;
- creators repeatedly rewrite the same character descriptions and safety rules;
- publishing copy and production documents live in separate workflows.

Slapstick Prompt Pack centralizes that work and applies continuity safeguards automatically.

## Main features

### Dual generation modes

- **Demo Mode:** generates complete packs locally from production-ready templates. No API key or network request is required.
- **AI Mode:** sends the creative brief to a secure server-side OpenAI route and returns strict structured JSON.

### Complete production packs

Generated packs include:

- episode title;
- cinematic start-frame and end-frame image prompts;
- main video, selected-model, and alternative-model prompts;
- second-by-second video, music, and sound-effect timelines;
- music, sound-effects, and Character Vocal Lock plans;
- Character Bible information used during generation;
- Facebook, Instagram, TikTok, and YouTube publishing copy;
- pinned comment and retention checklist;
- Quality Summary and Production Safety Notes.

### Character Library / Brand Bible

- Save recurring heroes, enemies, friends, narrators, and supporting characters.
- Lock appearance, personality, colors, size, voice, movement, continuity, and negative rules.
- Generate one character field or a complete professional Character Bible.
- Choose whether suggestions replace or append to existing text.
- Use local professional suggestions in Demo Mode or GPT-powered suggestions in AI Mode.
- Start with detailed built-in profiles for Biscuit, Grumpy, and Sneaky.

### Production intelligence

- Prompt Quality Control settings inject selected safeguards before generation.
- Prompt Quality Inspector scores packs from 0–100 and reports passed checks, warnings, and fixes.
- AI Mode can fix weak sections or regenerate one selected section.
- Generate Safe, Viral, and Cinematic variants.
- Maintain ratio, duration, identity, role, prop, movement, music, SFX, and vocal continuity.

### Creator workflow tools

- Biscuit Demo preset
- Project presets
- Saved Production Pack history using browser storage
- Copy individual sections, variants, or the full pack
- Download production packs and variants as Word documents
- Launch OpenArt, Higgsfield, Runway, Google Flow, or PixVerse
- Search and filter saved packs by title, platform, and model

## How Codex was used

Codex served as the implementation and verification partner for the project. It helped:

- evolve the initial idea into a working full-stack application;
- implement the creator interface and local production engine;
- add secure server-side OpenAI routes and strict JSON output schemas;
- build the Character Library, presets, history, variants, exports, and quality systems;
- diagnose runtime and API errors without exposing credentials;
- run production builds and exercise Demo and AI workflows in the browser;
- verify generated sections, copy behavior, Character Bible integration, and continuity rules.

This README and the application source remain reviewable and editable like a normal TypeScript project; Codex accelerated the build rather than becoming a runtime dependency.

## How GPT-5.6 and the OpenAI API are used

AI Mode calls the OpenAI **Responses API** from server-side routes:

- `POST /api/generate` creates packs, variants, fixes, and selected-section regenerations.
- `POST /api/character-suggest` creates individual Character Bible suggestions or a complete character profile.

The routes currently use `gpt-5.6-sol` with strict JSON schemas. The model receives the creator's selected platform, video model, ratio, duration, visual style, tone, music direction, vocal settings, Character Bible, quality controls, and story ingredients.

The API key is read only from `process.env.OPENAI_API_KEY`. It is never placed in React state, browser storage, client bundles, or request payloads sent by the browser.

## Tech stack

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- vinext 0.0.50 with Vite 8 build tooling
- OpenAI Responses API
- `docx` and `file-saver` for Word exports
- Browser `localStorage` for first-version character, preset, and pack persistence

## Run locally

### Prerequisites

- Node.js `22.13.0` or newer
- npm or pnpm
- An OpenAI API key only if you want to test AI Mode

### Installation

```bash
git clone <your-repository-url>
cd slapstick-prompt-pack
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To verify a production build:

```bash
npm run build
npm run start
```

## Configure `OPENAI_API_KEY`

Create `.env.local` in the project root:

```dotenv
OPENAI_API_KEY=
```

Paste your key after the equals sign:

```dotenv
OPENAI_API_KEY=your_key_here
```

Restart the development server after changing `.env.local`.

Important:

- Never commit `.env.local`.
- Never place the key in `app/page.tsx` or any client-side variable.
- Never prefix the key with `NEXT_PUBLIC_`.
- If the key is absent, Demo Mode remains fully available.

## Test Demo Mode

1. Start the app and select **Demo Mode**.
2. Enter a hero, enemies, object, and trap.
3. Choose the platform, video model, ratio, duration, visual style, and tone.
4. Optionally configure music, voices, Character Library entries, and Prompt Quality Control.
5. Select **Generate Production Pack**.
6. Confirm that all output cards appear, including **Quality Summary** and **Production Safety Notes**.
7. Test **Copy Full Pack**, Word export, pack history, variants, and the Prompt Quality Inspector.

Demo Mode must not make an OpenAI API request.

## Test AI Mode

1. Add a valid `OPENAI_API_KEY` to `.env.local`.
2. Restart the local server.
3. Select **AI Mode** and confirm the badge says **AI Mode active**.
4. Complete the required story fields or load Biscuit Demo.
5. Select **Generate Production Pack**.
6. Confirm that the returned pack respects the selected platform, model, ratio, duration, music, vocals, Character Bible, and quality settings.
7. Test **Fix Issues with AI**, **Regenerate Selected Section**, and **Generate 3 Variants**.
8. In the Character Library, test **AI Suggest** and **Generate Full Character Bible**.

Safe UI messages are provided for:

- missing API key;
- invalid API key;
- insufficient quota or inactive billing;
- unavailable model;
- network or API request failure.

Server logs may contain safe diagnostic metadata, but the API key is never logged.

## Use the Biscuit Demo

Select **Biscuit Demo** to load:

- **Hero:** Biscuit the Orange Squirrel
- **Enemies:** Grumpy the Purple Hedgehog and Sneaky the Green Chameleon
- **Object:** glowing cookie
- **Trap:** rolling log backfire
- **Duration:** 15 seconds
- **Ratio:** 9:16 vertical
- **Platform:** Facebook Reels
- **Video model:** OpenArt – Seedance
- **Style:** colorful 3D cartoon slapstick animation
- **Tone:** funny, fast, family-friendly

The built-in Character Bible locks Biscuit as the orange squirrel hero and Grumpy and Sneaky as enemies. Biscuit must clearly win, while the enemies receive their own harmless backfire. Colors, proportions, identities, roles, and movement styles remain consistent.

Use Biscuit Demo as the fastest judging path for both Demo Mode and AI Mode.

## Architecture and security

```text
Creator form
   ├── Demo Mode ──> local template and quality engines
   └── AI Mode ────> server-side Next.js routes ──> OpenAI Responses API
                              │
                              └── strict JSON schema validation

Generated pack
   ├── copy and Word export
   ├── local pack history
   ├── variants and targeted regeneration
   └── Prompt Quality Inspector
```

Security boundaries:

- OpenAI requests originate only from server-side routes.
- `OPENAI_API_KEY` never reaches the browser.
- API responses are constrained by strict JSON schemas.
- User-facing API errors are categorized and sanitized.
- Local browser data is not uploaded in Demo Mode.

## Limitations

- Saved characters, presets, and packs use the current browser's `localStorage`; they do not sync across devices.
- There is no user account, shared workspace, or cloud database in this version.
- Generated prompts still require creator review and may need tuning for individual third-party video models.
- AI Mode requires network access, an available configured model, and active API billing or credit.
- Platform launcher buttons open external tools but do not submit jobs or import results automatically.
- Word export is client-generated and focuses on production content rather than collaborative document editing.
- The app does not render final images, video, voices, music, or sound effects itself.

## Future roadmap

- Cloud accounts and cross-device project synchronization
- Team workspaces, comments, approvals, and version history
- Direct render-job integrations with supported image, video, voice, and music platforms
- Reference-image uploads and visual character-consistency analysis
- Automatic prompt adaptation based on model-specific performance feedback
- Timeline editor with draggable action, music, SFX, and dialogue beats
- Asset management for generated frames, clips, audio, and thumbnails
- Multilingual captions, metadata, narration, and vocal locks
- Analytics-informed retention recommendations
- Batch episode generation and reusable series templates
- Cloud export, sharing links, and production handoff APIs

## Submission summary

Slapstick Prompt Pack turns prompt writing into a complete production workflow. Its key contribution is not simply generating more text—it coordinates creative direction, character identity, timing, sound, publishing, and error prevention into one structured, inspectable pack that creators can immediately use across modern AI video tools.
