'use strict';
const express = require('express');
const request = require('request');
const nodemailer = require('nodemailer');
const fs = require('fs');
const bodyParser = require('body-parser')
const app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false });


app.use(bodyParser.urlencoded({ extended: false }))
var payload;
var minute = 60000;
var interval = 0.25 * minute; // runs function every 30 min (ie 60000 * 30)
var result = [];
var formBody;

app.get('/', function(req, res) {
    res.sendfile('form.html', { root: __dirname });
});

app.post('/submit', urlencodedParser, function(req, res) {
    interval = req.body.interval;
    formBody = req.body;

    res.sendfile('form.html', { root: __dirname })
    var indeedUrl = formBody.url || 'https://www.indeed.com/resumes/rpc/preview?keys=c87a23868360bc58%3Bfc4749ed29668516%3B6f1a027115d46585%3B6c02fdf0a9fddcb1%3B7ff27a7abc1b3df4%3Bb2a80e6e9dd044f2%3B4fce8841edd7a26e%3B584d561efec52b40%3B8e9fc2c3a8bf95b6%3Bcd7fab1672c21c19%3B08c4bc754c225f93%3Bba392ddcffc5f83e%3Bac5a656d688d3c5b%3B774db7bdded25b1b%3Bd3f14e99903ae8be%3B9f6c80b656e14428%3Bdb393a51d5f4cf8c%3Ba40800a40c863038%3Bc37d60ecd6960092%3Bfa4de3e04923af74%3B1210f37092eec858%3Ba1ab97f475454ccf%3Bfb6b297122b4653b%3B40c593db02e19c1d%3Bbb71238540443b79%3B7fa5c08fe47d0e54%3Bc0e8897919c6aadb%3B40fcb07d4fbe7646%3B651285d9f31d9a8d%3B946a82adfc322887%3B4aac9bb3eb88e2b7%3B4dc68dbc90f52b33%3Bdad64f3834a96afb%3B77197c6e1de5c885%3B2560cf5af0ed99af%3Bfe650a07f0d6e73c%3B897f929ac4a1a71d%3B9a291185135b1f2b%3B0884db12f21bea74%3B27aa7d3de41f9853%3Bb842db00cf8eafd7%3B50685cb52819eac6%3B8282ff1e8e634ef2%3B0c4ceb1f82e060d7%3Bbb20f8bfd97bf097%3Bed3a5012c30fe00d%3B145e6329a3baf422%3B138b6e16e3608621%3B435592ed94bfbfe0%3B836e6411aee5b03c&q=%22pwc%22+or+%22pricewaterhousecoopers%22+or+%22deloitte%22+or+%22kpmg%22+or+%22ey%22+or+%22ernst+%26+young%22+or+%22eisneramper%22+or+%22cohnreznick%22+or+%22rsm%22+or+%22bdo%22+or+%22crowe+horwath%22+or+%22baker+tilly+virchow+krause%22+or+%22pkf%22+or+%22o%27connor+davies%22+or+%22grassi+%26+co%22+or+%22rothstein+kass%22+or+%22raich+ende+malter%22+or+%22weisermazars%22+or+%22marks+paneth%22+or+%22berdon+%22+or+%22friedman%22+or+%22marcum%22+or+%22grant+thornton%22+or+%22wiss+%26+company%22+or+%22withumsmith%2Bbrown%22+or+%22cbiz%22+or+%22blumshapiro%22+or+%22rosen+seymour+shapss+%26+martin%22+or+%22anchin%2C+block+%26+anchin%22+or+%22mitchell+%26+titus%22+or+%22baker+tilly%22+or+%22citrin+cooperman%22+or+%22margolin%2C+winer+%26+evens%22+or+%22uhy%22&tk=1bk7dmb325o91d11';
    var local = [];
    var times = 0;
    var server = [];
    var requestLoop = setInterval(function() {
            request({
                url: indeedUrl,
                method: 'GET',
                timeout: 10000,
                followRedirect: true,
                maxRedirects: 10
            }, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    server.push(body);

                    let transporter = nodemailer.createTransport({
                        host: 'smtp.mail.yahoo.com',
                        port: 465,
                        secure: true,
                        auth: {
                            user: formBody.email,
                            pass: formBody.password
                        }
                    });

                    var onlyInServer = server.filter(function(current) {
                        return local.filter(function(current_local) {
                            return current_local.value == current.value && current_local.display == current.display
                        }).length == 0
                    });

                    var onlyInLocal = local.filter(function(current) {
                        return server.filter(function(current_server) {
                            return current_server.value == current.value && current_server.display == current.display
                        }).length == 0
                    });

                    result = onlyInServer.concat(onlyInLocal);
                    local.push(result);

                    // setup email data with unicode symbols
                    var mailOptions = {
                        from: formBody.email, // sender address
                        to: formBody.email, // list of receivers
                        subject: 'Scrapes', // Subject line
                        text: result, // plain text body
                        html: JSON.stringify(result) // html body
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            return console.log(error);
                        }
                        console.log('Message %s sent: %s', info.messageId, info.response);
                        result = [];
                    });

                } else {
                    console.log('error: ' + response);
                }
            });
        },
        interval);

});


app.listen(3000, function() {
    console.log('listening on port 3000')
})