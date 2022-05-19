require("dotenv").config()
const got = require("got")
const { URL } = require("url")

const baseurl = "https://api.groupme.com/"
const helptext = "Prayer Bot Commands:\n" +
                  "/pray - Submit something you'd like prayer for\n" +
                  "/praise - Submit something you want to praise\n" +
                  "/list - List all prayers and praises within the past week\n" +
                  "/sheet - Post link to Sabbath Dinner sheet\n" +
                  "/everyone - Mention everyone in the group (admins only)\n"

const botid = process.env.BOT_ID
const accesstoken = process.env.ACCESS_TOKEN
const groupid = process.env.GROUP_ID
const sheetid = process.env.SHEET_ID

if (!accesstoken) {
    console.log("ENV: 'ACCESS_TOKEN' is undefined")
}
if (!groupid) {
    console.log("ENV: 'GROUP_ID' is undefined")
}
if (!sheetid) {
    console.log("ENV: 'SHEET_ID' is undefined")
}

// msgId: str
// The bot uses the owner's credential to like a message with msgId
const likeMessage = async (msgId) => {
    const likePath = `/v3/messages/${groupid}/${msgId}/like?token=${accesstoken}`
    const destUrl = new URL(likePath, baseurl)
    console.log(`Liking message: ${msgId}`)
    const response = await got.post(destUrl, {
        json: {},
        responseType: "json",
    })
    if (response.statusCode !== 200) {
        console.log(`Error liking a message ${response.statusCode}`)
    }
}

const postPrayerRequestList = async () => {
    const myLikeList = await getMyLikeList()
    const prayList = filterRegexMsgList(myLikeList, prayregex)
    const praiseList = filterRegexMsgList(myLikeList, praiseregex)
    const praisepraylist = praiseList.concat(prayList)
    await filterAndPostWeeklyList(praisepraylist) // come back
}

// The bot retrieves a list of msg that the owner of the bot has liked
const getMyLikeList = async () => {
    // GET /groups/:group_id/likes/mine
    try {
        const myLikePath = `/v3/groups/${groupid}/likes/mine?token=${accesstoken}`
        const destUrl = new URL(myLikePath, baseurl)
        const response = await got(destUrl, {
            responseType: "json"
        })

        if (response.statusCode == 200) {
            const likedMessageList = response.body.response.messages
            console.log("success")
            return likedMessageList
        }
        return []

    } catch (error) {
        console.log(error)
    }
}

// Returns a list of msg that matches the regex
const filterRegexMsgList = (msgList, regex) => {
    return msgList.filter(msg => (msg.text && regex.test(msg.text)))
}

// Filter and post msg that are within the week
const filterAndPostWeeklyList = async (msgList) => {
    const event = new Date()

    // Retrieve the older date
    const pastDate = event.getDate() - 7
    event.setDate(pastDate)

    const roundedDate = event.toLocaleDateString()

    // Filter out all the msg that have timestamps greater than roundedDate
    const filteredTimePrayerList = filterTimeMsgList(msgList, Date.parse(roundedDate))
    const prayerRequestPostMsgList = composePrayerRequestList(filteredTimePrayerList)
    await postMsgList(prayerRequestPostMsgList)
}

// Returns a list of msg that have timestamps greater than cutOffTime
const filterTimeMsgList = (msgList, cutOffTime) => {
    return msgList.filter(msg =>
        (msg.liked_at && Date.parse(msg.liked_at) > cutOffTime)
    )
}

// Returns a list of posts that meets the character count requirement
const composePrayerRequestList = (msgList) => {
    let postList = []
    let post = ""

    // Displays prayer list in chronological order
    msgList = msgList.reverse()

    msgList.map((msg) => {
        const userName = msg.name
        const firstName = userName.split(" ")[0]
        let text = ""
        let type = ""

        /*
        // Split out the first char sequence "/pray " or "/praise " from the user's post
        let text = msg.text.split("/pray ")[1]
        */

        // Split out the first char sequence "/pray " or "/praise " from the user's post
        if(prayregex.test(msg.text)) {
            text = msg.text.split("/pray ")[1]
            type = "(prayer)"
        } else {
            text = msg.text.split("/praise ")[1]
            type = "(praise)"
        }

        if (text) {
            // Add the author's name to the post
            text = `${firstName} ${type} - ${text}\n\n`

            // If text meets the char requirement, append to post
            if ((text.length + post.length) < 1000) {
                post += text
            } else {
                // Add the current post to the list of posts
                postList.push(post)

                // Split the remainder of the msg into a smaller list
                let splitMsgList = splitInto1000CharList(text)

                // Cache the last element
                const lastElement = splitMsgList.pop()

                // Push the remainder into
                postList.push(...splitMsgList)
                post = ""
                post += lastElement
            }
        }
    })

    if (post) {
        postList.sort()
        postList.push(post)
    }

    return postList
}

