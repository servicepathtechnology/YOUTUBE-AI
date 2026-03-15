const { YoutubeTranscript } = require('youtube-transcript');

async function test(id) {
    try {
        console.log(`Fetching transcript for ${id}...`);
        const transcript = await YoutubeTranscript.fetchTranscript(id);
        console.log(`Success! Length: ${transcript.length}`);
        console.log(`First item:`, transcript[0]);
    } catch (e) {
        console.error(`Failed: ${e.message}`);
    }
}

const videoId = 'w-XPlC3a2oI'; // From user's screenshot
test(videoId);
