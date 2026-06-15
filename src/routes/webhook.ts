import { Router } from "express"
import express from "express"
import { webHooks } from "../controllers/webhooks"

export const webhookRouter = Router()

webhookRouter.post("/", express.raw({ type: "application/json" }), webHooks)
