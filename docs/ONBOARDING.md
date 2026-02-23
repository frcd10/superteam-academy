# Onboarding Flow

> Design document for the new-user onboarding experience.

## Goals

1. Guide first-time users through account setup
2. Introduce key platform features (courses, XP, credentials, community)
3. Prompt wallet connection for on-chain features
4. Minimize drop-off — no more than 3–4 steps

## Trigger

The onboarding flow activates when **all** of these are true:

- User just signed up or signed in for the first time
- `profiles.onboarding_completed` is `false` (new DB column)
- User is on `/dashboard` or the post-auth redirect lands them there

## Flow Steps

### Step 1 — Welcome

- **Content**: Welcome message, platform overview (30-second pitch)
- **Visual**: Animated logo + tagline
- **Action**: "Get Started" button

### Step 2 — Profile Setup

- **Content**: Display name, avatar (from OAuth or upload), preferred language
- **Pre-filled**: Name/avatar from Google/GitHub if available
- **Action**: "Next" (save profile updates)

### Step 3 — Connect Wallet (optional)

- **Content**: Explain why a wallet matters (XP tokens, credentials, achievements)
- **Visual**: Wallet benefits cards (soulbound XP, NFT credentials, on-chain proof)
- **Action**: "Connect Wallet" or "Skip for now"
- **Note**: Users who signed in with wallet skip this step

### Step 4 — Explore

- **Content**: Suggested starter courses based on difficulty level 1
- **Visual**: 3 course cards (Getting Started, Core Concepts, Frontend)
- **Action**: "Start Learning" → redirects to first course, or "Go to Dashboard"

## Technical Implementation

### Database

```sql
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
```

### Components

```
src/components/onboarding/
├── onboarding-modal.tsx      — Full-screen modal with step navigation
├── welcome-step.tsx          — Step 1
├── profile-step.tsx          — Step 2
├── wallet-step.tsx           — Step 3
├── explore-step.tsx          — Step 4
└── index.ts                  — Barrel export
```

### Auth Provider Changes

- After successful sign-in, check `profile.onboarding_completed`
- If `false`, set `showOnboarding: true` in auth context
- Dashboard reads this flag and renders the onboarding modal

### API

```
POST /api/onboarding/complete
  → Sets onboarding_completed = true, onboarding_completed_at = now()
```

### State Management

- Use local component state for step navigation (no global store needed)
- On final step completion, POST to `/api/onboarding/complete`
- Dismiss modal and refresh profile

## UX Details

- **Progress indicator**: Dots or step bar (1/4, 2/4, etc.)
- **Skip**: Always available via "Skip" link in top-right
- **Mobile**: Full-screen, swipeable between steps
- **Animation**: Framer Motion slide transitions between steps
- **Persistence**: If user closes mid-flow, resume at same step next visit

## i18n Keys

Add to `navigation` or new `onboarding` section in locale files:

```json
{
  "onboarding": {
    "welcome": "Welcome to Superteam Academy!",
    "welcomeSubtitle": "Master Solana development with interactive courses and on-chain credentials.",
    "getStarted": "Get Started",
    "profileTitle": "Set up your profile",
    "profileSubtitle": "Tell us a bit about yourself",
    "walletTitle": "Connect your wallet",
    "walletSubtitle": "Unlock on-chain features like XP tokens and credential NFTs",
    "walletBenefits": "Why connect a wallet?",
    "skipForNow": "Skip for now",
    "exploreTitle": "Start learning",
    "exploreSubtitle": "Here are some courses to get you started",
    "startLearning": "Start Learning",
    "goToDashboard": "Go to Dashboard",
    "skip": "Skip",
    "step": "Step {{current}} of {{total}}"
  }
}
```

## Migration

```sql
-- migrations/003_onboarding.sql
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

-- Mark existing users as completed so they don't see the onboarding
UPDATE profiles SET onboarding_completed = true WHERE created_at < NOW();
```

## Implementation Order

1. DB migration (003_onboarding.sql)
2. API endpoint (`/api/onboarding/complete`)
3. Onboarding components (4 steps)
4. Auth provider integration (check flag, show modal)
5. i18n keys (en, pt-br, es)
6. Tests (E2E: verify flow renders for new user, skips for existing)
