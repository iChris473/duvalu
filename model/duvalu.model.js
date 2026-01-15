const mongoose = require('mongoose');

const DuvaluSchema = new mongoose.Schema({
    totalSOL: String,
    depositPrivateKey: {
        type: String,
        required: true
    },
    depositPublicKey : {
        type: String,
        required: true
    },
    wallets: String,
}, {timestamps: true});

module.exports = mongoose.model("duvalu", DuvaluSchema);