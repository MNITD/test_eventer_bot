/**
 * Created by bogdan on 29.06.17.
 */
var TelegramBot = require('node-telegram-bot-api');
var token = require('./token');

var bot = new TelegramBot(token, {polling: true});

var Firebase = require('./connect');

var User = require('./user');


function getInlineButtons(data, page) {
    var options, buttons = [], item_num = 4, len, keys;
    page = page | 0;
    len = page * item_num + 4;

    if (!Array.isArray(data)) {

        keys = Object.keys(data);
        len = len < keys.length ? len : keys.length;

        for (var i = page * item_num; i < len; i++) {
            buttons.push([{text: keys[i], callback_data: keys[i]}]);
        }

    } else {
        data.forEach(function (user) {
            buttons.push([user]);
        });
    }
    if (page !== 0)
        buttons.push([{text: '<< prev', callback_data: 'other_' + (page - 1) + '_prev'}]);
    if ((data.length > 4 && len !== data.length) || (keys && keys.length > 4 && len !== keys.length)) {
        if (page === 0) buttons.push([{text: 'next >>', callback_data: 'other_' + (page + 1) + '_next'}]);
        else buttons[buttons.length - 1].push([{text: 'next >>', callback_data: 'other_' + (page + 1) + '_next'}]);
    }
    options = {
        reply_markup: JSON.stringify({
            inline_keyboard: buttons
        })
    };
    return options;
}

function getReplyButtons(dataArr) {
    var options, buttons = [], keys, row, passFlag = false;

    dataArr.forEach(function (data) {
        keys = Object.keys(data);

        keys.forEach(function (key, index) {
            if (!passFlag) {
                row = [];
                row.push({text: data[key], callback_data: key});
                if (data[key].length < 9 && index < keys.length - 1 && data[keys[index + 1]].length < 9) {
                    row.push({text: data[keys[index + 1]], callback_data: keys[index + 1]});
                    passFlag = true
                }
                buttons.push(row);
            } else {
                passFlag = false;
            }

        });
    });

    options = {
        reply_markup: JSON.stringify({
            keyboard: buttons,
            one_time_keyboard: true
        })
    };
    return options;
}

function removeReplyButtons() {
    var options;
    options = {
        reply_markup: JSON.stringify({
            remove_keyboard: true
        })
    };
    return options;
}

bot.getMe().then(function (me) {
    console.log('Hi my name is %s!', me.username);
});

var users = {}, connectionUsers;

//matches /start
bot.onText(/\/start/, function (msg, match) {
    var message = "Welcome to eventer_bot.\n";
    message += "This bot help you to exchange your contact information with other users.";
    bot.sendMessage(msg.chat.id, message);
});


// bot.onText(/\/echo (.+)/, function (msg, match) {
//     bot.sendMessage(msg.chat.id, match[1]);
// });

bot.on("text", function (msg) {
    console.log("On text from user " + msg.from.id);
    var item;
    if (users[msg.from.id] && users[msg.from.id].getState() === "profile_filling") {
        users[msg.from.id].setItem(users[msg.from.id].currentItem().key, msg.text);

        item = users[msg.from.id].nextItem();
        if (item.index !== -1)
            bot.sendMessage(msg.chat.id, "Your " + item.key + ":");
        else {
            users[msg.from.id].setState("profile_filled");
            Firebase.ref().user(msg.from.id).set({data: users[msg.from.id].getData()}).then(function (ref) {
                //ref.set();
                bot.sendMessage(msg.chat.id, "Your profile has successfully filled.");
            });
        }

    } else if (users[msg.from.id] && users[msg.from.id].getState() === "profile_updating") {
        if (msg.text !== "Y") users[msg.from.id].setItem(users[msg.from.id].currentItem().key, msg.text);

        users[msg.from.id].setState("profile_updated");
        Firebase.ref().user(msg.from.id).set({data: users[msg.from.id].getData()}).then(function (ref) {
            //ref.set();
            bot.sendMessage(msg.chat.id, "Your profile has successfully updated.");
        });
    } else if (users[msg.from.id] && users[msg.from.id].getState() === "profile_sharing") {

        if (msg.text.toLowerCase() === "initiate") { //initiate exchange
            bot.sendMessage(msg.from.id, "Waiting for other user...", removeReplyButtons());
            Firebase.exchange(msg.from.id, function onExchange(val) { //TODO edit inlineButtons, when new users
                users[msg.from.id].setState("started_sharing");
                var mapedUsers = val.map(function (user) {
                    return {
                        text: user.data.name + " " + user.data.surname,
                        callback_data: user.key + "_" + user.id
                    };
                });
                console.log("mappedUsers:");
                console.log(mapedUsers);
                bot.sendMessage(msg.from.id, "This users want to exchange profile with you:", getInlineButtons(mapedUsers));

            });
        } else if (msg.text.toLowerCase() === "join") {//join exchange
            Firebase.ref().connections().users().then(function (val) {
                users[msg.from.id].setState("joined_sharing");
                connectionUsers = val.map(function (user) {
                    return {text: user.data.name + " " + user.data.surname, callback_data: user.key};
                });
                bot.sendMessage(msg.from.id, "Choose user to exchange:", getInlineButtons(connectionUsers));
            });
        }
        //console.log(msg);
    }
});

