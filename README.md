# Sample GroupMe NodeJS Callback Bot

## Introduction

This project shows the capability of a bot to react to messages sent within a group.

## Contents

- Quickly get our sample bot up and running in your groups
- Deploy the code to heroku
- Create a bot
- Configure to your bot's credentials
- Make changes to the bot
- Pull the code down to your local machine
- Configure the local environment variables to your bot's credentials

## Requirements

- GroupMe account
- Heroku account

# Get your bot up and running<a name="deploy"></a>

## Deploy to Heroku

Be sure to log into heroku, using your heroku credentials.

Optionally, you can give your app a name, or instead leave
it blank and let Heroku name it for you (you can change it later).

## Next, create a GroupMe Bot

Go to:
https://dev.groupme.com/session/new

Use your GroupMe credentials to log into the developer site.

Once you have successfully logged in, go to https://dev.groupme.com/bots/new

Create your new bot

Fill out the form to create your new bot:

- Select the group where you want the bot to live
- Give your bot a name
- Paste in the url to your newly deply heroku app
  - `http://your-app-name-here.herokuapp.com/`
- (Optional) Give your bot an avatar by providing a url to an image
- Click submit

## Find your Bot ID:<a name="get-bot-id"></a>

Go here to view all of your bots:
https://dev.groupme.com/bots

Click on the one you just created.

Select your new bot and copy the Bot ID.

## Add your Bot ID to your Heroku app:

Go here to see all of your Heroku apps and select the one you just created before:

https://dashboard-next.heroku.com/apps

Select your heroku app and click settings in the top navigation.

On your app's setting page, find the Config Vars section and click the Reveal Config Vars button.

Fill out the form to add an environment variable to your app:

- In the "key" field type: BOT_ID
- In the "value" field paste your Bot ID that you copied in the previous steps
- Do the same for ACCESS_TOKEN (Grou me access token) and GROUP_ID (Group me group id)
- Click the save button

In the home dir of the project, create a .env file and add the contents below:

```text
BOT_ID="some_id"
ACCESS_TOKEN="some_token"
GROUP_ID="some_id"
```

## Now go test your bot

Go to GroupMe and type, "/pray", "/praise", "/list", "/cool", "/sheet", or "/help" in the group where your bot lives to see it in action.

# Make it your own<a name="pull"></a>

## Pull the code to your local machine

Within terminal, change directory to the location where you would like the files to live, then run this command:

```bash
$ heroku git:clone -a YOUR_APP_NAME_HERE
```

And then change directory into the new folder

```bash
$ cd YOUR_APP_NAME_HERE
```

## Start the server

To test your bot locally, open terminal and run the following command to start a local server.

```bash
node index.js
```

Then navigate to `http://127.0.0.1:5000/` in a browser.

You can also run the test script by running

```bash
node test.js
```

## All done! Go play around and make the bot your own
