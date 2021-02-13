const Axios = require('axios');
const VMetrics = require('../vm');
const moment = require('moment')
const SIZE = 1000;

class BinanceMinutes {
    static async sync() {

       const _ =  await VMetrics.ready();
        let startTime = (await VMetrics.getNeededTime()).add(1, "minutes");
        let endTime = moment(startTime).add(SIZE, "minutes");
        const getdata = () => {
            console.log(startTime, "---", endTime)
            Axios.get(`https://www.binance.com/fapi/v1/continuousKlines?pair=BTCUSDT&interval=1m&contractType=PERPETUAL&startTime=${startTime.unix() * 1000}&endTime=${endTime.unix() * 1000}&limit=${SIZE}`)
                .then(async (response) => {
                    await VMetrics.importData("BTCUSDT", "PERPETUAL", response.data)
                    startTime = moment(endTime).add(1, "minutes");
                    endTime = moment(endTime).add(SIZE + 2, "minutes")
                    if (moment(startTime).isAfter(moment.now())) {
                        clearInterval(inter)
                    }
                })
        }
        getdata()
        const inter = setInterval(getdata, 1000 * 15)

    }
}

BinanceMinutes.sync()