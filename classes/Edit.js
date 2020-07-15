const fluent_ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')

const logger = require('./Logger')('EDIT')

module.exports = {

  merge: function (task)
  {
    return new Promise((resolve, reject) =>
    {
      logger.info('Validating clips')
      //Resize all clips before merging
      this.resizeClips(task).then((clips) =>
      {
        //Create new fluent_ffmpeg object
        let mergedVideo = fluent_ffmpeg()

        //Create video name from name,period,task
        let videoPath = `./data/videos/${task.game.name}-${task.period}-${task.limit}.mp4`

        //Merge intro to video
        mergedVideo = mergedVideo.addInput(`./data/intros/${task.game.name}.mp4`).on('error', (err) =>
        {
          if (err) reject(err)
        })

        // Merge all clips into video
        for (let clip of clips)
        {
          mergedVideo = mergedVideo.addInput(`./data/clips/${clip.name}.mp4`).on('error', (err) =>
          {
            if (err) reject(err)
          })
        }

        // Merge outro into video
        mergedVideo = mergedVideo.addInput(`./data/intros/outro.mp4`).on('error', (err) =>
        {
          if (err) reject(err)
        })

        // If output path taken, delete old
        try
        {
          //If video path taken, delete
          if (fs.existsSync(videoPath))
          {
            //Delete old path
            fs.unlinkSync(videoPath)
            logger.warn('File path is taken, rewriting')
          }
        } catch (err)
        {
          //log path error
          reject(err)
        }

        logger.info(`Merging ${clips.length} clips...`)

        // Merged all clips together and export to path
        mergedVideo.mergeToFile(videoPath, './tmp/')
          .on('error', (err) =>
          {
            reject(err)
          })
          .on('end', () =>
          {
            logger.success('Video created!')
            //log video is finished merging
            //upload video to youtube using video path
            // 
            resolve()
          })

      }).catch((err) =>
      {
        reject(err)
      })
    })
  },

  // Resize all clips to prepare for merging
  resizeClips: function (task)
  {
    return new Promise((resolve, reject) =>
    {
      let resizedPromises = []
      for (let clip of task.clips)
      {
        resizedPromises.push(new Promise((resolve) =>
        {
          //Check each clip resolution
          fluent_ffmpeg.ffprobe(`./data/clips/${clip.name}.mp4`, (err, data) =>
          {
            if (err) reject(err)

            // Store video width and height
            let vidWidth = data.streams[0].width
            let vidHeight = data.streams[0].height

            let totalResize = 0
            let resizeCounter = 0

            //If resolution does not match HD, resize video
            if (vidWidth != 1920 || vidHeight != 1080)
            {
              logger.warn(`Incorrect resolution: ${vidWidth}x${vidHeight}, resizing...`)
              totalResize++

              // Fluent_ffmpeg to resize video
              fluent_ffmpeg(`./data/clips/${clip.name}.mp4`)
                //Add HDC to new clip name (path)
                .output(`./data/clips/HDR-${clip.name}.mp4`)
                .videoCodec('libx264')
                .size('1920x1080')
                .on('error', (err) =>
                {
                  logger.error(err)
                  reject(err)
                })
                .on('end', () =>
                {
                  // Replace clip name (path) with new resized clips
                  task.clips[task.clips.indexOf(clip)].name = `HDR-${clip.name}`
                  resizeCounter++
                  logger.info(`[ ${resizeCounter}/${totalResize} ] Clips resized`)
                  resolve()
                })
                .run()
            } else
            {
              resolve()
            }
          })
        }))
      }
      // Return resized clips promise
      Promise.all(resizedPromises).then(() =>
      {
        logger.success('All clips successfully resized')
        resolve(task.clips)
      })
    })
  }

}