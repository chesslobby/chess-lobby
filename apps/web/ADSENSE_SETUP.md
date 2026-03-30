# AdSense Setup Instructions

## Step 1: Apply for AdSense
1. Go to https://adsense.google.com
2. Sign in with chesslobby.play@gmail.com
3. Click "Get started"
4. Enter website: https://chesslobby.in
5. Submit application (approval takes 1–14 days)

## Step 2: Get Publisher ID
After approval your publisher ID looks like: `ca-pub-1234567890123456`

## Step 3: Replace placeholder ID in 3 files
Search for `ca-pub-XXXXXXXXXXXXXXXX` and replace with your real ID in:
- `apps/web/src/components/AdUnit.tsx` (2 occurrences)
- `apps/web/src/app/layout.tsx` (1 occurrence)
- `apps/web/public/ads.txt` (1 occurrence)

## Step 4: Create ad units in AdSense dashboard
Go to AdSense → Ads → By ad unit → Create new ad unit for each slot:

| Slot ID     | Type              | Used on         |
|-------------|-------------------|-----------------|
| 1234567890  | Horizontal banner | Lobby           |
| 0987654321  | Rectangle         | Lobby sidebar   |
| 1111111111  | Horizontal banner | Leaderboard     |
| 2222222222  | Horizontal banner | Learn           |
| 3333333333  | Rectangle         | Puzzles sidebar |
| 4444444444  | Rectangle         | Profile         |
| 5555555555  | Horizontal banner | Openings        |
| 6666666666  | Horizontal banner | Endgames        |

## Step 5: Replace slot IDs
Replace each placeholder slot ID (1234567890, 0987654321, etc.) with the
real ad unit IDs from your AdSense dashboard.

## Pages with NO ads (intentional — never add ads here)
- /game — active gameplay
- /play-bot — bot game
- /spectate — spectating
- /admin — admin dashboard
- /auth/* — auth flow pages

## Revenue estimate
- 1,000 page views/day → ~$1–3/day
- 10,000 page views/day → ~$10–30/day
- Varies by user location and niche (chess = high CPC)
