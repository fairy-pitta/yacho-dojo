import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDataWithServiceKey() {
  try {
    console.log('Connecting to Supabase with service role key...');
    
    // Check all tables with service role (bypasses RLS)
    const tables = ['birds', 'bird_images', 'user_answers', 'quiz_results'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Error counting ${table}:`, error);
      } else {
        console.log(`Total records in ${table}: ${count}`);
      }
    }
    
    // Get sample records from bird_images
    const { data: samples, error: sampleError } = await supabase
      .from('bird_images')
      .select('id, bird_id, image_url, created_at')
      .limit(5);
    
    if (sampleError) {
      console.error('Error fetching bird_images sample data:', sampleError);
    } else if (samples && samples.length > 0) {
      console.log('\nSample bird_images records:');
      samples.forEach((sample, index) => {
        console.log(`${index + 1}. ID: ${sample.id}, Bird ID: ${sample.bird_id}`);
        console.log(`   URL: ${sample.image_url}`);
        console.log(`   Created: ${sample.created_at}`);
      });
    } else {
      console.log('\nNo bird_images records found even with service key.');
    }
    
    // Also check birds table for reference
    const { data: birdSamples, error: birdError } = await supabase
      .from('birds')
      .select('id, japanese_name, scientific_name')
      .limit(3);
    
    if (birdError) {
      console.error('Error fetching birds sample data:', birdError);
    } else if (birdSamples && birdSamples.length > 0) {
      console.log('\nSample birds records:');
      birdSamples.forEach((bird, index) => {
        console.log(`${index + 1}. ${bird.japanese_name} (${bird.scientific_name})`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDataWithServiceKey();