import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { Webhook } from 'svix';

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
    const { id } = evt.data;
    
    try {
      const client = await clerkClient();
      console.log("Setting role to student for user:", id);
      
      await client.users.updateUser(id, {
        publicMetadata: { role: "student" },
      });
      
      console.log("Role set successfully");
    } catch (error) {
      console.error("Error setting role:", error);
      return NextResponse.json({ error: "Error setting role" }, { status: 500 });
    }
  }
  
  return NextResponse.json({ success: true });
} 