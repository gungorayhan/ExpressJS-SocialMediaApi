import mongoose,{Schema} from "mongoose";

//schema
const emailVerificationSchema= new Schema({
    userId:String,
    token:String,
    createdAt:Date,
    expiresAt:Date
})

const Verification = mongoose.model("Verification",emailVerificationSchema)

export default Verification