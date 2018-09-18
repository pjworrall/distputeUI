import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import {Wallet} from '/imports/startup/client/wallet.js';
import {Web3Provider} from '/imports/startup/client/web3provider.js';


import lightwallet from 'eth-lightwallet';
import HookedWeb3Provider from 'hooked-web3-provider';
import Web3 from "web3";

import {Session} from "meteor/session";


import './info.html';

Template.info.onCreated(function infoOnCreated() {
    this.balance = new ReactiveVar("DK");
    this.agreement = new ReactiveVar("DK");
    this.coinbase = new ReactiveVar("DK");
    this.addresses = new ReactiveVar([]);

    Session.set('taker',undefined);

    Session.set('factory',"0xd89ca44096afab420b87e998ae3cfc103aab849f");

});


Template.info.helpers({
    balance() {
        return Template.instance().balance.get();
    },
    coinbase() {
        return Template.instance().coinbase.get();
    },
    agreement() {
        return Template.instance().agreement.get();
    },
    addresses() {
        return Template.instance().addresses.get();
    },
    factory() {
        return Session.get("factory");
    },
    taker() {
        let taker = Session.get('taker');

        if (taker) {
            return taker;
        } else {
            return "DK";
        }
    }
});

Template.info.events({
    'click .js-coinbase'(event, instance) {
        event.preventDefault();

        let web3 = Web3Provider.get();

        if (web3) {
            web3.eth.getCoinbase(function (error, result) {
                if (!error) {
                    console.log("coinbase: " + result);
                    instance.coinbase.set(result);
                } else {
                    console.log("get coinbase error: " + error);
                }

            });
        }
    },
    'click .js-balance'(event, instance) {
        event.preventDefault();

        let web3 = Web3Provider.get();

        if (web3) {
            let address = instance.coinbase.get();

            web3.eth.getBalance(address, function (error, result) {
                if (!error) {
                    let wei = web3.fromWei(result, 'ether');
                    console.log("get balance: " + wei);
                    instance.balance.set(wei);
                } else {
                    console.log("get balance error: " + error);
                }

            });
        }
    },
    'click .js-unlock'(event, template) {
        // Prevent default browser form submit
        event.preventDefault();

        const mnemonic = template.$('input[name=mnemonic]').val();
        const password = 'notused';

        console.log("mnemonic: " + mnemonic);

        lightwallet.keystore.createVault({
            password: password,
            seedPhrase: mnemonic,
            // salt: fixture.salt,     // Optionally provide a salt.
            // A unique salt will be generated otherwise.
            hdPathString: "m/44'/60'/0'/0"
        }, function (err, ks) {

            if (err) {
                console.log("keystore creation error: " + err);
            } else {
                // Some methods will require providing the `pwDerivedKey`,
                // Allowing you to only decrypt private keys on an as-needed basis.
                // You can generate that value with this convenient method:
                ks.keyFromPassword(password, function (err, pwDerivedKey) {
                    if (err) throw err;

                    // generate five new address/private key pairs
                    // the corresponding private keys are also encrypted
                    ks.generateNewAddress(pwDerivedKey, 10);

                    // store wallet addresses on template for use with reactive var
                    let addr = ks.getAddresses();
                    template.addresses.set(addr);


                    ks.passwordProvider = function (callback) {
                        callback(null, password);
                    };

                    // use our global Wallet to store the Keystore in the Session
                    Wallet.set(ks);

                    // set initial taker
                    Session.set('taker',addr[1]);

                    // create new web3
                    let web3 = new Web3();

                    let provider = new HookedWeb3Provider({
                        host: "http://localhost:7545",
                        transaction_signer: ks
                    });

                    web3.setProvider(provider);

                    // use our global Web3Provvider to store the web3 in the Session
                    Web3Provider.set(web3);

                });
            }
        });

    },
    'click .js-factory'(event, instance) {
        event.preventDefault();

        let factory = instance.$('input[name=factory]').val();
        factory = (factory !== "") ? Session.set("factory",factory.trim()) : Session.get("factory");

        // todo: should validate address formats really and use checksum technique

        console.log("set factory.." + instance.factory.get());

    },

    'click .js-counterparties'(event, instance) {
        event.preventDefault();

        let taker = instance.$('select[name=taker]').val();

        console.log("taker set: " + taker );

        if (taker) {
            Session.set('taker',taker);
        } else {
            console.log("taker undefined");
        }

    }
});
