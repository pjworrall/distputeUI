import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import {Web3Provider} from '/imports/startup/client/web3provider.js';

import { EthHdWallet } from 'eth-hd-wallet';

import './main.html';

Template.hello.onCreated(function helloOnCreated() {
    // counter starts at 0
    this.counter = new ReactiveVar(0);

    this.balance = new ReactiveVar("DK");

    this.coinbase = new ReactiveVar("DK");

    this.agreement = new ReactiveVar("DK");

    let web3 = Web3Provider.getInstance();

    web3.eth.getCoinbase().then((result) => {
            console.log("web3provider.coinbase: " + result);
            this.coinbase.set(result);
        }
    ).catch((error) => {
            console.log("error trying to get coinbase: " + error);
        }
    );


});

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

        // get the balanc eof the coinbase
        let web3 = Web3Provider.getInstance();

        let address = instance.coinbase.get();
        console.log("coinbase: " + address);

        web3.eth.getBalance(address).then((result) => {
                let wei = web3.utils.fromWei(result, 'ether');
                console.log("web3provider.balance: " + wei);
                instance.balance.set(wei);
            }
        ).catch((error) => {
                console.log("error trying to get balance: " + error);
            }
        );
    },
    'click .js-agreement'(event, instance) {

        let web3 = Web3Provider.getInstance();

        console.log("main .js-agreement: to get an agreement contract");

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

        let factory = new web3.eth.Contract(abi,"0xd89ca44096afab420b87e998ae3cfc103aab849f");

        console.log(factory.options.address);

        debugger;

        let mnemonic = "dog double video above tuna afford almost jazz exclude rural level flag";

        const wallet = EthHdWallet.fromMnemonic(mnemonic);

        let addresses = wallet.generateAddresses(10);

        console.log(addresses);

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
