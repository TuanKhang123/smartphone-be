import "dotenv/config"
import express from "express"
import cors from "cors"
import mongoose from "mongoose"

const app = express();

app.use(cors());
app.use(express.json());


app.get("/health", (req, res) => {
    res.json({ok: true});
})

async function start() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    })
}

start();