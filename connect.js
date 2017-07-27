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
            // ref().user('001').on('value',function Success(snapshot) {
            //     console.log(snapshot.val());
            // }, function Error(errObj) {
            //     console.error(errObj.error);
            // });
        } else {
            //user signed out
        }
    });
    function ref() {
        var ref = firebase.database().ref();

        return {

            user: function (uid) {
                var _user;

                function val() {
                    return new Promise(function (resolve, reject) {
                        ref.child('users').orderByKey().equalTo(uid.toString()).on('value', function Success(snapshot) {
                            _user = snapshot;
                            resolve(snapshot.val()[uid]);
                        }, function Error(errObj) {
                            console.error(errObj.error);
                            reject(errObj);
                        });
                    })
                }

                function set(object) {
                    return new Promise(function (resolve, reject) {
                        // if(_user.val())
                        ref.child('users').child(uid).set(object).then(resolve, reject);
                        //resolve(user(uid))
                    });
                }


                return {val: val, set: set}
            },

            contacts: function (uid) {
                return new Promise(function (resolve, reject) {
                    resolve(ref.child('contacts').child(uid));
                })
            },

            connections: function (uid) {
                return new Promise(function (resolve, reject) {
                    resolve(ref.child('connections'));
                })
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

    function exchange(uid) {
        var key;
        ref().connections().then(function (ref) {
            key = getRandom(100, 999);

            ref.orderByKey().equalTo(key.toString()).once('value', function Success(snapshot) {
                if (snapshot.val())
                    exchange(uid);
                else
                    ref.child(key).set({user_id: uid});

            }, function Error(errObj) {
                console.error(errObj.error);
            });

        });

    }

    return {ref: ref, snap: snap, exchange: exchange};

}());