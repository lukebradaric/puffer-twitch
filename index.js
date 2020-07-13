const fetch = require('node-fetch') //url requests?
const download = require('download-file') //download file from url
const readline = require('readline')
const tools = require('./tools'); //custom tools (conversion & link building)
const edit = require('./edit'); //edit class
const upload = require('./upload');
const { type } = require('os');
const { create } = require('domain');

let dbg = false //Debug mode

let queue = [] //Queue of videos to download
let downloaded = [] //List of downloaded files

const maxVideoLength = 600; //10 minutes
let useMaxVideoLength = true //Should the video assembler care about max video length

let gameCategory = null //Type of next vid, League of Legends, Overwatch, etc
let finalVideoName = '' //Final name of the video created

// let videoData = {
//     videoPath: '',
//     videoTitle: '',
//     videoDescription: '',
//     broadcasterList: '',
// }

//Options for requesting twitch clips (Twitch API)
const options = {
    headers: {
        'Client-ID': '7p6pv4va8j8il24mvxjoz9hug27bz7',
        Accept: 'application/vnd.twitchtv.v5+json'
    }
}

//Download options for download-file
const downloadOptions = {
    directory: './clips/',
    filename: 'UNNAMED.mp4'
}

//Get top clips from a url
function getTopClips(url)
{
    //Fetch top clips from generated url
    return fetch(url, options).then(res => res.json()).then(data => { return data })
}

//Create a video from game or channel (LIMIT to null for unlimited (or maxVidLength))
function createVideo(type, name, period, limit)
{
    //Limit converted to string for logging
    let logLimit;
    //Check if time limit or clip limit
    if (limit == null)
    {
        logLimit = maxVideoLength.toString() + ' seconds'
    } else
    {
        logLimit = limit.toString() + ' clips'
    }

    //Create video name EX (World of Warcraft-week-600 seconds.mp4)
    finalVideoName = name + '-' + period + '-' + logLimit + '.mp4'

    //Change type to lowercase
    type = type.toLowerCase()

    //Log video creation
    console.log('Creating a ' + type + ' video from ' + name + '. Period: ' + period + '. Limit: ' + logLimit);

    //Set video upload details
    upload.setVideoTitle(tools.buildVideoTitle(name, period))
    //Set video tags
    upload.setVideoTags(name)

    //Generate top clips link
    let topClipsLink;
    if (type == 'game')
    {
        topClipsLink = tools.buildGameClipLink(name, period, limit)
        //If video type is game, set game category
        gameCategory = name
    } else if (type == 'channel')
    {
        topClipsLink = tools.buildChannelClipLink(name, period, limit)
    }

    //Download clips from generated link
    downloadClips(topClipsLink)
}

//Creates a queue of clips and DOWNLOADS THEM AUTOMATICALLY
function downloadClips(topClipsLink)
{
    let videoLength = 0;
    //Fetch json file from twitch api
    let jn = getTopClips(topClipsLink)
    //Create a queue of mp4 files from clips data
    jn.then(result =>
    {
        //Log the result of the html fetch
        if (dbg) console.log(result['clips'][0]['broadcaster'])

        //Create a new broadcast list to create video description with
        let broadcasterList = []

        //For each clip, create an mp4 link and add it to queue
        for (let x of result['clips'])
        {
            //Check if video length is less than max (keep adding clips until the video is 10 minutes long)
            if (videoLength < maxVideoLength && useMaxVideoLength)
            {
                videoLength += x['duration'];
            } else if (useMaxVideoLength)
            {
                console.log('Downloading queue, video duration: ' + videoLength)
                break
            }

            //Add broadcaster to list if not already in list
            if (!broadcasterList.includes(x['broadcaster']['display_name']))
            {
                broadcasterList.push(x['broadcaster']['display_name'])
            }

            //If debugging, print image link
            if (dbg) console.log('Image Link: ' + imgLink)

            //Convert clip thumbnail into video link and add to queue
            let imgLink = x.thumbnails['small']
            let vidLink = tools.imgToVid(imgLink)

            //Add new video link to queue to be downloaded
            queue.push(vidLink)
        }

        //Set video upload details
        upload.setVideoDescription(tools.buildVideoDescription(broadcasterList))

        //Log the clips queue
        if (dbg) console.log(queue)

        //call downloadQueue and download all clips in queue
        if (!dbg) downloadQueue()

    })
}

//Download all files in the queue
function downloadQueue()
{
    //Count videos downloaded
    let downloadCount = 0
    //Max download count to stop at
    let maxDownloadCount = queue.length
    console.log('Downloading ' + maxDownloadCount + ' files in queue...')

    //Loop through queue and download all files
    for (let link of queue)
    {
        let videoName = tools.vidLinkToName(link) //Create name for file
        downloadOptions.filename = videoName; //Set the name of the next download
        download(link, downloadOptions, async function (err)
        {
            if (err) throw err
            console.log('Successfully downloaded ' + videoName)
            downloaded.push('./clips/' + videoName)

            //Add one to amount of files downloaded
            downloadCount++
            //Check if all files were downloaded
            if (downloadCount == maxDownloadCount)
            {
                //If finished downloading, clear queue and stich files
                queue = []
                console.log('All files downloaded. Ready to be merged...');
                //Combine all videos together
                edit.combine(downloaded, gameCategory, finalVideoName)
            }
        })
    }
}

//Read console to create a video from user input
function readConsole()
{
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    let typeInput
    let gameInput
    let durationInput
    let limitInput

    //Read in type, game, duration, and limit
    rl.question('(game|channel) Please enter type:   ', (answer) =>
    {
        typeInput = answer
        rl.question('(Case Sensitive) Please enter game or channel name:   ', (answer) =>
        {
            gameInput = answer
            rl.question('(day|week|month) Please enter duration:   ', (answer) =>
            {
                durationInput = answer
                rl.question('Please enter clip limit or null for a ' + maxVideoLength + ' second video:   ', (answer) =>
                {
                    if (answer == 'null')
                    {
                        limitInput = null
                    } else
                    {
                        limitInput = parseInt(answer)
                    }
                    rl.close()
                })
            })
        })
    })

    //Generate video based on user input
    rl.on('close', () =>
    {
        createVideo(typeInput, gameInput, durationInput, limitInput)
    })

}

//Function that starts everything and takes in basic input
//createVideo('game', 'Overwatch', 'day', 2)
readConsole()