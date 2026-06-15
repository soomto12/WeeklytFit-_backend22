import { Request, Response } from "express"
import { AuthRequest } from "../types/express.d"
import { subscription } from "../types/types"
import { prisma } from "../libs/prisma"
import { getPrice } from '../libs/utility'
import { validationResult } from "express-validator"
import {stripe} from "../libs/stripe"

 export const CreateSubscription = async (req: Request, res: Response)=>{
    const error = validationResult(req)
    if (!error.isEmpty()) {
        res.status(400).json({message: "invalid tier", errorMessage: error.array()})
        return 
    }
const { tier } = req.body as subscription

const userId = (req as AuthRequest).user.id

try {
    const user = await prisma.user.findUnique({where: { id: userId}})


if (!user) {
    res.status(404).json({message: "user not found"})
    return
    
}

const getier = getPrice(tier) as string

const customer = await stripe.customers.create({
    email: user.email
})



const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items:[
        {
            price: getier,
            quantity: 1
        }
    ],
    customer : customer.id,
    mode: "subscription",
    metadata:{ userId: String(userId), tier, stripeCustomerId : customer.id},
    success_url :`${process.env.FRONT_END_URL}/dashboard` ,
    cancel_url: `${process.env.FRONT_END_URL}/cancel`,


})

res.json({url: session.url , sessionId : session.id})
} catch (error) {
    console.log(error)
    res.status(500).json({message:'server error'})
    return
}



}