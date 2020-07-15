let Jimp = require('jimp')

let fileName = '../data/thumbnails/hana.jpg'
let caption = 'League Highlights #23'

// PUT ALL IN MODULE EXPORT

// Build a thumbnail by printing title text onto a random background associated with the game
function build()
{
  return new Promise((result, reject) =>
  {
    // let fileName = getRandomBackground(task.game.name)
    // let caption = task.game.name + ' highlights ' + ?task.game.uploadcount?
    let loadedImage

    // Read file with jimp
    Jimp.read(fileName)
      .then((image) =>
      {
        loadedImage = image
        //Load black shadow font
        return Jimp.loadFont('../data/fonts/font.fnt')
      })
      .then((font) =>
      {
        // Write text in thick black (shadow)
        loadedImage.print(font, 0, 0, {
          text: caption,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1200, 720)
      })
      .then(() =>
      {
        // Load yellow gradient font
        return Jimp.loadFont('../data/fonts/yellow.fnt')
      })
      .then((font) =>
      {
        // Write text with yellow gradient
        loadedImage.print(font, -14, -14, {
          text: caption,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1200, 720).write('../data/thumbnails/generated.jpg')
        // Return path to new thumbnail
        resolve('../data/thumbnails/generated.jpg')
      })
      .catch((err) =>
      {
        console.log('Thumb error: ' + err.message);
        reject(err)
      })
  })
}

function getRandomBackground()
{
  //task.game.name
  let index = Math.floor(Math.random() * 10) + 1 //RANDOM BETWEEN 1 & 10
  //return task.game.name + index + .jpg
}

build()
