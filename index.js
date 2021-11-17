const BigNumber = require("bignumber.js");
const { ethers } = require("ethers");
const {commify, formatUnits} =ethers.utils
const DOBO_BNB_LP_ABI = require("./DOBO_BNB_LP_ABI.json");
// const BSC_WEB_SOCKET_RPC = "wss://bsc-ws-node.nariox.org:443";
const BSC_RPC = "https://bsc-dataseed.binance.org/";
const BSC_NETWORK = 56;
// const DOBO_BNB_LP_ADDRESS = "0xBE80839a3BE4D3953D5588A60a11aEAED286b593";
const BIRB_BNB_LP_ADDRESS = "0x2e5fE140C46aB86F8eD257c7831d131eBa74EF09";

// let subscribeParams = {
//     "id": 1545910660739,                          //The id should be an unique value
//     "type": "subscribe",
//     "topic": "/market/ticker:BTC-USDT,ETH-USDT",  //Topic needs to be subscribed. Some topics support to divisional subscribe the informations of multiple trading pairs through ",".
//     "privateChannel": false,                      //Adopted the private channel or not. Set as false by default.
//     "response": true                              //Whether the server needs to return the receipt information of this subscription or not. Set as false by default.
// }
// var socket = new WebSocket("wss://push1-v2.kucoin.com/endpoint?token=xxx&[connectId=xxxxx]");
// // let doboAmount = "19061801959701464822611";
// let doboDecimals = 9;

// let dobo = BigNumber(doboAmount);
// dobo.shiftedBy(-doboDecimals);

// // let x = 19001095378833240382345n;

// let wbnbAmount = "5131349111279551121689";
// let wbnb = BigNumber(wbnbAmount);
// let wbnbDecimals = 18;
// wbnb.shiftedBy(-wbnbDecimals);

// // console.log(doboAmount < x)

// console.log(dobo.toString());
// console.log(wbnb.toString());
// // need to figure out the math as to why we are shifting by 9
// let doboForOneBNB = dobo.dividedBy(wbnb).shiftedBy(doboDecimals);
// console.log(doboForOneBNB.toString());
// let bnbPriceInDollars = 633.06;
// bnbPriceInDollars = BigNumber(bnbPriceInDollars);
// let bnbAmountForOneDollar = BigNumber(1).dividedBy(bnbPriceInDollars);

// // console.log(bnbAmountForOneDollar.toString());

// let amountOfDoboForOneDollar = doboForOneBNB.multipliedBy(
//   bnbAmountForOneDollar
// );

// // console.log(amountOfDoboForOneDollar.toString());

// let dollarAmountForOneDobo = BigNumber(1)
//   .shiftedBy(9)
//   .dividedBy(amountOfDoboForOneDollar);
// console.log(dollarAmountForOneDobo.shiftedBy(-9).toFixed(9));
// console.log(doboForOneBNB.shiftedBy(9).toString())
// console.log(dobo)
// console.log(doboAmount.toNumber())
// console.log(wbnbAmount)
function getDollarAmountForOneToken(
  token1Amount,
  token1Decimals,
  token2,
  token2Decimals,
  BNBPrice
) {

token1Amount = BigNumber(token1Amount);
console.log('token 1 reserves:', token1Amount.toString());
token1Amount.shiftedBy(-token1Decimals);
token2 = BigNumber(token2);
token2.shiftedBy(-token2Decimals);
console.log('token 2 reserves:', token2.toString());
// need to figure out the math as to why we are shifting by 9 it is probably unnecessary
let tokenOneForOneTokenTwo = token1Amount.dividedBy(token2).shiftedBy(token1Decimals);
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
(async () => {
  // const provider = new ethers.providers.WebSocketProvider(
  //     BSC_WEB_SOCKET,
  //     BSC_NETWORK
  //   );
  let bnbDollars = 574.55;
  const provider = new ethers.providers.JsonRpcProvider(BSC_RPC, BSC_NETWORK);
  const DOBO_WBNB_LP_CONTRACT = new ethers.Contract(
    // DOBO_BNB_LP_ADDRESS,
    BIRB_BNB_LP_ADDRESS,
    DOBO_BNB_LP_ABI,
    provider
  );
  const reserves = await DOBO_WBNB_LP_CONTRACT.getReserves();
//   console.log(reserves[0]);
//   console.log(reserves[1]);
//   console.log(reserves[0].shl(9).toString());
//   console.log(reserves[1].shl(18).toString());
  const amount = getDollarAmountForOneToken(
    reserves[0].toString(),
    9,
    reserves[1].toString(),
    18,
    bnbDollars
  );
  console.log('price per one ', amount)

 DOBO_WBNB_LP_CONTRACT.on('Swap', (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
      console.log('swap occured')
      console.log('sender:', sender)
      console.log('amount0In (BIRB):', commify(formatUnits(amount0In, 9)))
      console.log('amount1In (WBNB):', commify(formatUnits(amount1In, 18)))
      console.log('amount0Out (BIRB):', commify(formatUnits(amount0Out, 9)))
      console.log('amount1Out: (WBNB)', commify(formatUnits(amount1Out, 18)))
      console.log('to:', to)
      
  })
  // ethers.BigNumber.from(42).shl()
  // console.log(ethers.BigNumber.from(reserves[0]).toString())
  // console.log(ethers.BigNumber.from(reserves[1]).toString())
  // const y = ethers.BigNumber.from(3)
  // console.log(y.toString())
})();
