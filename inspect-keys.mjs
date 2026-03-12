import fs from 'fs';
const data = JSON.parse(fs.readFileSync('player-response.json', 'utf8'));
console.log("Keys in player-response.json:", Object.keys(data));
if (data.playabilityStatus) {
    console.log("Playability Status:", data.playabilityStatus.status);
}
