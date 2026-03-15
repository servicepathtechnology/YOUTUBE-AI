const yt = require('youtube-ext');

async function test(id) {
    try {
        console.log(`Fetching info for ${id} using youtube-ext...`);
        const info = await yt.getVideoInfo(id);
        console.log(`Title: ${info.title}`);
        console.log(`Description length: ${info.description?.length}`);
    } catch (e) {
        console.error(`Failed: ${e.message}`);
    }
}

const videoId = 'w-XPlC3a2oI';
test(videoId);
