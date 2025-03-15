import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  console.log("⭐️ Webhook received");
  
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("Missing WEBHOOK_SECRET");
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  // Get the headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");
  
  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  console.log("Headers received");
  
  // Get the body
  let payload;
  try {
    payload = await req.json();
    console.log("Event type:", payload.type);
  } catch (err) {
    console.error("Error parsing JSON:", err);
    return NextResponse.json({ error: "Error parsing payload" }, { status: 400 });
  }

  const body = JSON.stringify(payload);
  
  // Verify with the Svix library
  let evt: WebhookEvent;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log("Webhook verified");
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json({ error: "Error verifying webhook" }, { status: 400 });
  }
  
  // Handle the webhook
  if (evt.type === "user.created") {
    console.log("Processing user.created event");
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    try {
      const client = await clerkClient();
      console.log("Setting role to student for user:", id);
      
      // Set the role in Clerk's publicMetadata
      await client.users.updateUser(id, {
        publicMetadata: { role: "student" },
      });
      
      console.log("Role set successfully in Clerk");
      
      // Add the user to Supabase
      const primaryEmail = email_addresses && email_addresses[0]?.email_address;
      
      // Insert the user into the Supabase users table
      const { error } = await supabase
        .from('users')
        .insert({
          id: id,
          role: 'student', // Default role for new users
          email: primaryEmail,
          username: evt.data.username || null,
          first_name: first_name || null,
          last_name: last_name || null
        });
      
      if (error) {
        console.error("Error inserting user into Supabase:", error);
        return NextResponse.json({ error: "Error inserting user into Supabase" }, { status: 500 });
      }
      
      console.log("User successfully added to Supabase");
    } catch (error) {
      console.error("Error processing user.created event:", error);
      return NextResponse.json({ error: "Error processing user.created event" }, { status: 500 });
    }
  } else if (evt.type === "user.deleted") {
    // Handle user deletion
    console.log("Processing user.deleted event");
    const { id } = evt.data;
    
    try {
      // Delete the user from Supabase
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting user from Supabase:", error);
        return NextResponse.json({ error: "Error deleting user from Supabase" }, { status: 500 });
      }
      
      console.log("User successfully deleted from Supabase");
    } catch (error) {
      console.error("Error processing user.deleted event:", error);
      return NextResponse.json({ error: "Error processing user.deleted event" }, { status: 500 });
    }
  } else if (evt.type === "user.updated") {
    // Handle user updates
    console.log("Processing user.updated event");
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
    
    try {
      const primaryEmail = email_addresses && email_addresses[0]?.email_address;
      const role = public_metadata?.role || 'student';
      
      // Update the user in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          role: role,
          email: primaryEmail,
          username: evt.data.username || null,
          first_name: first_name || null,
          last_name: last_name || null
        })
        .eq('id', id);
      
      if (error) {
        console.error("Error updating user in Supabase:", error);
        return NextResponse.json({ error: "Error updating user in Supabase" }, { status: 500 });
      }
      
      console.log("User successfully updated in Supabase");
    } catch (error) {
      console.error("Error processing user.updated event:", error);
      return NextResponse.json({ error: "Error processing user.updated event" }, { status: 500 });
    }
  }
  
  return NextResponse.json({ success: true });
} 