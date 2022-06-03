const cookieParser = require("cookie-parser")
const express = require("express");
const session  = require("express-session");
const sqlite3 = require("sqlite3");
const app = express()
const bodyParser = require("body-parser");
const urlencodedParser = express.urlencoded({extended: false});
const redisStorage = require('connect-redis')(session);
const multer  = require("multer");
const redis = require('redis');
const cors = require('cors');
const { urlencoded } = require("express");
const { application } = require("express");
var abc_login_fds = '';
var abc_user_fds = ''
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const corsOptions ={
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true,
    optionSuccessStatus: 200,
    exposedHeaders: ['set-cookie', 'Access-Control-Allow-Origin']
 }

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

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "post_photo/post");
    },
    filename: (req, file, cb) =>{
        cb(null, (new Date()).getFullYear() + '_' + (new Date()).getMonth() + '_' + (new Date()).getDay() + '_' + (new Date()).getHours() + '_' + file.originalname);
    }
});
    

app.use(multer({storage:storageConfig}).single("photo_file"));
app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/templates'));
app.use(express.static(__dirname + '/post_photo'));
app.use(
    session({
        secret: 'dskflsssmfcccccdlmf',
        store: new redisStorage({
            client: client
        }),
        cookie: {
            secure: true,
            sameSite: "none",
            httpOnly: true
        },
        saveUninitialized: true,
        resave: true,
        rolling: true,
    })
);

app.use(cors(corsOptions))
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))

function dict_reverse(obj) {
    new_obj= {}
    rev_obj = Object.keys(obj).reverse();
    rev_obj.forEach(function(i) { 
      new_obj[i] = obj[i];
    })
    return new_obj;
}

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
            prom = await new Promise(function(res, rej) {
                getdata('check_like', {like_from: abc_user_fds, number_post: data1[0][j]['number_post']}).then(function(data) {
                    res(data)
                });
            });
            data1[String(i)][j]['setting_like'] = prom;
            if (String(data1[String(i)][j]['setting_like']) == 'true') {
                data1[String(i)][j]['like_post'] += 1
            }
            
        };
    };
    return data1;
};

