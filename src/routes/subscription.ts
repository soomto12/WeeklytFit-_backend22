import { Router } from "express";
import { CreateSubscription } from "../controllers/subscription";
import  {authMiddleware} from "../middleware/auth"

import { body } from "express-validator";
export const subcriptionRouter = Router()

const validateSubscription = [body("tier").isIn(["monthly","yearly","weekly"]).withMessage("plan must contain monthly, yearly, weekly") ]

subcriptionRouter.post("/post", validateSubscription, authMiddleware,  CreateSubscription )


//http://localhost:3001/subscription/post