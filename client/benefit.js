import {Template} from "meteor/templating";

import {Wallet} from "../imports/startup/client/wallet";
import {Web3Provider} from "../imports/startup/client/web3provider";
import {TransactionData} from "../imports/startup/client/localstore";
import {TransactionReceipt} from "../imports/startup/client/receipt";
import {AgreementContract} from "../imports/startup/client/contracts.js";


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

        let agreement = web3.eth.contract(AgreementContract.abi).at(address);

        // if the agreement has not been accepted by the counter party abandon
        console.log("agreement accepted: " + agreement.isAccepted());
        if(!agreement.isAccepted()) {
            console.log("counter party has not yet accepted agreement");
            return;
        }

        let wallet = Wallet.get();

        if(!wallet) {
            console.log("please provide a wallet first");
            return;
        }

        let originator = wallet.getAddresses()[0];

        let params = {
            from: originator,
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };

        console.log("setBeneficiary params: " + JSON.stringify(params));

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