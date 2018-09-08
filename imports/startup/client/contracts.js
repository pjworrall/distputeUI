let AgreementContract = function () {

    return {
        'version': '',
        'abi': [
            {
                "constant": true,
                "inputs": [],
                "name": "isDisputed",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "setAccepted",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "settle",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "favoured",
                        "type": "address"
                    }
                ],
                "name": "setFavour",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "getSubject",
                "outputs": [
                    {
                        "name": "",
                        "type": "string"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "setBeneficiary",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "isAccepted",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "getBeneficiary",
                "outputs": [
                    {
                        "name": "",
                        "type": "address"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "setDispute",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "cancel",
                "outputs": [],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "name": "subject",
                        "type": "string"
                    },
                    {
                        "name": "taker",
                        "type": "address"
                    },
                    {
                        "name": "adjudicator",
                        "type": "address"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "taker",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "name": "subject",
                        "type": "string"
                    }
                ],
                "name": "Accepted",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "determiningParty",
                        "type": "address"
                    }
                ],
                "name": "Determined",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "disputingParty",
                        "type": "address"
                    }
                ],
                "name": "Dispute",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "favouredParty",
                        "type": "address"
                    }
                ],
                "name": "Favoured",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "beneficiary",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "name": "adjudicator",
                        "type": "address"
                    }
                ],
                "name": "Settled",
                "type": "event"
            }
        ]
    }

}();

export {AgreementContract};