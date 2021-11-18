const BigNumber = require("bignumber.js");
const { ethers } = require("ethers");
const { commify, formatUnits } = ethers.utils;
const https = require("https");
const { config } = require("dotenv");
config();
const crypto = require("crypto");
const KUCOIN_ENDPOINT = "api.kucoin.com";
const PRICES = "/api/v1/prices";
const DOBO_BNB_LP_ABI = require("./DOBO_BNB_LP_ABI.json");
// const BSC_WEB_SOCKET_RPC = "wss://bsc-ws-node.nariox.org:443";
const BSC_RPC = "https://bsc-dataseed.binance.org/";
const BSC_NETWORK = 56;
let BNB_PRICE = 580;
// const DOBO_BNB_LP_ADDRESS = "0xBE80839a3BE4D3953D5588A60a11aEAED286b593";
const BIRB_BNB_LP_ADDRESS = "0x2e5fE140C46aB86F8eD257c7831d131eBa74EF09";

function getBNBPriceFromKucoin() {
  return new Promise((resolve) => {
    const timestamp = Date.now();
    const signatureData = `${timestamp}GET${PRICES}`;
    const signatureAPI = crypto
      // eslint-disable-next-line no-undef
      .createHmac("sha256", process.env.API_SECRET)
      .update(signatureData)
      .digest("base64");
    const signatureAPI_PASS = crypto
      // eslint-disable-next-line no-undef
      .createHmac("sha256", process.env.API_SECRET)
      // eslint-disable-next-line no-undef
      .update(process.env.PASS)
      .digest("base64");

    const reqOptions = {
      hostname: KUCOIN_ENDPOINT,
      port: 443,
      path: PRICES + "?currencies=BNB",
      method: "GET",
      headers: {
        // eslint-disable-next-line no-undef
        KC_API_KEY: process.env.API_KEY,
        KC_API_SIGN: signatureAPI,
        "KC-API-TIMESTAMP": timestamp,
        "KC-API-PASSPHRASE": signatureAPI_PASS,
        "KC-API-KEY-VERSION": "2",
      },
    };
    const req = https.request(reqOptions, (res) => {
      res.on("data", (d) => {
        // const x = d;
        resolve(d.toString());
      });
    });
    req.end();
  });
}

function getDollarAmountForOneToken(
  token1Amount,
  token1Decimals,
  token2,
  token2Decimals,
  BNBPrice
) {
  token1Amount = BigNumber(token1Amount);
  console.log(token1Amount);
  token1Amount.shiftedBy(-token1Decimals);
  console.log("token 1 reserves:", token1Amount.toString());
  token2 = BigNumber(token2);
  token2.shiftedBy(-token2Decimals);
  console.log("token 2 reserves:", token2.toString());
  // need to figure out the math as to why we are shifting by 9 it is probably unnecessary
  let tokenOneForOneTokenTwo = token1Amount
    .dividedBy(token2)
    .shiftedBy(token1Decimals);
  console.log(tokenOneForOneTokenTwo.toString());
  BNBPrice = BigNumber(BNBPrice);
  let bnbAmountForOneDollar = BigNumber(1).dividedBy(BNBPrice);

  // console.log(bnbAmountForOneDollar.toString());

  let amountOfTokenOneForOneDollar = tokenOneForOneTokenTwo.multipliedBy(
    bnbAmountForOneDollar
  );

  // console.log(amountOfDoboForOneDollar.toString());

  let dollarAmountForOneTokenOne = BigNumber(1)
    .shiftedBy(9)
    .dividedBy(amountOfTokenOneForOneDollar);
  return dollarAmountForOneTokenOne.shiftedBy(-9).toFixed(15);
}

const provider = new ethers.providers.JsonRpcProvider(BSC_RPC, BSC_NETWORK);
const DOBO_WBNB_LP_CONTRACT = new ethers.Contract(
  // DOBO_BNB_LP_ADDRESS,
  BIRB_BNB_LP_ADDRESS,
  DOBO_BNB_LP_ABI,
  provider
);
async function callReserves() {
  let bnbPrice = await getBNBPriceFromKucoin();
  bnbPrice = JSON.parse(bnbPrice);
  BNB_PRICE = bnbPrice.data.BNB;
  const reserves = await DOBO_WBNB_LP_CONTRACT.getReserves();

  const amount = getDollarAmountForOneToken(
    reserves[0].toString(),
    9,
    reserves[1].toString(),
    18,
    BNB_PRICE
  );
  console.log("price per one ", amount);
  return amount;
}
(async () => {
  // const provider = new ethers.providers.WebSocketProvider(
  //     BSC_WEB_SOCKET,
  //     BSC_NETWORK
  //   );

  let amount = await callReserves();
  DOBO_WBNB_LP_CONTRACT.on(
    "Swap",
    async (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
      console.log("swap occured");
      console.log("sender:", sender);
      amount0In = new BigNumber(formatUnits(amount0In, 9));
      console.log(
        "amount0In (BIRB):",
        commify(amount0In.toString()),
        "$" + amount0In.multipliedBy(amount).toString()
      );
      amount1In = new BigNumber(formatUnits(amount1In, 18));
      console.log(
        "amount1In (WBNB):",
        commify(amount1In.toString()),
        "$" + amount1In.multipliedBy(BNB_PRICE).toString()
      );
      amount0Out = new BigNumber(formatUnits(amount0Out, 9));
      console.log(
        "amount0Out (BIRB):",
        commify(amount0Out.toString()),
        "$" + amount0Out.multipliedBy(amount).toString()
      );
      amount1Out = new BigNumber(formatUnits(amount1Out, 18));
      console.log(
        "amount1Out: (WBNB)",
        commify(amount1Out.toString()),
        "$" + amount1Out.multipliedBy(BNB_PRICE).toString()
      );
      console.log("to:", to);
      console.log("new price");
      amount = await callReserves();
    }
  );
  // ethers.BigNumber.from(42).shl()
  // console.log(ethers.BigNumber.from(reserves[0]).toString())
  // console.log(ethers.BigNumber.from(reserves[1]).toString())
  // const y = ethers.BigNumber.from(3)
  // console.log(y.toString())
})();
