const fetch = require('node-fetch') //url requests?
const download = require('download-file') //download file from url
const tools = require('./tools'); //custom tools (conversion & link building)
const edit = require('./edit') //edit class
let dbg = false //Debug mode
let queue = [] //Queue of videos to download
let downloaded = [] //List of downloaded files
const maxVideoLength = 600; //10 minutes
let useMaxVideoLength = true //Should the video assembler care about max video length

let gameCategory = null //Type of next vid, League of Legends, Overwatch, etc
let finalVideoName = ''

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
    return fetch(url, options).then(res => res.json()).then(data => { return data })
}

//Create a video from game or channel (LIMIT to null for unlimited (or maxVidLength))
function createVideo(type, name, period, limit)
{
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

    //Generate top clips link
    let topClipsLink;
    if (type == 'game')
    {
        topClipsLink = tools.buildGameClipLink(name, period, limit)
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
        if (dbg) console.log(result)

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
            //Convert clip thumbnail into video link and add to queue
            let imgLink = x.thumbnails['small']
            if (dbg) console.log('Image Link: ' + imgLink)
            let vidLink = tools.imgToVid(imgLink)
            queue.push(vidLink)
        }

        //call downloadQueue and download all clips in queue
        if (!dbg) downloadQueue()

        //Log the clips queue
        if (dbg) console.log(queue)
    })
}

//Download all files in the queue
function downloadQueue()
{
    //Create link of last file to know when download queue is finished
    let downloadCount = 0
    let maxDownloadCount = queue.length
    console.log('Downloading ' + maxDownloadCount + ' files in queue...')

    //Loop through queue and download all files
    for (let link of queue)
    {
        if (dbg) console.log('Downloading ' + link) //Log out file to download
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
                edit.combine(downloaded, gameCategory, finalVideoName)
            }
        })
    }
}

//Build a link from tools (buildGameClipLink = top clips in a game category)
//let clipLink = tools.buildChannelClipLink('kephrii', 'week', 3)
//let clipLink = tools.buildGameClipLink('League of Legends', 'week', null)
//downloadClips(clipLink)
createVideo('game', 'Valorant', 'week', 3)