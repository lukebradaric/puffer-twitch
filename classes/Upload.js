const Youtube = require('youtube-api')
const fs = require('fs')
const Lien = require('lien')
const opn = require('opn')
const prettyBytes = require('pretty-bytes')

const Utils = require('./Utils')
const Thumbnail = require('./Thumbnail')
const logger = require('./Logger')('UPLOAD')

const credentials = require('../data/credentials.json')

let server = new Lien({
  host: 'localhost',
  port: 5000
})

//Authentication for youtube application
let oauth = Youtube.authenticate({
  type: 'oauth',
  client_id: credentials.web.client_id,
  client_secret: credentials.web.client_secret,
  redirect_url: credentials.web.redirect_uris[0]
})

module.exports = {

  //Upload from task object
  upload: (task) =>
  {
    return new Promise((resolve, reject) =>
    {
      // log uploading to youtube, please login
      logger.await('Waiting for manual login...')

      opn(oauth.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.upload']
      }))

      server.addPage('/oauth2callback', lien =>
      {
        // log grabbing tokens

        oauth.getToken(lien.query.code, (err, tokens) =>
        {
          if (err) reject(err)

          // log got tokens

          oauth.setCredentials(tokens)

          lien.end(task.title + ' | is being uploaded. Check console for progress')

          var req = Youtube.videos.insert({
            resource: {
              snippet: {
                title: task.title,
                description: task.description,
                tags: task.game.tags
              },
              status: {
                privacyStatus: 'public'
              }
            },
            part: 'snippet,status',
            media: {
              body: fs.createReadStream(`./data/videos/${task.game.name}-${task.period}-${task.limit}.mp4`)
            }
          }, (err, result) =>
          {
            if (err) reject(err)

            logger.success('Video successfully uploaded')
            clearInterval(uploadData)
            resolve(result)
          })

          // Log progress on video upload
          let uploadData = setInterval(() =>
          {
            //console.log(req.req.connection)
            logger.info(`[ ${prettyBytes(req.req.connection._bytesDispatched)} / ] bytes uploaded`)
          }, 250)
        })

      })
    })
  },
  thumbnail: (task) =>
  {
    return new Promise((resolve, reject) =>
    {
      // If you want a different thumbnail for each period type
      // let period = task.period
      // period[0] = period[0].toUpperCase()
      // REPLACE LINE body: fs.createReadStream(`./data/thumbnails/${task.game.name}${period}.jpg`) //ex: overwatchDay.jpg
      let fileStream = fs.createReadStream('./data/thumbnails/generated.jpg')
      fileStream.on('open', (fd) => // Wait for file stream to open then upload thumbnail
      {
        //get thumbnail for video type
        logger.info('Updating thumbnail')
        Youtube.thumbnails.set({
          videoId: task.video.id,
          media: {
            mimeType: 'image/jpeg',
            body: fs.readFileSync('./data/thumbnails/generated.jpg')
            //Buffer.from('./data/thumbnails/generated.jpg')
            //fs.createReadStream('./data/thumbnails/generated.jpg') //ex: overwatch.jpg
          }
        },
          (err, result) =>
          {
            if (err)
            {
              logger.error('Failed to upload thumbnail')
              reject(err)
            }

            logger.success('Thumbnail successfully updated')
            logger.success(`Video Success: ${task.title}`)
            resolve(result)
          })
      })
      fileStream.on('error', (err) =>
      {
        console.log('BRUH N: ' + err.message)
      })
    })
  }
}