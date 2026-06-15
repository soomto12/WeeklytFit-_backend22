import { Request, Response } from "express"
import { stripe } from "../libs/stripe"
import { prisma } from "../libs/prisma"

export const webHooks = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: any) {
        console.log("Webhook signature verification failed:", err.message)
        res.status(400).json({ message: `Webhook error: ${err.message}` })
        return
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object
                const { userId, tier, stripeCustomerId } = session.metadata ?? {}

                if (!userId || !tier || !session.subscription) break

                await prisma.subscription.upsert({
                    where: { userId: Number(userId) },
                    create: {
                        userId: Number(userId),
                        tier: tier as "monthly" | "yearly" | "weekly",
                        status: "active",
                        stripeSubscriptionId: session.subscription as string,
                        stripeCustomerId: stripeCustomerId,
                    },
                    update: {
                        tier: tier as "monthly" | "yearly" | "weekly",
                        status: "active",
                        stripeSubscriptionId: session.subscription as string,
                        stripeCustomerId: stripeCustomerId,
                    },
                })
                break
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object

                await prisma.subscription.update({
                    where: { stripeSubscriptionId: sub.id },
                    data: { status: "cancelled" },
                })
                break
            }

            case "customer.subscription.updated": {
                const sub = event.data.object
                const priceId = sub.items?.data[0]?.price?.id

                const tierMap: Record<string, "monthly" | "yearly" | "weekly"> = {
                    [process.env.MONTHLY_PRICE!]: "monthly",
                    [process.env.YEARLY_PRICE!]:  "yearly",
                    [process.env.WEEKLY_PRICE!]:  "weekly",
                }

                const newStatus = sub.status === "active"   ? "active"
                    : sub.status === "past_due"              ? "past_due"
                    : "cancelled"

                await prisma.subscription.update({
                    where: { stripeSubscriptionId: sub.id },
                    data: {
                        status: newStatus,
                        ...(tierMap[priceId] && { tier: tierMap[priceId] }),
                    },
                })
                break
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object
                if (!invoice.subscription) break

                await prisma.subscription.update({
                    where: { stripeSubscriptionId: invoice.subscription as string },
                    data: { status: "past_due" },
                })
                break
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object
                if (!invoice.subscription) break

                await prisma.subscription.update({
                    where: { stripeSubscriptionId: invoice.subscription as string },
                    data: { status: "active" },
                })
                break
            }

            default:
                break
        }

        res.status(200).json({ received: true })
    } catch (error) {
        console.log("Webhook handler error:", error)
        res.status(500).json({ message: "server error" })
    }
}
