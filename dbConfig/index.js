import mongoose from "mongoose";


async function dbConnection (){
    try {
        const connection = mongoose.connect(process.env.MONGODB_URL,{
            // useNewUrlParser:true,
            // useUnifiedTopology:true,
        })
    } catch (error) {
        console.log("DB Error: "+ error )
    }
} 

export default dbConnection