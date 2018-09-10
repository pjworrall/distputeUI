import {Template} from "meteor/templating";

import {Wallet} from "../imports/startup/client/wallet";
import {Web3Provider} from "../imports/startup/client/web3provider";
import {TransactionData} from "../imports/startup/client/localstore";
import {TransactionReceipt} from "../imports/startup/client/receipt";
import {AgreementContract} from "../imports/startup/client/contracts.js";


import "./dispute.html";

import {ReactiveVar} from "meteor/reactive-var";

Template.dispute.onCreated(function infoOnCreated() {
    this.disputed = new ReactiveVar(undefined);
});

Template.dispute.helpers({
    disputed() {
        return Template.instance().disputed.get();
    }
});

Template.dispute.events({
    'click .js-dispute'(event, instance) {
        event.preventDefault();

        instance.disputed.set(undefined);

        const address = instance.$('input[name=disputed_agreement]').val();

        console.log("Disputed agreement address: " + address);

        // todo: really a lot of these repeated tests can be put on somethign that extends the Template prototype
        // so the checks on done implicitly

        let web3 = Web3Provider.get();

        if(!web3) {
            console.log("no web3 provider, please provide a wallet first");
            return;
        }

        let agreement = web3.eth.contract(AgreementContract.abi).at(address);

        // todo: is there any conditions that should be check before attempting a transaction?

        let wallet = Wallet.get();

        if(!wallet) {
            console.log("please provide a wallet first");
            return;
        }

        let taker = Session.get('taker');

        let params = {
            from: taker,
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };

        console.log("setDispute params: " + JSON.stringify(params));

        agreement.setDispute(params, function(error,tranHash) {
            if (!error) {
                console.log("setDispute transaction: " + tranHash);

                TransactionReceipt.check(tranHash, web3, function (error, receipt) {

                    if (error) {
                        console.log("setDispute transaction failed: " + error);
                    } else {

                        let log = receipt.logs[0];

                        TransactionData.insert({
                            type: "Disputed",
                            date: new Date(),
                            transactionHash: log.transactionHash,
                            blockNumber: log.blockNumber,
                            from: taker, // bad feeling about this, should come from receipt not outer variable
                            to: log.address,
                            gas: receipt.gasUsed,
                            cumulativeGasUsed: receipt.cumulativeGasUsed
                        });
                    }
                });

            } else {
                console.log("setDispute error: " + error);
            }

            // This is just bum bum. Getting to point initial requirements are too vague now

            let event = agreement.Dispute([{disputingParty: taker}], function (error, result) {

                if (error) {
                    console.log("agreement disputed event failed: " + error);
                } else {
                    instance.disputed.set("Disputed");
                    event.stopWatching();
                }
            });
        });

    },
});