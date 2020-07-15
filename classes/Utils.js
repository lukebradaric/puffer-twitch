const fs = require('fs')

const logger = require("./Logger")("UTILS");

const baseTwitchLink = "https://api.twitch.tv/kraken/clips/top?";

const useTrending = "&trending=false"; // should clips requested using trending tag
const defaultLanguage = "&language=en&"; // default language for clips requested

const defaultClipLimit = 80; // If no limit specified, grab only up to 80 clips

const config = require('../data/config.json')

module.exports = {
  // Builds a link used to request clips from twitch , used task (json)
  buildLink: function (task)
  {

    // Create twitch link
    let twitchLink = baseTwitchLink
    let trending = useTrending
    let language = defaultLanguage

    let name = "game=" + task.game.twitchName + "&"
    let period = "period=" + task.period
    let limit = task.limit
    limit == null // learn
      ? (limit = `limit=${defaultClipLimit}`)
      : (limit = `limit=${task.limit}`);

    return twitchLink + name + period + trending + language + limit;
  },
  // Builds a video description from a task
  buildTitle: function (task)
  {
    //Update upload count of video by object and period
    config.games[config.games.indexOf(task.game)].uploads[task.period] += 1
    fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2), (err, data) =>
    {
      if (err) logger.error(err)
    })

    //Convert period and videoNumber to string version
    let period = task.period
    let videoNumber = task.game.uploads[task.period]
    switch (task.period)
    {
      case 'day':
        period = 'Daily'
        break
      case 'week':
        period = 'Weekly'
        break
      case 'month':
        period = 'Monthly'
        break
      case 'all':
        period = 'All Time'
        break
    }

    return task.game.twitchName + ' - ' + period + ' Highlights ' + '#' + videoNumber
  },
  // Builds a video description from a task
  buildDescription: function (task)
  {
    let desc = 'Streamers featured in this video:\n'

    let addedBroadcasters = []

    // Add each broadcaster from each clip to broadcaster description
    for (clip of task.clips)
    {
      // Make sure each broadcaster is only added once
      if (!addedBroadcasters.includes(clip.broadcaster))
      {
        desc += `https://twitch.tv/${clip.broadcaster}\n`
      }
      addedBroadcasters.push(clip.broadcaster)
    }

    return desc
  },
  // Creates an mp4 link from an image link
  imgToVideo: function (imgLink)
  {
    let index = imgLink.indexOf('-preview')

    return imgLink.substring(0, index) + '.mp4'
  },
  // Sets if twitch will use trending to get clips
  setUseTrending: function (bool)
  {
    useTrending = bool;
  },
  // Sets the default language for twitch to get links
  setDefaultLanguage: function (language)
  {
    defaultLanguage = language;
  },
};
