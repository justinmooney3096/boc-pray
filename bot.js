const cool = require('cool-ascii-faces');
const {
  praiseRegex, //Justin
  prayRegex,
  coolRegex,
  genListRegex,
  createPost,
  likeMessage,
  postPrayerRequestList
} = require("./groupme-api");

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate a response
const respond = async (req, res) => {
  try {
    const request = req.body;
    const requestText = request.text;
    console.log(`User request: "${requestText}"`);

    // If text matches regex
    if (requestText) {
      res.writeHead(200);
      // Add a quick delay so group me sends msg to server first instead of bot
      await sleep(1500);
      if (prayRegex.test(requestText) || praiseRegex.test(requestText)) {
        const msgId = request.id;
        if (!msgId) {
          console.log("Message id is undefined");
        }
        msgId && await likeMessage(msgId);
      } 
      else if (genListRegex.test(requestText)) {
        await postPrayerRequestList();
      } else if (coolRegex.test(requestText)) {
        await createCoolFaceMessage();
      } else {
        console.log("Just chilling... doing nothing...");
      }
      res.end();
    }
    // Does not match regex
    else {
      console.log("don't care");
      res.writeHead(200);
      res.end();
    }
  } catch (error) {
    createPost("Mr. Stark I don't feel so good :(");
    console.log(error);
  }
}

const createCoolFaceMessage = async () => {
  // Get cool face
  const botResponse = cool();
  await createPost(botResponse);
}

exports.respond = respond;