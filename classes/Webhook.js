const fetch = require("node-fetch");

module.exports = {
  send: (task) =>
  {
    return new Promise((resolve) =>
    {
      fetch(
        "https://discordapp.com/api/webhooks/732735900479651870/deoryoHC7gizM9cjXArY6jpSwPoyV4OLdrg-FK17x6240PGqgK5vcc5qwAz-htGm4tFl",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            embeds: [
              {
                title: task.title,
                description: "Video successfully uploaded!",
                url: `https://www.youtube.com/watch?v=${task.video.id}`,
                color: 16761114,
                fields: [
                  {
                    name: "Info",
                    value: `> **Clips**: ${task.clips.length}\n> **Published At:** ${new Date(task.video.snippet.publishedAt)}`,
                  },
                ],
                footer: {
                  text: "Puffer",
                  icon_url:
                    "https://cdn.discordapp.com/attachments/566403701791653899/733075883706941490/Puffer-Logo.png",
                },
                image: {
                  url: task.video.thumbnail.items[0].maxres.url,
                },
              },
            ],
            username: "Puffer",
            avatar_url:
              "https://cdn.discordapp.com/attachments/566403701791653899/733075883706941490/Puffer-Logo.png",
          }),
          gzip: true,
        }
      ).then((res) => resolve())
    });
  },
};
