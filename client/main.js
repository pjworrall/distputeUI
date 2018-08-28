import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import {Web3Provider} from '/imports/startup/client/web3provider.js'

import './main.html';

Template.hello.onCreated(function helloOnCreated() {
    // counter starts at 0
    this.counter = new ReactiveVar(0);

    this.balance = new ReactiveVar("DK");

    this.coinbase = new ReactiveVar("DK");

    let web3 = Web3Provider.getInstance();

    web3.eth.getCoinbase().then( (result) => {
            console.log("web3provider.coinbase: " + result);
            this.coinbase.set(result);
        }
    ).catch( (error) => {
            console.log("error trying to get balance: " + error);
        }
    );

    web3.eth.getBalance(this.coinbase.get()).then( (result) => {

            let wei = web3.utils.fromWei(result,'ether');

            console.log("web3provider.balance: " + wei);
            this.balance.set(wei);
        }
    ).catch( (error) => {
            console.log("error trying to get balance: " + error);
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
    }
});

Template.hello.events({
    'click button'(event, instance) {
        // increment the counter when button is clicked
        instance.counter.set(instance.counter.get() + 1);
    },
});
