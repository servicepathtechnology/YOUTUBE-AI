const ytdl = require('ytdl-core');

async function test(id) {
    try {
        console.log(`Fetching info for ${id}...`);
        const info = await ytdl.getBasicInfo(id);
        console.log(`Title: ${info.videoDetails.title}`);
        console.log(`Description length: ${info.videoDetails.description.length}`);
        console.log(`Description preview: ${info.videoDetails.description.substring(0, 100)}`);
    } catch (e) {
        console.error(`Failed: ${e.message}`);
    }
}

const videoId = 'w-XPlC3a2oI';
test(videoId);