async function getdata (typeq, dataq) {
    let bd = new sqlite3.Database('instagram.db');
    all_types = {
        add_profile: 'INSERT INTO man (login, password, e_mail, phone, name_surname) VALUES (?, ?, ?, ?, ?)',
        create_post: 'INSERT INTO post (number_post, login, text_post, photo_post) VALUES (?, ?, ?, ?)',
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
        all_post_user: `SELECT * FROM post WHERE login IN ${dataq.login} ORDER BY number DESC`,
        check_all_like_post: `SELECT COUNT(*) FROM like WHERE number_post = "${dataq.number_post}"`,
        sel_ava: `SELECT avatar FROM man WHERE login = "${dataq.login}"`,
        personalpage_up: `SELECT avatar FROM man WHERE login = "${dataq.login}" `,
        podpischiki: `SELECT COUNT(*) FROM subscribers WHERE to_sub = "${dataq.login}"`,
        posts: `SELECT COUNT(*) FROM post WHERE login = "${dataq.login}" ORDER BY number DESC`,
        about_me_s: `SELECT about_me FROM user_setting WHERE user = "${dataq.login}"`,
        page_pers_post: `SELECT photo_post FROM post WHERE login = "${dataq.login}" ORDER BY number DESC`,
        save_settings: `UPDATE man SET ${dataq.str}WHERE login = "${dataq.login}"`,
        getsetts: `SELECT * FROM man WHERE login = "${dataq.login}"`,
        save_post: `UPDATE post SET login = "${dataq.login_new}" WHERE login = "${dataq.login}"`,
        save_sub_f: `UPDATE subscribers SET from_sub = "${dataq.login_new}" WHERE from_sub = "${dataq.login}"`,
        save_sub_t: `UPDATE subscribers SET to_sub = "${dataq.login_new}" WHERE to_sub = "${dataq.login}"`,
        setting_a: `UPDATE user_setting SET user = "${dataq.login_new}" WHERE user = "${dataq.login}"`,
        setting_me: `UPDATE user_setting SET about_me = "${dataq.login_new}" WHERE user = "${dataq.login}"`
    };
    
    if (typeq == 'add_profile') {
        let prom = new Promise (function (res, rej) {
            bd.run(all_types[typeq], [dataq.login, dataq.password, dataq.e_mail, dataq.phone, dataq.name_surname], function (err) {
                if (err) {
                    console.log(err.message);
                    res(false)
                } else {
                    res(true)
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
                            } else {
                                res(true)
                            }
                        });
                    });
                } else {
                    let prom_d = new Promise (function (res, rej) {
                        bd.run(all_types['subscribe_del'], function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                res(true)
                            }
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
                            } else {
                                res(true)
                            }
                        });
                    });
                    res(prom_d)
                } else {
                    let prom_d = new Promise(function(res, rej){
                        bd.run(all_types['del_like'], function(err) {
                            if(err) {
                                console.log(err);        
                            } else {
                                res(false)
                            }
                        });
                    });
                    res(prom_d)
                };
                
            });
        });
        return prom_s
    } else if (typeq == 'personalpage_up') {
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
    } else if (typeq == 'podpischiki') {
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
    } else if (typeq == 'posts') {
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
    } else if (typeq == 'about_me_s') {
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
    } else if (typeq == 'page_pers_post') {
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
    } else if (typeq == 'subscribe_check') {
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
    } else if (typeq == 'check_like') {
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
    } else if (typeq == 'getsetts') {
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
    } else if (typeq == 'save_settings') {
        let prom = new Promise (function(res, rej) {
            bd.run(all_types[typeq], function(err) {
                if (err) {
                    console.log(err.message);
                    res(false)
                } else {
                    res(true)
                }
            });
        });
        return prom;
    } else if (typeq == 'save_post') {
        let prom = new Promise (function(res, rej) {
            bd.run(all_types[typeq], function(err) {
                if (err) {
                    console.log(err.message);
                    res(false)
                } else {
                    res(true)
                }
            });
        });
        return prom;
    } else if (typeq == 'save_sub_f') {
        let prom = new Promise (function(res, rej) {
            bd.run(all_types[typeq], function(err) {
                if (err) {
                    console.log(err.message);
                    res(false)
                } else {
                    res(true)
                }
            });
        });
        return prom;
    } else if (typeq == 'save_sub_t') {
        let prom = new Promise (function(res, rej) {
            bd.run(all_types[typeq], function(err) {
                if (err) {
                    console.log(err.message);
                    res(false)
                } else {
                    res(true)
                }
            });
        });
        return prom;
    } else if (typeq == 'setting_a') {
        let prom = new Promise (function(res, rej) {
            bd.run(all_types[typeq], function(err) {
                if (err) {
                    console.log(err.message);
                    res(false)
                } else {
                    res(true)
                }
            });
        });
        return prom;
    } else if (typeq == 'setting_me') {
        let prom = new Promise (function(res, rej) {
            bd.run(all_types[typeq], function(err) {
                if (err) {
                    console.log(err.message);
                    res(false)
                } else {
                    res(true)
                }
            });
        });
        return prom;
    }
};

app.post('/settget', urlencodedParser, function(req, res) {
    let indata = {
        login: req.body.login
    };

    let data12 = {
        login: req.body.login,
        name_surname: '',
        about_me: '',
        phone: '',
        email: '',
        avatar: ''
    }
    getdata('getsetts', indata).then(function(data) {
        data12['name_surname'] = data[0]['name_surname'];
        data12['email'] = data[0]['e_mail'];
        data12['phone'] = data[0]['phone'];
        data12['avatar'] = 'http://127.0.0.1:8000/avatar/' + data[0]['avatar']

    });
    getdata('about_me_s', indata).then(function(data) {
        data12['about_me'] = data[0]['about_me'];
    });

    setTimeout(() => {
        res.send(data12);
    }, 200);
});

