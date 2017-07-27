/**
 * Created by bogdan on 25.07.17.
 */

var User = function (data) {

    var contacts = [],
        currentItem = {index: -1, key: null, val: null},
        state = 'initial';

    data = data || {name: "", surname: "", position: "", email: "", phone: ""};

    this.currentItem = function (key) {
        if (key) {
            currentItem.index = -1;
            currentItem.key = key;
            currentItem.val = data[key];
        }

        return currentItem;
    };

    this.nextItem = function () {
        var property;
        currentItem.index++;
        if (currentItem.index === Object.keys(data).length) {
            currentItem.index = -1;
            return currentItem;
        }
        property = Object.keys(data)[currentItem.index];
        currentItem.key = property;
        currentItem.val = data[property];
        return currentItem;
    };

    this.setItem = function (key, val) {
        data[key] = val;
    };

    this.getData = function () {
        return data;
    };

    this.setData = function (newData) {
        data = newData;
    };

    this.getState = function () {
        return state;
    };

    this.setState = function (newState) {
        state = newState;
    };

    this.getContacts = function () {
        return contacts;
    };

    this.addContacts = function (newContacts) {
        if (Array.isArray(newContacts)) {
            newContacts.forEach(function (contact) {
                contacts.push(contact);
            });
        }
    };

    // this.deleteContacts = function (ids) {
    //
    // };

};

/**
 * Static method that convert object to string
 *
 * @param profile
 * @return {string}
 */

User.parseProfile = function (profile) {
    var message = "";
    for (var k in profile) {
        message += k;
        message += ": ";
        message += profile[k] === "" ? "-" : profile[k];
        message += '\n';
    }
    return message;
};

module.exports = User;
