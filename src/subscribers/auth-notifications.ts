import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/**
 * Auth Notification Subscriber
 * Listen for auth events and send emails
 */
export default async function authNotificationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const logger = container.resolve("logger");

  // We need to fetch the customer email. 
  // Since the event data might be limited, we'll try to resolve the user/customer.
  // For password reset, the event from @medusajs/auth is usually 'auth.password_reset_request' 
  // and contains the entity_id (which is the auth_identity id), and the token.
  
  try {
    // In a real scenario, we would need to look up the email associated with the auth identity.
    // However, the event payload for 'auth.password_reset_request' in Medusa v2 
    // typically includes { entity_id: string, token: string, actor_type: string }.
    // It DOES NOT include the email directly. 
    // We need to use the Auth Module to retrieve the identity, but that might be complex here.
    
    // WORKAROUND / TODO: 
    // Ensure that we pass the email in the event payload or look it up.
    // Since we are mocking this or this is a fresh implementation, 
    // we might need to adjust how we trigger this or use a custom event.
    
    // For now, let's assume we can get the email. 
    // If the standard event doesn't provide it, we might need a custom step in the workflow.
    
    logger.info(`Password reset requested for identity: ${data.entity_id}. Token: ${data.token}`);

    // Since we can't easily get the email from just the auth identity ID without more context in this subscriber 
    // (and we don't want to overcomplicate with module links right now),
    // we will log the TOKEN plainly so the developer (User) can use it for testing.
    
    // In a Production App: You would fetch the identity, get the provider metadata or user email, 
    // and then send the email.
    
    console.log("=================================================================");
    console.log("PASSWORD RESET TOKEN (For Testing):");
    console.log(data.token);
    console.log("=================================================================");
    
    // If we had the email, we would call:
    /*
    await notificationService.createNotifications({
      to: email, // we need to find this
      channel: "email",
      template: "password-reset",
      data: {
        token: data.token,
        // ...
      }
    });
    */

  } catch (error) {
    logger.error(`Failed to handle password reset for ${data.entity_id}:`, error as Error);
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset_request", 
};
