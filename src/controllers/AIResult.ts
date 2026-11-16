import { Request, Response } from "express"
import { AuthRequest } from "../types/express.d"
import { prisma } from "../libs/prisma"
import OpenAI from "openai"
import { Exercise, Food, MealType, WeekDay } from "../types/types"

const ai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
})

const DAYS: WeekDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"]

// exercises/foods ordered sunday -> saturday (enum order), then by position in the day
const planInclude = {
    exercises: { orderBy: [{ day: "asc" as const }, { order: "asc" as const }] },
    foods: { orderBy: [{ day: "asc" as const }, { mealType: "asc" as const }] },
}

const buildYoutubeSearchUrl = (exerciseName: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} exercise tutorial`)}`

type Profile = NonNullable<Awaited<ReturnType<typeof prisma.profile.findFirst>>>

const buildPrompt = (profile: Profile) => {
    const restDaysLabel = profile.restDays?.length ? profile.restDays.join(", ") : "none"
    const locationLabel =
        profile.location === "gym" ? "gym only"
        : profile.location === "homeWorkOut" ? "home only"
        : "gym and home"

    return `
You are an expert fitness coach and nutritionist. Generate a complete, personalized 7-day weekly fitness and meal plan for this user.

USER PROFILE:
- Age: ${profile.age}
- Weight: ${profile.weight ?? "not provided"}
- Height: ${profile.height ?? "not provided"}
- Fitness goal: ${profile.goal}
- Experience level: ${profile.difficultLevel}
- Workout location: ${locationLabel}
- Available hours per day: ${profile.dailyHours ?? "flexible"}
- Rest days: ${restDaysLabel}
- Health issues / limitations: ${profile.healthIssues ?? "none"}

RULES:
1. "day" must be one of: ${DAYS.join(", ")} (lowercase).
2. Do NOT include any exercises for rest days (${restDaysLabel}).
3. Every day (including rest days) must have exactly one food for each mealType: breakfast, lunch, dinner.
4. Tailor meals to the user's goal — e.g. high protein for muscle gain, caloric deficit for weight loss.
5. Suggest exercises appropriate for the user's level and location.
6. If health issues are listed, avoid exercises that could aggravate them.
7. "sets" and "rest" (seconds) are numbers; "reps" is a string such as "10" or "8-12" or "30s".
8. Return ONLY raw valid JSON — no markdown fences, no explanations, nothing outside the JSON object.

OUTPUT FORMAT (fill with real values):
{
  "exercises": [{ "day": "monday", "name": "", "sets": 0, "reps": "", "rest": 0 }],
  "foods": [{ "day": "monday", "mealType": "breakfast", "name": "" }]
}
`.trim()
}

// asks the AI for a plan and normalizes it into rows ready for prisma; returns null on bad output
const generatePlan = async (profile: Profile) => {
    const result = await ai.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: buildPrompt(profile) }],
        response_format: { type: "json_object" },
        // a week's plan is ~2-4k tokens; without a cap OpenRouter reserves the model's full limit against credits
        max_tokens: 6000,
    })

    const text = result.choices[0]?.message?.content

    if (!text) {
        return { error: "AI returned empty response" }
    }

    const cleanText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any
    try {
        parsed = JSON.parse(cleanText)
    } catch {
        console.log("JSON parse failed:", cleanText)
        return { error: "AI response was not valid JSON", raw: cleanText }
    }

    const dayCounts: Partial<Record<WeekDay, number>> = {}
    const exercises: Exercise[] = []
    for (const item of Array.isArray(parsed?.exercises) ? parsed.exercises : []) {
        const day = String(item?.day ?? "").toLowerCase() as WeekDay
        const name = String(item?.name ?? "").trim()
        if (!DAYS.includes(day) || !name) continue

        const order = dayCounts[day] ?? 0
        dayCounts[day] = order + 1
        exercises.push({
            day,
            name,
            sets: Math.max(0, Math.round(Number(item.sets) || 0)),
            reps: String(item.reps ?? ""),
            rest: Math.max(0, Math.round(Number(item.rest) || 0)),
            youtubeUrl: buildYoutubeSearchUrl(name),
            order,
        })
    }

    const foods: Food[] = []
    for (const item of Array.isArray(parsed?.foods) ? parsed.foods : []) {
        const day = String(item?.day ?? "").toLowerCase() as WeekDay
        const mealType = String(item?.mealType ?? "").toLowerCase() as MealType
        const name = String(item?.name ?? "").trim()
        if (!DAYS.includes(day) || !MEAL_TYPES.includes(mealType) || !name) continue

        foods.push({ day, mealType, name })
    }

    if (!exercises.length && !foods.length) {
        return { error: "AI response did not contain a usable plan", raw: cleanText }
    }

    return { exercises, foods }
}

