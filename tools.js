const fs = require('fs')
const upload = require('./upload')

const defaultIfLimitNull = 40 //If limit is null (10 min video) grab 40 clips

const overwatchData = './data/overwatch.json'
const leagueOfLegendsData = './data/leagueOfLegends.json'
const worldOfWarcraftData = './data/worldOfWarcraft.json'
const valorantData = './data/valorant.json'
const callOfDutyModernWarfareData = './data/callOfDutyModernWarfare.json'
const fortniteData = './data/fortnite.json'
const defaultData = './data/default.json'

module.exports = {
    //Build a twitch URL to download from (game clips)
    buildGameClipLink: function (game, period, limit)
    {
        //game is string of game name, EX: 'League+of+Legends
        //period is clip period, EX: 'day, week, month, all'
        //limit is amount of clips to download, EX: '1,2,3,4,5,10,100'
        let twLink = 'https://api.twitch.tv/kraken/clips/top?'
        let gameLink = 'game=' + game + '&'
        let periodLink = 'period=' + period + '&trending=false&language=en&'
        if (limit == null) limit = defaultIfLimitNull
        let limitLink = 'limit=' + limit
        return twLink + gameLink + periodLink + limitLink
    },
    //Build a twitch URL to download from (channel clips)
    buildChannelClipLink: function (channel, period, limit)
    {
        //channel is string of channel name, EX: 'loltyler1'
        //period is clip period, EX: 'day, week, month, all'
        //limit is amount of clips to download, EX: '1,2,3,4,5,10,100'
        let twLink = 'https://api.twitch.tv/kraken/clips/top?'
        let channelLink = 'channel=' + channel + '&'
        let periodLink = 'period=' + period + '&trending=false&language=en&'
        if (limit == null) limit = defaultIfLimitNull
        let limitLink = 'limit=' + limit
        return twLink + channelLink + periodLink + limitLink
    },
    //Build a youtube video title from data
    buildVideoTitle: function (game, duration)
    {
        let dataPath = this.gameToJson(game)
        let rawData = fs.readFileSync(dataPath)
        let gameData = JSON.parse(rawData)
        let uploadCount = ''

        switch (duration)
        {
            case 'day':
                duration = 'Daily'
                uploadCount = 'uploadsDaily'
                break
            case 'week':
                duration = 'Weekly'
                uploadCount = 'uploadsWeekly'
                break
            case 'month':
                duration = 'Monthly'
                uploadCount = 'uploadsMonthly'
                break
            default:
                uploadCount = 'uploads'
        }

        let title
        title = game + ' - ' + duration + ' Highlights #' + gameData[uploadCount]

        let newUploadCount = parseInt(gameData[uploadCount]) + 1
        gameData[uploadCount] = newUploadCount
        let writeData = JSON.stringify(gameData)
        fs.writeFile(dataPath, writeData, () =>
        {
            console.log('Updating ' + game + ' data (.json)')
        })
        console.log('Video title: ' + title)
        return title
    },
    //Build a youtuber video description from data
    buildVideoDescription: function (broadcasterList)
    {
        let description = 'Streamers featured in this video:\n'
        //Add all streamers to description of video
        for (let b of broadcasterList)
        {
            description += b + '\n'
        }
        return description
    },
    //Returns a game json file from game name
    gameToJson: function (game)
    {
        switch (game)
        {
            case 'Overwatch':
                return overwatchData
                break
            case 'League of Legends':
                return leagueOfLegendsData
                break
            case 'World of Warcraft':
                return worldOfWarcraftData
                break
            case 'Call of Duty: Modern Warfare':
                return callOfDutyModernWarfareData
                break
            case 'Valorant':
                return valorantData
                break
            case 'Fortnite':
                return fortniteData
                break
            default:
                return defaultData
                break
        }
    },
    //Convert thumbnail link to mp4 link
    imgToVid: function (link)
    {
        let index = link.indexOf('-preview')
        let vidLink = link.substring(0, index)
        vidLink += '.mp4'
        return vidLink;
    },
    //Convert video link into a 6 digit name
    vidLinkToName: function (link)
    {
        let index = link.indexOf('.mp4')
        let name = link.substring(index - 6, link.length)
        return name;
    }
}