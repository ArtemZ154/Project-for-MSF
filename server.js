const express = require("express");
const session  = require("express-session");
const sqlite3 = require("sqlite3");
const app = express();


app.get("/", function (req, res) {

});

app.get("/registration", function (req, res) {

});

app.get("/login", function (req, res) {

});

app.get("/:nickname", function (req, res) {

});

app.get("/create_post", function (req, res) {

});



app.listen(port=8000, function () {
    console.log('Сервер запущен...');
});