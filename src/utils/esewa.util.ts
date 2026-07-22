import crypto from "crypto";
import { CONSTANTS } from "../config/constant";

export const ESEWA_SIGNED_FIELD_NAMES = "total_amount,transaction_uuid,product_code";

export const generateEsewaSignature = (totalAmount: string, transactionUuid: string, productCode: string): string => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", CONSTANTS.ESEWA_SECRET_KEY).update(message).digest("base64");
};

export interface EsewaStatusResponse {
  product_code: string;
  transaction_uuid: string;
  total_amount: string | number;
  status: "COMPLETE" | "PENDING" | "FULL_REFUND" | "PARTIAL_REFUND" | "AMBIGUOUS" | "NOT_FOUND" | "CANCELED";
  ref_id?: string;
}

export const checkEsewaTransactionStatus = async (
  transactionUuid: string,
  totalAmount: string
): Promise<EsewaStatusResponse> => {
  const url = new URL(CONSTANTS.ESEWA_STATUS_URL);
  url.searchParams.set("product_code", CONSTANTS.ESEWA_PRODUCT_CODE);
  url.searchParams.set("total_amount", totalAmount);
  url.searchParams.set("transaction_uuid", transactionUuid);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`eSewa status check failed with HTTP ${response.status}`);
  }
  return (await response.json()) as EsewaStatusResponse;
};
