"use strict";
var config = require('./config');
var symbol_excluded = require('./symbol_excluded');
console.log("Symbol excluded (wallet update, deposit maintenance, bug, etc): ")
console.log(symbol_excluded)

var request = require("request")

const ccxt      = require ('ccxt')
const asTable   = require ('as-table')
const log       = require ('ololog').configure ({ locate: false })

require ('ansicolor').nice;

let printSupportedExchanges = function () {
    log ('Supported exchanges:', ccxt.exchanges.join (', ').green)
}

let printUsage = function () {
    log ('Usage: node', process.argv[1], 'id1'.green, 'id2'.yellow, 'id3'.blue, '...')
    printSupportedExchanges ()
}

let printExchangeSymbolsAndMarkets = function (exchange) {
    log (getExchangeSymbols (exchange))
    log (getExchangeMarketsTable (exchange))
}

let getExchangeMarketsTable = (exchange) => {
    return asTable.configure ({ delimiter: ' | ' }) (Object.values (markets))
}

let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms));

let proxies = [
    '', // no proxy by default
    'https://crossorigin.me/',
    'https://cors-anywhere.herokuapp.com/',
]

;(async function main (cb) {

    if (process.argv.length > 3) {

        let ids = process.argv.slice (2)
        let exchanges = {}

        log (ids.join (', ').yellow)

        // load all markets from all exchanges
        for (let id of ids) {

            // instantiate the exchange by id
            let exchange = new ccxt[id] ()

            // save it in a dictionary under its id for future use
            exchanges[id] = exchange

            // load all markets from the exchange
            let markets = await exchange.loadMarkets ()


            //console.log(markets['ETH/BTC'].taker)
            // var createAdr = await exchange.createDepositAddress('ABY/BTC', "")

            // basic round-robin proxy scheduler
            let currentProxy = 0
            let maxRetries   = proxies.length

            for (let numRetries = 0; numRetries < maxRetries; numRetries++) {

                try { // try to load exchange markets using current proxy

                    exchange.proxy = proxies[currentProxy]
                    await exchange.loadMarkets ()

                } catch (e) { // rotate proxies in case of connectivity errors, catch all other exceptions

                    // swallow connectivity exceptions only
                    if (e instanceof ccxt.DDoSProtection || e.message.includes ('ECONNRESET')) {
                        log.bright.yellow ('[DDoS Protection Error] ' + e.message)
                    } else if (e instanceof ccxt.RequestTimeout) {
                        log.bright.yellow ('[Timeout Error] ' + e.message)
                    } else if (e instanceof ccxt.AuthenticationError) {
                        log.bright.yellow ('[Authentication Error] ' + e.message)
                    } else if (e instanceof ccxt.ExchangeNotAvailable) {
                        log.bright.yellow ('[Exchange Not Available Error] ' + e.message)
                    } else if (e instanceof ccxt.ExchangeError) {
                        log.bright.yellow ('[Exchange Error] ' + e.message)
                    } else {
                        throw e; // rethrow all other exceptions
                    }

                    // retry next proxy in round-robin fashion in case of error
                    currentProxy = ++currentProxy % proxies.length
                }
            }

            log (id.green, 'loaded', exchange.symbols.length.green, 'markets')
        }

        log ('Loaded all markets'.green)

        // get all unique symbols
        let uniqueSymbols = ccxt.unique (ccxt.flatten (ids.map (id => exchanges[id].symbols)))

        // filter out symbols that are not present on at least two exchanges
        let arbitrableSymbols = uniqueSymbols
            .filter (symbol =>
                ids.filter (id =>
                    (exchanges[id].symbols.indexOf (symbol) >= 0)).length > 1)
            .sort ((id1, id2) => (id1 > id2) ? 1 : ((id2 > id1) ? -1 : 0))

        // print a table of arbitrable symbols
        let table = arbitrableSymbols.map (symbol => {
            let row = { symbol }
            for (let id of ids) {
                if (exchanges[id].symbols.indexOf (symbol) >= 0)
                    row[id] = id
                  }
            return row
        })

     log (asTable.configure ({ delimiter: ' | ' }) (table))






        var arbitrage = {} ;
        arbitrage.symbols = [] ;
        arbitrage.exchanges = [] ;
        for(var i = 0 ; i < arbitrableSymbols.length ; i++){
          arbitrage.symbols[i] = arbitrableSymbols[i]
          arbitrage.exchanges[i] = []
          arbitrage.exchanges[i].orderbook = [] ;
          arbitrage.exchanges[i].spreads = [] ;

          for (var j = 0 ; j < ids.length ; j++ /*let id of ids*/) {
            if (exchanges[ids[j]].symbols.indexOf (arbitrage.symbols[i]) >= 0) {
              //console.log(exchanges[ids[j]].fees.trading.taker)
              //console.log(exchanges[ids[j]].fees.funding.withdraw)
              //console.log(arbitrage.symbols[i]+" have order book "+ ids[j])
              try {
                var error = false ;
                arbitrage.exchanges[i].orderbook[j] = await exchanges[ids[j]].fetchOrderBook (arbitrage.symbols[i])
                if(!arbitrage.exchanges[i].orderbook[j]) console.log("No orderbookl found");
               } catch(e) {
                   console.log(e);
                   var error = true;
               }

              //console.log(id)
            }
          }
      //  console.log(arbitrage.exchanges[i])
        if(!error)
          compareAll(arbitrage.exchanges[i], ids, arbitrage.symbols[i], exchanges)
        }




    } else {

        printUsage ()

    }

    process.exit ()

}) ()



