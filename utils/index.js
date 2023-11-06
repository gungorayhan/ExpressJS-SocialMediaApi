import bcrypt from "bcrypt"
import JWT from "jsonwebtoken"

//bcrypt
export const hashString = async(useValue)=>{
    const salt = await bcrypt.genSalt(10)
    const hashedPasword = await bcrypt.hash(useValue,salt)
    return hashedPasword;
}

export const compareString=async(userPassword,password)=>{
    const isMatch=await bcrypt.compare(userPassword,password)
    return isMatch;
}


//jsonwebtoken
export function createJWT(id){
    return  JWT.sign({userId:id},process.env.JWT_SECRET_KEY,{expiresIn: "1d"})
}