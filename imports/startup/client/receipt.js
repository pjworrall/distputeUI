let TransactionReceipt = (function () {

    return {

        /**
         *
         * @method check
         * @param {Object} tranHash
         * @param {Object} web3
         * @param {Function} callback
         * @returns {Undefined}
         */

        check: function (tranHash, web3, callback) {

            var count = 0;
            var callbackFired = false;

            // wait for receipt
            var filter = web3.eth.filter('latest', function (e) {
                if (!e && !callbackFired) {
                    count++;

                    // stop watching after 50 blocks (timeout)
                    if (count > 50) {

                        filter.stopWatching();
                        callbackFired = true;

                        if (callback)
                            callback(new Error('Transaction couldn\'t be found after 50 blocks'));
                        else
                            throw new Error('Transaction couldn\'t be found after 50 blocks');

                    } else {
                        console.log("trying to get receipt for " + tranHash);

                        web3.eth.getTransactionReceipt(tranHash, function (e, receipt) {

                            if (e) {
                                console.log("web3.eth.getTransactionReceipt: " + e);
                                return;
                            }

                            if (receipt && !callbackFired) {

                                filter.stopWatching();
                                callbackFired = true;
                                // todo: need to test something on the receipt here to check the transaction happened
                                // I mean, what is the behaviour of a transaction is rejected due to insufficient funds?
                                var tmpForceTrue = true;

                                if (tmpForceTrue) {

                                    // let the caller know the transaction receipt
                                    if (callback)
                                        callback(null, receipt)

                                } else {
                                    if (callback)
                                        callback(new Error('The change couldn\'t be made, please check your gas amount.'));
                                    else
                                        throw new Error('The change couldn\'t be made, please check your gas amount.');
                                }

                            }
                        });

                    }
                }
            });
        }
    }
})();

export { TransactionReceipt };