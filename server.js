const express = require("express");
const session  = require("express-session");
const sqlite3 = require("sqlite3");
const app = express();
const urlencodedParser = express.urlencoded({extended: false});

app.use(express.static(__dirname + '/public'));
app.use(
    session({
        secret: abc(),
        resave: true,
        saveUninitialized: true
    })
);

function abc() {
    var abc = "a1bcd5e2fgh95ij3k8lmn54op6qrstu7vwx9yz";
    var rs = "";
    while (rs.length < 100) {
        rs += abc[Math.floor(Math.random() * abc.length)];
    };
    return rs;
}

async function getdata (typeq, dataq) {
    let bd = new sqlite3.Database('instagram.db');
    all_types = {
        add_profile: 'INSERT INTO man (login, password, e_mail, phone, name_surname) VALUES (?, ?, ?, ?, ?)',
        create_post: 'INSERT INTO post (number_post, login, text_post, photo_post) VALUES (?, ?, ?, ?)',
        like_post: 'INSERT INTO like (number_post, like_from, id_like) VALUES (?, ?, ?)',
        create_comments: 'INSERT INTO comments (number_post, comm_text, comm_from, id_comm) VALUES (?, ?, ?, ?)',
        del_like: 'DELETE FROM like WHERE id_like = ?',
        del_post: 'DELETE FROM post WHERE number_post = ?',
        del_comm: 'DELETE FROM comments WHERE id_comm = ?',
        check_reg: 'SELECT * FROM man WHERE login = "${dataq.login}"',
        check_log: `SELECT * FROM man WHERE login = "${dataq.login}" AND password = "${dataq.password}"`, 
    };
    
    if (typeq == 'add_profile') {
        let prom = new Promise (function (res, rej) {
            bd.run(all_types[typeq], [dataq.login, dataq.password, dataq.e_mail, dataq.phone, dataq.name_surname], function (err) {
                if (err) {
                    console.log(err.message)
                };
            });
        });
        return prom
    } else if (typeq == 'check_reg') {
        let prom = new Promise (function(res, rej) {
            bd.all(all_types[typeq] + dataq.login + '"', function(err, rows) {
                if (rows.length == 0) {
                    res(true)
                } else if (err) {
                    rej(err);
                } else {
                    res(false)
                };
            });
        });
        let data = prom;
        return prom;
    } else if (typeq == 'check_log') {
        let prom = new Promise (function(res, rej) {
            bd.all(all_types[typeq], function(err, rows) {
                if (rows.length == 0) {
                    res(false)
                } else if (err) {
                    rej(err);
                } else {
                    res(true)
                };
            });
        });
        return prom;
    } else {
        let sqlq = all_types[typeq];
        let prom = new Promise(function(res, rej){
            bd.all(sqlq, dataq, function(err, rows){
                if (err) {
                    rej(err);
                } else {
                    res(rows);
                };
            });
        });
        let data = prom;
        bd.close();
        return data;
    };
};

app.post('/login_s', urlencodedParser, function(req, res) {
    login = req.body.login;
    password = req.body.password;
    indata = {
        login: login, 
        password: password
    };
    getdata('check_log', indata).then(function(data) {
        console.log(data)
        if (data == true) {
            req.session["login"] = abc();
            res.redirect("../");
        } else(
            console.log()
        );            
    });
});

app.post("/registration_s", urlencodedParser, function (req, res) {
    login = req.body.login;
    password = req.body.password;
    e_mail = req.body.e_mail;
    phone = req.body.phone;
    name_surname = req.body.name_surname;
    indata = {
        login: login,
        password: password,
        e_mail: e_mail,
        phone: phone,
        name_surname: name_surname,
    };
    getdata('add_profile', indata).then(function(data) {
        console.log(data);
        res.send(data);
    });
});

app.post("/check_reg_s", urlencodedParser, function (req, res) {
    indata = {
        login: req.params.login,
    };
    getdata('check_reg', indata).then(function(data){
        return data;
    });
});

app.get("/login/", function (req, res) {
    res.sendFile('static/index.html', {root: __dirname });
});

app.get("/", function (req, res) {
    if (!req.session.login) {
        res.send("Вы не вошли");
    } else {
        res.send("авторизация пройдена");
    };
});

app.get("/:login", function (req, res) {

});

app.get("/create_post", function (req, res) {

});



app.listen(port=8000, function () {
    console.log('Сервер запущен...');
});