module.exports = {
    //Convert thumbnail link to mp4 link
    imgToVid: function (link)
    {
        let index = link.indexOf('-preview')
        let vidLink = link.substring(0, index)
        vidLink += '.mp4'
        return vidLink;
    }
}