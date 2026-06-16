# WeeklyFit — AI Fitness Planner API

A REST API backend for a personalized fitness app. Users set up a profile and get a complete AI-generated 7-day workout and meal plan tailored to their goals, fitness level, and available equipment. Plans are regenerated on demand, and users track each day's workout as done, missed, or unable.

## Features

- **JWT authentication** — register and log in with email and password
- **Profile setup** — fitness goal, age, weight, height, experience level, workout location, rest days, and health limitations
- **AI plan generation** — 7-day personalized workout and meal plan generated via OpenRouter (Qwen model)
- **Daily logs** — track each day's workout status (done / missed / unable)
- **Stripe subscriptions** — weekly, monthly, and yearly tiers; free users get 3 AI generations
- **Profile image upload** — upload a profile picture (PNG/JPG)

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | JWT + bcrypt |
| AI | OpenRouter API (Qwen 2.5 7B) |
| Payments | Stripe |
| File uploads | Multer |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL instance)
- A [Stripe](https://stripe.com) account with products/prices created
- An [OpenRouter](https://openrouter.ai) API key

### Installation

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate deploy
npx prisma generate
```

### Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your_jwt_secret_key
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
STRIPE_SECRET_KEY=sk_...
YEARLY_PRICE=price_...
MONTHLY_PRICE=price_...
WEEKLY_PRICE=price_...
FRONT_END_URL=http://localhost:5173
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Running the Server

```bash
# Development (with hot reload)
npx nodemon src/index.ts

# Production
npx tsc && node dist/index.js
```

The server starts on **port 3001**.

---

## API Reference

All protected routes require a `Bearer` token in the `Authorization` header.

### Auth — `/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/users/register` | No | Create a new account |
| POST | `/users/login` | No | Log in and receive a JWT |
| GET | `/users/me` | Yes | Get the current user's details |
| PUT | `/users/addImage` | Yes | Upload a profile picture |

**Register body:**
```json
{ "name": "John", "email": "john@example.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```

---

### Profile — `/profile`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/profile/post` | Yes | Create a fitness profile |
| PUT | `/profile/update` | Yes | Update your profile |
| GET | `/profile/me` | Yes | Get your profile |

**Profile body:**
```json
{
  "goal": "lose weight",
  "age": "25",
  "weight": "80kg",
  "height": "175cm",
  "difficultLevel": "beginner",
  "location": "gym",
  "restDays": ["saturday", "sunday"],
  "dailyHours": "1",
  "healthIssues": "bad knees",
  "ai_motivation": true
}
```

`location` must be one of: `gym`, `homeWorkOut`, `both`  
`difficultLevel` must be one of: `beginner`, `intermidiate`, `expert`

---

### AI Plans — `/aiResult`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/aiResult/generate` | Yes | Generate a new 7-day plan |
| PUT | `/aiResult/generate` | Yes | Regenerate the latest plan |
| GET | `/aiResult/result` | Yes | Get the latest plan |
| GET | `/aiResult/results` | Yes | Get all past plans |

Free users can generate up to **3 plans**. A subscription is required beyond that.

**Example plan response:**
```json
{
  "monday": {
    "day": "Monday",
    "focus": "Upper Body",
    "workoutType": "strength",
    "duration": 45,
    "warmup": ["arm circles", "shoulder rolls"],
    "exercises": [
      { "name": "Push-ups", "sets": 3, "reps": "12", "rest": 60 }
    ],
    "meals": {
      "breakfast": "Oats with banana and peanut butter",
      "lunch": "Grilled chicken with rice and vegetables",
      "dinner": "Salmon with sweet potato"
    },
    "motivation": "Every rep brings you closer to your goal!"
  }
}
```

---

### Daily Logs — `/dailyLogs`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dailyLogs` | Yes | Get all your workout logs |
| POST | `/dailyLogs` | Yes | Mark a day's workout status |

**Log body:**
```json
{ "aiResultId": 1, "day": "monday", "status": "done" }
```

`status` must be one of: `done`, `unable`, `missed`

---

### Subscriptions — `/subscription`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/subscription` | Yes | Create a Stripe checkout session |

**Body:**
```json
{ "tier": "monthly" }
```

`tier` must be one of: `weekly`, `monthly`, `yearly`

Returns a Stripe checkout `url` to redirect the user to.

---

### Webhooks — `/webhook`

`POST /webhook` — Stripe webhook endpoint. Register this URL in your Stripe dashboard. Must receive raw (unparsed) request bodies.

---

## Database Schema

```
User ──< Profile
     ──< Ai_Result ──< dailyLogs
     ──< Subscription
     ──< freeLimit
```

- A user has one profile, many AI results, and one free-usage counter
- Each AI result has one daily log record tracking completion per day
- Subscriptions are managed through Stripe and stored per user

## Project Structure

```
src/
├── controllers/     # Route handler logic
│   ├── auth.ts
│   ├── profile.ts
│   ├── AIResult.ts
│   ├── dailyLogs.ts
│   ├── subscription.ts
│   └── webhooks.ts
├── routes/          # Express routers
├── middleware/      # JWT auth middleware
├── libs/            # Prisma, Stripe, utility helpers
├── types/           # TypeScript types
└── index.ts         # App entry point
prisma/
├── schema.prisma
└── migrations/
```
