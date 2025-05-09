
import { supabase } from "./supabase";

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

// Initial default config with your provided credentials
const defaultConfig: TwilioConfig = {
  accountSid: "ACecc48d690cee75c2f6761a8a90317a2e",
  authToken: "69b545cd92ca4bb89d88fd2b0ddbd3e8",
  phoneNumber: "+919008773200" // Added country code to ensure proper format
};

export const getTwilioConfig = async (): Promise<TwilioConfig> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return defaultConfig;
    
    // Try to get user-specific config from Supabase
    const { data, error } = await supabase
      .from('twilio_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) {
      // If no user config exists, create one with default values
      const { error: insertError } = await supabase
        .from('twilio_configs')
        .insert([
          { 
            user_id: user.id, 
            account_sid: defaultConfig.accountSid,
            auth_token: defaultConfig.authToken,
            phone_number: defaultConfig.phoneNumber
          }
        ]);
      
      if (insertError) {
        console.error('Error creating Twilio config:', insertError);
      }
      
      return defaultConfig;
    }
    
    return {
      accountSid: data.account_sid,
      authToken: data.auth_token,
      phoneNumber: data.phone_number
    };
  } catch (error) {
    console.error('Error fetching Twilio config:', error);
    return defaultConfig;
  }
};

export const updateTwilioConfig = async (config: Partial<TwilioConfig>): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    await supabase
      .from('twilio_configs')
      .update({
        account_sid: config.accountSid,
        auth_token: config.authToken,
        phone_number: config.phoneNumber
      })
      .eq('user_id', user.id);
  } catch (error) {
    console.error('Error updating Twilio config:', error);
    throw error;
  }
};
