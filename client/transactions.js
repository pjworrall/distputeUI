import {Template} from "meteor/templating";
import {TransactionData} from "../imports/startup/client/localstore";

import './transactions.html';

Template.transactions.helpers({

    transactions() {
        console.log("finding all the QQQQQQQQQQQQQQQ");
        return TransactionData.find();
    }
});