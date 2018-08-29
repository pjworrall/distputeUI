/**
 * Created by Paul Worrall on 28th August 2018.
 *
 * Web3 provider singleton.
 *
 */

import Web3 from 'web3';

let Web3Provider = (function () {
    let web3;
    let cached = false;

    function create() {
        return  new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
    }

    return {
        getInstance: function () {
            if (!web3) {
                web3 = create();
            }
            return web3;
        },
        reset: function () {
            web3 = undefined;
            cached = false;
        }
    }

})();

export {Web3Provider};