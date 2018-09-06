

// standard Meteorjs MongoDB store collection client side (no server side)
let TransactionData = new Mongo.Collection('TransactionData', {connection: null});
let AgreementEventData = new Mongo.Collection('AgreementData', {connection: null});

// local persist used to store the data to the browser store
let TransactionDataObserver = new LocalPersist(TransactionData, 'TransactionDataObserver',
    {                                     // options are optional!
        maxDocuments: 500,                  // max number of docs to store
        storageFull: function (col, doc) {  // function to handle maximum being exceeded
            col.remove({_id: doc._id});
            alert('Restricted to storing 500 transaction records.');
        }
    });


let AgreementEventDataObserver = new LocalPersist(AgreementEventData, 'AgreementEventDataObserver',
    {                                     // options are optional!
        maxDocuments: 500,                  // max number of docs to store
        storageFull: function (col, doc) {  // function to handle maximum being exceeded
            col.remove({_id: doc._id});
            alert('Restricted to storing 500 agreement records.');
        }
    });

export { TransactionData, AgreementEventData };