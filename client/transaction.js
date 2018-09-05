import { ReactiveVar } from 'meteor/reactive-var';

import {TransactionData} from '/imports/startup/client/localstore';
import {Template} from "meteor/templating";

import "./transaction.html";

Template.transaction.onCreated(function() {

    this.tx = new ReactiveVar(TransactionData.findOne(this.data._id));

});

Template.transaction.helpers({

    type() {
        return Template.instance().tx.get().type;
    },

    date(){
        return Template.instance().tx.get().date;
    },

    gas(){
        return Template.instance().tx.get().gas;
    },

    to(){
        return Template.instance().tx.get().to;
    },

    transactionHash() {
        return Template.instance().tx.get().transactionHash;
    }

});