export const getAllAIResults = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id

    try {
        const results = await prisma.ai_Result.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true, ...planInclude },
        })

        res.status(200).json({ data: results })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "server error" })
    }
}

export const getAIResult = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id

    try {
        const latest = await prisma.ai_Result.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: planInclude,
        })

        if (!latest) {
            res.status(404).json({ message: "No AI results found for this user" })
            return
        }

        res.status(200).json({ data: latest })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "server error" })
    }
}

export const updateAIResult = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id

    try {
        const user = await prisma.user.findFirst({ where: { id: userId } })

        if (!user) {
            res.status(404).json({ message: "user not found" })
            return
        }

        const latest = await prisma.ai_Result.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        })

        if (!latest) {
            res.status(404).json({ message: "No AI result found to update" })
            return
        }

        const profile = await prisma.profile.findFirst({ where: { userid: user.id as number } })

        if (!profile) {
            res.status(404).json({ message: "profile not found" })
            return
        }

        const plan = await generatePlan(profile)

        if ("error" in plan) {
            res.status(500).json({ message: plan.error, raw: plan.raw })
            return
        }

        // replaces the old exercises/foods atomically and resets the week's log for the new plan
        const updated = await prisma.ai_Result.update({
            where: { id: latest.id },
            data: {
                exercises: { deleteMany: {}, create: plan.exercises },
                foods: { deleteMany: {}, create: plan.foods },
                dailyLogs: {
                    upsert: {
                        create: { userId: user.id },
                        update: {
                            sunday: "pending",
                            monday: "pending",
                            tuesday: "pending",
                            wednesday: "pending",
                            thursday: "pending",
                            friday: "pending",
                            saturday: "pending",
                        },
                    },
                },
            },
            include: planInclude,
        })

        res.status(200).json({ message: "AI result updated", data: updated })

    } catch (error: any) {
        console.log(error)
        res.status(500).json({ message: "server error", error: error?.message ?? String(error) })
    }
}

export const generateAIResult = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id

    try {
        const user = await prisma.user.findFirst({ where: { id: userId } })

        if (!user) {
            res.status(404).json({ message: "user not found" })
            return
        }
        const [freeLimit, subscription] = await Promise.all([
            prisma.freeLimit.findFirst({ where: { userId: user.id } }),
            prisma.subscription.findFirst({ where: { userId: user.id, status: "active" } }),
        ])

        if (!subscription && freeLimit && freeLimit.limitCount >= 3) {
            res.status(400).json({ message: "You have reached your free limit. Please subscribe to continue generating plans." })
            return
        }

        const profile = await prisma.profile.findFirst({ where: { userid: user.id as number } })

        if (!profile) {
            res.status(404).json({ message: "profile not found" })
            return
        }

        const plan = await generatePlan(profile)

        if ("error" in plan) {
            res.status(500).json({ message: plan.error, raw: plan.raw })
            return
        }

        const weeklyRoutine = await prisma.ai_Result.create({
            data: {
                userId: user.id,
                dailyLogs: { create: { userId: user.id } },
                exercises: { create: plan.exercises },
                foods: { create: plan.foods },
            },
            include: planInclude,
        })

        await prisma.freeLimit.upsert({
            where: { userId: user.id },
            create: { userId: user.id, limitCount: 1 },
            update: { limitCount: { increment: 1 } },
        })

        res.status(200).json({ message: "AI result generated", data: weeklyRoutine })

    } catch (error: any) {
        console.log(error)
        res.status(500).json({ message: "server error", error: error?.message ?? String(error) })
    }
}