function compareAll (oB, ids, symbol, exchanges ) {

  var spreadMax = 0, c=0 ;
  let imax, jmax ;
  //console.log(symbol+"Compare spread ....")
  // console.log(oB.orderbook)
  for(var i = 0 ; i < ids.length ; i++ /*let i of ids*/) {
    for(var j = 0 ; j < ids.length ; j++) {
    //  console.log("i = "+i+" j = "+j)
       if( ( oB.orderbook[i] != null && oB.orderbook[j] != null )) {
      //    console.log("i = "+i+" j = "+j)

        if(i != j ) {
        //  console.log("i = "+i+" j = "+j)

        if(oB.orderbook[i].bids != null && oB.orderbook[j].asks != null ) {
        if(oB.orderbook[i].bids[0] != null && oB.orderbook[j].asks[0] != null) {
          if(oB.orderbook[i].bids[0][0] != null && oB.orderbook[j].asks[0][0] != null ) {

          if(oB.orderbook[j].asks[0][0] != 0  ) {
            if(i == 'kucoin'){
              oB.spreads[c] = oB.orderbook[i].asks[0][0] / oB.orderbook[j].asks[0][0]
            }
            else if(j == 'kucoin'){
              oB.spreads[c] = oB.orderbook[i].bids[0][0] / oB.orderbook[j].bids[0][0]
            }
            else {
              oB.spreads[c] = oB.orderbook[i].bids[0][0] / oB.orderbook[j].asks[0][0]
            }
               //console.log(ids[i]+" et REVENTE sur "+ids[j]+"     => Gain = "+(oB.spreads[c]-1)*100 +" % ")
              if(oB.spreads[c] > spreadMax){
                spreadMax = oB.spreads[c] ;
                imax = i ;
                jmax = j ;
              }

              c++
          }
        }
            }
          }
        }
      }
    }
  }

  if(imax != null && jmax != null ){
    if(exchanges[ids[imax]].fees.trading.taker != null && exchanges[ids[jmax]].fees.trading.taker != null ) {
      var takerI = exchanges[ids[imax]].fees.trading.taker
      var takerJ = exchanges[ids[jmax]].fees.trading.taker
    }

    if((spreadMax-takerI-takerJ-1)*100 > 0.6 ) {
      if(!symbol_excluded.includes(symbol)){
      //if(symbol != 'STEEM/BTC'/* && symbol != 'RADS/BTC' && symbol != 'NEOS/BTC' && symbol != 'SBD/BTC' && symbol != 'STEEM/ETH' && symbol != 'XRB/BTC' && symbol != 'XRB/BTC' && symbol != 'BCD/BTC' && symbol != 'BCD/ETH'*/) {// )
        var volume = Math.min(oB.orderbook[jmax].asks[0][1] , oB.orderbook[imax].bids[0][1])
        // if(markets[symbol].taker != null) {
        // markets['ETH/BTC'].taker
        // }
        console.log(symbol+" : Achat de "+volume+" sur "+ids[jmax]+" à "+oB.orderbook[jmax].asks[0][0]+" taker : "+takerJ+" et Revente sur "+ids[imax]+" taker : "+takerJ+" à "+oB.orderbook[imax].bids[0][0]+"   => Gain = "+(spreadMax-1-takerI-takerJ)*100 + " % ")
        if(ids[jmax] == 'exmo' || ids[imax] == 'exmo') {
          var string_notification = symbol+" : Achat de "+volume+" sur "+ids[jmax]+" à "+oB.orderbook[jmax].asks[0][0]+" taker : "+takerJ+" et Revente sur "+ids[imax]+" taker : "+takerJ+" à "+oB.orderbook[imax].bids[0][0]+"   => Gain = "+(spreadMax-1-takerI-takerJ)*100 + " % "
          request.post('https://api.pushover.net/1/messages.json', {form:{token:config.apiKeyPushoverToken,user:config.apiKeyPushoverUser, message:string_notification}})
          console.log("Send notification")
        }
      }
    } else
        console.log(symbol+": "+(spreadMax-1-takerI-takerJ)*100 + " % ")
      }


  // console.log("Prix d'achat : "+oB.books[imax].asks[0][0]+" Volume : "+oB.books[imax].asks[0][1])
  // console.log("Prix de vente : "+oB.books[imax].bids[0][0]+" Volume : "+oB.books[imax].bids[0][1])
  // console.log("Prix d'achat : "+oB.books[jmax].asks[0][0]+" Volume : "+oB.books[jmax].asks[0][1])
  // console.log("Prix de vente : "+oB.books[jmax].bids[0][0]+" Volume : "+oB.books[jmax].bids[0][1])
  //console.log(c)

}




































        // let kraken    = new ccxt.kraken ()
        // let poloniex    = new ccxt.poloniex ()
        // let binance    = new ccxt.binance ()
        //
        // var symbol = 'ETC/ETH'
        //
        // var obBinance = await binance.fetchOrderBook (symbol)
        // console.log("Prix d'achat : "+obBinance.asks[0][0]+" Volume : "+obBinance.asks[0][1])
        // console.log("Prix de vente : "+obBinance.bids[0][0]+" Volume : "+obBinance.bids[0][1])
        //
        // var orderBookKraken = await kraken.fetchOrderBook (symbol)
        // console.log("Prix d'achat : "+orderBookKraken.asks[0][0]+" Volume : "+orderBookKraken.asks[0][1])
        // console.log("Prix de vente : "+orderBookKraken.bids[0][0]+" Volume : "+orderBookKraken.bids[0][1])
        //
        // var orderBookPoloniex = await poloniex.fetchOrderBook (symbol)
        // console.log("Prix d'achat : "+orderBookPoloniex.asks[0][0]+" Volume : "+orderBookPoloniex.asks[0][1])
        // console.log("Prix de vente : "+orderBookPoloniex.bids[0][0]+" Volume : "+orderBookPoloniex.bids[0][1])
        //
        // var spread1 = orderBookPoloniex.bids[0][0] / orderBookKraken.asks[0][0]
        // var spread2 = orderBookKraken.bids[0][0] / orderBookKraken.asks[0][0]
        //
        //
        // var vol1 = Math.min(orderBookPoloniex.bids[0][0], orderBookKraken.asks[0][0] )
        // var vol2 = Math.min(orderBookKraken.bids[0][0] , orderBookKraken.asks[0][0] )
        //
        // console.log("Spread1  : "+spread1+" Volume : "+vol1)
        // console.log("Spread2  : "+spread2+" Volume : "+vol2)

    //    console.log(orderBookKraken.bids[0])

          //console.log (kraken.id,    await kraken.fetchOrderBook ('BTC/USD'))
    //console.log (kraken.id,  await kraken.fetchTicker ('BTC/USD'))
    //console.log (bitfinex.id,  await bitfinex.fetchTicker ('BTC/USD'))




        // for(var i = 0 ; i < arbitrableSymbols.length ; i++) {
        //   var symbols = {}
        //   for(var i = 0 ; i < arbitrableSymbols.length ; i++) {
        //   }
        //   var symbols[i].orderbooks = [] ;
        //   var symbols[i].askbid = [] ;
        //   //var
        //   let row = { symbol }
        //   //console.log(arbitrableSymbols[2])
        //
        //   for (let id of ids){
        //     if (exchanges[id].symbols.indexOf (symbol) >= 0) {
        //       symbols[i].orderbooks[id] = await exchanges[id].fetchOrderBook (symbol)
        //       symbols[i].askbid[id] = [symbols[i].orderbooks[id].asks[0][0], symbols[i].orderbooks[id].bids[0][0]]
        //       row[id] = "x"
        //     }
        //   }
        // //  compareAll(orderbooks)
        //
        // }


        //
        // let table2 = arbitrableSymbols.map (symbol => {
        //     let row = { symbol }
        //     var orderbooks = [], ifound = -1 ;
        //     for(var i = 0 ; i < arbitrableSymbols.length ; i++) {
        //       if(arbitrableSymbols[i] == symbol) ifound = i
        //     }
        //     for (let id of ids)
        //         if (exchanges[id].symbols.indexOf (symbol) >= 0) {
        //           //  orderbooks[id] = await exchanges[id].fetchOrderBook (symbol)
        //
        //             row[id] = arbitrableSymbols[ifound].askbid[id]
        //           }
        //     return row
        // })
        // log (asTable.configure ({ delimiter: ' | ' }) (table2))
