const { YoutubeTranscript } = require('youtube-transcript-api');

async function test(id) {
    try {
        console.log(`Fetching transcript for ${id} using youtube-transcript-api...`);
        const transcript = await YoutubeTranscript.fetchTranscript(id); // Check if this is the right method
        console.log(`Success! Length: ${transcript.length}`);
    } catch (e) {
        console.error(`Failed: ${e.message}`);
        try {
            // Some libs call it fetch
            const { fetchTranscript } = require('youtube-transcript-api');
            const t = await fetchTranscript(id);
            console.log(`Success with fetchTranscript! Length: ${t.length}`);
        } catch (e2) {
            console.error(`Second attempt failed: ${e2.message}`);
        }
    }
}

const videoId = 'w-XPlC3a2oI';
test(videoId);
