const fetch = require("node-fetch");
const download = require("download-file");
const { uuid } = require("uuidv4");
const fs = require("fs");

const logger = require("./Logger")("DOWNLOAD");
const Utils = require("./Utils");
const { log } = require("console");

module.exports = {
  // Fetch json file from twitch using build url
  fetchClips: (url) =>
  {
    return new Promise((resolve, reject) =>
    {
      logger.info("Fetching clips");
      fetch(url, {
        headers: {
          "Client-ID": "7p6pv4va8j8il24mvxjoz9hug27bz7",
          Accept: "application/vnd.twitchtv.v5+json",
        },
        gzip: true,
      })
        .then((res) => res.json())
        .then((data) =>
        {
          if (data.error) reject(`${data.error} - ${data.message}`);
          resolve(data);
        })
        .catch((err) => reject(err));
    });
  },
  //Download rawClips and create clips array in task object
  downloadClips: (rawClips) =>
  {
    return new Promise((resolve, reject) =>
    {
      // Only download clips up to a minimum duration of 600 seconds
      let clipsDuration = 0;
      let clips = rawClips.clips
        .map(
          (
            c // Creates an array of clip objects
          ) =>
          {
            //Download max of 600 seconds worth of clips
            if (clipsDuration < 600)
            {
              clipsDuration += c.duration;
              return {
                // Create clip object to map into filtered clips array
                name: uuid(),
                link: Utils.imgToVideo(c.thumbnails.small),
                broadcaster: c.broadcaster.display_name,
              };
            }
          }
        )
        .filter((i) => i != undefined);
      if (clips.length > 0)
      {
        // Download each clip from links generated
        let downloadPromises = [];
        let downloadCounter = 0;
        logger.info(`Downloading ${clips.length} clips`);
        for (let clip of clips)
        {
          downloadPromises.push(
            new Promise((resolve) =>
            {
              download(
                clip.link,
                {
                  directory: "./data/clips",
                  filename: `${clip.name}.mp4`,
                },
                async (err) =>
                {
                  if (err) logger.err(err);
                  // Log each clip of index of downloaded
                  downloadCounter++;
                  logger.info(
                    `[ ${downloadCounter}/${clips.length} ] Clips downloaded`
                  );
                  resolve();
                }
              );
            })
          );
        }
        // Return all clips downloaded with new array
        Promise.all(downloadPromises).then(() =>
        {
          logger.success("All clips successfully downloaded");
          resolve(clips);
        });
      } // If no clips to download (wtf??)
      else
      {
        reject("No clips available for download");
      }
    });
  },
  // Delete all clips from the task (after video is created)
  delete: (task) =>
  {
    //Return promise once all clips are deleted
    return new Promise((resolve, reject) =>
    {
      logger.info("Deleting old clips...");

      let clipsToDelete = [];
      for (let clip of task.clips)
      {
        // If clip is a resize, add non resized clip to array to be deleted
        if (clip.name.substring(0, 4) == "HDR-")
        {
          clipsToDelete.push(clip.name.substring(4, clip.name.length));
        }

        // Add name to list
        clipsToDelete.push(clip.name);
      }

      //Loop through clips
      for (let clipName of clipsToDelete)
      {
        //Delete clips from clip path
        fs.unlinkSync(`./data/clips/${clipName}.mp4`),
          (err) =>
          {
            if (err)
            {
              logger.error("Failed to delete clips");
              reject(err);
            }
          };
      }

      //After all clips deleted, resolve promise
      logger.success("All clips successfully deleted");
      resolve();
    });
  },
};
