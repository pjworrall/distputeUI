import {Template} from "meteor/templating";
import {TransactionData} from "../imports/startup/client/localstore";

import './transactions.html';

Template.transactions.helpers({

    transactions() {
        return TransactionData.find({},{
            sort: {date: -1}
        });
    }
});