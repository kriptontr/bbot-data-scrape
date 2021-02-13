const Axios = require("axios");
const moment = require('moment');
const  urlencode = require('urlencode')
const crypto = require('crypto');
const S_URL_V1 = "https://api.binance.com/sapi/v1"
const api_key = "5IJrAqOchPG9MV0dMGtVBnnv1jUbQyyPY6w1TeDBZ5dbsWXhOoqbF7kEhVWB7YNh"
const secret_key = "GNWeLr8I0J81L0ADMxIa2WpoJ7ahmYLnueUWmXdmFiyLrOuVw7NTO1iQGJCO0Dd3"
params = {"symbol": 'BTCUSDT',
    "startTime":1593554400000,
    "endTime": moment(1593727200000).add(1,"days").unix()*1000,
    "dataType": 'T_TRADE',
}

const axios = new Axios.create({
    headers:{'X-MBX-APIKEY':api_key}
})

const sign = function (params){
    const timestamp =  moment.now() // (moment().unix()).toString();
    params.timestamp = timestamp;
    let str = urlencode.stringify(params)
   // str = urlencode(str)
    console.log(str)
    const buf = Buffer.from(str,'utf8');

    const sig = crypto.createHmac('sha256',secret_key).update(buf).digest('hex')
    params.signature  = sig;
    return params

}

const requestDownId = function (paramsWithSig){
    let params2 = urlencode.stringify(paramsWithSig)
   return  axios.post(S_URL_V1+"/futuresHistDataId?"+ params2)
        .then(a => {
           return a.data.id
        })
        .catch(a => {
            console.log(a)}
        )
}

const downdata = function (id){
    const dparams = {downloadId:id};
    const allParams = sign(dparams)
    return axios.get(S_URL_V1+"/downloadLink?downloadId="+id+ "&timestamp=" + allParams.timestamp + "&signature=" + allParams.signature)
        .catch(a => {
            console.log(a)
        })
        .then(a => {
            console.log(a)
            axios.get(a.data.link)
                .then(l => {
                    console.log(l )
                })
                .catch(err => {
                    console.log(err)
                })
        })
}


const main = async ()=> {
    //const params1 = sign(params)
   //const id =  await requestDownId(params1)
    //241888
    //24195
     console.log(await downdata(24195))
}
main()