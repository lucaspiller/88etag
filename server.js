var express = require('express');

var app = express.createServer();
app.listen(8000);
app.use(express.static(__dirname + '/public'));
