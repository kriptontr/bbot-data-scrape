const  Vmetrics = require('./index')
const fs = require("fs");
const path = require("path")
describe("VictoriaMetrics",function () {
    afterAll(function (){

    })
    test("starts",async (done) => {
       const obj =  await Vmetrics.ready("test");
       expect( fs.lstatSync(obj.datapath).isDirectory()).toBe(true)
        done();
    },15000)

})
