'use strict';
const ccxt = require ('ccxt');

(async function () {
  (async () => {
      let kraken = new ccxt.kraken ()
      let markets = await kraken.load_markets ()
  //    console.log (kraken.id, markets)

      console.log (markets['ZEC/EUR'].tiers)

  }) ()
}) ();
