import { Request, Response } from "express"
import { AuthRequest } from "../types/express.d"
import { prisma } from "../libs/prisma"
import { validationResult } from "express-validator"

export const createProfile = async (req: Request, res: Response) => {
  const error = validationResult(req)

  if (!error.isEmpty()) {
    res.status(400).json({ message: "invalid credentials", errorMessage: error.array() })
    return
  }

  const { goal, dailyHours, healthIssues, location, difficultLevel, age, weight, height, restDays } = req.body

  try {
    const createUserProfile = await prisma.profile.create({
      data: {
        goal,
        dailyHours,
        healthIssues,
        location,
        ai_motivation: false,
        age,
        weight,
        height,
        difficultLevel,
        ...(restDays !== undefined && { restDays }),
        userid: (req as AuthRequest).user.id
      }
    })

    res.status(200).json({ message: "profile created", data: createUserProfile })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "server error" })
  }
}


export const includeAiMotivation = async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.id

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    const updated = await prisma.profile.updateMany({
      where: { userid: user.id },
      data: { ai_motivation: true }
    })

    return res.status(200).json({ message: "ai motivation enabled", count: updated.count })
  } catch (error) {
    res.status(500).json({ message: "server error" })
  }
}

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.id
  const error = validationResult(req)

  if (!error.isEmpty()) {
    return res.status(400).json({ message: "invalid credentials", errorMessage: error.array() })
  }

  const { goal, dailyHours, healthIssues, location, difficultLevel, age, weight, height } = req.body

  const data: Record<string, unknown> = {}

  if (goal !== undefined) data.goal = goal
  if (dailyHours !== undefined) data.dailyHours = dailyHours
  if (healthIssues !== undefined) data.healthIssues = healthIssues
  if (location !== undefined) data.location = location
  if (difficultLevel !== undefined) data.difficultLevel = difficultLevel
  if (age !== undefined) data.age = age
  if (weight !== undefined) data.weight = weight
  if (height !== undefined) data.height = height

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "no profile fields provided for update" })
  }

  try {
    const updated = await prisma.profile.updateMany({
      where: { userid: userId },
      data
    })

    if (updated.count === 0) {
      return res.status(404).json({ message: "profile not found" })
    }

    return res.status(200).json({ message: "profile updated", count: updated.count })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "server error" })
  }
}

export const removeAiMotivation = async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.id

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    const removed = await prisma.profile.updateMany({ where: { userid: user.id }, data: { ai_motivation: false } })

    res.status(200).json({ message: "ai motivation disabled", count: removed.count })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "server error" })
  }
}


export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.id

  try {
    const profile = await prisma.profile.findFirst({ where: { userid: userId } })

    if (!profile) {
      return res.status(404).json({ message: "profile not found" })
    }

    return res.status(200).json({ message: "profile retrieved", data: profile })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "server error" })
  }
}