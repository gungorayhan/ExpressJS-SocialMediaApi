import mongoose, { Schema } from "mongoose";

//schema
const passwordResetSchema= new Schema({
    userId:{type:String,unique:true},
    emial:{type:String,unique:true},
    token:String,
    createdAt:Date,
    expiresAt:Date
})

const PasswordReset= mongoose.model("PasswordReset", passwordResetSchema);

export default PasswordReset