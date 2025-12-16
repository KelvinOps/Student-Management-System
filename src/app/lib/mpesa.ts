// src/app/lib/mpesa.ts
/**
 * M-PESA Daraja API Integration
 * This file handles M-PESA STK Push and payment verification
 */

import { MPESA_CONFIG } from './finance-constants';

interface MpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface StkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

interface CallbackMetadata {
  Item: Array<{
    Name: string;
    Value: string | number;
  }>;
}

interface StkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: CallbackMetadata;
}

/**
 * Get M-PESA API Base URL based on environment
 */
function getApiBaseUrl(): string {
  return MPESA_CONFIG.ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

/**
 * Format phone number to M-PESA format (254XXXXXXXXX)
 */
function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or plus signs
  let cleaned = phone.replace(/[\s\-+]/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If starts with 254, keep as is
  if (cleaned.startsWith('254')) {
    return cleaned;
  }
  
  // Otherwise, assume it's missing country code
  return '254' + cleaned;
}

/**
 * Generate M-PESA password for STK Push
 */
function generatePassword(timestamp: string): string {
  const passkey = MPESA_CONFIG.PASSKEY;
  const shortcode = MPESA_CONFIG.BUSINESS_SHORT_CODE;
  const str = shortcode + passkey + timestamp;
  return Buffer.from(str).toString('base64');
}

/**
 * Generate timestamp in format YYYYMMDDHHMMSS
 */
function generateTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Get M-PESA OAuth token
 */
export async function getMpesaAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(
      `${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`
    ).toString('base64');

    const response = await fetch(
      `${getApiBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data: MpesaAuthResponse = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting M-PESA access token:', error);
    throw new Error('Failed to authenticate with M-PESA API');
  }
}

/**
 * Initiate STK Push (Lipa Na M-PESA Online)
 */
export async function initiateStkPush(
  request: StkPushRequest
): Promise<StkPushResponse> {
  try {
    const accessToken = await getMpesaAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);
    const formattedPhone = formatPhoneNumber(request.phoneNumber);

    const payload = {
      BusinessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(request.amount), // M-PESA requires whole numbers
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.CALLBACK_URL,
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc,
    };

    const response = await fetch(
      `${getApiBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `STK Push failed: ${errorData.errorMessage || response.statusText}`
      );
    }

    const data: StkPushResponse = await response.json();
    
    // Check if the request was successful
    if (data.ResponseCode !== '0') {
      throw new Error(`STK Push failed: ${data.ResponseDescription}`);
    }

    return data;
  } catch (error) {
    console.error('Error initiating STK push:', error);
    throw error;
  }
}

/**
 * Query STK Push transaction status
 */
export async function queryStkPushStatus(
  checkoutRequestId: string
): Promise<StkQueryResponse> {
  try {
    const accessToken = await getMpesaAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    const payload = {
      BusinessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await fetch(
      `${getApiBaseUrl()}/mpesa/stkpushquery/v1/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `STK Query failed: ${errorData.errorMessage || response.statusText}`
      );
    }

    const data: StkQueryResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error querying STK push status:', error);
    throw error;
  }
}

/**
 * Process M-PESA callback
 * This function should be called from your callback endpoint
 */
export function processMpesaCallback(callbackData: {
  Body: { stkCallback: StkCallback };
}): {
  success: boolean;
  transactionId?: string;
  amount?: number;
  phoneNumber?: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  message: string;
} {
  try {
    const { stkCallback } = callbackData.Body;

    // Check if transaction was successful (ResultCode 0 means success)
    if (stkCallback.ResultCode === 0) {
      // Extract callback metadata
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      
      const amount = metadata.find((item) => item.Name === 'Amount')?.Value as number;
      const mpesaReceiptNumber = metadata.find(
        (item) => item.Name === 'MpesaReceiptNumber'
      )?.Value as string;
      const transactionDate = metadata.find(
        (item) => item.Name === 'TransactionDate'
      )?.Value as string;
      const phoneNumber = metadata.find(
        (item) => item.Name === 'PhoneNumber'
      )?.Value as string;

      return {
        success: true,
        transactionId: stkCallback.CheckoutRequestID,
        amount,
        phoneNumber: phoneNumber?.toString(),
        mpesaReceiptNumber,
        transactionDate: transactionDate?.toString(),
        message: 'Payment received successfully',
      };
    } else {
      // Transaction failed
      return {
        success: false,
        transactionId: stkCallback.CheckoutRequestID,
        message: stkCallback.ResultDesc || 'Payment failed',
      };
    }
  } catch (error) {
    console.error('Error processing M-PESA callback:', error);
    return {
      success: false,
      message: 'Error processing callback',
    };
  }
}

/**
 * Validate M-PESA transaction
 * Checks if a transaction with the given receipt number exists
 */
export async function validateMpesaTransaction(
  receiptNumber: string
): Promise<boolean> {
  // In production, you would query M-PESA API or your database
  // to verify if this transaction exists and hasn't been used before
  
  // For now, we'll do basic validation
  if (!receiptNumber || receiptNumber.length < 10) {
    return false;
  }

  // Receipt number format validation (M-PESA receipt numbers are typically alphanumeric)
  const receiptRegex = /^[A-Z0-9]{10,}$/i;
  return receiptRegex.test(receiptNumber);
}

/**
 * Generate M-PESA transaction reference
 */
export function generateMpesaReference(studentId: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `STU${studentId.slice(-4)}${timestamp}${random}`;
}

/**
 * Check if phone number is valid Kenyan M-PESA number
 */
export function isValidMpesaNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  
  // Kenyan M-PESA numbers: 254[7XX|1XX]XXXXXX
  // Safaricom: 254[7XX] (e.g., 254700000000, 254710000000, 254711000000, etc.)
  // Airtel: 254[1XX] (e.g., 254100000000, 254101000000, etc.)
  const mpesaRegex = /^254(7[0-9]{8}|1[0-9]{8})$/;
  
  return mpesaRegex.test(formatted);
}

/**
 * Format M-PESA amount (remove decimals, M-PESA only accepts whole numbers)
 */
export function formatMpesaAmount(amount: number): number {
  return Math.round(amount);
}

/**
 * Get friendly error message for M-PESA errors
 */
export function getMpesaErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    '1': 'Insufficient funds in your M-PESA account',
    '2': 'Payment cancelled by user',
    '17': 'User has cancelled the payment',
    '26': 'Invalid phone number',
    '2001': 'Invalid transaction',
    '1032': 'Request cancelled by user',
    '1037': 'Timeout. User did not complete the payment',
    '11': 'The balance is insufficient for the transaction',
    '500.001.1001': 'Unable to lock subscriber, a transaction is already in process',
  };

  return errorMessages[errorCode] || 'Payment processing failed. Please try again.';
}