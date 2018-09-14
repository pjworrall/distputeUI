import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import {Wallet} from '/imports/startup/client/wallet.js';
import {Web3Provider} from '/imports/startup/client/web3provider.js';
import {TransactionReceipt} from '/imports/startup/client/receipt';
import {TransactionData, AgreementEventData} from '/imports/startup/client/localstore';
import {FactoryContract} from "../imports/startup/client/contracts.js";


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

    this.factory = new ReactiveVar("0xd89ca44096afab420b87e998ae3cfc103aab849f");

    Session.set('taker',undefined);

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
        return Template.instance().factory.get();
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
        factory = (factory !== "") ? factory.trim() : "0xd89ca44096afab420b87e998ae3cfc103aab849f";

        instance.factory.set(factory);

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

    },
    'click .js-agreement'(event, instance) {
        event.preventDefault();

        let web3 = Web3Provider.get();

        console.log("main .js-agreement: to get an agreement contract");

        // get the distpute factory and create a new Agreement contract

        let distputeFactory = web3.eth.contract(FactoryContract.abi).at(instance.factory.get());

        let wallet = Wallet.get();

        let params = {
            from: wallet.getAddresses()[0],
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };

        let subject = instance.$('input[name=subject]').val();
        subject = (subject !== "") ? subject.trim() : "subject not supplied";

        let taker = Session.get('taker');

        // fudging adjudicator atm, this will be set by protocol in smart contractors
        let adjudicator = wallet.getAddresses()[9];

        // todo: bum, horrible need to refactor now
        var ERC20Token = "0x7c21f56495fc1e8cccf850cb3d6d05b74200ac37";

        distputeFactory.newAgreement(subject, taker, adjudicator, ERC20Token, params, function (error, tranHash) {
            //todo: this is not handling errors like 'not a BigNumber' , do we need a try catch somewhere?

            if (!error) {
                console.log("newAgreement transaction: " + tranHash);

                // check for the transaction receipt confirming the mining
                // (would need mechanism to check confirmations for finality)

                TransactionReceipt.check(tranHash, web3, function (error, receipt) {

                    if (error) {
                        console.log("new agreement transaction failed: " + error);
                    } else {

                        let log = receipt.logs[0];

                        TransactionData.insert({
                            type: "Agreement",
                            subject: subject,
                            date: new Date(),
                            transactionHash: log.transactionHash,
                            blockNumber: log.blockNumber,
                            from: params.from, // todo: surely the receipt as the from address and that would be more reliable?
                            to: log.address,
                            gas: receipt.gasUsed,
                            cumulativeGasUsed: receipt.cumulativeGasUsed
                        });
                    }
                });

            } else {
                console.log("newAgreement error: " + error);
            }

            // We can also watch for events straight away
            // 1. Remember above callback and this are async events so will happen at different times
            // 2. Need to look carefully at the pattern to make sure we are getting the event we expect because this might not
            // in production
            // 3. this was appearing to work but relaised {from: } was maker but should have been transaction sender of createAGreement to factory
            // why did it work because it should not have filtered correctly, and does it now it is corrected?


            let event = distputeFactory.AgreementCreated([{from: wallet.getAddresses()[0]}], function (error, result) {

                if (error) {
                    console.log("new agreement event failed: " + error);
                } else {

                    AgreementEventData.insert({
                        factory: result.address,
                        taker: taker,
                        agreement: result.args.agreement,
                        date: new Date(),
                        blockHash: result.transactionHash,
                        blockNumber: result.blockNumber,
                        logIndex: result.logIndex,
                        event: result.name,
                        transactionIndex: result.transactionIndex,
                        transactionHash: result.transactionHash
                    });

                    event.stopWatching();

                    //todo: there is a removed attribute on an event that should be studied
                    // carefully because understanding it helps plan for managing transactions
                    // which do not finalize/persist on the chain
                }
            });


        });

    }
});
