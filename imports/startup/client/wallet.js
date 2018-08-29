// a global function to share the ether-lightwallet across the app
let Wallet = {

    set: function (keystore, session) {
        session.set("wallet", this.wallet = keystore);
    },

    get: function () {
        return this.wallet;
    },

    destroy: function (session) {
        session.set("wallet", this.wallet = undefined);
    }
};

export { Wallet };