app.post('/settup', urlencodedParser, function(req, res) {
    let indata = {
        login: req.body.login,
        phone: req.body.phone,
        about_me: req.body.about_me,
        name_surname: req.body.name_surname,
        email: req.body.email,
    };
    a = `login = "${indata.login}" `;
    b = `phone = "${indata.phone}" `;
    c = `about_me = "${indata.about_me}" `;
    d = `name_surname = "${indata.name_surname}" `;
    e = `e_mail = "${indata.email}" `;
    itog = '';
    if (indata.login.length != 0) {
        if (itog.length != 0) {
            itog += a
            if (indata.phone.length != 0 || indata.name_surname.length != 0 || indata.email.length != 0) {
                itog += ', ';
            }
        } else {
            itog += a;
            if (indata.phone.length != 0 || indata.name_surname.length != 0 || indata.email.length != 0) {
                itog += ', ';
            }
        }
        
    }; 
    if (indata.phone.length != 0) {
        if (itog.length == 0) {
            itog += b
            if (indata.name_surname.length != 0 || indata.email.length != 0) {
                itog += ', ';
            }
        } else {
            itog += b;
            if (indata.name_surname.length != 0 || indata.email.length != 0) {
                itog += ', ';
            }
        }
    }; 
    if (indata.name_surname.length != 0) {
        if (itog.length == 0) {
            itog += d
            if (indata.email.length != 0) {
                itog += ', ';
            }
        } else {
            itog += d;
            if (indata.email.length != 0) {
                itog += ', ';
            }
        }
    }; 
    if (indata.email.length != 0) {
        itog += e
    };

    getdata('save_settings', {str: itog, login: abc_user_fds}).then(function(data) {
    }) ;
    if (req.body.login.length != 0){
        getdata('save_post', {login_new: req.body.login, login: abc_user_fds}).then(function(data) {
        });
        getdata('save_sub_f', {login_new: req.body.login, login: abc_user_fds}).then(function(data) {
        });
        getdata('save_sub_t', {login_new: req.body.login, login: abc_user_fds}).then(function(data) {
        });
        getdata('setting_a', {login_new: req.body.login, login: abc_user_fds, about_me: req.body.about_me}).then(function(data) {
        });
        abc_user_fds = req.body.login
    }
        
    if (req.body.about_me.length != 0) {
        getdata('setting_me', {login_new: req.body.login, login: abc_user_fds, about_me: req.body.about_me}).then(function(data) {
        });
    }
    
});

app.post('/personalpage', urlencodedParser, function(req, res) {
    console.log(req.body.login)
    console.log(req.body.login_from)
    let indata = {
        login: (req.body.login).slice(9),
        login_from: req.body.login_from,
    };
    if ((req.body.login).slice(9) == abc_user_fds){
        let a = {
            up: {
                login: (req.body.login).slice(9),
                avatar: '',
                subscribers: '',
                settings: 'true'
            },
            postss: {
                
            }
        }
        getdata('personalpage_up', indata).then(function(data){
            a['up']['avatar'] = 'http://127.0.0.1:8000/avatar/' + data[0]['avatar'];
        });
        getdata('podpischiki', indata).then(function(data) {
            a['up']['subscribers'] = data[0]['COUNT(*)'];
        });
        getdata('posts', indata).then(function(data) {
            a['up']['posts'] = data[0]['COUNT(*)'];
        });
        getdata('about_me_s', indata).then(function(data) {
            a['up']['about_me'] = data[0]['about_me'];
        });
        getdata('subscribe_check', {from_sub: req.body.login_from, to_sub: (req.body.login).slice(9)}).then(function(data) {
            a['up']['settings_sub'] = data
        });
        getdata('page_pers_post', indata).then(function(data) {
            let adsfasa = data.length
            let len_3 = Math.ceil((data.length) / 3)
            for (let j = 0; j < len_3; j++) {
                a['postss'][j] = []
                if (adsfasa >= 3) {
                    for (let i = 0; i < 3; i++) {
                        a['postss'][j].push(data[0]['photo_post']);
                        data.shift();
                    };
                } else if (adsfasa < 3) {
                    for (let i = 0; i < adsfasa; i++) {
                        a['postss'][j].push(data[0]['photo_post']);
                        data.shift();
                    };
                }
                adsfasa -= 3
            };
        });
        setTimeout(() => {
            console.log(a)
            res.send(a);
        }, 200);
    } else {
        let a = {
            up: {
                login: (req.body.login).slice(9),
                avatar: '',
                subscribers: '',
                settings: 'false'
            },
            postss: {
                
            }
        }
        getdata('personalpage_up', indata).then(function(data){
            a['up']['avatar'] = 'http://127.0.0.1:8000/avatar/' + data[0]['avatar'];
        });
        getdata('podpischiki', indata).then(function(data) {
            a['up']['subscribers'] = data[0]['COUNT(*)'];
        });
        getdata('posts', indata).then(function(data) {
            a['up']['posts'] = data[0]['COUNT(*)'];
        });
        getdata('about_me_s', indata).then(function(data) {
            a['up']['about_me'] = data[0]['about_me'];
        });
        getdata('subscribe_check', {from_sub: req.body.login_from, to_sub: (req.body.login).slice(9)}).then(function(data) {
            a['up']['settings_sub'] = data
        });
        getdata('page_pers_post', indata).then(function(data) {
            let adsfasa = data.length
            let len_3 = Math.ceil((data.length) / 3)
            for (let j = 0; j < len_3; j++) {
                a['postss'][j] = []
                if (adsfasa >= 3) {
                    for (let i = 0; i < 3; i++) {
                        a['postss'][j].push(data[0]['photo_post']);
                        data.shift();
                    };
                } else if (adsfasa < 3) {
                    for (let i = 0; i < adsfasa; i++) {
                        a['postss'][j].push(data[0]['photo_post']);
                        data.shift();
                    };
                }
                adsfasa -= 3
            };
        });
        setTimeout(() => {
            console.log(a)
            res.send(a);
        }, 200);
    }
    
});

