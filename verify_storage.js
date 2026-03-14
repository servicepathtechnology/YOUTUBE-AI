const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function checkStorage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log("Checking storage buckets...");
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error("Error listing buckets:", error.message);
    return;
  }

  console.log("Found buckets:", data.map(b => b.name).join(", "));
  
  const podcastBucket = data.find(b => b.name === 'podcasts');
  if (!podcastBucket) {
    console.warn("WARNING: 'podcasts' bucket NOT FOUND!");
  } else {
    console.log("'podcasts' bucket exists.");
    
    // Try to list files in it to check permissions (will likely be empty)
    const { data: files, error: fileError } = await supabase.storage.from('podcasts').list();
    if (fileError) {
        console.error("Error listing files (Permissions?):", fileError.message);
    } else {
        console.log("Successfully listed files in 'podcasts' bucket.");
    }
  }
}

checkStorage();
