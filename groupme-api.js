require("dotenv").config()
const got = require("got");
const {
    URL
} = require("url");

const baseUrl = "https://api.groupme.com/";

// The bot id associated with a group
const botID = process.env.BOT_ID;

// Access token allows the bot to make post on your behalf
const accessToken = process.env.ACCESS_TOKEN;

// The groupId is used with the accessToken for the bot to like posts on behalf of the owner
const groupId = process.env.GROUP_ID;

if (!accessToken) {
    console.log("ENV: 'ACCESS_TOKEN' is undefined");
}
if (!groupId) {
    console.log("ENV: 'GROUP_ID' is undefined");
}

// msgId: str
// The bot uses the owner's credential to like a message with msgId
const likeMessage = async (msgId) => {
    const likePath = `/v3/messages/${groupId}/${msgId}/like?token=${accessToken}`;
    const destUrl = new URL(likePath, baseUrl);
    console.log(`Liking message: ${msgId}`);
    const response = await got.post(destUrl, {
        json: {},
        responseType: "json",
    })
    if (response.statusCode !== 200) {
        console.log(`Error liking a message ${response.statusCode}`);
    }
}

const postPrayerRequestList = async () => {
    const myLikeList = await getMyLikeList()
    const prayList = filterRegexMsgList(myLikeList, prayRegex);
    const praiseList = filterRegexMsgList(myLikeList, praiseRegex);
    const praisepraylist = praiseList.concat(prayList)
    await filterAndPostWeeklyList(praisepraylist); // come back
}


// The bot retrieves a list of msg that the owner of the bot has liked
const getMyLikeList = async () => {
    // GET /groups/:group_id/likes/mine
    try {
        const myLikePath = `/v3/groups/${groupId}/likes/mine?token=${accessToken}`;
        const destUrl = new URL(myLikePath, baseUrl);
        const response = await got(destUrl, {
            responseType: "json"
        });

        if (response.statusCode == 200) {
            const likedMessageList = response.body.response.messages;
            console.log("success");
            return likedMessageList;
        }
        return [];

    } catch (error) {
        console.log(error)
    }
}

// Returns a list of msg that matches the regex
const filterRegexMsgList = (msgList, regex) => {
    return msgList.filter(msg => (msg.text && regex.test(msg.text)))
}

// // Filter and post msg that are within the week
const filterAndPostWeeklyList = async (msgList) => {

    const event = new Date();

    // Retrieve the older date
    const pastDate = event.getDate() - 7;
    event.setDate(pastDate);

    const roundedDate = event.toLocaleDateString();

    // Filter out all the msg that have timestamps greater than roundedDate
    const filteredTimePrayerList = filterTimeMsgList(msgList, Date.parse(roundedDate));
    const prayerRequestPostMsgList = composePrayerRequestList(filteredTimePrayerList);
    await postMsgList(prayerRequestPostMsgList);
}

// Returns a list of msg that have timestamps greater than cutOffTime
const filterTimeMsgList = (msgList, cutOffTime) => {
    return msgList.filter(msg =>
        (msg.liked_at && Date.parse(msg.liked_at) > cutOffTime)
    )
}

// need to add in praise logic to split on

// Returns a list of posts that meets the character count requirement
const composePrayerRequestList = (msgList) => {
    let postList = [];
    let post = "";

    // Displays prayer list in chronological order
    msgList = msgList.reverse();

    msgList.map((msg) => {
        const userName = msg.name;
        const firstName = userName.split(" ")[0];
        let text = "";
        let type = "";

        /*
        // Split out the first char sequence "/pray " or "/praise " from the user's post
        let text = msg.text.split("/pray ")[1];
        */

        // Split out the first char sequence "/pray " or "/praise " from the user's post
        if(prayRegex.test(msg.text)) {
            text = msg.text.split("/pray ")[1];
            type = "(prayer)"
        } else {
            text = msg.text.split("/praise ")[1];
            type = "(praise)"
        }

        if (text) {
            // Add the author's name to the post
            text = `${firstName} ${type} - ${text}\n\n`;

            // If text meets the char requirement, append to post
            if ((text.length + post.length) < 1000) {
                post += text;
            } else {
                // Add the current post to the list of posts
                postList.push(post);

                // Split the remainder of the msg into a smaller list
                let splitMsgList = splitInto1000CharList(text);

                // Cache the last element
                const lastElement = splitMsgList.pop();

                // Push the remainder into 
                postList.push(...splitMsgList);
                post = "";
                post += lastElement;
            }
        }
    })

    if (post) {
        postList.sort();
        postList.push(post);
    }

    return postList;
}


// Split the msg into a list of msg under that is 999 len long
const splitInto1000CharList = (msg) => {
    const msgList = []
    let smallMsg = ""
    for (let i = 0; i < msg.length; i++) {
        if (smallMsg.length < 1000) {
            smallMsg += msg[i];
        } else {
            msgList.push(smallMsg);
            smallMsg = "";
        }
    }

    if (smallMsg) {
        msgList.push(smallMsg);
    }
    return msgList;
}

// Post all the msg in msgList
const postMsgList = async (msgList) => {
    for (let i = 0; i < msgList.length; i++) {
        let msg = msgList[i]
        await createPost(msg);
    }
}


// Tell the bot to create a post within its group
const createPost = async (message) => {
    console.log(`Creating new post (${message.length}): ${message}`);
    const postPath = "/v3/bots/post";
    const destUrl = new URL(postPath, baseUrl);

    const response = await got.post(destUrl, {
        json: {
            "bot_id": botID,
            "text": String(message),
        },
    })

    const statusCode = response.statusCode;
    if (statusCode !== 201) {
        console.log(`Error creating a post ${statusCode}`);
    }
}


// Returns all your bots and their info
const getBots = async () => {
    const groupPath = `/v3/bots?token=${accessToken}`;
    const destUrl = new URL(groupPath, baseUrl);
    const response = await got(destUrl, {
        responseType: "json"
    });
    console.log(response.body.response);
}

const prayRegex = /^(\s)*\/pray/;
const praiseRegex = /^(\s)*\/praise/;
const genListRegex = /^(\s)*\/list/;
const coolRegex = /^(\s)*\/cool/;

exports.praiseRegex = praiseRegex;
exports.prayRegex = prayRegex;
exports.coolRegex = coolRegex;
exports.genListRegex = genListRegex;
exports.getBots = getBots;
exports.createPost = createPost;
exports.likeMessage = likeMessage;
exports.getMyLikeList = getMyLikeList;
exports.filterMsgList = filterRegexMsgList;
exports.postPrayerRequestList = postPrayerRequestList;
exports.filterAndPostWeeklyList = filterAndPostWeeklyList;
exports.composePrayerRequestList = composePrayerRequestList;