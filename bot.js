/**
 * Created by bogdan on 29.06.17.
 */
var TelegramBot = require('node-telegram-bot-api');
var token = require('./token');

var bot = new TelegramBot(token, {polling: true});
bot.getMe().then(function (me) {
    console.log('Hi my name is %s!', me.username);
});

var state = "initial";
var profile = {
    data: {name: "", surname: "", role: "", email: "", phone: ""},
    contacts: [{name: "John", surname: "McMillow", role: "PM", email: "mcmillow@gmail.com", phone: "+20434384998"}],
    currentItem: 0
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

//matches /start
bot.onText(/\/start/, function (msg, match) {
    var fromId = msg.chat.id; // get the id, of who is sending the message
    var message = "Welcome to eventer_bot.\n";
    message += "This bot help you to exchange your contact information with other users.";
    bot.sendMessage(fromId, message);
});

bot.onText(/\/echo (.+)/, function (msg, match) {
    bot.sendMessage(msg.chat.id, match[1]);
});

// bot.onText(/\/set_profile/, function (msg, match) {
//     if (state === "initial") {
//         state = "profile_filling";
//         profile.currentItem = 0;
//         var property = Object.keys(profile.data)[profile.currentItem];
//         bot.sendMessage(msg.chat.id, "Your " + property + ":");
//     } else {
//         bot.sendMessage(msg.chat.id, "Profile has already filled!\n\nUse /update_profile to change profile.");
//     }
// });

bot.on("text", function (msg) {
    if (state === "profile_filling") {
        var property = Object.keys(profile.data)[profile.currentItem];
        profile.data[property] = msg.text;
        profile.currentItem++;
        property = Object.keys(profile.data)[profile.currentItem];
        if (property !== undefined)
            bot.sendMessage(msg.chat.id, "Your " + property + ":");
        else
            state = "profile_filled";
    }
});

bot.onText(/\/profile/, function (msg, match) {
    if(state === "initial"){
        var property;
        state = "profile_filling";
        profile.currentItem = 0;
        property = Object.keys(profile.data)[profile.currentItem];
        bot.sendMessage(msg.chat.id, "Your profile is empty. Answer the question to fill profile.")
            .then(function () {
                bot.sendMessage(msg.chat.id, "Your " + property + ":");
            });
    } else
        bot.sendMessage(msg.chat.id, "Your profile:\n\n" + parseProfile(profile.data));
});

bot.onText(/\/update_profile/, function (msg, match) {
    bot.sendMessage(msg.chat.id, "This command has not specified yet.");
});

bot.onText(/\/contacts/, function (msg, match) {
    bot.sendMessage(msg.chat.id, "You have " + profile.contacts.length + " contacts:\n\n")
        .then(function () {
            profile.contacts.forEach(function (p1) {
                bot.sendMessage(msg.chat.id, parseProfile(p1));
            });
        });
});

bot.onText(/\/share_profile/,function (msg, match) {
    bot.sendMessage(msg.chat.id, "This command has not specified yet.");
});