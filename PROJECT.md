# FoodJourney - Couple's Restaurant Tracker

## 📋 Project Overview

**Purpose**: Private webapp for couples to collaboratively track, plan, and archive restaurant visits with AI-powered extraction from Google Maps links.

**Tech Stack**:

- **Frontend/Backend**: Next.js 15 (App Router, Server Components, Server Actions)
- **Database**: AppBackend.io (PostgreSQL)
- **UI Framework**: DaisyUI + Tailwind CSS
- **AI**: Google Gemini API
- **Storage**: AWS S3 / Google Cloud Storage
- **Auth**: Simple password protection

**Target Users**: 2 users (Hasbi & Nadya)

---

## 🎯 Core Features

### MVP (Phase 1)

- [x] Paste Google Maps link
- [x] Gemini auto-extraction (name, cuisine, price, menus, worst review)
- [x] Dual approval system
- [x] Status flow: Suggested → Planned → Archived
- [x] Color-coded cards (Pink: Nadya, Indigo: Hasbi)
- [x] Single photo upload per archived place
- [x] Mobile-first responsive design
- [x] Simple password auth

### Future Enhancements (Phase 2+)

- [ ] Filter & search
- [ ] Drag-to-reorder planned list
- [ ] Random picker
- [ ] Stats dashboard
- [ ] Rating system
- [ ] Push notifications

---

## 👥 User Journey

### 1️⃣ **Authentication Flow**

```
┌─────────────────┐
│  Landing Page   │
│                 │
│  [Enter Pass]   │ ← Simple password field
│  [Login]        │
└────────┬────────┘
         │
         ▼
    Set Cookie
         │
         ▼
┌─────────────────┐
│   Home/Tabs     │
└─────────────────┘
```

**Steps**:

1. User opens app
2. If no valid session → Show password input
3. Enter shared password
4. Cookie persists session
5. Access all features

---

### 2️⃣ **Adding New Place (Suggested Status)**

**Actor**: Hasbi or Nadya

```
┌──────────────────┐
│   Home Screen    │
│                  │
│ [+ Add Place]    │ ← Floating action button
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Add Place Form  │
│                  │
│ Maps Link: _____ │
│ Category: [café] │
│                  │
│ [Submit]         │
└────────┬─────────┘
         │
         ▼
    Call Gemini API
    Extract data
         │
         ▼
┌──────────────────┐
│ New Card Created │
│ Status: Suggested│
│ Added by: Hasbi  │
│ Hasbi: ✅        │
│ Nadya: ⏳        │
└──────────────────┘
```

**Steps**:

1. Tap "+ Add Place" button
2. Paste Google Maps link
3. Select category (Café, Resto, Sushi, etc.)
4. Submit
5. Server Action calls Gemini API
6. Extract: name, cuisine, price, menus, worst review
7. Save to DB with `status: 'suggested'` and `addedBy: 'hasbi'`
8. Auto-approve for submitter (`hasbiApproved: true`)
9. Show in "Suggested" tab
10. Partner sees notification badge

---

### 3️⃣ **Approval Flow**

