const FacebookBot = require('messenger-bot');
const PocketBot = require('./pocket-bot');
const http = require('http');
const logger = require('heroku-logger');
require('dotenv').load();

const PORT = process.env.PORT || 5000;

const POCKET_BOT_FACEBOOK_TOKEN = process.env.POCKET_BOT_FACEBOOK_TOKEN;
const POCKET_BOT_FACEBOOK_SECRET = process.env.POCKET_BOT_FACEBOOK_SECRET;
const POCKET_BOT_FACEBOOK_VERIFY = process.env.POCKET_BOT_FACEBOOK_VERIFT;
const POCKET_CONSUMER_KEY = process.env.POCKET_CONSUMER_KEY;
const POCKET_BOT_MLABS_URI = process.env.MONGODB_URI;

const facebookBot = new FacebookBot({
  token: POCKET_BOT_FACEBOOK_TOKEN,
  verify: POCKET_BOT_FACEBOOK_VERIFY,
  app_secret: POCKET_BOT_FACEBOOK_SECRET,
});
const pocketBot = new PocketBot(facebookBot, POCKET_CONSUMER_KEY, POCKET_BOT_MLABS_URI);

facebookBot.on('error', (err) => {
  logger.error(err.message);
});

facebookBot.on('message', (payload, reply) => {
  pocketBot.handleMessage(payload, reply);
});

http.createServer((request, response) => {
  if (request.url.startsWith('/callback')) {
    pocketBot.handlePocketCallback(request, response);
  } else {
    facebookBot.middleware()(request, response);
  }
}).listen(PORT);
