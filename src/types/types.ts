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

export type WeekDay = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday"

export type MealType = "breakfast" | "lunch" | "dinner"

export interface Exercise {
    day: WeekDay
    name: string
    sets: number
    reps: string
    rest: number
    youtubeUrl?: string
    order: number
}

export interface Food {
    day: WeekDay
    mealType: MealType
    name: string
}

export interface AI_Result {
    userId: number | string
    exercises: Exercise[]
    foods: Food[]
}


