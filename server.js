const express = require("express");
const session  = require("express-session");
const sqlite3 = require("sqlite3");
const app = express();
const urlencodedParser = express.urlencoded({extended: false});
const redisStorage = require('connect-redis')(session);
const redis = require('redis');
const { urlencoded } = require("express");
const client = redis.createClient({
    legacyMode: true,
    host: 'localhost',
    port: 6379
});
client.connect()

client.on('error', function (err) {
    console.log('Не удалось установить соединение с redis. ' + err);
});
client.on('connect', function (err) {
    console.log('Успешно подключен к redis');
});

let data = new Date()

app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/templates'));
app.use(express.static(__dirname + '/post_photo'));
app.use(
    session({
        secret: 'secret_key_for_instagram_jkshjfnosaif41564613',
        store: new redisStorage({
            client: client
        }),
        resave: true,
        saveUninitialized: true
    })
);


function abc123(a) {
    var abc = "1234567890abcdefghijklmnopqrstuvwxyz";
    var rs = "";
    while (rs.length < a) {
        rs += abc[Math.floor(Math.random() * abc.length)];
    };
    return rs;
};

function calcTime(offset) {
    var d = new Date();
    var utc = d.getTime() - (d.getTimezoneOffset() * 60000);
    var nd = new Date(utc + (3600000*offset));
    return nd.toLocaleString();
};

async function getdata (typeq, dataq) {
    let bd = new sqlite3.Database('instagram.db');
    all_types = {
        add_profile: 'INSERT INTO man (login, password, e_mail, phone, name_surname) VALUES (?, ?, ?, ?, ?)',
        create_post: 'INSERT INTO post (number_post, login, text_post, photo_post, date_post) VALUES (?, ?, ?, ?, ?)',
        load_likepost: `INSERT INTO like (number_post, like_from, id_like) VALUES (?, ?, ?)`,
        create_comments: 'INSERT INTO comments (number_post, comm_text, comm_from, id_comm) VALUES (?, ?, ?, ?)',
        load_post: `SELECT * FROM post WHERE number_post = "${dataq.number_post}"`,
        del_like: `DELETE FROM like WHERE number_post = "${dataq.number_post}" AND like_from = "${dataq.like_from}"`,
        del_post: 'DELETE FROM post WHERE number_post = ?',
        del_comm: 'DELETE FROM comments WHERE id_comm = ?',
        check_like: `SELECT * FROM like WHERE like_from = "${dataq.like_from}" AND number_post = "${dataq.number_post}"`,
        check_reg: `SELECT * FROM man WHERE login = "${dataq.login}"`,
        change_pass: `UPDATE man SET password = "${dataq.password_new}" WHERE login = "${dataq.login}" AND password = "${dataq.password}"`,
        check_log: `SELECT * FROM man WHERE login = "${dataq.login}" AND password = "${dataq.password}"`,
        l_r_photo: `SELECT photo_post FROM post ORDER BY RAND() LIMIT 24`,
        acc_log: `SELECT login, name_surname, avatar FROM man WHERE login = "${dataq.login}"`,
    };
    
    if (typeq == 'add_profile') {
        let prom = new Promise (function (res, rej) {
            bd.run(all_types[typeq], [dataq.login, dataq.password, dataq.e_mail, dataq.phone, dataq.name_surname], function (err) {
                if (err) {
                    console.log(err.message)
                };
            });
        });
        return prom;
    } else if (typeq == 'acc_log') {
        let prom = new Promise (function (res, rej) {
            bd.all(all_types[typeq], function (err, rows) {
                if (err) {
                    rej(err);
                } else {
                    res(rows)
                }
            })
        });
        return prom
    } else if (typeq == 'create_post') {
        let prom = new Promise (function (res, rej) {
            bd.run(all_types[typeq], [dataq.number_post, dataq.login, dataq.text_post, dataq.photo_post, dataq.date], function (err) {
                if (err) {
                    console.log(err.message)
                };
            });
        })
    } else if (typeq == 'change_pass') {
        console.log(dataq)
        let prom = new Promise (function(res, rej) {
            bd.run(all_types[typeq], function(err) {
                if (err) {
                    console.log(err.message)
                }
            });
        });
    } else if (typeq == 'check_reg') {
        let prom = new Promise (function(res, rej) {
            bd.all(all_types[typeq] + dataq.login + '"', function(err, rows) {
                if (rows.length == 0) {
                    res(true)
                } else if (err) {
                    rej(err); 
                } else {
                    res(false);
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
                    res(true);
                };
            });
        });
        return prom;
    } else if (typeq == 'load_post') {
        let prom = new Promise (function(res, rej){
            bd.all(all_types[typeq], function(err, rows){
                res(rows);
            });
        });
        return prom
    } else if (typeq == 'load_likepost') {
        let prom_s = new Promise(function(res, rej) {
            bd.all(all_types['check_like'], function(err, rows){
                if (rows.length == 0) {
                    let prom_d = new Promise(function(res, rej){
                        bd.run(all_types['load_likepost'], [dataq.number_post, dataq.like_from, dataq.id_like], function(err) {
                            if (err) {
                                console.log(err);
                            };
                        });
                    });
                } else {
                    let prom_d = new Promise(function(res, rej){
                        bd.run(all_types['del_like'], function(err) {
                            if(err) {
                                console.log(err);        
                            }
                        });
                    });
                };
            });
        });
        return prom_s
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
        if (data == true) {
            req.session["user"] = login;
            req.session["login"] = abc123(100);
            res.redirect("../");
        } else {
            console.log()
        };            
    });

});

