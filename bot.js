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
    data: {name: "", surname:"", role: "", email:"", phone:""},
    currentItem: 0
};

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

bot.onText(/\/set_profile/, function (msg, match) {
    if(state === "initial"){
    state = "profile_updating";
    profile.currentItem = 0;
    var property = Object.keys(profile.data)[profile.currentItem];
    bot.sendMessage( msg.chat.id, "Your "+property+":");
    } else {
        bot.sendMessage( msg.chat.id, "Profile has already filled!\n\nUse /update_profile to change profile.");
    }
});

bot.on("text",function (msg) {
    if(state === "profile_updating"){
        var property = Object.keys(profile.data)[profile.currentItem];
        profile.data[property] = msg.text;
        profile.currentItem++;
        property = Object.keys(profile.data)[profile.currentItem];
        if(property !== undefined)
            bot.sendMessage( msg.chat.id, "Your "+property+":");
        else
            state = "profile_updated";
    }
});

bot.onText(/\/my_profile/, function (msg, match) {
    //profile.data.forEach();
    bot.sendMessage( msg.chat.id, "Your profile:\n" + JSON.stringify(profile.data));
});

bot.onText(/\/update_profile/, function (msg, match) {
    bot.sendMessage( msg.chat.id, "This command has not specified yet.");
});