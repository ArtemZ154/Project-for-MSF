const express = require("express");
const session  = require("express-session");
const sqlite3 = require("sqlite3");
const app = express()
    bodyParser = require("body-parser");
    port = 3080;
const urlencodedParser = express.urlencoded({extended: false});
const redisStorage = require('connect-redis')(session);
const redis = require('redis');
const cors = require('cors');
const { urlencoded } = require("express");

const corsOptions ={
    origin:'*',
    credentials:true,
    optionSuccessStatus:200
 }
 
 app.use(cors(corsOptions))

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

app.use(bodyParser.json());
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

async function post_for_lenta(len_data, a) {
    data1 = {

    };
    a = a.join('","');
    let indata = {
        login: '("' + a + '")'
    };
    let prom = await new Promise(function(res, rej) {
        getdata('all_post_user', indata).then(function(dataa) {
            res(dataa)
        });  
    });
    data1[0] = prom
    let count = 0;
    for (let key in data1) {
        count++
    };
    for (let i = 0; i < count; i++) {
        for (let j = 0; j < data1[i].length; j++) {
            let indata = {
                number_post: data1[i]['number_post'],
            };
            let prom = await new Promise (function(res, rej) {
                getdata('check_all_like_post', indata).then(function(dataa) {
                    res(dataa)
                });  
            });
            fs = data1[i][j]['photo_post'];
            data1[i][j]['photo_post'] = '/post/' + fs
            data1[String(i)][j]['like_post'] = prom[0]['COUNT(*)']
            indata = {
                login: data1[i][j]['login'],
            };
            prom = await new Promise(function(res, rej) {
                getdata('sel_ava', indata).then(function(dataa) {
                    res(dataa);
                });
            });
            fs = '/avatar/' + prom[0]['avatar']
            data1[String(i)][j]['avatar'] = fs;
        };
    };
    return data1;
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
        l_r_photo: `SELECT photo_post FROM post ORDER BY RANDOM() LIMIT 25`,
        acc_log: `SELECT login, name_surname, avatar FROM man WHERE login = "${dataq.login}"`,
        personal_post: `SELECT photo_post FROM post WHERE login = "${dataq.login}"`,
        subscribe_bd: 'INSERT INTO subscribers (sub_id, from_sub, to_sub) VALUES (?, ?, ?)',
        subscribe_check: `SELECT * FROM subscribers WHERE from_sub = "${dataq.from_sub}" AND to_sub = "${dataq.to_sub}"`,
        subscribe_del: `DELETE FROM subscribers WHERE from_sub = "${dataq.from_sub}" AND to_sub = "${dataq.to_sub}"`,
        all_sub_user: `SELECT to_sub FROM subscribers WHERE from_sub = "${dataq.user_p}"`,
        all_post_user: `SELECT * FROM post WHERE login IN ${dataq.login}`,
        check_all_like_post: `SELECT COUNT(*) FROM like WHERE number_post = "${dataq.number_post}"`,
        sel_ava: `SELECT avatar FROM man WHERE login = "${dataq.login}"`
    };
    
    if (typeq == 'add_profile') {
        let prom = new Promise (function (res, rej) {
            bd.run(all_types[typeq], [dataq.login, dataq.password, dataq.e_mail, dataq.phone, dataq.name_surname], function (err) {
                if (err) {
                    console.log(err.message);
                };
            });
        });
        return prom;
    } else if (typeq == 'check_all_like_post') {
        let prom = new Promise (function(res, rej) {
            bd.all(all_types[typeq], function(err, rows) {
                if (err) {
                    console.log(err)
                    rej(err);
                } else {
                    res(rows);
                };
            });
        }); 
        return prom;
    } else if (typeq == 'sel_ava') {
        let prom = new Promise (function(res, rej) {
            bd.all(all_types[typeq], function(err, rows) {
                if (err) {
                    console.log(err)
                    rej(err);
                } else {
                    res(rows);
                };
            });
        }); 
        return prom;
    } else if (typeq == 'all_sub_user') {
        let prom = new Promise (function(res, rej) {
            bd.all(all_types['all_sub_user'], function(err, rows) {
                if (err) {
                    console.log(err)
                    rej(err);
                } else {
                    res(rows);
                };
            });
        }); 
        return prom;
    } else if (typeq == 'all_post_user') {
        let prom = new Promise (function(res, rej) {
            bd.all(all_types['all_post_user'], function(err, rows) {
                if (err) {
                    console.log(err)
                    rej(err);
                } else {
                    res(rows);
                };
            });
        }); 
        return prom;
    } else if (typeq == 'subscribe_bd') {
        let prom = new Promise(function(res, rej) {
            bd.all(all_types['subscribe_check'], function(err, rows) {
                if (rows.length == 0) {
                    let prom_d = new Promise(function(res, rej) {
                        bd.run(all_types['subscribe_bd'], [dataq.sub_id, dataq.from_sub, dataq.to_sub], function (err) {
                            if (err) {
                                console.log(err);
                            };
                        });
                    });
                } else {
                    let prom_d = new Promise (function (res, rej) {
                        bd.run(all_types['subscribe_del'], function (err) {
                            if (err) {
                                console.log(err);
                            };
                        });
                    });
                }

            })
        });
        return prom 
    } else if (typeq == 'l_r_photo'){
        let prom = new Promise (function (res, rej) {
            bd.all(all_types[typeq], function(err, rows) {
                if (err) {
                    rej(err.message)
                } else {
                    res(rows)
                }
            });
        });
        return prom
    } else if (typeq == 'personal_post') {
        let prom = new Promise (function(res, rej) {
            bd.all(all_types[typeq], function(err, rows) {
                if (err) {
                    rej(err.message);
                } else {
                    res(rows);
                }
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
    let indata = {
        login: login, 
        password: password
    };
    if (req.session["user"] == undefined) {
        getdata('check_log', indata).then(function(data) {
            if (data == true) {
                req.session["user"] = login;
                req.session["login"] = abc123(100);
                res.send(true)
            } else {
                res.send(false)
            };            
        });
    } else {
        res.send('log_true')
    };
});

app.post('/lenta_sub', urlencodedParser, function(req, res) {
    let indata = {
        user_p: req.session['user'],
    };
    getdata('all_sub_user', indata).then(function(data){
        len_data = data.length
        let a = []
        for (let i = 0; i < data.length; i++) {
            b = data[i]['to_sub'];
            a.push(b);
        }; 
        post_for_lenta(len_data, a).then(function(data) {
            res.send(data);
        });
    });
});

app.post('/subscribator', urlencodedParser, function(req, res) {
    let indata = {
        from_sub: req.session['user'],
        to_sub: req.body.to_sub,
        sub_id: abc123(50)
    }
    getdata('subscribe_bd', indata).then(function(data) {
        res.send()
    })
})

app.post("/log_reg_photo", urlencodedParser, function (req, res) {
    getdata('l_r_photo', {}).then(function(data){
        let data_o = {};
        for (i = 0; i < 4; i++) {
            a = []
            for (j = 0; j < 6; j++) {
                if (data.length == 0 || j == 6) {
                    break
                } else {
                    f = 'http://127.0.0.1:8000/post/' + data[0].photo_post;
                    a.unshift(f)
                    data.splice(0, 1)
                };
            }
            data_o[i + 1] = a;
        };
        res.send(data_o);
    })
});

app.post("/check_ses", urlencodedParser, function (req, res) {
    if (req.session.login == undefined) {
        res.send(false)
    } else {
        res.send(true)
    }
});

app.post("/registration_s", urlencodedParser, function (req, res) {
    login = req.body.login;
    password = req.body.password;
    e_mail = req.body.e_mail;
    phone = req.body.phone;
    name_surname = req.body.name_surname;
    let indata = {
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
    let indata = {
        login: req.body.login,
    };
    getdata('check_reg', indata).then(function(data){
        res.send(data);
    });
});

app.post('/change_password', urlencodedParser, function(req, res) {
    let indata = {
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
    let indata = {
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
    let indata = {
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
    let indata = {
        number_post: req.body.number_post
    };
    getdata('load_post', indata).then(function(data) {
        ret_of_obj.login_ = data.login;
        ret_of_obj.text_ = data.text_post;
        ret_of_obj.photo_ = data.photo_post;
    });
});

app.post('/personal_page_post', urlencodedParser, function(req, res) {
    let indata = {
        login: req.session['user']
    };
    getdata('personal_post', indata).then(function(data) {
        console.log(data);
        res.send(data)
    });
});



app.get("/registration", function (req, res) {
    res.sendFile('templates/registration123.html', {root: __dirname });
});

app.get("/login", function(req, res) {
    res.sendFile('templates/login123.html', {root: __dirname })
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

app.get('/', function (req, res) {
    res.sendFile('templates/main.html', {root: __dirname })
});

app.get("/test", function(req, res) {
    res.sendFile('templates/test.html', {root: __dirname })
});



app.listen(port=8000, function () {
    console.log('Сервер запущен...');
});