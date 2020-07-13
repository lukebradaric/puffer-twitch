const Youtube = require('youtube-api')
const fs = require('fs')
const readJson = require('r-json')
const Lien = require('lien')
const Logger = require('bug-killer')
const opn = require('opn')
const prettyBytes = require('pretty-bytes')

const overwatchTags = ['overwatch', 'overwatch highlights', 'overwatch twitch', 'twitch', 'twitch highlights', 'overwatch clips', 'genji', 'mercy', 'lucio', 'dva', 'overwatch league', 'overwatch competitive', 'overwatch guide', 'overwatch moments']
const leagueOfLegendsTags = ['league of legends', 'lol', 'league of legends twitch', 'lol twitch', 'league of legends highlights', 'lol highlights', 'league highlights', 'league twitch', 'lol clips', 'league clips', 'league ranked', 'league streamers', 'lol streamers', 'league of legends streamers', 'league of legends moments', 'lol moments']
const worldOfWarcraftTags = ['world of warcraft', 'wow', 'world of warcraft highlights', 'wow highlights', 'world of warcraft twitch', 'wow twitch', 'world of warcraft clips', 'wow clips', 'asmongold', 'esfandtv', 'sodapoppin', 'world of warcraft streamers', 'wow streamers', 'world of warcraft moments', 'wow moments']
const valorantTags = ['valorant', 'valorant highlights', 'valorant clips', 'valorant streamers', 'valorant clips', 'valorant moments', 'valorant streams', 'valorant plays', 'valorant guide', 'valorant top plays', 'valorant top clips']
const callOfDutyModernWarfareTags = ['modern warfare', 'warzone', 'warzone twitch', 'modern warfare twitch', 'warzone moments', 'modern warfare moments', 'warzone highlights', 'warzone clips', 'modern warfare clips', 'modern warfare warzone', 'warzone streamers', 'modern warfare streamers']
const counterStrikeGlobalOffensiveTags = ['csgo', 'csgo clips', 'csgo highlights', 'csgo pros', 'csgo twitch', 'csgo moments', 'counter strike', 'counter strike global offensive', 'csgo best moments', 'csgo plays', 'csgo best plays']
const fortniteTags = ['fornite', 'fortnite twitch', 'ninja', 'fortnite moments', 'fortnite clips', 'fortnite streamers', 'fornite guide', 'fortnite stream', 'fortnite highlights']
const escapeFromTarkovTags = ['tarkov', 'escape from tarkov', 'tarkov highlights', 'tarkov clips', 'escape from tarkov highlights', 'escape from tarkov clips', 'tarkov twitch', 'escape from tarkov twitch', 'tarkov twitch highlights', 'tarkov streamers', 'tarkov streams', 'shroud', 'pestily', 'tarkov guide']
const hyperScapeTags = ['hyper scape', 'hyper scape twitch', 'hyperscape', 'hyperscale twitch', 'hyperscape highlights', 'hyper scape highlights', 'hyperscape clips', 'hyper scape clips']

const defaultTags = ['twitch', 'twitch moments', 'twitch highlights', 'twitch clips', 'twitch gaming', 'twitch streamers', 'twitch lol']

//Credentials from downloaded json file
const Credentials = readJson('./credentials/credentials.json')

//Path of video being uploaded
let video = ''
//Title of video being uploaded
let videoTitle = 'default'
//Description of video being uploaded
let videoDescription = 'default desc'
//Tags for next video
let videoTags = []

//Open server on port 5000
let server = new Lien({
    host: 'localhost',
    port: 5000
})

//Authentication for youtube application
let oauth = Youtube.authenticate({
    type: 'oauth',
    client_id: Credentials.web.client_id,
    client_secret: Credentials.web.client_secret,
    redirect_url: Credentials.web.redirect_uris[0]
})

module.exports = {

    //Upload a video to youtube
    video: function (videoPath)
    {
        //Set video path
        video = videoPath

        //Log uploaded video
        console.log('Uploading ' + videoPath + ' to Youtube. Please login...')

        //Get oauth2 token using opn
        opn(oauth.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/youtube.upload']
        }))

        //Add app.get page to get oauth response and output text
        server.addPage('/oauth2callback', lien =>
        {
            //Log token grab with logger
            Logger.log('Trying to get the token using the following code: ' + lien.query.code)
            //Attempt to get token from youtube services
            oauth.getToken(lien.query.code, (err, tokens) =>
            {
                //If error log out
                if (err)
                {
                    lien.lien(err, 400)
                    return Logger.log(err)
                }

                //If no error and received tokens
                Logger.log('Got the tokens.')

                //Set credentials of oauth
                oauth.setCredentials(tokens)

                //Set text of html response page
                lien.end(videoTitle + ' | is being uploaded. Check console for progress')

                //Set details of youtube video being uploaded
                var req = Youtube.videos.insert({
                    resource: {
                        snippet: {
                            title: videoTitle,
                            description: videoDescription,
                            tags: videoTags
                        },
                        status: {
                            privacyStatus: 'unlisted'
                        }
                    },
                    part: 'snippet,status',
                    media: {
                        body: fs.createReadStream(video)
                    }
                }, (err, data) =>
                {
                    //On finish exit application
                    console.log('Finished uploading.')
                    process.exit()
                })

                setInterval(() =>
                {
                    Logger.log(`${prettyBytes(req.req.connection._bytesDispatched)} bytes uploaded.`)
                }, 250)
            })
        })

    },
    //Set title of video being created (called from index.js)
    setVideoTitle: function (videoT)
    {
        videoTitle = videoT
    },
    //Set description of video being created (called from index.js)
    setVideoDescription: function (videoDesc)
    {
        videoDescription = videoDesc
    },
    setVideoTags: function (game)
    {
        let tags = []
        switch (game)
        {
            case 'Overwatch':
                tags = overwatchTags
                break
            case 'League of Legends':
                tags = leagueOfLegendsTags
                break
            case 'World of Warcraft':
                tags = worldOfWarcraftTags
                break
            case 'Call of Duty: Modern Warfare':
                tags = callOfDutyModernWarfareTags
                break
            case 'Valorant':
                tags = valorantTags
                break
            case 'Fortnite':
                tags = fortniteTags
                break
            case 'Counter-Strike: Global Offensive':
                tags = counterStrikeGlobalOffensiveTags
                break
            case 'Hyper Scape':
                tags = hyperScapeTags
                break
            case 'Escape From Tarkov':
                tags = escapeFromTarkovTags
                break
            default:
                tags = defaultTags
                break
        }
        videoTags = tags
    }
}