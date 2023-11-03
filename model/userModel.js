import mongoose,{Schema} from "mongoose";

//schema
const userSchema=new Schema({
    name:{
        type:String,
        require:[true,'First name is required']
    },
    lastName:{
        type:String,
        required:[true,"Last name is required"]
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minlength:[6,"password length should be greater than 6 character"],
        select:true
    },
    location:{type:String},
    profileUrl:{type:String},
    friends:[{type:Schema.Types.ObjectId, ref:"Users"}],
    views:[{type:String}],
    verified:{type:Boolean,default: false}
},
{
    timestamps:true
})

const Users = mongoose.model("Users",userSchema)

export default Users