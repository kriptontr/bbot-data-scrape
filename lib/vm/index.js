const util = require('util');
const childProcess = require('child_process');
const axios = require('axios');
const PrometheusQuery = require('prometheus-query');
const moment = require('moment')
const ms = require('ms');
// const  proc =  spawn(process.cwd()+ "/vm/victoria-metrics-prod", [`-storageDataPath=${process.cwd() + "/vm/data"}`, `-retentionPeriod=360`] )
// proc.stderr.on("data", (data)=>{
//     console.log("wm:",data)
// })
// proc.stderr.on("error", (data)=>{
//     console.log("wm:",data)
// })
// proc.stderr.on("message", (data)=>{
//     console.log("wm:",data)
// })
// proc.stderr.on("exit", (data)=>{
//     console.log("wm:",data)
// })
// proc.stderr.on("close", (data)=>{
//     console.log("wm:",data)
// })
//
// const onexit = (onexit) => {
//     process.stdin.write("ho","utf8")
//
//     process.kill(proc.pid,"SIGHUP")
//     setInterval(()=>{
//
//     },1000)
//    // process.exit(0)
//
//
// }
// process.on('SIGINT', onexit)
// process.on('SIGTERM', onexit)
// process.on('SIGQUIT', onexit)
// setInterval(()=>{},1000)