**Actor**: Partner (the one who didn't add)

```
┌──────────────────┐
│  Suggested Tab   │
│                  │
│ 🩷 Kopi Kenangan │
│ Café · $ · 1km   │
│ "Always crowded" │
│                  │
│ Hasbi ⏳ Nadya ✅│
│ [❌ Skip] [✅ OK]│
└────────┬─────────┘
         │
    User taps ✅
         │
         ▼
┌──────────────────┐
│ Both Approved!   │
│ Status: Planned  │
└────────┬─────────┘
         │
         ▼
    Moves to Planned Tab
```

**Steps**:

1. Open "Suggested" tab
2. Review place details
3. Tap "✅ Plan It" or "❌ Skip"
4. If approved:
   - Update `nadyaApproved: true`
   - If both approved → `status: 'planned'`
   - Move to "Planned" tab
5. If skipped:
   - Update `status: 'skipped'` (soft delete)
   - Remove from view

---

### 4️⃣ **Visiting & Archiving**

**Actor**: Either user after visit

```
┌──────────────────┐
│   Planned Tab    │
│                  │
│ 1. Warung Tekko  │
│    Indonesian·$$ │
│    [Mark Visited]│
└────────┬─────────┘
         │
    Tap Mark Visited
         │
         ▼
┌──────────────────┐
│  Archive Form    │
│                  │
│ Visit Date: ___  │
│ Upload Photo: 📷 │
│ Rating: ⭐⭐⭐⭐  │
│ Notes: _______   │
│                  │
│ [Save]           │
└────────┬─────────┘
         │
         ▼
    Upload photo to S3
    Update DB
         │
         ▼
┌──────────────────┐
│ Status: Archived │
│ Moves to Archive │
└──────────────────┘
```

**Steps**:

1. Open "Planned" tab
2. Tap place card
3. Tap "Mark as Visited"
4. Fill form:
   - Visit date (date picker)
   - Upload photo (camera/gallery)
   - Rating (1-5 stars)
   - Notes (optional text)
5. Submit
6. Photo uploads to S3/GCS
7. Update DB: `status: 'archived'`, save metadata
8. Show in "Archived" tab

---

### 5️⃣ **Browsing Archive**

**Actor**: Any user

```
┌──────────────────┐
│  Archived Tab    │
│                  │
│ ┌────┐ ┌────┐   │
│ │ 📷 │ │ 📷 │   │
│ │Hiro│ │Kopi│   │
│ └────┘ └────┘   │
└────────┬─────────┘
         │
    Tap card
         │
         ▼
┌──────────────────┐
│  Detail Modal    │
│                  │
│ [Photo]          │
│ Sushi Hiro       │
│ Visited: Dec 15  │
│ Rating: ⭐⭐⭐⭐   │
│ Notes: "Amazing!"│
│ Added by: Hasbi🟣│
│                  │
│ [Close]          │
└──────────────────┘
```

**Steps**:

1. Open "Archived" tab
2. Browse photo grid
3. Tap to open detail modal
4. View full info + photo

---

## 🗄️ Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────┐
│                    USERS                        │
├─────────────────────────────────────────────────┤
│ id                 UUID          PRIMARY KEY    │
│ username           VARCHAR(20)   UNIQUE         │ ← 'hasbi' | 'nadya'
│ display_name       VARCHAR(50)                  │
│ color              VARCHAR(7)                   │ ← '#ec4899' | '#6366f1'
│ created_at         TIMESTAMP                    │
└─────────────────────────────────────────────────┘
                       │
                       │ 1:N
                       ▼
┌─────────────────────────────────────────────────┐
│                   PLACES                        │
├─────────────────────────────────────────────────┤
│ id                 UUID          PRIMARY KEY    │
│ name               VARCHAR(200)  NOT NULL       │
│ maps_link          TEXT          NOT NULL       │
│ category           ENUM          NOT NULL       │ ← cafe|resto|sushi|fine_dining|street_food|dessert
│ cuisine            VARCHAR(100)                 │
│ price_range        ENUM                         │ ← $|$$|$$$|$$$$
│ distance           VARCHAR(20)                  │
│                                                  │
│ -- Gemini Extracted --                          │
│ summary            TEXT                         │
│ top_menus          TEXT[]                       │
│ worst_review       TEXT                         │
│                                                  │
│ -- Metadata --                                  │
│ added_by           UUID          FK → USERS     │
│ added_at           TIMESTAMP     DEFAULT NOW()  │
│ status             ENUM          NOT NULL       │ ← suggested|planned|archived|skipped
│                                                  │
│ -- Approval --                                  │
│ hasbi_approved     BOOLEAN       DEFAULT FALSE  │
│ nadya_approved     BOOLEAN       DEFAULT FALSE  │
│                                                  │
│ -- After Visit --                               │
│ visited_at         TIMESTAMP                    │
│ photo_url          TEXT                         │
│ rating             INTEGER                      │ ← 1-5
│ notes              TEXT                         │
│                                                  │
│ created_at         TIMESTAMP     DEFAULT NOW()  │
│ updated_at         TIMESTAMP     DEFAULT NOW()  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                  APP_CONFIG                     │
├─────────────────────────────────────────────────┤
│ id                 UUID          PRIMARY KEY    │
│ key                VARCHAR(50)   UNIQUE         │ ← 'shared_password'
│ value              TEXT                         │
│ updated_at         TIMESTAMP                    │
└─────────────────────────────────────────────────┘
```

### **Indexes**:

```sql
CREATE INDEX idx_places_status ON places(status);
CREATE INDEX idx_places_added_by ON places(added_by);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_visited_at ON places(visited_at DESC);
```

---

## 📁 Project Structure

```
food-journey/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx           # Password login
│   │   └── layout.tsx              # Auth layout
│   │
│   ├── (app)/
│   │   ├── layout.tsx              # Main app layout with tabs
│   │   ├── page.tsx                # Redirect to /suggested
│   │   │
│   │   ├── suggested/
│   │   │   └── page.tsx            # Suggested tab
│   │   ├── planned/
│   │   │   └── page.tsx            # Planned tab
│   │   ├── archived/
│   │   │   └── page.tsx            # Archived tab
│   │   │
│   │   └── place/
│   │       └── [id]/
│   │           └── page.tsx        # Place detail modal
│   │
│   ├── actions/
│   │   ├── auth.ts                 # Login/logout actions
│   │   ├── place.ts                # CRUD place actions
│   │   └── gemini.ts               # Extract from Maps link
│   │
│   ├── api/
│   │   └── upload/
│   │       └── route.ts            # S3 upload endpoint
│   │
│   └── layout.tsx                  # Root layout
│
├── components/
│   ├── PlaceCard.tsx               # Reusable place card
│   ├── AddPlaceModal.tsx           # Add new place
│   ├── ArchiveModal.tsx            # Mark as visited
│   ├── ApprovalButtons.tsx         # Approve/Skip
│   ├── TabNavigation.tsx           # Bottom tab bar
│   └── PhotoUpload.tsx             # Photo upload component
│
├── lib/
│   ├── db.ts                       # AppBackend.io client
│   ├── gemini.ts                   # Gemini API wrapper
│   ├── s3.ts                       # S3 upload helper
│   ├── auth.ts                     # Auth utilities
│   └── types.ts                    # TypeScript types
│
├── middleware.ts                   # Auth middleware
├── tailwind.config.ts              # DaisyUI config
└── package.json
```

---

## 🛠️ Tech Implementation Details

### **Database Schema (AppBackend.io)**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default users
INSERT INTO users (username, display_name, color) VALUES
  ('hasbi', 'Hasbi', '#6366f1'),
  ('nadya', 'Nadya', '#ec4899');

-- Places table
CREATE TYPE place_status AS ENUM ('suggested', 'planned', 'archived', 'skipped');
CREATE TYPE place_category AS ENUM ('cafe', 'resto', 'sushi', 'fine_dining', 'street_food', 'dessert');
CREATE TYPE price_range AS ENUM ('$', '$$', '$$$', '$$$$');

CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  maps_link TEXT NOT NULL,
  category place_category NOT NULL,
  cuisine VARCHAR(100),
  price_range price_range,
  distance VARCHAR(20),

  summary TEXT,
  top_menus TEXT[],
  worst_review TEXT,

  added_by UUID REFERENCES users(id) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  status place_status DEFAULT 'suggested' NOT NULL,

  hasbi_approved BOOLEAN DEFAULT FALSE,
  nadya_approved BOOLEAN DEFAULT FALSE,

  visited_at TIMESTAMP,
  photo_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- App config
CREATE TABLE app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default password (hash this in production!)
INSERT INTO app_config (key, value) VALUES
  ('shared_password', 'your_hashed_password_here');

-- Indexes
CREATE INDEX idx_places_status ON places(status);
CREATE INDEX idx_places_added_by ON places(added_by);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_visited_at ON places(visited_at DESC);
```

---

### **Gemini Integration**

```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function extractPlaceInfo(mapsLink: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
Extract restaurant information from this Google Maps link:
${mapsLink}

Return JSON with this exact structure:
{
  "name": "restaurant name",
  "cuisine": "cuisine type (e.g., Japanese, Italian)",
  "priceRange": "$ or $$ or $$$ or $$$$",
  "topMenus": ["menu1", "menu2", "menu3"],
  "worstReview": "most critical review found (max 150 chars)"
}

If any field is unavailable, use "N/A".
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}
```

---

### **Server Actions**

```typescript
// app/actions/place.ts
"use server";

import { db } from "@/lib/db";
import { extractPlaceInfo } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

export async function addPlace(formData: FormData) {
  const mapsLink = formData.get("mapsLink") as string;
  const category = formData.get("category") as string;
  const addedBy = formData.get("addedBy") as string; // 'hasbi' | 'nadya'

  // Extract info from Gemini
  const extracted = await extractPlaceInfo(mapsLink);

  // Get user ID
  const user = await db.query("SELECT id FROM users WHERE username = $1", [
    addedBy,
  ]);

  // Auto-approve for submitter
  const approval = {
    hasbi_approved: addedBy === "hasbi",
    nadya_approved: addedBy === "nadya",
  };

  await db.query(
    `
    INSERT INTO places (
      name, maps_link, category, cuisine, price_range,
      summary, top_menus, worst_review,
      added_by, status, hasbi_approved, nadya_approved
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `,
    [
      extracted.name,
      mapsLink,
      category,
      extracted.cuisine,
      extracted.priceRange,
      extracted.summary,
      extracted.topMenus,
      extracted.worstReview,
      user.rows[0].id,
      "suggested",
      approval.hasbi_approved,
      approval.nadya_approved,
    ]
  );

  revalidatePath("/suggested");
}

export async function approvePlace(placeId: string, username: string) {
  const field = username === "hasbi" ? "hasbi_approved" : "nadya_approved";

  await db.query(
    `
    UPDATE places 
    SET ${field} = true, updated_at = NOW()
    WHERE id = $1
  `,
    [placeId]
  );

  // Check if both approved, then move to planned
  const place = await db.query(
    "SELECT hasbi_approved, nadya_approved FROM places WHERE id = $1",
    [placeId]
  );

  if (place.rows[0].hasbi_approved && place.rows[0].nadya_approved) {
    await db.query(
      `
      UPDATE places 
      SET status = 'planned', updated_at = NOW()
      WHERE id = $1
    `,
      [placeId]
    );
    revalidatePath("/planned");
  }

  revalidatePath("/suggested");
}

export async function skipPlace(placeId: string) {
  await db.query(
    `
    UPDATE places 
    SET status = 'skipped', updated_at = NOW()
    WHERE id = $1
  `,
    [placeId]
  );

  revalidatePath("/suggested");
}

export async function archivePlace(
  placeId: string,
  visitDate: Date,
  photoUrl: string,
  rating: number,
  notes: string
) {
  await db.query(
    `
    UPDATE places 
    SET 
      status = 'archived',
      visited_at = $2,
      photo_url = $3,
      rating = $4,
      notes = $5,
      updated_at = NOW()
    WHERE id = $1
  `,
    [placeId, visitDate, photoUrl, rating, notes]
  );

  revalidatePath("/planned");
  revalidatePath("/archived");
}
```

---

### **DaisyUI Components**

```tsx
// components/PlaceCard.tsx
import { Place } from "@/lib/types";

interface PlaceCardProps {
  place: Place;
  onApprove?: (id: string) => void;
  onSkip?: (id: string) => void;
}

export function PlaceCard({ place, onApprove, onSkip }: PlaceCardProps) {
  const borderColor =
    place.addedBy === "hasbi" ? "border-indigo-500" : "border-pink-500";

  return (
    <div className={`card bg-base-100 shadow-md border-l-4 ${borderColor}`}>
      <div className="card-body p-4">
        <h2 className="card-title text-lg">{place.name}</h2>

        <div className="flex gap-2 text-sm text-base-content/70">
          <span className="badge badge-outline">{place.category}</span>
          <span>{place.priceRange}</span>
          {place.distance && <span>· {place.distance}</span>}
        </div>

        {place.worstReview && (
          <p className="text-sm italic text-error">"{place.worstReview}"</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs">
            Hasbi {place.hasbiApproved ? "✅" : "⏳"}
          </span>
          <span className="text-xs">|</span>
          <span className="text-xs">
            Nadya {place.nadyaApproved ? "✅" : "⏳"}
          </span>
        </div>

        {place.status === "suggested" && onApprove && onSkip && (
          <div className="card-actions justify-end mt-3">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => onSkip(place.id)}
            >
              ❌ Skip
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onApprove(place.id)}
            >
              ✅ Plan It
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### **Tailwind + DaisyUI Config**

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        foodjourney: {
          primary: "#6366f1", // Indigo
          secondary: "#ec4899", // Pink
          accent: "#14b8a6",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
      },
    ],
  },
};

export default config;
```

---

## 🚀 Deployment Checklist

- [ ] Set up AppBackend.io database
- [ ] Configure Gemini API key
- [ ] Set up S3/GCS bucket
- [ ] Deploy to Vercel/Railway
- [ ] Set environment variables
- [ ] Test auth flow
- [ ] Test Gemini extraction
- [ ] Test photo upload
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] PWA configuration (optional)

---

## 🔐 Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://user:password@host:port/database"
GEMINI_API_KEY="your_gemini_api_key_here"
S3_BUCKET_NAME="foodjourney-photos"
S3_ACCESS_KEY="your_aws_access_key"
S3_SECRET_KEY="your_aws_secret_key"
S3_REGION="ap-southeast-1"
SHARED_PASSWORD_HASH="bcrypt_hashed_password"
NEXT_PUBLIC_APP_URL="https://foodjourney.app"
```

---

## 📱 Mobile-First UI Specifications

### **Bottom Tab Navigation**

- Fixed position at bottom
- 3 tabs: Suggested, Planned, Archived
- Active tab highlighted with primary color
- Badge count for pending approvals in Suggested tab

### **Floating Action Button (FAB)**

- Fixed bottom-right position
- Opens "Add Place" modal
- Primary color background
- Plus icon

### **Card Spacing**

- 16px horizontal padding
- 12px vertical spacing between cards
- Cards full-width on mobile

### **Touch Targets**

- Minimum 44x44px for all buttons
- Swipe gestures for card actions (optional enhancement)
- Pull-to-refresh for data sync

### **Photo Upload**

- Camera/gallery picker
- Image compression before upload
- Preview before submission
- Maximum 2MB file size

---

## 🎨 Design System

### **Colors**

- **Hasbi (Indigo)**: `#6366f1`
- **Nadya (Pink)**: `#ec4899`
- **Success**: `#36d399`
- **Error**: `#f87272`
- **Background**: `#ffffff`
- **Text**: `#1f2937`

### **Typography**

- **Headings**: Inter/System UI font, 18-24px, bold
- **Body**: 14-16px, regular
- **Small text**: 12px for metadata

### **Spacing Scale**

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

---

## 🔄 State Management

### **Status Flow**

```
Suggested → (both approve) → Planned → (mark visited) → Archived
          ↘ (skip)        ↘ Skipped
```

### **Approval Logic**

- When user adds place → auto-approve for self
- Partner must explicitly approve
- Both approved → status changes to "planned"
- Either can skip → status changes to "skipped"

### **Revalidation Strategy**

- `revalidatePath()` after mutations
- Real-time via polling (optional enhancement)
- Optimistic UI updates for better UX

---

## 🧪 Testing Checklist

### **Functional Tests**

- [ ] Login with correct password
- [ ] Login with incorrect password (should fail)
- [ ] Add place with valid Maps link
- [ ] Add place with invalid link (should error)
- [ ] Approve place (check status updates)
- [ ] Skip place (should disappear from Suggested)
- [ ] Mark as visited with photo
- [ ] View archived places
- [ ] Logout and session persistence

### **Mobile Tests**

- [ ] Touch targets adequate size
- [ ] Forms work with mobile keyboard
- [ ] Photo upload from camera
- [ ] Photo upload from gallery
- [ ] Orientation change (portrait/landscape)
- [ ] Different screen sizes (iPhone SE, Plus, iPad)

### **Edge Cases**

- [ ] Gemini API timeout/failure
- [ ] S3 upload failure
- [ ] Network offline behavior
- [ ] Concurrent approval by both users
- [ ] Very long place names/reviews
- [ ] Special characters in text

---

## 📊 Analytics (Future Enhancement)

### **Metrics to Track**

- Total places suggested by each user
- Approval rate (% approved vs skipped)
- Average time from suggested to visited
- Most popular categories
- Monthly visit frequency
- Photo upload rate

### **Insights Dashboard**

- "Hasbi suggested 12 places, Nadya suggested 8"
- "Café is your favorite category (15 visits)"
- "You visit new places 2x per month on average"
- "Your approval rate: 85%"

---

## 🔒 Security Considerations

### **Password Protection**

- Use bcrypt for password hashing (min 10 rounds)
- Store hash in database, never plaintext
- HTTP-only cookies for session
- CSRF protection via Next.js built-in

### **Data Privacy**

- All data private to the couple
- No public sharing features
- No analytics tracking personal data
- S3 bucket set to private (signed URLs for access)

### **Input Validation**

- Sanitize Maps links
- Validate category enum values
- Limit text field lengths
- Check file types/sizes for photos

---

## 🚧 Known Limitations

1. **Gemini Accuracy**: Extraction quality depends on Google Maps page structure
2. **No Offline Support**: Requires internet for all operations
3. **Single Photo**: Only one photo per archived place (by design)
4. **No Edit Feature**: Once added, places cannot be edited (future enhancement)
5. **Simple Auth**: Password-only (no 2FA, recovery flow)

---

## 🎯 Success Metrics

### **MVP Success Criteria**

- [ ] Both users can add places successfully
- [ ] Approval flow works without bugs
- [ ] Photo upload < 5 seconds
- [ ] Gemini extraction > 80% accurate
- [ ] Mobile-friendly on iOS/Android
- [ ] Zero data loss

### **User Satisfaction**

- Actually used weekly by both users
- Reduces "forgotten suggestions" problem
- Creates positive shared memories
- Simple enough to use without friction

---

## 📞 Support & Maintenance

### **Bug Reporting**

- Simple in-app feedback button (future)
- Direct messaging to developer
- Version number in footer

### **Updates**

- Deploy fixes via Vercel CI/CD
- Database migrations via AppBackend.io
- Changelog tracking (future)

### **Backups**

- AppBackend.io handles database backups
- S3 versioning enabled for photos
- Export data feature (future enhancement)

---

**Built with ❤️ for Hasbi & Nadya**
