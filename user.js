/**
 * Created by bogdan on 25.07.17.
 */
module.exports = function User() {
    this.contacts = [];
    this.currentItem = 0;
    this.data = {name: "", surname: "", position: "", email: "", phone: ""};
    this.state = 'initial';
};