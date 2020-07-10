const fluent_ffmpeg = require('fluent-ffmpeg');
const videoIntro = './intro.mp4'

let totalClips = 0 //Total number of clips to combine
let currentClipsProcessed = 0 //Current number of clips processed

let processedClips = [] //Queue of clips processed

module.exports = {
    //Proccessed clips to be merged/combined
    combine: function (vids)
    {
        //Set total clips to the queue passed in
        totalClips = vids.length

        console.log('Checking video resolutions...');

        //Proccess clips to check for correct resolution
        for (let vid of vids)
        {
            fluent_ffmpeg.ffprobe(vid, (err, data) =>
            {
                if (err) console.log('Conversion Error: ' + err.message)

                let vidWidth = data['streams'][0]['width']
                let vidHeight = data['streams'][0]['height']

                //If resolution is incorrect, resize video
                if (vidWidth != 1920 || vidHeight != 1080)
                {
                    console.log('Invalid resolution: ' + vidWidth + 'x' + vidHeight + '. Resizing to 1080p');
                    let newVid = './clips/' + 'HDC-' + vid.substring(8, vid.length)
                    processedClips.push(newVid)
                    this.resizeVideo(vid)
                } else
                //If video is correct resolution, add to proccessed clips
                {
                    processedClips.push(vid)
                    currentClipsProcessed += 1
                }
            })
        }
    },
    //Resize video to 1920x1080 and rewrite path in queue array
    resizeVideo: function (vid)
    {
        let index = 8 //8 is index because it removes './clips/' to add 'HDC-'
        let output = './clips/' + 'HDC-' + vid.substring(index, vid.length)
        fluent_ffmpeg(vid)
            .output(output)
            .videoCodec('libx264')
            .size('1920x1080')
            .on('error', (err) =>
            {
                console.log('Resizing Error: ' + err.message);
            })
            .on('end', () =>
            {
                //Once video is resized, log and check if it was the last
                currentClipsProcessed += 1
                console.log('Finished resizing video to HD ' + currentClipsProcessed + '/' + totalClips);

                //If this is the final processed clip, merge all clips
                if (currentClipsProcessed == totalClips)
                {
                    this.merge(processedClips)
                }
            })
            .run();
    },
    //Merges clips into one large clip
    merge: function (vids)
    {
        console.log('Merging videos together...');

        let mergedVideo = fluent_ffmpeg()

        let videoPath = './videos/mergedVideo.mp4'

        //Avoid EventEmitter memory leak
        process.setMaxListeners(0)

        //Add each video to be merged
        for (let vid of vids)
        {
            mergedVideo = mergedVideo.addInput(vid).on('error', (err) =>
            {
                console.log(err.message)
            })
        }

        //Merge all videos into one
        mergedVideo.mergeToFile(videoPath, './tmp/')
            .on('error', (err) =>
            {
                console.log('Edit Error: ' + err.message)
            })
            .on('end', () =>
            {
                console.log('Video edit finished! Send to: ' + videoPath);
            })
    }
}