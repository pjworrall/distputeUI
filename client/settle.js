import './settle.html';
import {Template} from "meteor/templating";
import {TransactionReceipt} from "../imports/startup/client/receipt";
import {TransactionData, SettlementEventData} from "../imports/startup/client/localstore";
import {AgreementContract, ERC20TokenContract} from "../imports/startup/client/contracts";
import {Wallet} from "../imports/startup/client/wallet";
import {Web3Provider} from "../imports/startup/client/web3provider";
import {ReactiveVar} from "meteor/reactive-var";


Template.settle.onCreated(function () {

    this.originatorBalance = new ReactiveVar(undefined);
    this.takerBalance = new ReactiveVar(undefined);

});

Template.settle.helpers({
    originatorBalance() {
        return Template.instance().originatorBalance.get();
    },
    takerBalance() {
        return Template.instance().takerBalance.get();
    }
});

Template.settle.events({

    'click .js-balances'(event,template) {
        event.preventDefault();

        let web3 = Web3Provider.get();

        // todo got to manage where this address comes from
        let token = web3.eth.contract(ERC20TokenContract.abi).at("0x7c21f56495fc1e8cccf850cb3d6d05b74200ac37");

        template.takerBalance.set(token.balanceOf(Session.get("taker")));

        template.originatorBalance.set(token.balanceOf(Wallet.get().getAddresses()[0]));


    },

    'click .js-settle'(event, template) {
        // Prevent default browser form submit
        event.preventDefault();

        let web3 = Web3Provider.get();

        const address = template.$('input[name=agreement-address]').val();

        console.log("js-settle agreement address: " + address);

        let agreement = web3.eth.contract(AgreementContract.abi).at(address);

        let wallet = Wallet.get();

        let params = {
            from: wallet.getAddresses()[0],
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };

        agreement.settle(params, function (error, tranHash) {

            if (!error) {
                console.log("settle transaction: " + tranHash);

                // check for the transaction receipt confirming the mining
                // todo we need mechanism to check confirmations for finality)

                TransactionReceipt.check(tranHash, web3, function (error, receipt) {

                    if (error) {
                        console.log("settle transaction failed: " + error);
                    } else {

                        let log = receipt.logs[0];

                        TransactionData.insert({
                            type: "Settlement",
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
                console.log("settlement failed: " + error);
            }

            // then watch for event

            let event = agreement.Settled([{from: wallet.getAddresses()[0]}], function (error, result) {

                if (error) {
                    console.log("settled event failed: " + error);
                } else {

                    SettlementEventData.insert({
                        agreement: address,
                        beneficiary: "DK",
                        value: "DK",
                        date: new Date(),
                        blockHash: result.transactionHash,
                        blockNumber: result.blockNumber,
                        logIndex: result.logIndex,
                        event: result.name,
                        transactionIndex: result.transactionIndex,
                        transactionHash: result.transactionHash
                    });

                    event.stopWatching();

                }
            });

        });

    }
});