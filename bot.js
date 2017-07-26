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
    keys = Object.keys(data);
    len = len < keys.length ? len : keys.length;

    for (var i = page * item_num; i < len; i++) {
        buttons.push([{text: keys[i], callback_data: keys[i]}]);
    }
    if (page !== 0)
        buttons.push([{text: '<< prev', callback_data: 'other_' + (page - 1) + '_prev'}]);
    if (len !== keys.length) {
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

bot.getMe().then(function (me) {
    console.log('Hi my name is %s!', me.username);
});

var users = {};

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
    console.log("On text from user "+ msg.from.id);
    var item;
    if (users[msg.from.id] && users[msg.from.id].getState() === "profile_filling") {
        users[msg.from.id].setItem(users[msg.from.id].currentItem().key, msg.text);

        item = users[msg.from.id].nextItem();
        if (item.key)
            bot.sendMessage(msg.chat.id, "Your " + item.key + ":");
        else {
            users[msg.from.id].setState("profile_filled");
            Firebase.ref().user(msg.from.id).then(function (ref) {
                ref.child(msg.from.id).set({data: users[msg.from.id].getData()}).then(function () {
                    //ref.set();
                    bot.sendMessage(msg.chat.id, "Your profile has successfully filled.");
                })
            });

        }

    } else if (users[msg.from.id] && users[msg.from.id].getState() === "profile_updating") {
        if (msg.text !== "Y") users[msg.from.id].setItem(users[msg.from.id].currentItem().key, msg.text);

        users[msg.from.id].setState("profile_updated");
        Firebase.ref().user(msg.from.id).then(function (ref) {
            ref.set({data: users[msg.from.id].getData()}).then(function () {
                //ref.set();
                bot.sendMessage(msg.chat.id, "Your profile has successfully updated.");
            })
        });
    }
});

bot.onText(/\/profile/, function (msg, match) {
    var message;
    console.log("User "+ msg.from.id + " choose /profile");
    Firebase.ref().user(msg.from.id)
        .then(function (ref) {
            if (ref.key === 'users') { // state === initial
                users[msg.from.id] = new User();
                users[msg.from.id].setState("profile_filling");
                message = "Your profile is empty. Answer questions to fill profile.";
                bot.sendMessage(msg.from.id, message)
                    .then(function () {
                        bot.sendMessage(msg.from.id, "Your " + users[msg.from.id].nextItem().key + ":");
                    });
            } else {
                Firebase.snap(ref).then(function (snap) {
                    message = "Your profile:\n\n" + User.parseProfile(snap.val().data);
                    bot.sendMessage(msg.from.id, message);
                });
            }
        })
});

bot.onText(/\/update_profile/, function (msg, match) {
    var message;
    console.log("User "+ msg.from.id + " choose /update_profile");
    Firebase.ref().user(msg.from.id)
        .then(function (ref) {
            if (ref.key !== 'users') { // state !== initial
                Firebase.snap(ref).then(function (snap) {
                    users[msg.from.id] = new User(snap.val().data);
                    users[msg.from.id].setState("profile_updating");
                    message = "Answer the question to update profile. To save previous value write \'Y\'.";
                    bot.sendMessage(msg.from.id, message, getInlineButtons(users[msg.from.id].getData()));
                });

            } else
                bot.sendMessage(msg.from.id, "/profile");
        })
});

bot.onText(/\/contacts/, function (msg, match) {
    if (!users[msg.from.id]) {
        bot.sendMessage(msg.from.id, "You have no contacts yet.");
    } else {
        bot.sendMessage(msg.chat.id, "You have " + users[msg.from.id].getContacts.length + " contacts:\n\n")
            .then(function () {
                users[msg.from.id].getContacts().forEach(function (contact) {
                    bot.sendMessage(msg.chat.id, User.parseProfile(contact));
                });
            });
    }
});

bot.onText(/\/share_profile/, function (msg, match) {
    bot.sendMessage(msg.chat.id, "This command has not specified yet.");
});

bot.on('callback_query', function (msg) {
    var args, options, answer;
    if (users[msg.from.id].getState() === "profile_updating") {
        args = msg.data.split('_');

        answer = 'You choose: ' + (args[2] === 'prev' ? '<<' : '>>');
        bot.answerCallbackQuery(msg.id, answer, false);

        if (args[0] === 'other') {
            options = {chat_id: msg.message.chat.id, message_id: msg.message.message_id};
            bot.editMessageReplyMarkup(getInlineButtons(users[msg.from.id].getData(), args[1]).reply_markup, options);
        }
        else
            bot.sendMessage(msg.from.id, "Your " + msg.data + ": (" + users[msg.from.id].currentItem(msg.data).val + ")");
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
    Firebase.ref().user(query.from.id).then(function (ref) {
        if (ref.key !== 'users') {
            Firebase.snap(ref).then(function (snap) {
                console.log(snap.val());
                articles.push({
                    type: "article",
                    id: "article_my_profile",
                    title: "My Profile",
                    input_message_content: {
                        message_text: User.parseProfile(snap.val().data)
                    }
                });
                bot.answerInlineQuery(query.id, articles);
            });
        } else {
            bot.answerInlineQuery(query.id, articles);
        }
    });

});