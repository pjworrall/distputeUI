import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import {Wallet} from '/imports/startup/client/wallet.js';
import {Web3Provider} from '/imports/startup/client/web3provider.js';
import {TransactionReceipt} from '/imports/startup/client/receipt';
import {TransactionData, AgreementEventData} from '/imports/startup/client/localstore';

import lightwallet from 'eth-lightwallet';
import HookedWeb3Provider from 'hooked-web3-provider';
import Web3 from "web3";

import {Session} from "meteor/session";


import './info.html';

Template.info.onCreated(function infoOnCreated() {
    this.balance = new ReactiveVar("DK");
    this.agreement = new ReactiveVar("DK");
    this.coinbase = new ReactiveVar("DK");
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
                        callback(null, password);
                    };

                    // use our global Wallet to store the Keystore in the Session
                    Wallet.set(ks);

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
    'click .js-agreement'(event, instance) {
        event.preventDefault();

        let web3 = Web3Provider.get();

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

        let distputeFactory = web3.eth.contract(abi).at("0xd89ca44096afab420b87e998ae3cfc103aab849f");

        let wallet = Wallet.get();

        let params = {
            from: wallet.getAddresses()[0],
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };

        let subject = instance.$('input[name=subject]').val();
        subject = (subject !== "") ? subject.trim() : "subject not supplied";

        let maker = wallet.getAddresses()[1];
        let taker = wallet.getAddresses()[2];

        distputeFactory.newAgreement(subject,  maker,  taker, params, function (error, tranHash) {
            //todo: this is not handling errors like 'not a BigNumber' , do we need a try catch somewhere?

            if (!error) {
                console.log("newAgreement transaction: " + tranHash);

                // check for the transaction receipt confirming the mining
                // (would need mechanism to check confirmations for finality)

                TransactionReceipt.check(tranHash, web3, function (error, receipt) {

                    if (error) {
                        console.log( "new agreement transaction failed: " + error );
                    } else {
                        // log the transaction

                        console.log("Transaction data blocknumber: " + receipt.blockNumber);

                        TransactionData.insert({
                            type: "Agreement",
                            subject: subject,
                            date: new Date(),
                            transactionHash: receipt.transactionHash,
                            blockNumber: receipt.blockNumber,
                            from: receipt.from,
                            to: receipt.to,
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


            let event = distputeFactory.AgreementCreated([{from: maker}], function (error, result) {

                if (error) {
                    console.log( "new agreement event failed: " + error );
                } else {

                    console.log("event callback result: " + JSON.stringify(result));

                    AgreementEventData.insert({
                        factory: result.address,
                        maker: result.args.from,
                        address: result.args.address,
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