app.post("/log_reg_photo", urlencodedParser, function (req, res) {
    getdata('l_r_photo').then(function(data){
        console.log(data)
    })
});

app.post("/check_ses", urlencodedParser, function (req, res) {
    if (req.session.login == undefined) {
        return false
    } else {
        return true
    }
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
        res.send(data);
    });
});

app.post("/check_reg_s", urlencodedParser, function (req, res) {
    indata = {
        login: req.body.login,
    };
    getdata('check_reg', indata).then(function(data){
        res.send(data);
    });
});

app.post('/change_password', urlencodedParser, function(req, res) {
    indata = {
        login: req.session.user,
        password: req.body.password,
        password_new: req.body.password_new
    };

    getdata('change_pass', indata).then(function (data){
        res.send(data);
    });
});

app.post('/exit_account', urlencodedParser, function(req, res) {
    if (req.session.login != undefined) {
        req.session.destroy();
        return true;
    } else {
        return false;
    };
});

app.post('/create_post_s', urlencodedParser, function (req, res) {
    number_post = abc123(60);
    text_post = req.body.text_post;
    photo_post = req.body.photo_post;
    login = req.body.login;
    time_zone = Number(((req.body.time_zone.split('')).slice(2, 3))[0])
    if (String((req.body.time_zone.split('')).slice(0, 1)) == '+') {
        date = calcTime(-time_zone*2);
    } else {
        date = calcTime(timezone*2)
    };
    indata = {
        number_post: number_post,
        text_post: text_post,
        photo_post: photo_post,
        login: login,
        date: date
    };
    getdata('create_post', indata).then(function(data){
        res.send(data);
    });
});

app.post('/load_like_post', urlencodedParser, function(req, res) {
    indata = {
        like_from: req.session['user'],
        number_post: req.body.number_post,
        id_like: abc123(50)
    };
    getdata('load_likepost', indata).then(function(data) {
        res.send(data);
    });
});

app.post('/load_post_s', urlencodedParser, function(req, res) {
    ret_of_obj = {
        login_: '',
        like_: '',
        photo_: '',
        text_: '',
    };
    indata = {
        number_post: req.body.number_post
    };
    getdata('load_post', indata).then(function(data) {
        ret_of_obj.login_ = data.login;
        ret_of_obj.text_ = data.text_post;
        ret_of_obj.photo_ = data.photo_post;
    });
});



app.get("/registration", function (req, res) {
    res.sendFile('templates/registration.html', {root: __dirname });
});

app.get("/login", function(req, res ) {
    res.sendFile('templates/login.html', {root: __dirname })
});

app.get("/account/:login", function (req, res) {
    let login = req.params.login;

    getdata('acc_log', {login: login}).then(function(data){
        l1 = data[0];
        l = 'post_photo/avatar/' + l1.avatar;
        data[0].avatar = l;
        console.log(data);
    })
});



app.listen(port=8000, function () {
    console.log('Сервер запущен...');
});