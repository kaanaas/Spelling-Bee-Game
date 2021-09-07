const express = require("express");
const path = require("path");

const router = express.Router();
const app = express();

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
});

const port = process.env.PORT || 3000;
app.set('port', port);
app.listen(port, () => {
    console.log(`app.js: listening on port ${port}`);
});