// Split the msg into a list of msg under that is 999 len long
const splitInto1000CharList = (msg) => {
    const msgList = []
    let smallMsg = ""
    for (let i = 0; i < msg.length; i++) {
        if (smallMsg.length < 1000) {
            smallMsg += msg[i]
        } else {
            msgList.push(smallMsg)
            smallMsg = ""
        }
    }

    if (smallMsg) {
        msgList.push(smallMsg)
    }
    return msgList
}

// Post all the msg in msgList
const postMsgList = async (msgList) => {
    for (let i = 0; i < msgList.length; i++) {
        let msg = msgList[i]
        await createPost(msg)
    }
}

// Get members
const getMembers = async () => {
  const getpath = `/v3/groups/${groupid}?token=${accesstoken}`
  const desturl = new URL(getpath, baseurl)
  const response = await got(desturl, {
      responseType: "json"
  })

  memberdict = response.body.response.members
  let memberarr = []
  for (const key of Object.entries(memberdict)) {
    memberarr.push(key[1].user_id)
  }
  return memberarr
}

// Get admins/owners
const getAdmins = async () => {
  const getpath = `/v3/groups/${groupid}?token=${accesstoken}`
  const desturl = new URL(getpath, baseurl)
  const response = await got(desturl, {
      responseType: "json"
  })

  // Get admin details
  memberdict = response.body.response.members
  let adminarr = []
  for (const key of Object.entries(memberdict)) {
    if (key[1].roles.indexOf("admin") > -1) {
      console.log(`Found: ${key[1].roles} - ${key[1].user_id} - ${key[1].nickname}`)
      adminarr.push(key[1].user_id)
    }
  }

  return adminarr
}

// Create mention post
const createMention = async (slashtext) => {
  console.log(`Creating new mention (${slashtext.length}): ${slashtext}`)
  let text = slashtext.replace("/", "@")
  const message = {
      text,
      bot_id,
      attachments: [{ loci: [], type: "mentions", user_ids: [] }]
    }

  // Get member IDs as an array and push to message variable
  members = await getMembers()
  for (let i = 0; i < members.length; i++) {
    message.attachments[0].loci.push([i, i + 1])
    message.attachments[0].user_ids.push(members[i])
  }

  // Prep message as JSON and construct packet
  const json = JSON.stringify(message)
  const groupmeAPIOptions = {
    agent: false,
    host: "api.groupme.com",
    path: "/v3/bots/post",
    port: 443,
    method: "POST",
    headers: {
      "Content-Length": json.length,
      "Content-Type": "application/json",
      "X-Access-Token": accesstoken
    }
  }

  // Send request
  const req = https.request(groupmeAPIOptions, response => {
    let data = ""
    response.on("data", chunk => (data += chunk))
    response.on("end", () =>
      console.log(`[GROUPME RESPONSE] ${response.statusCode} ${data}`)
    )
  })
  req.end(json)
}

// Tell the bot to create a post within its group
const createPost = async (message) => {
    console.log(`Creating new post (${message.length}): ${message}`)
    const postPath = "/v3/bots/post"
    const destUrl = new URL(postPath, baseurl)

    const response = await got.post(destUrl, {
        json: {
            "bot_id": botid,
            "text": String(message),
        },
    })

    const statusCode = response.statusCode
    if (statusCode !== 201) {
        console.log(`Error creating a post ${statusCode}`)
    }
}


// Returns all your bots and their info
const getBots = async () => {
    const groupPath = `/v3/bots?token=${accesstoken}`
    const destUrl = new URL(groupPath, baseurl)
    const response = await got(destUrl, {
        responseType: "json"
    })
    console.log(response.body.response)
}

const helpregex = /^(\s)*\/help/
const prayregex = /^(\s)*\/pray/
const praiseregex = /^(\s)*\/praise/
const genlistregex = /^(\s)*\/list/
const coolregex = /^(\s)*\/cool/
const sheetregex = /^(\s)*\/sheet/
const everyoneregex = /^(\s)*\/everyone/

exports.praiseregex = praiseregex
exports.prayregex = prayregex
exports.coolregex = coolregex
exports.genlistregex = genlistregex
exports.getBots = getBots
exports.createPost = createPost
exports.likeMessage = likeMessage
exports.getMyLikeList = getMyLikeList
exports.filterMsgList = filterRegexMsgList
exports.postPrayerRequestList = postPrayerRequestList
exports.filterAndPostWeeklyList = filterAndPostWeeklyList
exports.composePrayerRequestList = composePrayerRequestList
exports.sheetregex = sheetregex
exports.sheetid = sheetid
exports.everyoneregex = everyoneregex
exports.createMention = createMention
exports.getAdmins = getAdmins
exports.helpregex = helpregex
exports.helptext = helptext
