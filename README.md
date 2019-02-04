# Pocket-Bot 

[![Greenkeeper badge](https://badges.greenkeeper.io/Tketa/pocket-bot.svg)](https://greenkeeper.io/)

Save articles on Facebook to [Pocket](http://getpocket.com) by sending them to a Messenger Chatbot.

## Motivation

Read [this article](https://medium.com/@jgot/how-i-hacked-around-facebook-to-save-articles-to-a-third-party-app-116e970b287d)

-------------------

To deploy your own bot, follow thoses steps:

## Heroku

Get an account on [Heroku](http://herokuapp.com/), and create a NodeJS application. Download the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) as well.


Also add the "mLab MongoDB" plugin to have a free Mongo database that we will use to store the users.

Fork this repository and link it to your Heroku app. From the command line type:

```
heroku git:remote -a my-app
```

## Pocket API Key

Go to http://getpocket.com/developers, and request an API key (you only need `WRITE` access currently but can request `READ` access to provide further functionalities through the bot in the future)

## Facebook Token for the Bot

Follow the procedure [here](https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/) to create a Facebook page and associate a bot to it.
Then get the token, the secret, and come up with a verify phrase.

## Heroku Environment Variables

Go to your [Heroku Dashboard](https://dashboard.heroku.com/apps/) and go to your apps Settings to set the environment variables:

```
POCKET_BOT_FACEBOOK_TOKEN='XX'
POCKET_BOT_FACEBOOK_SECRET='XX'
POCKET_BOT_FACEBOOK_VERIFY='XX'
POCKET_CONSUMER_KEY='XX'
HOSTNAME='XX'
```

## Deploy

```
git push heroku master
```

# Development

### Copy the environment variable file

```
cp .env.dist .env
```

Update in your `.env` the variables that you got from Pocket, Facebook, MongoLabs and Heroku.


```
npm install
```

```
node index.js
```
