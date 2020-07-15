// Swaps the two credential files when we have run out of daily quota

const fs = require('fs')

function swap()
{
  let file1 = 'credentials.json'
  let file2 = 'credentials-product.json'

  //Temp rename file 1
  fs.rename(file1, 'temp.json', (err) =>
  {
    if (err) console.log('Swap error: ' + err.message)

    file1 = 'temp.json'

    //Rename file 2
    fs.rename(file2, 'credentials.json', (err) =>
    {
      if (err) console.log('Swap error: ' + err.message)

      //Rename file 1
      fs.rename(file1, 'credentials-product.json', (err) =>
      {
        if (err) console.log('Swap error: ' + err.message)
      })
    })
  })

}

swap()