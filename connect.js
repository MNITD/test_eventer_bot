/**
 * Created by bogdan on 10.07.17.
 */
var firebase = require('firebase');
var config = require('./firebase-config');

module.exports = (function () {
    'use strict';
    firebase.initializeApp(config);

    firebase.auth().signInAnonymously().catch(console.error);
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            //user signed in
            var isAnonymous = user.isAnonymous;
            var uid = user.uid;
            // console.log(ref(user.uid));
        } else {
            //user signed out
        }
    });
    function ref() {
        var _ref = firebase.database().ref();

        return {

            user: function (uid) {
                var _user;

                function val() {
                    return new Promise(function (resolve, reject) {
                        _ref.child('users').orderByKey().equalTo(uid.toString()).once('value', function Success(snapshot) {
                            _user = snapshot;
                            if (snapshot.val())
                                resolve(snapshot.val()[uid]);
                            else
                                resolve(snapshot.val()); // null
                        }, function Error(errObj) {
                            console.error(errObj.error);
                            reject(errObj);
                        });
                    })
                }

                function set(object) {
                    return new Promise(function (resolve, reject) {
                        // if(_user.val())
                        _ref.child('users').child(uid).set(object).then(resolve, reject);
                        //resolve(user(uid))
                    });
                }


                return {val: val, set: set}
            },

            contacts: function (uid) {
                return new Promise(function (resolve, reject) {
                    resolve(_ref.child('contacts').child(uid));
                })
            },

            connections: function (key) {

                function val() {

                    return new Promise(function (resolve, reject) {
                        function success(snapshot) {
                            resolve(snapshot.val());
                        }

                        function error(errObj) {
                            console.error(errObj.error);
                            reject(errObj);
                        }

                        if (key)
                            _ref.child('connections').orderByKey().equalTo(key.toString()).once('value', success, error);
                        else
                            _ref.child('connections').once('value', success, error);

                    });
                }

                function users() {
                    return new Promise(function (resolve, reject) {
                        val().then(function (connections) {
                            //TODO same as in exchange
                            var keys, promises = [];

                            keys = Object.keys(connections);
                            console.log("keys: " + keys);

                            keys.forEach(function (key) {
                                promises.push(ref().user(connections[key].user_id).val());
                            });

                            Promise.all(promises).then(function (users) {
                                // console.log(users);
                                users.forEach(function (user, index) {
                                    user.key = keys[index];
                                });
                                // console.log(users);
                                resolve(users);
                            });

                        });
                    });
                }

                function candidates() {
                    function set(object, onApprove) {
                        return new Promise(function (resolve, reject) {
                            val().then(function (val) {
                                var candidateKey = Object.keys(object)[0];
                                if (!val)
                                    val = {};
                                val[candidateKey] = object[candidateKey];
                                _ref.child('connections').child(key).child('candidates').set(val).then(function () {
                                    if (onApprove)
                                        _ref.child('connections').child(key).child('candidates').child(candidateKey).once('child_changed', onApprove);
                                    resolve();
                                }, reject);
                                //resolve(user(uid))
                            });

                        });
                    }

                    function val() {

                        return new Promise(function (resolve, reject) {
                            function success(snapshot) {
                                resolve(snapshot.val());
                            }

                            function error(errObj) {
                                console.error(errObj.error);
                                reject(errObj);
                            }

                            if (key)
                                _ref.child('connections').child(key).child('candidates').once('value', success, error);

                        });
                    }

                    return {set: set, val: val}
                }

                function set(object) {
                    return new Promise(function (resolve, reject) {
                        _ref.child('connections').child(key).set(object).then(resolve, reject);
                        //resolve(user(uid))
                    });
                }

                function on(event, callback) {
                    // _ref.child('connections').child(key).on(event, callback);
                    _ref.child('connections').on(event, callback);
                }

                function once(event, callback) {
                    // _ref.child('connections').child(key).once(event, callback);
                    _ref.child('connections').once(event, callback);
                }

                return {val: val, users: users, set: set, on: on, once: once, candidates: candidates};

            }
        }
    }

    function snap(ref) {
        return new Promise(function (resolve, reject) {
            ref.on('value', function Success(snapshot) {
                resolve(snapshot);
            }, function Error(errObj) {
                console.error(errObj.error);
                reject(errObj);
            })
        });
    }

    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function exchange(uid, onExchange) {
        var key;
        key = getRandom(100, 999);
        ref().connections(key).val().then(function (val) {
            if (val) // key already exist in db
                exchange(uid);
            else {
                ref().connections(key).set({user_id: uid}).then(function () {
                    ref().connections(key).once('child_changed', function (snapshot) { // TODO on()
                        var ids, promises = [];
                        if (snapshot.key === key.toString()) {
                            ids = Object.keys(snapshot.val().candidates);
                            console.log("user ids: " + ids);

                            ids.forEach(function (key) {
                                promises.push(ref().user(key).val());
                            });

                            Promise.all(promises).then(function (users) {
                                users.forEach(function (user, index) {
                                    user.id = ids[index];
                                    user.key = key;
                                });
                                onExchange(users);
                            });
                        }
                    });

                });
            }
        });

    }

    return {ref: ref, exchange: exchange};

}());