Distpute Smart Contract Test UI

This is a test UI for working with Distpute the Smart Contract Dispute Resolution framework.

It needs the Distpute framework smart contract to be already deployed and the 
Address of the Distpute Factory SC to create Agreements from.

**Todo**

* ~~Get the Address of the Agreement contract~~

* Create a view for each role (Maker, Taker, Resolver)

* Enable Maker to attempt to settle

* Enable Taker to attempt to settle

* Enable Maker to dispute

* Enable Taker to dispute

* Enable Resolver to resolve

* Enable Maker, Taker and Resolver to receive events on an Agreement

**Known Bugs**

Maker Address when provided is used for transaction creation but not for the 
Agreement owner.