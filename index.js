const fetch = require('node-fetch') //url requests?
const download = require('download-file') //download file from url
const tools = require('./tools'); //custom tools (conversion & link building)
let dbg = false; //Debug mode
let queue = []; //Queue of videos to download

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

//Creates a queue of clips and DOWNLOADS THEM AUTOMATICALLY
function createQueue(topClipsLink)
{
    //Fetch json file from twitch api
    let jn = getTopClips(topClipsLink)
    //Create a queue of mp4 files from clips data
    jn.then(result =>
    {
        //Log the result of the html fetch
        if (dbg) console.log(result);

        //For each clip, create an mp4 link and add it to queue
        for (let x of result['clips'])
        {
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
        download(link, downloadOptions, function (err)
        {
            if (err) throw err
            console.log('Successfully downloaded ' + videoName + ' at ' + link)

            //Add one to amount of files downloaded
            downloadCount++
            //Check if all files were downloaded
            if (downloadCount == maxDownloadCount)
            {
                //If finished downloading, clear queue and stich files
                queue = []
                console.log('All files downloaded. Ready to be stitched...');
            }
        })
    }
}

//Build a link from tools (buildGameClipLink = top clips in a game category)
createQueue(tools.buildGameClipLink('World of Warcraft', 'day', 3))