app.post('/login_s', urlencodedParser, function(req, res) {
    login = req.body.login;
    password = req.body.password;
    let indata = {
        login: login, 
        password: password
    };  
    if (req.session["user"] != abc_login_fds) {
        getdata('check_log', indata).then(function(data) {
            if (data == true) {
                req.session['user'] = indata.login;
                req.session['login'] = abc123(100);
                abc_user_fds = indata.login
                abc_login_fds = req.sessionID;
                res.send([true, req.sessionID])
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
        user_p: abc_user_fds,
    };
    console.log(req.body.user_sid, abc_login_fds)
    if (req.body.user_sid === abc_login_fds) {
        getdata('all_sub_user', indata).then(function(data){
            len_data = data.length
            let a = []
            for (let i = 0; i < data.length; i++) {
                b = data[i]['to_sub'];
                a.push(b);
            }; 
            post_for_lenta(len_data, a).then(function(data) {
                console.log(data)
                res.send(data);
            });
    });
    } else {
        res.send(false)
    }
    
});

app.post("/upload_file", urlencodedParser,function (req, res, next) {
        let filedata = req.file;
        console.log(req.body);
        let indata = {
            login: abc_user_fds,
            number_post: abc123(50),
            photo_post: filedata.filename,
            text_post: req.body.text_post
        }
        if (!filedata) {
            res.redirect(301, 'http://localhost:8080/account/' + abc_user_fds);
        } else {
            getdata('create_post', indata).then(function(data) {
                res.redirect(301, 'http://localhost:8080/account/' + abc_user_fds);
            });
        }
    });    

app.post('/subscribator', urlencodedParser, function(req, res) {
    let indata = {
        from_sub: req.body.login_from,
        to_sub: (req.body.login).slice(9),
        sub_id: abc123(50)
    }
    if (req.body.login_from == abc_user_fds) {
        console.log(123)
        getdata('subscribe_bd', indata).then(function(data) {
            res.send(true)
        });
        console.log(321)
        res.send(true)
    } else {
        res.send(false)
    };
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
    console.log(req.body.user_sid, abc_login_fds)
    if (req.body.user_sid === abc_login_fds) {
        res.send(true)
    } else {
        res.send(false)
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
        console.log(data)
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
    abc_login_fds= '';
    abc_user_fds = '';
    console.log(req.body);
    return true
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
        like_from: req.body.login,
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



app.listen(port=8000, function () {
    console.log('Сервер запущен...');
});