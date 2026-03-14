const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testUpload() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const testBuffer = Buffer.from("test audio content");
  const fileName = `test-${Date.now()}.txt`;

  console.log(`Attempting to upload test file: ${fileName} to 'podcasts' bucket...`);
  
  const { data, error } = await supabase
    .storage
    .from('podcasts')
    .upload(fileName, testBuffer, {
      contentType: 'text/plain',
      upsert: true
    });

  if (error) {
    console.error("Upload FAILED!");
    console.error("Error Message:", error.message);
    console.error("Error Status:", error.status);
    console.error("Error Name:", error.name);
    
    if (error.message.includes("not found")) {
        console.log("\nSTILL NOT FOUND. Possible reasons:");
        console.log("1. The bucket name is not exactly 'podcasts' (case sensitive).");
        console.log("2. The bucket was created but is not set to 'Public' (sometimes required for discovery).");
        console.log("3. The API URL/Key doesn't match the project where you created the bucket.");
    } else if (error.message.includes("is not authorized") || error.status === 403 || error.status === 401) {
        console.log("\nBUCKET EXISTS BUT PERMISSION DENIED.");
        console.log("You must go to Supabase Dashboard -> Storage -> Policies and add an 'INSERT' policy for the 'podcasts' bucket.");
    }
  } else {
    console.log("Upload SUCCESSFUL!", data);
    // Cleanup
    await supabase.storage.from('podcasts').remove([fileName]);
    console.log("Test file cleaned up.");
  }
}

testUpload();
