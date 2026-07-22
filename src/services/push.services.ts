import webpush from "web-push";
import { CONSTANTS } from "../config/constant";
import { HttpException } from "../exceptions/http-exception";
import { PushSubscriptionModel } from "../models/push-subscription.model";

let vapidConfigured = false;

const ensureVapidConfigured = () => {
  if (!CONSTANTS.VAPID_PUBLIC_KEY || !CONSTANTS.VAPID_PRIVATE_KEY) {
    throw new HttpException(500, "Push notifications are not configured. Set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY.");
  }
  if (!vapidConfigured) {
    webpush.setVapidDetails(CONSTANTS.VAPID_SUBJECT, CONSTANTS.VAPID_PUBLIC_KEY, CONSTANTS.VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  }
};

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export const PushService = {
  getVapidPublicKey(): string {
    if (!CONSTANTS.VAPID_PUBLIC_KEY) {
      throw new HttpException(500, "Push notifications are not configured. Set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY.");
    }
    return CONSTANTS.VAPID_PUBLIC_KEY;
  },

  async subscribe(userId: string, subscription: PushSubscriptionInput) {
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      throw new HttpException(400, "A valid push subscription is required");
    }

    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { userId, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true, new: true }
    );
  },

  async unsubscribe(userId: string, endpoint: string) {
    await PushSubscriptionModel.deleteOne({ userId, endpoint });
  },

  async isSubscribed(userId: string): Promise<boolean> {
    const count = await PushSubscriptionModel.countDocuments({ userId });
    return count > 0;
  },

  // Sends to every device/browser the user has subscribed on. Subscriptions the push
  // service reports as gone (404/410) are removed so we stop retrying dead endpoints.
  async sendToUser(userId: string, payload: PushPayload) {
    ensureVapidConfigured();

    const subscriptions = await PushSubscriptionModel.find({ userId });
    if (subscriptions.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            { endpoint: subscription.endpoint, keys: subscription.keys },
            body
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await PushSubscriptionModel.deleteOne({ _id: subscription._id });
          } else {
            console.error(`Failed to send push notification to user ${userId}:`, err);
          }
        }
      })
    );
  },
};
