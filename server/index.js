const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/" ,(req, res) => {
res.send("Temp Mail server is running");
});



mongoose.connect(process.env.MONGO_URI).then(()=> console.log("connected to MongoDB")).catch((err) => console.error("MongoDB connection eroor:", err));

const PORT = process.env.PORT || 5000;
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});
const inboxRoutes = require("./routes/inbox.js");
app.use("/inbox", inboxRoutes);
app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`);
});
