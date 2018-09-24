import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import {Wallet} from '/imports/startup/client/wallet.js';
import {Web3Provider} from '/imports/startup/client/web3provider.js';
import {TransactionReceipt} from '/imports/startup/client/receipt';
import {TransactionData, AgreementEventData} from '/imports/startup/client/localstore';
import {FactoryContract} from "../imports/startup/client/contracts.js";

import {Session} from "meteor/session";

import './create.html';

Template.create.onCreated(function () {

});


Template.create.helpers({

});

Template.create.events({

    'click .js-agreement'(event, instance) {
        event.preventDefault();

        let web3 = Web3Provider.get();

        console.log("create .js-agreement: to get an agreement contract");

        // get the distpute factory and create a new Agreement contract

        let distputeFactory = web3.eth.contract(FactoryContract.abi).at(Session.get("factory"));

        let wallet = Wallet.get();

        let params = {
            from: wallet.getAddresses()[0],
            gas: 0x24889C,
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

            console.log("Started watching for Agreement creation event.");

            let event = distputeFactory.AgreementCreated([{from: wallet.getAddresses()[0]}], function (error, result) {

                if (error) {
                    console.log("new agreement event failed: " + error);
                } else {

                    console.log(result);

                    AgreementEventData.insert({
                        factory: result.address,
                        taker: taker,
                        agreement: result.args.agreement,
                        originatorEscrow: result.args.originatorEscrow,
                        takerEscrow: result.args.takerEscrow,
                        date: new Date(),
                        blockHash: result.transactionHash,
                        blockNumber: result.blockNumber,
                        logIndex: result.logIndex,
                        event: result.name,
                        transactionIndex: result.transactionIndex,
                        transactionHash: result.transactionHash
                    });

                    event.stopWatching();

                    console.log("Stopped watching for Agreement creation event.");

                    //todo: there is a removed attribute on an event that should be studied
                    // carefully because understanding it helps plan for managing transactions
                    // which do not finalize/persist on the chain
                }
            });


        });

    }
});
