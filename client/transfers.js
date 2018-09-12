import {Template} from "meteor/templating";
import {TransferEventData} from "../imports/startup/client/localstore";

import './transfers.html';

Template.transfers.helpers({

    transfers() {
        return TransferEventData.find({},{
            sort: {date: -1}
        });
    }
});