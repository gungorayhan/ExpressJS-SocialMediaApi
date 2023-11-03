import mongoose,{Schema} from "mongoose";

//schema
const requestSchema=new Schema({
    requesetTo:{type:Schema.Types.ObjectId,ref:"Users"},
    requestFrom:{type:Schema.Types.ObjectId,ref:"Users"},
    requestStatus:{type:String, default:"Pending"}
},{timestamps:true})

const FriendRequest = mongoose.model("FriendRequest",requestSchema);

export default FriendRequest