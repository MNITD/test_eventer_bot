/**
 * Created by bogdan on 25.07.17.
 */

var User = function (data) {

    var contacts = [],
        currentItem = -1,
        state = 'initial';

    data = data | {name: "", surname: "", position: "", email: "", phone: ""};

    this.currentItem = function () {
        var property;
        property = Object.keys(data)[currentItem];
        return {key: property, val: data[property]}
    };

    this.nextItem = function () {
        var property;
        currentItem++;
        if (currentItem === Object.keys(data).length) {
            currentItem = -1;
            return {key: undefined, val: undefined};
        }
        property = Object.keys(data)[currentItem];
        return {key: property, val: data[property]}
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
