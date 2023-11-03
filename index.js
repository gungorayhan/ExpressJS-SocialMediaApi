import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import morgan from "morgan"
import cors from "cors"

//securty
import helmet from "helmet"
//db
import dbConnection from "./dbConfig/index.js"

dotenv.config();
dbConnection();

const app = express();

const PORT = process.env.PORT;

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json({limit:"10mb"}))
app.use(express.urlencoded({extended:true}))

app.use(morgan("dev"))

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
})