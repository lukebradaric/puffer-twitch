let thumb = require('./classes/Thumbnail')

function run()
{
  let obj = {
    game: {
      name: 'overwatch',
      thumbName: 'overwatch',
      uploads: {
        daily: 4
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