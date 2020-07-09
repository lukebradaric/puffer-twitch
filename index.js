const fetch = require('node-fetch')
const leagueUrl = 'https://api.twitch.tv/kraken/clips/top?game=League+of+Legends&period=day&trending=true&limit=3'
const tools = require('./tools')
let dbg = false; //Debug mode

//Options for requesting twitch clips (Twitch API)
const options = {
    headers: {
        'Client-ID': '7p6pv4va8j8il24mvxjoz9hug27bz7',
        Accept: 'application/vnd.twitchtv.v5+json'
    }
}

//Get top three clips to json (testing purposes)
function getTopThree(url)
{
    return fetch(url, options).then(res => res.json()).then(data => { return data })
}

//Get thumbnail of clip and grab mp4 from thumbnail
let jn = getTopThree(leagueUrl)
jn.then(result =>
{
    if (dbg) console.log(result);

    for (let x of result['clips'])
    {
        let imgLink = x.thumbnails['small']
        if (dbg) console.log('Image Link: ' + imgLink)
        let vidLink = tools.imgToVid(imgLink)
        console.log('Video Link: ' + vidLink)
    }
})