const logger = require('heroku-logger');
const mongoose = require('mongoose');
const Pocket = require('pocket-api');
const PocketHelper = require('./pocket-helper');
const User = require('./models/user.js');

const GIF_TUTORIAL_URL = 'http://i.giphy.com/d3mm4KIjUneGAcdG.gif';

const ERROR_MESSAGES = [
  'You have to send me an article, otherwise I\'m lost 😵',
  'Haven\'t been introduced to the subtleties of human languages yet. \n\nHowever you can send me an article from your Facebook feed to save it to Pocket 😉.',
  'What you say sounds interesting, but I don\'t quite get it. \n\nSend me an article from your Facebook feed to save it to Pocket 😉.',
  'I\'m not here to chit-chat.\n\nSend me an article from your Facebook feed to save it to Pocket 😉.',
];

const getRandomErrorMessage = () => {
  const randomInt = Math.floor(4 * Math.random());
  return ERROR_MESSAGES[randomInt];
};

class PocketBot {

  constructor(facebookBot, pocketConsumerKey, mlabsUri) {
    this.facebookBot = facebookBot;
    this.pocketHelper = new PocketHelper(pocketConsumerKey);
    mongoose.connect(mlabsUri);
  }

  processUnknownUser(senderId) {
    this.facebookBot.getProfile(senderId, (err, profile) => {
      if (err) throw err;
      const newUser = new User({
        senderId,
        first_name: profile.first_name,
        last_name: profile.last_name,
        profile_pic: profile.profile_pic,
        locale: profile.locale,
        timezone: profile.timezone,
        gender: profile.gender,
        plainTextCount: 0,
        articleCount: 0,
      });
      newUser.save().then(() => {
        this.pocketHelper.getLoginUrl(senderId).then((url) => {
          this.facebookBot.sendMessage(senderId, { text: 'You need to log in to Pocket if you want me to help 😉' });
          this.facebookBot.sendMessage(senderId, PocketHelper.getLoginMessage(url), (replyErr) => {
            if (replyErr) logger.error(replyErr);
            this.facebookBot.sendMessage(senderId, { text: 'Don\'t worry, I will not know your Pocket password, and I do not keep track of the articles you save thanks to me.' });
          });
        }).catch(() => {
          logger.error('Error while getting the Pocket login url', { senderId });
          this.facebookBot.sendMessage(senderId, { text: 'Oops, ' });
        });
      });
    });
  }

  saveArticle(user, url) {
    const pocketParams = this.pocketHelper.getPocketPostParams(user.accessToken, url);
    user.set({
      plainTextCount: 0,
      articleCount: (user.articleCount || 0) + 1,
    });
    user.save();
    Pocket.addArticles(null, pocketParams, (err, data) => {
      if (err) {
        this.facebookBot.sendMessage(user.senderId, { text: 'There was an error adding this article to your Pocket 😥' });
        logger.error(err);
      } else {
        const text = `Thanks ${user.first_name}, saving that in your Pocket 👌`;
        this.facebookBot.sendMessage(user.senderId, { text });
        if (user.articleCount === 10) {
          const rewardText = 'You saved 10 articles through me! Happy to be of help, here is a cookie to show my love: 🍪 😘';
          this.facebookBot.sendMessage(user.senderId, { text: rewardText });
        } else if (user.articleCount % 100 === 0) {
          const rewardText = `You saved ${user.articleCount} articles through me! Wow! Thanks for your loyalty 😘`;
          this.facebookBot.sendMessage(user.senderId, { text: rewardText });
        }
      }
    });
  }

  handleMessage(payload, reply) {
    const senderId = payload.sender.id;
    User.findOne({ senderId }).then((user) => {
      if (!user) {
        this.processUnknownUser(senderId);
      } else if (!user.accessToken) {
        reply({ text: 'Log in to Pocket, otherwise I can\'t help!' });
      } else if (payload.message.attachments && payload.message.attachments[0].url) {
        const url = unescape(payload.message.attachments[0].url.split('?u=').pop());
        this.saveArticle(user, url);
      } else {
        const receivedText = payload.message.text;
        if (receivedText && (receivedText.startsWith('http://') || receivedText.startsWith('https://'))) {
          this.saveArticle(user, receivedText);
          return;
        }

        if (receivedText && receivedText.includes('logout')) {
          user.remove().then(() => {
            reply({ text: 'Successfuly logged you out of Pocket!' });
          });
          return;
        }

        if (receivedText && receivedText.toLowerCase().includes('thanks')) {
          reply({ text: 'No worries, you know I\'ll always be here for you ❤️' });
        } else if (!(receivedText && receivedText.endsWith('?'))) {
          user.set({ plainTextCount: user.plainTextCount + 1 });
          user.save();
          if (user.plainTextCount < 4) return;
          reply({ text: getRandomErrorMessage() });
        }
      }
    });
  }

  handlePocketCallback(request, response) {
    const params = request.url.split('?').pop();
    const senderId = params.split(',')[0].split('senderId=').pop();
    const requestToken = params.split(',')[1].split('requestToken=').pop();
    this.pocketHelper.getAccessToken(senderId, requestToken).then((data) => {
      const accessToken = data.access_token;
      User.findOneAndUpdate({ senderId }, { $set: { accessToken } }).then((user) => {
        this.facebookBot.sendMessage(senderId, { text: 'You are logged in now 😉 You can send me articles to add to your Pocket library!' }, (err, message) => {
          if (err) throw err;
          this.facebookBot.sendMessage(senderId, {
            attachment: {
              type: 'image',
              payload: { url: GIF_TUTORIAL_URL },
            },
          });
          logger.info('Sent login confirmation', { senderId });
        });
      }).catch((updateError) => {
        logger.error('Error while updating', updateError);
      });
    });

    response.writeHead(302, {
      Location: 'https://www.messenger.com/closeWindow/?image_url=http://clipartix.com/wp-content/uploads/2016/04/Thumbs-up-clipart-cliparts-for-you.jpg&display_text=Successful',
    });
    response.end();
  }
}

module.exports = PocketBot;
