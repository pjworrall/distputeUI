import {Template} from "meteor/templating";

import {Wallet} from "../imports/startup/client/wallet";
import {Web3Provider} from "../imports/startup/client/web3provider";
import {TransactionData} from "../imports/startup/client/localstore";
import {TransactionReceipt} from "../imports/startup/client/receipt";

import "./accept.html";
import {Session} from "meteor/session";
import {ReactiveVar} from "meteor/reactive-var";

Template.accept.onCreated(function infoOnCreated() {
    this.accepted = new ReactiveVar(undefined);
});

Template.accept.helpers({
    taker() {
        let taker = Session.get('taker');

        if (taker) {
            return taker;
        } else {
            return "DK";
        }
    },
    accepted() {
        return Template.instance().accepted.get();
    }
});

Template.accept.events({
    'click .js-accept'(event, instance) {
        event.preventDefault();

        instance.accepted.set(undefined);

        const address = instance.$('input[name=address]').val();

        console.log("Agreement address: " + address);

        let web3 = Web3Provider.get();

        if(!web3) {
            console.log("no web3 provider, please provide a wallet first");
            return;
        }

        let abi = [
            {
                "constant": true,
                "inputs": [],
                "name": "isDisputed",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "setAccepted",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "settle",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "favoured",
                        "type": "address"
                    }
                ],
                "name": "setFavour",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "getSubject",
                "outputs": [
                    {
                        "name": "",
                        "type": "string"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "setBeneficiary",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "isAccepted",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "getBeneficiary",
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
                "constant": false,
                "inputs": [],
                "name": "setDispute",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "cancel",
                "outputs": [],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
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
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "taker",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "name": "subject",
                        "type": "string"
                    }
                ],
                "name": "Accepted",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "determiningParty",
                        "type": "address"
                    }
                ],
                "name": "Determined",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "disputingParty",
                        "type": "address"
                    }
                ],
                "name": "Dispute",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "favouredParty",
                        "type": "address"
                    }
                ],
                "name": "Favoured",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "beneficiary",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "name": "adjudicator",
                        "type": "address"
                    }
                ],
                "name": "Settled",
                "type": "event"
            }
        ];

        let agreement = web3.eth.contract(abi).at(address);

        let wallet = Wallet.get();

        if(!wallet) {
            console.log("please provide a wallet first");
            return;
        }

        // the call MUST come from the Taker address but how do we know it without it being factored into
        // a global ?

        let taker = Session.get('taker');

        if(!taker) {
            console.log("taker address not set");
            return;
        }

        let params = {
            from: taker,
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };


        agreement.setAccepted(params, function(error,tranHash) {
            if (!error) {
                console.log("setAccepted transaction: " + tranHash);

                TransactionReceipt.check(tranHash, web3, function (error, receipt) {

                    if (error) {
                        console.log("new agreement transaction failed: " + error);
                    } else {

                        let log = receipt.logs[0];

                        TransactionData.insert({
                            type: "Accept",
                            date: new Date(),
                            transactionHash: log.transactionHash,
                            blockNumber: log.blockNumber,
                            from: taker,
                            to: log.address,
                            gas: receipt.gasUsed,
                            cumulativeGasUsed: receipt.cumulativeGasUsed
                        });
                    }
                });

            } else {
                console.log("setAccepted error: " + error);
            }

            // We can also watch for events straight away
            // 1. Remember above callback and this are async events so will happen at different times
            // 2. Need to look carefully at the pattern to make sure we are getting the event we expect because this might not
            // in production


            let event = agreement.Accepted([{taker: taker}], function (error, result) {

                if (error) {
                    console.log("agreement acceptance event failed: " + error);
                } else {
                    console.log("accepted agreement " + result.args.subject);
                    instance.accepted.set("Accepted");
                    event.stopWatching();
                }
            });
        });


    },
});