//Avoid EventEmitter memory leak
process.setMaxListeners(0);

const inquirer = require("inquirer");

const Utils = require("./classes/Utils");
const Download = require("./classes/Download");
const Edit = require("./classes/Edit");
const Upload = require("./classes/Upload");
const Webhook = require("./classes/Webhook");

const config = require("./data/config.json");

class Puffer
{
  constructor(task)
  {
    // Create task variable
    this.task = task;
    this.logger = require("./classes/Logger")("PUFFER");
    // Validated task schema (makes sure task has all proper variables))
    this.validate()
      .then(() =>
      {
        this.run();
      })
      .catch((err) =>
      {
        this.logger.error(err);
      });
  }

  validate()
  {
    return new Promise((resolve, reject) =>
    {
      if (
        this.task && // If has task
        this.task.type && // If has task type
        config.taskSchema.types.find(
          (t) => t.toLowerCase() == this.task.type.toLowerCase()
        ) && //If task type is valid (from pre-defined list)
        this.task.period &&
        config.taskSchema.period.find(
          (p) => p.toLowerCase() == this.task.period.toLowerCase()
        ) && //If task period is valid
        (this.task.limit || this.task.limit == null) //If has limit or limit is null
      )
      {
        if (this.task.type === "game")
        {
          // If task type is game
          let game = config.games.find(
            (g) => g.name == this.task.name
          ); // If game name is valid (from pre-defined list)
          if (game)
          {
            this.task.game = game; // Attaches pre-defined game values to task
            resolve(); // Resolves back to original function
          } else
          {
            reject("Invalid game");
          }
        }
      } else
      {
        reject("Invalid task");
      }
    });
  }

  run()
  {
    let link = Utils.buildLink(this.task);
    Download.fetchClips(link)
      .then(
        (
          rawClips // Gets json file from twitch
        ) =>
        {
          Download.downloadClips(rawClips)
            .then(
              (
                filteredClips // Filters and downloads clips
              ) =>
              {
                this.task.clips = filteredClips; // Assigns clips to task
                this.task.description = Utils.buildDescription(this.task); // Video description based on filtered clips
                Edit.merge(this.task)
                  .then(() =>
                  {
                    Download.delete(this.task); // deletes downloaded clips
                    this.task.title = Utils.buildTitle(this.task); // Update video title
                    Upload.upload(this.task) // Uploads video
                      .then((video) =>
                      {
                        this.task.video = video;
                        Upload.thumbnail(this.task) // Update video thumbnail
                          .then((thumbnail) =>
                          {
                            this.task.video.thumbnail = thumbnail;
                            Webhook.send(this.task).then(() =>
                            {
                              process.exit();
                            });
                          })
                          .catch((err) =>
                          {
                            this.logger.error(
                              `Error updating video thumbnail : ${err}`
                            );
                          });
                      })
                      .catch((err) =>
                      {
                        this.logger.error(`Error uploading video : ${err}`);
                      });
                  })
                  .catch((err) =>
                  {
                    this.logger.error(`Error merging clips : ${err}`);
                  });
              }
            )
            .catch((err) =>
            {
              this.logger.error(`Error downloading clips : ${err}`); // Logs download error
            });
        }
      )
      .catch((err) =>
      {
        this.logger.error(`Error fetching clips : ${err}`); // Logs fetch error
      });
  }
}

// Prompt user for input to create video with
function input()
{
  let type;
  let name;
  let period;
  let limit;
  inquirer
    .prompt({
      type: "list",
      name: "type",
      message: "Select type",
      choices: config.taskSchema.types,
    })
    .then((choice) =>
    {
      type = choice.type;
      let prompt = {
        type: type == "game" ? "list" : "input",
        name: "name",
        message: type == "game" ? "Select game" : "Type channel",
        choices: config.games.map((g) => g.name),
      };
      if (type.game == "game")
        prompt = { ...prompt, choices: config.games.map((g) => g.name) };
      inquirer.prompt(prompt).then((choice) =>
      {
        name = choice.name;
        inquirer
          .prompt({
            type: "list",
            name: "period",
            message: "Select type",
            choices: ["day", "week", "month", "all"],
          })
          .then((choice) =>
          {
            period = choice.period;
            inquirer
              .prompt({
                type: "input",
                name: "limit",
                message: "Input limit (null or #)",
              })
              .then((choice) =>
              {
                limit = choice.limit;
                if (limit == "null") limit = null
                if (limit == 0) limit = null
                // Initialize Task
                new Puffer({
                  type: type,
                  name: name,
                  period: period,
                  limit: limit,
                });
              });
          });
      });
    });
}

input();
