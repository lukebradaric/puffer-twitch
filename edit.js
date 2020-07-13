const fluent_ffmpeg = require('fluent-ffmpeg');
const upload = require('./upload');
const fs = require('fs')

//INTROS
const overwatchIntro = './intros/Overwatch.mp4'
const leagueOfLegendsIntro = './intros/LeagueOfLegends.mp4'
const worldOfWarcraftIntro = './intros/WorldOfWarcraft.mp4'
const callOfDutyModernWarfareIntro = './intros/ModernWarfare.mp4'
const fortniteIntro = './intros/Fortnite.mp4'
const valorantIntro = './intros/Valorant.mp4'
const counterStrikeGlobalOffensiveIntro = './intros/CounterStrikeGlobalOffensive.mp4'
const hyperScapeIntro = './intros/HyperScape.mp4'
const escapeFromTarkovIntro = './intros/EscapeFromTarkov.mp4'


const defaultIntro = './intros/Default.mp4' //Default intro for non custom game

const outro = './intros/Outro.mp4'

let nextIntro = defaultIntro //Intro for next video //SET A DEFAULT INTRO

let totalClips = 0 //Total number of clips to combine
let currentClipsProcessed = 0 //Current number of clips processed

let processedClips = [] //Queue of clips processed

let videoName //Name of next video being Created

module.exports = {
    //Proccessed clips to be merged/combined, requires vids array, gameCategory (ex, overwaatch, LoL, null), and video name
    combine: function (vids, gameCategory, finalVideoName)
    {
        //Set name of video from parameter
        videoName = finalVideoName
        console.log('Creating video: ' + videoName);

        //If is game clip and not channel clip
        if (gameCategory != null)
        {
            //Select next intro based off of game
            nextIntro = this.gameCategoryToIntroPath(gameCategory)
            console.log('Selected game intro: ' + nextIntro.substring(8, nextIntro.length));
        } else
        {
            console.log('No game category, using default intro...');
        }

        //Set total clips to the queue passed in
        totalClips = vids.length

        console.log('Checking video resolutions...');

        //Proccess clips to check for correct resolution
        for (let vid of vids)
        {
            //Check resolution of each video
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
                    //If this is the final processed clip, merge all clips
                    if (currentClipsProcessed == totalClips)
                    {
                        this.merge(processedClips)
                    }
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
        console.log('Video resolutions all matching.');

        let mergedVideo = fluent_ffmpeg()

        let videoPath = './videos/' + videoName

        //Avoid EventEmitter memory leak
        process.setMaxListeners(0)

        //Add intro to front of video
        mergedVideo = mergedVideo.addInput(nextIntro).on('error', (err) =>
        {
            console.log(err.message)
        })

        //Add each video to be merged
        for (let vid of vids)
        {
            mergedVideo = mergedVideo.addInput(vid).on('error', (err) =>
            {
                console.log(err.message)
            })
        }

        //Add outro to end of video
        mergedVideo = mergedVideo.addInput(outro).on('error', (err) =>
        {
            console.log(err.message)
        })

        //If path of video output is taken, delete old
        try
        {
            if (fs.existsSync(videoPath))
            {
                fs.unlinkSync(videoPath)
                console.log('Path is taken. Deleting previous file...');
            } else
            {
                console.log('File path is open.')
            }
        } catch (err)
        {
            console.log('Edit Path Error: ' + err.message);
        }

        console.log('Merging videos together...');
        //Merge all videos into one
        mergedVideo.mergeToFile(videoPath, './tmp/')
            .on('error', (err) =>
            {
                console.log('Edit Error: ' + err.message)
            })
            .on('end', () =>
            {
                console.log('Video edit finished! Sent to: ' + videoPath);
                upload.video(videoPath)
            })
    },
    //Find correct intro based on game category
    gameCategoryToIntroPath: function (gameCategory)
    {
        switch (gameCategory)
        {
            case 'Overwatch':
                return overwatchIntro
                break
            case 'League of Legends':
                return leagueOfLegendsIntro
                break
            case 'Call of Duty: Modern Warfare':
                return callOfDutyModernWarfareIntro
                break
            case 'Fortnite':
                return fortniteIntro
                break
            case 'World of Warcraft':
                return worldOfWarcraftIntro
                break
            case 'Valorant':
                return valorantIntro
                break
            case 'Counter-Strike: Global Offensive':
                return counterStrikeGlobalOffensiveIntro
                break
            case 'Hyper Scape':
                return hyperScapeIntro
                break
            case 'Escape From Tarkov':
                return escapeFromTarkovIntro
                break
            default:
                return defaultIntro
                break
        }
    }
}