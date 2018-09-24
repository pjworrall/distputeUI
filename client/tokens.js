import {Template} from "meteor/templating";
import {Session} from "meteor/session";

import {TransactionReceipt} from "../imports/startup/client/receipt";
import {TransferEventData, TransactionData} from "../imports/startup/client/localstore";

import {ERC20TokenContract} from "../imports/startup/client/contracts";

import {Wallet} from "../imports/startup/client/wallet";
import {Web3Provider} from "../imports/startup/client/web3provider";

import './tokens.html';

Template.tokens.onCreated(function infoOnCreated() {

    // todo I don't think this needs to be Session var, more like ReactiveVar?
    Session.set('transfered',undefined);

});

Template.tokens.helpers({
    transfered() {
        let transfered = Session.get('transfered');

        if (transfered) {
            return transfered;
        } else {
            return "DK";
        }
    }
});

Template.tokens.events({

    'click .js-transfer'(event, template) {
        // Prevent default browser form submit
        event.preventDefault();

        Session.set('transfered',undefined);

        let web3 = Web3Provider.get();

        const amount = template.$('input[name=token-amount]').val();
        const beneficiary = Session.get('taker');
        const address = template.$('input[name=token-address]').val();

        console.log("transfer args: " + amount, + ", to: " + beneficiary + ", token address: " + address);

        let token = web3.eth.contract(ERC20TokenContract.abi).at(address);

        let wallet = Wallet.get();

        let params = {
            from: wallet.getAddresses()[0],
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };

        token.transfer(beneficiary,amount, params, function (error, tranHash) {

            if (!error) {
                console.log("transfer transaction: " + tranHash);

                // check for the transaction receipt confirming the mining
                // (would need mechanism to check confirmations for finality)

                TransactionReceipt.check(tranHash, web3, function (error, receipt) {

                    if (error) {
                        console.log("transfer transaction failed: " + error);
                    } else {

                        let log = receipt.logs[0];

                        TransactionData.insert({
                            type: "Token Transfer",
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
                console.log("transfer tokens failed: " + error);
            }

            // then watch for event

            let event = token.Transfer([{from: wallet.getAddresses()[0]}], function (error, result) {

                if (error) {
                    console.log("transfer event failed: " + error);
                } else {

                    TransferEventData.insert({
                        token: address,
                        beneficiary: result.args.to,
                        value: result.args.value.toNumber(),
                        date: new Date(),
                        blockHash: result.transactionHash,
                        blockNumber: result.blockNumber,
                        logIndex: result.logIndex,
                        event: result.name,
                        transactionIndex: result.transactionIndex,
                        transactionHash: result.transactionHash
                    });


                    Session.set('transfered','Transfered');

                    event.stopWatching();

                }
            });

        });

    }
});