class VMetrics {
    constructor() {

    }
    static proc = null;
    static settings = {};
    static query = {};
    static startTime = 1569888000000;
    /**
     * @param folder name of the dbfolder ./vm/data/{folder}
     * @returns {Promise<void>}
     */
    static async ready(folder = "data"){
        if(VMetrics.proc) return Promise.resolve()
        const datapath = `${process.cwd() + "/lib/vm/data/"+folder}`

        VMetrics.proc =  childProcess.execFile(process.cwd()+ "/lib/vm/victoria-metrics-prod", [`-storageDataPath=${datapath}`, `-retentionPeriod=360`, `-httpListenAddr=0.0.0.0:8423`] );

        return new Promise((resolve, reject)=>{
            VMetrics.proc.stderr.on("error", (str)=>{
              //  console.log(str)
                if(str.indexOf("starting http server at") !== -1)
                    resolve({datapath});
            })
            VMetrics.proc.stderr.on("data", (str)=>{
              //  console.log(str)
                if(str.indexOf("starting http server at") === -1)
                    return;
                    VMetrics.settings = {
                        datapath,
                        url:str.slice(str.indexOf("server at")+10,str.indexOf("server at")+10+20)
                    }
                    VMetrics.query =  new PrometheusQuery({
                        endpoint: VMetrics.settings.url,
                        baseURL: "/api/v1" // default value
                    });
                    resolve(VMetrics.settings);
            })
        })

    }
    static async getNeededTime(){
        const match = 'max_over_time(timestamp(low[7y]))';
      return   VMetrics.query.instantQuery(match)
            .then((res) => {
                if(res.result && res.result.length){
                 return moment(res.result[0].value.value*1000)
                }
                return  moment(VMetrics.startTime);
            })
            .catch(e => {

                console.error(e)
            });

    }
    /**
     * @param pair
     * @param type
     * @param data Array[Array[12]] as binance return data
     * @returns {Promise<void>}
     */
    static async importData(pair,type,data){
       const str =  toJSONL(pair,type,data);
      return  axios.post("http://localhost:8423/api/v1/import",str)

    }
    static async stop(){
        VMetrics.proc.stderr.on("exit", (data)=>{
            delete VMetrics.proc;
            return Promise.resolve();
        })
        // VMetrics.proc.stderr.on("close", (data)=>{
        //     console.log("wm:",data)
        // })
        process.kill(VMetrics.proc.pid,"SIGHUP")
    }
    static async getData(endTime, duration, limit){
         const drMs = ms(duration);
         const  remainder = (moment(endTime).unix()*1000) % drMs;
         const endT = moment(endTime).add(-1*remainder);
         const startT = moment(endT.unix()*1000).add(-1 * drMs*limit, "ms")
        //let qStr = `sum(sum(low[${duration}]))`
        let qStr = [
            {q:`min_over_time(low[${drMs}ms])`, key:"low",oStart:0,oEnd:0 },
            {q:`max_over_time(high[${drMs}ms])`,key:"high",oStart:0,oEnd:0},
            {q:`close[${drMs}ms]`,key:"close",oStart:0,oEnd:0},
            {q:`open`, key:'open',oStart:0,oEnd:0},
          //  {tradeCount:`sum_over_time(tradeCount[${duration}])`},
          //  {quoteAssetVol:`sum_over_time(quoteAssetVol[${duration}])`},
           // {takerBaseVol:`sum_over_time(takerBaseVol[${duration}])`},
           // {takerQuoteVol:`sum_over_time(takerQuoteVol[${duration}])`},
            {q:`sum_over_time(volume[${drMs}ms])`,key:"volume", oStart:0,oEnd:0},
        ]
        let result = {}

      const jobs =   qStr.map(function (q)  {
            const key =  q.key
          return   VMetrics.query.rangeQuery(q.q,(startT.unix()*1000+q.oStart + 1),(endT.unix()*1000+q.oEnd),drMs+"ms")
                .then(a => {

                   a.result[0].values.forEach(val => {
                       if(!result[val.time.getTime()])
                       {
                           result[val.time.getTime()] = {}
                       }
                       result[val.time.getTime()][key] = val.value
                   })
                })
                .catch(e=> {
                    console.log(e)
                })
        })

        Promise.all(jobs)
            .then(c => {
                let result1 = Object.keys(result).map(a => {
                    result[a]['time'] =  moment(parseInt(a)).toString()
                    return result[a]
                })
                console.log(result1)
            })


    }
}
function toJSONL(pair,type,data){
    let  jsShem = {
        open:{"metric":{"__name__":"open","pair":pair,"type":type},"values":[],"timestamps":[]},
        high:{"metric":{"__name__":"high","pair":pair,"type":type},"values":[],"timestamps":[]},
        low:{"metric":{"__name__":"low","pair":pair,"type":type},"values":[],"timestamps":[]},
        close:{"metric":{"__name__":"close","pair":pair,"type":type},"values":[],"timestamps":[]},
        volume:{"metric":{"__name__":"volume","pair":pair,"type":type},"values":[],"timestamps":[]},
        quoteAssetVol:{"metric":{"__name__":"quoteAssetVol","pair":pair,"type":type},"values":[],"timestamps":[]},
        tradeCount: {"metric":{"__name__":"tradeCount","pair":pair,"type":type},"values":[],"timestamps":[]},
        takerBaseVol:{"metric":{"__name__":"takerBaseVol","pair":pair,"type":type},"values":[],"timestamps":[]},
        takerQuoteVol:{"metric":{"__name__":"takerQuoteVol","pair":pair,"type":type},"values":[],"timestamps":[]},
    }
    const timestamps = [];
   const jsdata =  data.reduce((acc,a)=>{
        timestamps.push((a[0]+30000))
    acc.open.values.push(parseFloat(a[1]))
    acc.high.values.push(parseFloat(a[2]))
    acc.low.values.push(parseFloat(a[3]))
    acc.close.values.push(parseFloat(a[4]))
    acc.volume.values.push(parseFloat(a[5]))
    acc.quoteAssetVol.values.push(parseFloat(a[7]))
    acc.tradeCount.values.push(parseFloat(a[8]))
    acc.takerBaseVol.values.push(parseFloat(a[9]))
    acc.takerQuoteVol.values.push(parseFloat(a[10]))
       return acc;
    },jsShem)
    let jsSTR = "";
    for (prop in jsdata){
        jsdata[prop].timestamps = timestamps;
        jsSTR = jsSTR + JSON.stringify(jsdata[prop])+ "\n"
    }

    return jsSTR;

}
(async () => {
   await VMetrics.ready()
       .then(()=> {
            //VMetrics.getData(1611490020000,"1m",9)
           console.log("---")
           VMetrics.getData(1611490020000,"1h",3)
       })

})()

module.exports = VMetrics;