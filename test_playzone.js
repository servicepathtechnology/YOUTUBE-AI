const { YoutubeTranscript } = require('@playzone/youtube-transcript');

async function test(id) {
    try {
        console.log(`Fetching transcript for ${id} using @playzone...`);
        const transcript = await YoutubeTranscript.fetchTranscript(id);
        console.log(`Success! Length: ${transcript.length}`);
    } catch (e) {
        console.error(`Failed: ${e.message}`);
    }
}

const videoId = 'w-XPlC3a2oI';
test(videoId);
