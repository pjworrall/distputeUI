import { ReactiveVar } from 'meteor/reactive-var';

import dateFormat from 'dateformat';

import {AgreementEventData} from '/imports/startup/client/localstore';
import {Template} from "meteor/templating";

import "./agreement.html";

Template.agreement.onCreated(function() {

    this.agreement = new ReactiveVar(AgreementEventData.findOne(this.data._id));

});

Template.agreement.helpers({

    date() {
        return dateFormat(Template.instance().agreement.get().date, "mm:dd:yy HH:MM");
    },

    agreement(){
        return Template.instance().agreement.get().agreement;
    },

    factory(){
        return Template.instance().agreement.get().factory;
    },

    taker(){
        return Template.instance().agreement.get().taker;
    }

});