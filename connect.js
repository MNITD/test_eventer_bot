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
                return new Promise(function (resolve, reject) {
                    ref.child('users').orderByKey().equalTo(uid.toString()).on('value', function Success(snapshot) {
                        if (snapshot.val()){
                            resolve(ref.child('users').child(uid));
                        }
                        else{
                            resolve(ref.child('users'));
                        }
                    }, function Error(errObj) {
                        console.error(errObj.error);
                        reject(errObj);
                    });
                });
            },
            contacts: function (uid) {
                return new Promise(function (resolve, reject) {
                    resolve(ref.child('contacts').child(uid));
                })
            }
        }
    }

    function snap(ref) {
        return new Promise(function(resolve, reject){
            ref.on('value', function Success(snapshot) {
                resolve(snapshot);
            }, function Error(errObj) {
                console.error(errObj.error);
                reject(errObj);
            })
        });
    }

    return {ref: ref, snap: snap};
}());