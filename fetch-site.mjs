async function fetchSite() {
    try {
        const res = await fetch("https://www.youtube-transcript.io/");
        const html = await res.text();
        console.log("HTML length:", html.length);
        // Look for apiKey
        const match = html.match(/apiKey\s*:\s*"([^"]+)"/);
        if (match) console.log("API Key:", match[1]);
        else console.log("API Key not found");
    } catch (e) {
        console.error("Error:", e.message);
    }
}
fetchSite();
