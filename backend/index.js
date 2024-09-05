const express = require("express");
const Moralis = require("moralis").default;
const speakeasy = require("speakeasy"); // For 2FA
const qrcode = require("qrcode"); // For generating QR code
const cors = require("cors");
require("dotenv").config();
const port = 3001;

const app = express();
app.use(cors());
app.use(express.json());

const userSecrets = {};

app.post("/auth/generate-2fa", async (req, res) => {
  const { userId } = req.body;

  console.log(`Generating 2FA secret for user: ${userId}`);

  const secret = speakeasy.generateSecret({
    name: `SolanaWallet (${userId})`, 
  });

  userSecrets[userId] = secret;

  console.log(`2FA secret generated and stored for user: ${userId}`);

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  return res.status(200).json({ qrCodeUrl });
});

// Route to verify the 2FA token
app.post("/verify-2fa", (req, res) => {
  const { userId, token } = req.body;

  console.log(`Verifying 2FA for user: ${userId}`);
  console.log(`Received token: ${token}`);

  // Retrieve the user's secret (from memory or database)
  const userSecret = userSecrets[userId];

  if (!userSecret) {
    console.log(`User ${userId} not enrolled in 2FA.`);
    return res
      .status(400)
      .json({ valid: false, message: "User not enrolled in 2FA." });
  }

  console.log(`User secret found for ${userId}`);

  // Verify the token
  try {
    const isValid = speakeasy.totp.verify({
      secret: userSecret.base32,
      encoding: 'base32',
      token: token,
      window: 1,
    });

    console.log(`2FA verification result for user ${userId}: ${isValid}`);

    if (isValid) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(400).json({ valid: false, message: "Invalid token." });
    }
  } catch (error) {
    console.error(`Error verifying 2FA token: ${error.message}`);
    return res.status(500).json({ valid: false, message: "Server error during verification." });
  }
});


// Moralis integration for Solana
app.get("/getTokens", async (req, res) => {
  const { userAddress, network } = req.query;

  const tokens = await Moralis.SolApi.account.getSPL({
    network: network,
    address: userAddress,
  });

  const balance = await Moralis.SolApi.account.getBalance({
    network: network,
    address: userAddress,
  });

  const jsonResponse = {
    tokens: tokens.raw,
    nfts: [],
    balance: balance.raw.solana,
  };

  return res.status(200).json(jsonResponse);
});

// Start Moralis and the Express server
Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
