export interface User {
    name : string,
    email: string,
    password : string
    image?: string
}



 export interface Profile {
    userId: string | number

    goal : string,
    dailyHours?: string,
    healthIssues ?: string
    location : "gym" | "homeWorkOut" | "both"
    AI_motivation?: boolean
    restdays?: string[]
    difficultLevel: "beginner" | "intermidiate" | "expert"
    age: string
    weight?: string
    height?: string
    

}

interface  reason {
userid : string,
reason: string
}

export type tier = "monthly" | "yearly" | "weekly"

 export type subscription = {
    userid: number | string,
    tier: tier
 }

export interface Exercise {
    name: string
    sets: number
    reps: string | number
    rest: number
}

export interface DayPlan {
    day: string
    focus: string
    workoutType: string
    duration: number
    warmup: string[]
    exercises: Exercise[]
    meals: {
        breakfast: string
        lunch: string
        dinner: string
    }
    motivation?: string
}

export interface AI_Result {
    userId: number | string
    weeklyPlans: {
        sunday: DayPlan
        monday: DayPlan
        tuesday: DayPlan
        wednesday: DayPlan
        thursday: DayPlan
        friday: DayPlan
        saturday: DayPlan
    }
}


