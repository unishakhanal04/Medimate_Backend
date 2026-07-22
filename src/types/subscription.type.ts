export type SubscriptionPlan = "free" | "premium";

export interface SubscriptionStatusResponse {
  plan: SubscriptionPlan;
  status: "active" | "expired" | "cancelled" | null;
  expiresAt: Date | null;
  priceNpr: number;
}

export interface InitiatePaymentResponse {
  paymentUrl: string;
  fields: Record<string, string>;
  transactionUuid: string;
}

export interface PaymentHistoryItem {
  id: string;
  transactionUuid: string;
  amount: number;
  gateway: string;
  status: string;
  esewaRefId?: string;
  createdAt: Date;
}

export interface VerifyPaymentResponse {
  status: "success" | "failed" | "pending";
  subscription: SubscriptionStatusResponse;
}
