const defaultIfLimitNull = 40 //If limit is null (10 min video) grab 40 clips

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