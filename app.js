require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const app = express().use("*", cors());


const {sendMail} = require('./src/services/mail.service');

app.use(compression());

app.get("/", async (req, res) => {
    await sendMail('hemamessi47@gmail.com', "welcom again from brave", "Generated Password Email");
    return res.status(200).json({
        name: "The brave spirit API",
        Description: "test version",
    });
});


// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// parse application/json
app.use(express.json());

//DB Connection
require("./configs/db").connection();


//Routes
const routes = require("./src/routes/index");
app.use("/", routes);

// Run the server
const port = process.env.PORT || 4000;
app.listen(port, async () => {
    console.log("server up and running on PORT :", port);
});

