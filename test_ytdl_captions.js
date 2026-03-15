const ytdl = require('ytdl-core');

async function test(id) {
    try {
        console.log(`Fetching info for ${id}...`);
        const info = await ytdl.getInfo(id);
        const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (tracks && tracks.length > 0) {
            console.log(`Found ${tracks.length} caption tracks.`);
            console.log(`First track URL: ${tracks[0].baseUrl}`);
        } else {
            console.log('No caption tracks found via ytdl.');
        }
    } catch (e) {
        console.error(`Failed: ${e.message}`);
    }
}

const videoId = 'w-XPlC3a2oI';
test(videoId);
