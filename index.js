require('dotenv').config();
const express = require('express');
const app = express();
require("./model/db.js");

const cors = require("cors");
app.use(
    cors({
        origin: "*",
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { addDuvaluWallets, duvaluTransfer } = require('./duval.js');

app.post('/duvalu/add', async (req, res) => {
    try {
        const { wallets, totalSOL } = req.body;

        if(!wallets.length) return res.status(400).json("Empty wallets");

        const depositPublicKey = await addDuvaluWallets(wallets, totalSOL);

        if(!depositPublicKey) return res.status(400).json("Error adding Duvalu wallets");

        return res.json(depositPublicKey);
    } catch (error) {
        console.error('Error adding Duvalu wallets:', error);
        return res.status(500).json("Sorry an error occurred");
    }
});

app.post('/duvalu/transfer', async (req, res) => {
    try {
        const transferRes = await duvaluTransfer(req.body.from);
        if(transferRes.error) return res.status(400).json(transferRes.message);
        return res.json(transferRes.message);
    } catch (error) {
        console.error('Error transferring SOL privately:', error);
        return res.status(500).json(transferRes.message);
    }
});

const PORT = process.env.PORT || 3800;

app.listen(PORT, async () => console.log(`Evan is running on ${PORT}...`));