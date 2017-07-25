/**
 * Created by bogdan on 29.06.17.
 */
var TelegramBot = require('node-telegram-bot-api');
var token = require('./token');

var bot = new TelegramBot(token, {polling: true});

var Firebase = require('./connect');

var User = require('./user');

bot.getMe().then(function (me) {
    console.log('Hi my name is %s!', me.username);
});

var users = {
    001: {data: {name: "", surname: "", position: "", email: "", phone: ""}},
    state: 'initial',
    currentItem: 0,
    contacts: [{name: "John", surname: "McMillow", role: "PM", email: "mcmillow@gmail.com", phone: "+20434384998"}]
};

function parseProfile(profile) {
    var message = "";
    for (var k in profile) {
        message += k;
        message += ": ";
        message += profile[k] === "" ? "-" : profile[k];
        message += '\n';
    }
    return message;
}

function writeToDB(msg) {
    var property = Object.keys(users[msg.from.id].data)[users[msg.from.id].currentItem];
    users[msg.from.id].data[property] = msg.text;
}

//matches /start
bot.onText(/\/start/, function (msg, match) {
    var message = "Welcome to eventer_bot.\n";
    message += "This bot help you to exchange your contact information with other users.";
    bot.sendMessage(msg.chat.id, message);
    if (!users[msg.from.id]) users[msg.from.id] = new User();
});


bot.onText(/\/echo (.+)/, function (msg, match) {
    bot.sendMessage(msg.chat.id, match[1]);
});

bot.on("text", function (msg) {
    var property;
    if (!users[msg.from.id]) users[msg.from.id] = new User();
    if (users[msg.from.id].state === "profile_filling") {
        writeToDB(msg);

        users[msg.from.id].currentItem++;
        property = Object.keys(users[msg.from.id].data)[users[msg.from.id].currentItem];
        if (property !== undefined)
            bot.sendMessage(msg.chat.id, "Your " + property + ":");
        else {
            users[msg.from.id].state = "profile_filled";
            Firebase.ref().user(msg.from.id).then(function (ref) {
                ref.child(msg.from.id).set({data: users[msg.from.id].data}).then(function () {
                    //ref.set();
                })
            });
        }

    } else if (users[msg.from.id].state === "profile_updating") {
        if (msg.text !== "Y")
            writeToDB(msg);

        users[msg.from.id].currentItem++;
        property = Object.keys(users[msg.from.id].data)[users[msg.from.id].currentItem];
        if (property !== undefined)
            bot.sendMessage(msg.chat.id, "Your " + property + ": (" + users[msg.from.id].data[property] + ")");
        else {
            users[msg.from.id].state = "profile_updated";
            Firebase.ref().user(msg.from.id).then(function (ref) {
                ref.set({data: users[msg.from.id].data}).then(function () {
                    //ref.set();
                })
            });
        }
    }
});

bot.onText(/\/profile/, function (msg, match) {
    if (!users[msg.from.id]) users[msg.from.id] = new User();
    Firebase.ref().user(msg.from.id)
        .then(function (ref) {
            if (ref.key === 'users') { // state === initial
                users[msg.from.id].state = "profile_filling";
                users[msg.from.id].currentItem = 0;

                bot.sendMessage(msg.from.id, "Your profile is empty. Answer questions to fill profile.")
                    .then(function () {
                        var property = Object.keys(users[msg.from.id].data)[users[msg.from.id].currentItem];
                        bot.sendMessage(msg.chat.id, "Your " + property + ":");
                    });
            } else {
                Firebase.snap(ref).then(function (snap) {
                    users[msg.from.id].data = snap.val().data;
                    console.log(snap.val());
                    bot.sendMessage(msg.from.id, "Your profile:\n\n" + parseProfile(users[msg.from.id].data));
                });
            }
        })
});

bot.onText(/\/update_profile/, function (msg, match) {

    Firebase.ref().user(msg.from.id)
        .then(function (ref) {
            if (ref.key !== 'users') { //state !== "initial")
                if (!users[msg.from.id]) users[msg.from.id] = new User();
                Firebase.snap(ref).then(function (snap) {
                    users[msg.from.id].data = snap.val().data;
                    console.log(snap.val());
                    users[msg.from.id].state = "profile_updating";
                    users[msg.from.id].currentItem = 0;

                    bot.sendMessage(msg.chat.id, "Answer the question to update profile. To save previous value write \'Y\'.")
                        .then(function () {
                            var property = Object.keys(users[msg.from.id].data)[users[msg.from.id].currentItem];
                            bot.sendMessage(msg.chat.id, "Your " + property + ": (" + users[msg.from.id].data[property] + ")");
                        });
                });

            } else
                bot.sendMessage(msg.from.id, "/profile");
        })
});

bot.onText(/\/contacts/, function (msg, match) {
    if (!users[msg.from.id]) users[msg.from.id] = new User();
    bot.sendMessage(msg.chat.id, "You have " + users[msg.from.id].contacts.length + " contacts:\n\n")
        .then(function () {
            users[msg.from.id].contacts.forEach(function (contact) {
                bot.sendMessage(msg.chat.id, parseProfile(contact));
            });
        });
});

bot.onText(/\/share_profile/, function (msg, match) {
    bot.sendMessage(msg.chat.id, "This command has not specified yet.");
});