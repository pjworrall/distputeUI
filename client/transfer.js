import { ReactiveVar } from 'meteor/reactive-var';

import dateFormat from 'dateformat';

import {TransferEventData} from '/imports/startup/client/localstore';
import {Template} from "meteor/templating";

import "./transfer.html";

Template.transfer.onCreated(function() {

    this.transfer = new ReactiveVar(TransferEventData.findOne(this.data._id));

});


Template.transfer.helpers({

    date() {
        return dateFormat(Template.instance().transfer.get().date, "mm:dd:yy HH:MM");
    },

    token(){
        return Template.instance().transfer.get().token;
    },

    value(){
        return Template.instance().transfer.get().value;
    },

    beneficiary(){
        return Template.instance().transfer.get().beneficiary;
    }

});