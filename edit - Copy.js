const fluent_ffmpeg = require('fluent-ffmpeg');
//const ffmpeg = require('ffmpeg');
const videoIntro = './intro.mp4'

let allVids
let currentVids

module.exports = {
    combineVideos: async function (vids)
    {
        allVids = vids.length
        //vids.unshift(videoIntro)
        console.log('Checking video resolutions...');

        for (let vid of vids)
        {
            console.log('.vid');
            //let val = await this.checkQuality(vid)
            fluent_ffmpeg.ffprobe(vid, (err, data) =>
            {
                console.log('Checking INSIDE resolutions');

                if (err) console.log('Conversion Error: ' + err.message)

                let vidWidth = data['streams'][0]['width']
                let vidHeight = data['streams'][0]['height']

                if (vidWidth != 1920 || vidHeight != 1080)
                {
                    console.log('Invalid resolution: ' + vidWidth + 'x' + vidHeight + '. Converting to 1080p');
                    let newVid = './clips/' + 'HDC-' + vid.substring(8, vid.length)
                    vids[vids.indexOf(vid)] = newVid
                    //this.convertVideoSize(vid)
                } else
                {
                    currentVids++
                }
            })
        }

        // for (let vid of vids)
        // {
        //     fluent_ffmpeg.ffprobe(vid, async (err, data) =>
        //     {
        //         if (err) console.log('Conversion Error: ' + err.message)

        //         let vidWidth = data['streams'][0]['width']
        //         let vidHeight = data['streams'][0]['height']

        //         if (vidWidth != 1920 || vidHeight != 1080)
        //         {
        //             console.log('Invalid resolution: ' + vidWidth + 'x' + vidHeight + '. Converting to 1080p');
        //             let newVid = await this.convertVideoSize(vid)
        //             vids[vids.indexOf(vid)] = newVid
        //         }
        //     })
        // }

        // console.log('Reached pause...');
        // while (currentVids != allVids)
        // {

        // }

        console.log('Merging videos together...');

        let mergedVideo = fluent_ffmpeg()

        for (let vid of vids)
        {
            mergedVideo = mergedVideo.addInput(vid).on('error', (err) =>
            {
                console.log(err.message)
            })
        }

        mergedVideo.mergeToFile('./videos/mergedVideo.mp4', './tmp/')
            .on('error', (err) =>
            {
                console.log('Edit Error: ' + err.message)
            })
            .on('end', () =>
            {
                console.log('Video edit finished!');
            })
    },
    checkQuality: function (vid)
    {
        fluent_ffmpeg.ffprobe(vid, (err, data) =>
        {
            console.log('Checking INSIDE resolutions');

            if (err) console.log('Conversion Error: ' + err.message)

            let vidWidth = data['streams'][0]['width']
            let vidHeight = data['streams'][0]['height']

            if (vidWidth != 1920 || vidHeight != 1080)
            {
                console.log('Invalid resolution: ' + vidWidth + 'x' + vidHeight + '. Converting to 1080p');
                return true
                //let newVid = './clips/' + 'HDC-' + vid.substring(8, vid.length)
                //vids[vids.indexOf(vid)] = newVid
                //this.convertVideoSize(vid)
            } else
            {
                return false
                //currentVids++
            }
        })
    },
    reassembleQueue: function (vids)
    {
        let queue = []

        //Handle video conversion, update queue with converted videos
        for (let vid of vids)
        {
            fluent_ffmpeg.ffprobe(vid, (err, metadata) =>
            {
                let data = metadata
                if (data['streams'][0]['width'] != 1920)
                {
                    console.log('Invalid size: ' + data['streams'][0]['width'] + 'x' + data['streams'][0]['height'] + '. Converting...');
                    let newFile = this.convertVideoSize(vid)
                    queue.push(newFile)
                } else
                {
                    queue.push(vid)
                }
            })
        }

        console.log('Combining videos!');
        this.combineVideos(queue)
    },
    //Convert video to 1920x1080 and rewrite path in queue array
    convertVideoSize: function (vid)
    {
        let index = 8 //8 because './clips/'
        let output = './clips/' + 'HDC-' + vid.substring(index, vid.length)
        //let output = vid.substring(0, 7) + 'HDC-' + vid.substring(8, vid.length)
        fluent_ffmpeg(vid)
            .output(output)
            .videoCodec('libx264')
            .size('1920x1080')
            .on('error', (err) =>
            {
                console.log('Conversion Error: ' + err.message);
            })
            .on('end', () =>
            {
                console.log('Finished converting video to HD');
                currentVids++
            })
            .run();
    }
}