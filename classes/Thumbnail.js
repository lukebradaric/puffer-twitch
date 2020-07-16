let Jimp = require('jimp')
let fs = require('fs')

module.exports = {
  // Build a thumbnail by printing title text onto a random background associated with the game
  build: (task) =>
  {
    return new Promise((resolve, reject) =>
    {
      let fileName
      let loadedImage
      let caption = task.game.thumbName + ' highlights #' + task.game.uploads[task.period]
      let dir = `./data/thumbnails/${task.game.name}/`
      fs.readdir(dir, (err, files) => // Get random file from game folder
      {
        if (err) console.log(err.message)

        let index = Math.floor(Math.random() * files.length)

        // Get random file from all in folder
        fileName = './data/thumbnails/' + task.game.name + '/' + files[index]

        // Read file with jimp
        Jimp.read(fileName)
          .then((image) =>
          {
            loadedImage = image
            //Load black shadow font
            return Jimp.loadFont('./data/fonts/font.fnt')
          })
          .then((font) =>
          {
            // Write text in thick black (shadow)
            loadedImage.print(font, 40, 0, {
              text: caption,
              alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
              alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            }, 1200, 720)
          })
          .then(() =>
          {
            // Load yellow gradient font
            return Jimp.loadFont('./data/fonts/yellow.fnt')
          })
          .then((font) =>
          {
            // Write text with yellow gradient
            loadedImage.print(font, 33, -14, {
              text: caption,
              alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
              alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            }, 1200, 720).write('./data/thumbnails/generated.jpg')
            // Return path to new thumbnail
          })
          .then(() =>
          {
            // Resolve image is generated
            resolve()
          })
          .catch((err) =>
          {
            console.log('Thumb error: ' + err.message);
            reject(err)
          })
      })
    })
  }
}
