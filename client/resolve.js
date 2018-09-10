import {Template} from "meteor/templating";

import {Wallet} from "../imports/startup/client/wallet";
import {Web3Provider} from "../imports/startup/client/web3provider";
import {TransactionData} from "../imports/startup/client/localstore";
import {TransactionReceipt} from "../imports/startup/client/receipt";
import {AgreementContract} from "../imports/startup/client/contracts.js";


import "./resolve.html";

import {ReactiveVar} from "meteor/reactive-var";

Template.resolve.onCreated(function infoOnCreated() {
    this.resolved = new ReactiveVar(undefined);
});

Template.resolve.helpers({
    resolved() {
        return Template.instance().resolved.get();
    }
});

Template.resolve.events({
    'click .js-resolve'(event, instance) {
        event.preventDefault();

        instance.resolved.set(undefined);

        const address = instance.$('input[name=resolved-agreement]').val();

        console.log("Resolved agreement address: " + address);

        const favoured = instance.$('input[name=favoured-party]').val();

        console.log("Favoured party: " + favoured);

        // todo: if either input is invalid should error!!!!

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

        // fudging adjudicator atm, this will be set by protocol in smart contractors
        let adjudicator = wallet.getAddresses()[9];

        let params = {
            from: adjudicator,
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };

        console.log("setResolved params: " + JSON.stringify(params));

        agreement.setFavour(favoured,params, function(error,tranHash) {
            if (!error) {
                console.log("setResolved transaction: " + tranHash);

                TransactionReceipt.check(tranHash, web3, function (error, receipt) {

                    if (error) {
                        console.log("setResolved transaction failed: " + error);
                    } else {

                        let log = receipt.logs[0];

                        TransactionData.insert({
                            type: "Resolved",
                            date: new Date(),
                            transactionHash: log.transactionHash,
                            blockNumber: log.blockNumber,
                            from: adjudicator, // bad feeling about this, should come from receipt not outer variable
                            to: log.address,
                            gas: receipt.gasUsed,
                            cumulativeGasUsed: receipt.cumulativeGasUsed
                        });
                    }
                });

            } else {
                console.log("setResolved error: " + error);
            }

            // the Favoured event needs some consideration and improvement

            let event = agreement.Favoured([{disputingParty: adjudicator}], function (error, result) {

                if (error) {
                    console.log("agreement resolved event failed: " + error);
                } else {
                    instance.resolved.set("Resolved");
                    event.stopWatching();
                }
            });
        });

    },
});