import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import {Web3Provider} from '/imports/startup/client/web3provider.js';

import {EthHdWallet} from 'eth-hd-wallet';

import './main.html';

Template.hello.onCreated(function helloOnCreated() {
    // counter starts at 0
    this.counter = new ReactiveVar(0);
    this.balance = new ReactiveVar("DK");
    this.agreement = new ReactiveVar("DK");
    this.coinbase = new ReactiveVar("DK");


});

Template.hello.onRendered(function helloOnRendered() {

        let web3 = Web3Provider.getInstance();

        const instance = this;

        web3.eth.getCoinbase(function (error, result) {
            if (!error) {
                console.log("coinbase: " + result);
                instance.coinbase.set(result);
            } else {
                console.log("get coinbase error: " + error);
            }

        });
    }
);

Template.hello.helpers({
    counter() {
        return Template.instance().counter.get();
    },
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

Template.hello.events({
    'click .js-balance'(event, instance) {
        // increment the counter when button is clicked
        instance.counter.set(instance.counter.get() + 1);

        // get the balance of the coinbase
        let web3 = Web3Provider.getInstance();

        let address = instance.coinbase.get();
        console.log("coinbase: " + address);

        web3.eth.getBalance(address, function (error, result) {
            if (!error) {
                let wei = web3.fromWei(result, 'ether');
                console.log("get balance: " + wei);
                instance.balance.set(wei);
            } else {
                console.log("get balance error: " + error);
            }

        });
    },
    'click .js-agreement'(event, instance) {

        let web3 = Web3Provider.getInstance();

        console.log("main .js-agreement: to get an agreement contract");

        // setup up a hd wallet for Granache

        let mnemonic = "dog double video above tuna afford almost jazz exclude rural level flag";

        const wallet = EthHdWallet.fromMnemonic(mnemonic);

        let addresses = wallet.generateAddresses(10);

        console.log(addresses);

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

        let factory = new web3.eth.contract(abi);

        let distputeFactory = factory.at("0xd89ca44096afab420b87e998ae3cfc103aab849f");

        let params = {
            from: addresses[3],
            gas: 0x1c33c9,
            gasPrice: 0x756A528800
        };

        debugger;

        distputeFactory.newAgreement("Rain on Monday", params, function (error, tranHash) {
            //todo: this is not handling errors like 'not a BigNumber' , do we need a try catch somewhere?

            if (!error) {
                console.log("newAgreement transaction: " + tranHash);
            } else {
                console.log("newAgreement error: " + error);
            }
        });

        console.log(factory.options.address);


        console.log("trying to perform a new agreement transaction");

        // gas and gas price will have to be determined eventually or maybe required to work
        // factory.methods.newAgreement("Dry on Sunday",
        //     web3.eth.accounts[1],
        //     web3.eth.accounts[2],
        // ).send({from: web3.eth.accounts[0]})
        //     .then(function(receipt){
        //             console.log(receipt);
        //         }
        //
        //     );

    },
});
