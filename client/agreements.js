import {Template} from "meteor/templating";
import {AgreementEventData} from "../imports/startup/client/localstore";

import './agreements.html';

Template.agreements.helpers({

    agreements() {
        return AgreementEventData.find({},{
            sort: {date: -1}
        });
    }
});