bot.onText(/\/profile/, function (msg, match) {
    var message;
    console.log("User " + msg.from.id + " choose /profile");
    Firebase.ref().user(msg.from.id).val().then(function (val) {
        if (!val) {  // state === initial
            users[msg.from.id] = new User();
            users[msg.from.id].setState("profile_filling");
            message = "Your profile is empty. Answer questions to fill profile.";
            bot.sendMessage(msg.from.id, message)
                .then(function () {
                    bot.sendMessage(msg.from.id, "Your " + users[msg.from.id].nextItem().key + ":");
                });
        } else {
            message = "Your profile:\n\n" + User.parseProfile(val.data);
            bot.sendMessage(msg.from.id, message);
        }
    });
});

bot.onText(/\/update_profile/, function (msg, match) {
    var message;
    console.log("User " + msg.from.id + " choose /update_profile");
    Firebase.ref().user(msg.from.id).val().then(function (val) {
        if (val) { // state !== initial
            users[msg.from.id] = new User(val.data);
            users[msg.from.id].setState("profile_updating");
            message = "Answer the question to update profile. To save previous value write \'Y\'.";
            bot.sendMessage(msg.from.id, message, getInlineButtons(users[msg.from.id].getData()));
        } else
            bot.sendMessage(msg.from.id, "/profile");
    })
});

bot.onText(/\/contacts/, function (msg, match) {
    var message;
    if (!users[msg.from.id]) {
        message = "You have no contacts yet.";
        bot.sendMessage(msg.from.id, message);
    } else {
        message = "You have " + users[msg.from.id].getContacts.length + " contacts:\n\n";
        bot.sendMessage(msg.chat.id, message)
            .then(function () {
                users[msg.from.id].getContacts().forEach(function (contact) {
                    bot.sendMessage(msg.chat.id, User.parseProfile(contact));
                });
            });
    }
});

bot.onText(/\/share_profile/, function (msg, match) {
    // bot.sendMessage(msg.chat.id, "This command has not specified yet.");
    var message;
    console.log("User " + msg.from.id + " choose /share_profile");
    if (!users[msg.from.id]) users[msg.from.id] = new User();
    users[msg.from.id].setState("profile_sharing");
    message = "To exchange profile choose option: \n";
    message += "\t- initiate to start exchange\n";
    message += "\t- join to join existed exchange";
    data = [{initiate: "Initiate", join: "Join"}];
    bot.sendMessage(msg.from.id, message, getReplyButtons(data));
});

// handler for inline keyboards
bot.on('callback_query', function (msg) {
    var args, options, answer;
    console.log("On callback_query from user " + msg.from.id);

    args = msg.data.split('_');

    if (args[0] === 'other') {
        answer = 'You choose: ' + (args[2] === 'prev' ? '<<' : '>>');
    } else {
        answer = args[0];
    }


    options = {chat_id: msg.message.chat.id, message_id: msg.message.message_id};


    if (users[msg.from.id].getState() === "profile_updating") {

        bot.answerCallbackQuery(msg.id, answer, false);
        if (args[0] === 'other') {
            bot.editMessageReplyMarkup(getInlineButtons(users[msg.from.id].getData(), args[1]).reply_markup, options);
        } else {
            bot.sendMessage(msg.from.id, "Your " + msg.data + ": (" + users[msg.from.id].currentItem(msg.data).val + ")");
        }
    } else if (users[msg.from.id].getState() === "joined_sharing") {

        if (args[0] === 'other') {
            bot.answerCallbackQuery(msg.id, answer, false);
            bot.editMessageReplyMarkup(getInlineButtons(connectionUsers, args[1]).reply_markup, options);
        } else {

            answer = connectionUsers.find(function (user) {
                return user.callback_data === args[0];
            }).text;
            bot.answerCallbackQuery(msg.id, answer, false);
            var candidate = {};
            candidate[msg.from.id] = {status: 'f'};

            // console.log(candidate);

            Firebase.ref().connections(msg.data).candidates().set(candidate, function onApprove() {
                bot.sendMessage(msg.from.id, "Contact successfully exchanged!");
                users[msg.from.id].setState("complete_sharing");
            }).then(function () {
                bot.sendMessage(msg.from.id, "Wating for reply...", removeReplyButtons());
            });

        }
    } else if (users[msg.from.id].getState() === "started_sharing") {
        if (args[0] === 'other') {
            bot.answerCallbackQuery(msg.id, answer, false);
            // bot.editMessageReplyMarkup(getInlineButtons(connectionUsers, args[1]).reply_markup, options);
        } else {
            Firebase.ref().user(args[1]).val().then(function (val) {
                answer = val.data.name + " " + val.data.surname;
                bot.answerCallbackQuery(msg.id, answer, false);
                var candidate = {};
                candidate[args[1]] = {status: 't'};
                // var connectionKey = connectionUsers.find()
                Firebase.ref().connections(args[0]).candidates().set(candidate).then(function () {
                    bot.sendMessage(msg.from.id, "Contact successfully exchanged!");
                    users[msg.from.id].setState("complete_sharing");
                });
            });

        }
    }
});


/**
 * Implementation of inline query handlers
 */

bot.on('inline_query', function (query) {
    var articles = [];
    articles.push({
        type: "article",
        id: "article_about",
        title: "About",
        input_message_content: {
            message_text: "This bot help you to exchange your contact information with other users.\nStart right now with @test_eventer_bot!"
        }
    });
    console.log(query);
    Firebase.ref().user(query.from.id).val().then(function (val) {
        if (val) { // state !== initial
            console.log(val.data);//
            articles.push({
                type: "article",
                id: "article_my_profile",
                title: "My Profile",
                input_message_content: {
                    message_text: User.parseProfile(val.data)
                }
            });
            bot.answerInlineQuery(query.id, articles);
        } else {
            bot.answerInlineQuery(query.id, articles);
        }
    });

});