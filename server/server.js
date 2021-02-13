
const express = require('express');
const path = require('path');
const app = express();




app.use("/",express.static(path.join(__dirname, 'static/charts')));

app.listen(3000);
console.log('listening on port 3000');
// // if you wanted to "prefix" you may use
// // the mounting feature of Connect, for example
// // "GET /static/js/app.js" instead of "GET /js/app.js".
// // The mount-path "/static" is simply removed before
// // passing control to the express.static() middleware,
// // thus it serves the file correctly by ignoring "/static"
// app.use('/static', express.static(path.join(__dirname, 'public')));
//
// // if for some reason you want to serve files from
// // several directories, you can use express.static()
// // multiple times! Here we're passing "./public/css",
// // this will allow "GET /style.css" instead of "GET /css/style.css":
// app.use(express.static(path.join(__dirname, 'public', 'css')));