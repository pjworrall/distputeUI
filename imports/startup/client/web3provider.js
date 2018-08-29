/**
 * Created by Paul Worrall on 28th August 2018.
 *
 * Web3 provider singleton.
 *
 */

// a global function to share the web3 instance across the app
let Web3Provider = {

    set: function (web3, session) {
        session.set("web3", this.web3 = web3);
    },

    get: function () {
        return this.web3;
    },

    destroy: function (session) {
        session.set("web3", this.web3 = undefined);
    }
};

export { Web3Provider };