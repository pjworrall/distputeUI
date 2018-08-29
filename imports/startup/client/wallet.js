// a global function to share the ether-lightwallet across the app
let Wallet = {

    set: function (keystore) {
        this.wallet = keystore;
    },

    get: function () {
        return this.wallet;
    },

    destroy: function () {
        this.wallet = undefined;
    }
};

export { Wallet };