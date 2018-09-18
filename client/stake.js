import {Template} from "meteor/templating";

import {Wallet} from "../imports/startup/client/wallet";
import {Web3Provider} from "../imports/startup/client/web3provider";
import {TransactionData} from "../imports/startup/client/localstore";
import {TransactionReceipt} from "../imports/startup/client/receipt";
import {ERC20TokenContract} from "../imports/startup/client/contracts.js";


import "./stake.html";

import {ReactiveVar} from "meteor/reactive-var";

Template.stake.onCreated(function infoOnCreated() {
    this.staked = new ReactiveVar(undefined);
});

Template.stake.helpers({
    staked() {
        return Template.instance().staked.get();
    }
});

Template.stake.events({
    'click .js-stake'(event, instance) {
        event.preventDefault();

        instance.staked.set(undefined);

        const partyAddress = instance.$('input[name=party-address]').val();

        console.log("party address: " + partyAddress);

        const escrowAddress = instance.$('input[name=escrow-address]').val();

        console.log("escrow address: " + escrowAddress);

        const tokenAddress = instance.$('input[name=token-address]').val();

        console.log("token address: " + tokenAddress);

        const amount = instance.$('input[name=amount]').val();

        console.log("Stake amount: " + amount);

        let web3 = Web3Provider.get();

        if(!web3) {
            console.log("no web3 provider, please provide a wallet first");
            return;
        }

        let token = web3.eth.contract(ERC20TokenContract.abi).at(tokenAddress);

        let wallet = Wallet.get();

        if(!wallet) {
            console.log("please provide a wallet first");
            return;
        }

        // fudging adjudicator atm, this will be set by protocol in smart contractors
        let originator = partyAddress;

        let params = {
            from: originator,
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };


        token.transfer(escrowAddress,amount,params, function(error,tranHash) {
            if (!error) {

                console.log("transfer tran hash: " + tranHash);

                TransactionReceipt.check(tranHash, web3, function (error, receipt) {

                    if (error) {
                        console.log("transfer failed: " + error);
                    } else {

                        let log = receipt.logs[0];

                        TransactionData.insert({
                            type: "Stake",
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
                console.log("transfer error: " + error);
            }

            let event = token.Transfer([{from: originator}], function (error, result) {

                if (error) {
                    console.log("transfer event failed: " + error);
                } else {

                    console.log("" + JSON.stringify(result));

                    instance.staked.set("Staked");
                    event.stopWatching();
                }
            });
        });

    },
});