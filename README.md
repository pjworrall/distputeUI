Distpute Smart Contract Test UI

This is a test UI for working with Distpute the Smart Contract Dispute Resolution framework.

It needs the Distpute framework smart contract to be already deployed and the 
Address of the Distpute Factory SC to create Agreements from.

**Todo**

* Agreement checks Escrow stakes for Originator and Taker

* Agreement settles by move Escrow balances to Beneficiary

**Known Bugs**

* if transactions fail event watchers don't stop polling for events