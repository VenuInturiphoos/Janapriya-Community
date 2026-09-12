import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateHouseNumbers() {
  const { data, error } = await supabase.from('houses').select('id, house_number');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${data.length} houses.`);
  
  for (const house of data) {
    if (house.house_number.match(/^[GF]-\d+$/i)) {
      const parts = house.house_number.split('-');
      const newNumber = `${parts[1]}-${parts[0].toUpperCase()}`;
      
      const { error: updateError } = await supabase
        .from('houses')
        .update({ house_number: newNumber })
        .eq('id', house.id);
        
      if (updateError) {
        console.error(`Failed to update ${house.house_number}:`, updateError);
      } else {
        console.log(`Updated ${house.house_number} -> ${newNumber}`);
      }
    }
  }
  console.log('Migration complete!');
}

migrateHouseNumbers();
