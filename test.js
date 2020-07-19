let thumb = require('./classes/Thumbnail')

function run()
{
  let obj = {
    game: {
      name: 'worldOfWarcraft',
      thumbName: 'wow',
      uploads: {
        daily: 3,
        weekly: 1
      }
    },
    period: 'daily',
    name: 'name'
  }

  thumb.build(obj)
  // let newThumb = thumb.build(obj)
  // console.log(newThumb);
}

run()