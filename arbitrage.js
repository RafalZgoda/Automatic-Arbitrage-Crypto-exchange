"use strict";

const ccxt      = require ('ccxt')

;(async function main () {

//  let kraken    = new ccxt.kraken ()
  let poloniex    = new ccxt.poloniex ()
  let binance    = new ccxt.binance ()
  let cryptopia    = new ccxt.cryptopia ()
  let hitbtc    = new ccxt.hitbtc ()


  var symbol = 'BCH/USDT'
  var arbitrage = {} ;
  arbitrage.books = [] ;
  arbitrage.markets = [] ;
  arbitrage.spreads = [] ;

  arbitrage.books.push(await binance.fetchOrderBook (symbol))
  arbitrage.markets.push("binance") ;
  // arbitrage.books.push(await kraken.fetchOrderBook (symbol))
  // arbitrage.markets.push("kraken") ;
  arbitrage.books.push(await poloniex.fetchOrderBook (symbol))
  arbitrage.markets.push("poloniex") ;
  arbitrage.books.push(await cryptopia.fetchOrderBook (symbol))
  arbitrage.markets.push("cryptopia") ;
  arbitrage.books.push(await hitbtc.fetchOrderBook (symbol))
  arbitrage.markets.push("hitbtc") ;



  compareAll(arbitrage)
//  console.log(arbitrage.spreads[0])


}) ()

function compareAll (oB) {

  var spreadMax = 0, imax, jmax, c=0 ;

  for(var i = 0 ; i < oB.books.length ; i ++ ) {
    for(var j = 0 ; j < oB.books.length; j ++ ) {
      oB.spreads[c] = oB.books[i].bids[0][0] / oB.books[j].asks[0][0]
      console.log(oB.markets[i]+" et REVENTE sur "+oB.markets[j]+"     => Gain = "+(oB.spreads[c]-1)*100 +" % ")
      if(oB.spreads[c] > spreadMax){
        spreadMax = oB.spreads[c] ;
        imax = i ;
        jmax = j ;
        console.log(jmax)
      }

      c++
    }
  }
  console.log("ADchat sur "+oB.markets[jmax]+" à "+oB.books[jmax].asks[0][0]+" et Revente sur "+oB.markets[imax]+" à "+oB.books[imax].bids[0][0]+"   => Gain = "+(spreadMax-1)*100 + " % ")

  console.log("Prix d'achat : "+oB.books[imax].asks[0][0]+" Volume : "+oB.books[imax].asks[0][1])
  console.log("Prix de vente : "+oB.books[imax].bids[0][0]+" Volume : "+oB.books[imax].bids[0][1])
  console.log("Prix d'achat : "+oB.books[jmax].asks[0][0]+" Volume : "+oB.books[jmax].asks[0][1])
  console.log("Prix de vente : "+oB.books[jmax].bids[0][0]+" Volume : "+oB.books[jmax].bids[0][1])
  console.log(c)


}
















/*  var symbol = 'ETC/ETH'

  var obBinance = await binance.fetchOrderBook (symbol)
  console.log("Prix d'achat : "+obBinance.asks[0][0]+" Volume : "+obBinance.asks[0][1])
  console.log("Prix de vente : "+obBinance.bids[0][0]+" Volume : "+obBinance.bids[0][1])

  var orderBookKraken = await kraken.fetchOrderBook (symbol)
  console.log("Prix d'achat : "+orderBookKraken.asks[0][0]+" Volume : "+orderBookKraken.asks[0][1])
  console.log("Prix de vente : "+orderBookKraken.bids[0][0]+" Volume : "+orderBookKraken.bids[0][1])

  var orderBookPoloniex = await poloniex.fetchOrderBook (symbol)
  console.log("Prix d'achat : "+orderBookPoloniex.asks[0][0]+" Volume : "+orderBookPoloniex.asks[0][1])
  console.log("Prix de vente : "+orderBookPoloniex.bids[0][0]+" Volume : "+orderBookPoloniex.bids[0][1])

  var spread1 = orderBookPoloniex.bids[0][0] / orderBookKraken.asks[0][0]
  var spread2 = orderBookKraken.bids[0][0] / orderBookPoloniex.asks[0][0]


  var vol1 = Math.min(orderBookPoloniex.bids[0][0], orderBookKraken.asks[0][0] )
  var vol2 = Math.min(orderBookKraken.bids[0][0] , orderBookKraken.asks[0][0] )

  console.log("Spread1  : "+spread1+" Volume : "+vol1)
  console.log("Spread2  : "+spread2+" Volume : "+vol2)
*/
