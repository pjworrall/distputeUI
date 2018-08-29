import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import {Wallet} from '/imports/startup/client/wallet.js';
import {Web3Provider} from '/imports/startup/client/web3provider.js';

import lightwallet from 'eth-lightwallet';
import HookedWeb3Provider from 'hooked-web3-provider';
import Web3 from "web3";

import {Session} from "meteor/session";


import './main.html';

Template.hello.onCreated(function helloOnCreated() {
    this.balance = new ReactiveVar("DK");
    this.agreement = new ReactiveVar("DK");
    this.coinbase = new ReactiveVar("DK");
});


Template.hello.helpers({
    balance() {
        return Template.instance().balance.get();
    },
    coinbase() {
        return Template.instance().coinbase.get();
    },
    agreement() {
        return Template.instance().agreement.get();
    }
});

Template.hello.events({
    'click .js-balance'(event, instance) {
        event.preventDefault();

        let web3 = Web3Provider.get();

        debugger;

        if (web3) {
            let address = instance.coinbase.get();
            console.log("coinbase: " + address);

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
    'click .js-agreement'(event, instance) {
        event.preventDefault();

        let web3 = Web3Provider.getInstance();

        console.log("main .js-agreement: to get an agreement contract");

        // get the distpute factory and create a new Agreement contract

        let abi = [
            {
                "constant": true,
                "inputs": [],
                "name": "getAgreementCount",
                "outputs": [
                    {
                        "name": "agreementCount",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "subject",
                        "type": "string"
                    },
                    {
                        "name": "taker",
                        "type": "address"
                    },
                    {
                        "name": "adjudicator",
                        "type": "address"
                    }
                ],
                "name": "newAgreement",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "agreements",
                "outputs": [
                    {
                        "name": "",
                        "type": "address"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "name": "agreement",
                        "type": "address"
                    }
                ],
                "name": "AgreementCreated",
                "type": "event"
            }
        ];

        let factory = new web3.eth.contract(abi);

        let distputeFactory = factory.at("0xd89ca44096afab420b87e998ae3cfc103aab849f");

        let params = {
            from: "",
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };

        debugger;

        distputeFactory.newAgreement("Rain on Monday", "1", "2", params, function (error, tranHash) {
            //todo: this is not handling errors like 'not a BigNumber' , do we need a try catch somewhere?

            if (!error) {
                console.log("newAgreement transaction: " + tranHash);
            } else {
                console.log("newAgreement error: " + error);
            }
        });

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

            if(err){
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
                    let addr = ks.getAddresses();

                    ks.passwordProvider = function (callback) {
                        callback(null, passsword);
                    };

                    // use our global Wallet to store the Keystore in the Session
                    Wallet.set(ks, Session);

                    // create new web3
                    let web3 = new Web3();

                    let provider = new HookedWeb3Provider({
                        host: "http://localhost:7545",
                        transaction_signer: ks
                    });

                    web3.setProvider(provider);

                    // use our global Web3Provvider to store the web3 in the Session
                    Web3Provider.set(web3, Session);

                });

            }


        });

    }
});
