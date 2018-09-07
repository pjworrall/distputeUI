import {Template} from "meteor/templating";

import {Wallet} from "../imports/startup/client/wallet";
import {Web3Provider} from "../imports/startup/client/web3provider";
import {TransactionData} from "../imports/startup/client/localstore";
import {TransactionReceipt} from "../imports/startup/client/receipt";

import "./benefit.html";
import {Session} from "meteor/session";
import {ReactiveVar} from "meteor/reactive-var";

Template.benefit.onCreated(function infoOnCreated() {
    this.benefited = new ReactiveVar(undefined);
});

Template.benefit.helpers({
    benefited() {
        return Template.instance().benefited.get();
    }
});

Template.benefit.events({
    'click .js-benefit'(event, instance) {
        event.preventDefault();

        instance.benefited.set(undefined);

        const address = instance.$('input[name=agreement]').val();

        console.log("Agreement address: " + address);

        let web3 = Web3Provider.get();

        if(!web3) {
            console.log("no web3 provider, please provide a wallet first");
            return;
        }

        // todo: really need to factor out the abi etc. now!!!

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

        let originator = wallet.getAddresses()[0];

        console.log("originator address: " + originator);

        let params = {
            from: originator,
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };


        agreement.setBeneficiary(params, function(error,tranHash) {
            if (!error) {
                console.log("setBeneficiary transaction: " + tranHash);

                TransactionReceipt.check(tranHash, web3, function (error, receipt) {

                    if (error) {
                        console.log("setBeneficiary transaction failed: " + error);
                    } else {

                        let log = receipt.logs[0];

                        TransactionData.insert({
                            type: "Beneficiary claim",
                            date: new Date(),
                            transactionHash: log.transactionHash,
                            blockNumber: log.blockNumber,
                            from: originator,
                            to: log.address,
                            gas: receipt.gasUsed,
                            cumulativeGasUsed: receipt.cumulativeGasUsed
                        });
                    }
                });

            } else {
                console.log("setBeneficiary error: " + error);
            }

            // This is just bum bum. Getting to point initial requirements are too vague now

            let event = agreement.Determined([{determiningParty: originator}], function (error, result) {

                if (error) {
                    console.log("agreement benefitance event failed: " + error);
                } else {
                    console.log("benefited agreement event result: " + result);
                    instance.benefited.set("Benefited");
                    event.stopWatching();
                }
            });
        });


    },
});