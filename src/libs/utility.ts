import jwt from "jsonwebtoken"
const secretToken = process.env.SECRET_KEY || "MYfitnessappsecretkey"


export const createToken =(id : number)=>{

    return jwt.sign({id}, secretToken!)


}

 export const getPrice = (tier: "monthly" |"weekly"| "yearly"  ) =>{ 

    if (tier === "monthly" ) {
return process.env.MONTHLY_PRICE!   as string
    }else if (tier === "weekly"){
return process.env.WEEKLY_PRICE! as string
    } else if (tier === "yearly"){
        return process.env.YEARLY_PRICE! as string
    }

}