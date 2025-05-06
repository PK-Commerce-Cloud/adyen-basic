import { z } from "zod";

// Define schema for risk data
const riskDataSchema = z.object({
  clientData: z.string(),
});

// Define schema for payment method
const paymentMethodSchema = z.object({
  type: z.string(),
  holderName: z.string(),
  encryptedCardNumber: z.string(),
  encryptedExpiryMonth: z.string(),
  encryptedExpiryYear: z.string(),
  encryptedSecurityCode: z.string(),
  brand: z.string(),
  checkoutAttemptId: z.string(),
});

// Define schema for browser info
const browserInfoSchema = z.object({
  acceptHeader: z.string(),
  colorDepth: z.number(),
  language: z.string(),
  javaEnabled: z.boolean(),
  screenHeight: z.number(),
  screenWidth: z.number(),
  userAgent: z.string(),
  timeZoneOffset: z.number(),
});

// Define schema for Adyen state data
const adyenStateDataSchema = z.object({
  riskData: riskDataSchema,
  paymentMethod: paymentMethodSchema,
  browserInfo: browserInfoSchema,
  origin: z.string(),
  clientStateDataIndicator: z.boolean(),
});

// Define schema for the complete form
export const adyenFormSchema = z.object({
  addressSelector: z.string(),
  dwfrm_billing_addressFields_firstName: z.string(),
  dwfrm_billing_addressFields_lastName: z.string(),
  dwfrm_billing_addressFields_address1: z.string(),
  dwfrm_billing_addressFields_address2: z.string().optional(),
  dwfrm_billing_addressFields_country: z.string(),
  dwfrm_billing_addressFields_states_stateCode: z.string(),
  dwfrm_billing_addressFields_city: z.string(),
  dwfrm_billing_addressFields_postalCode: z.string(),
  csrf_token: z.string(),
  localizedNewAddressTitle: z.string(),
  dwfrm_billing_contactInfoFields_phone: z.string(),
  dwfrm_billing_paymentMethod: z.string(),
  dwfrm_billing_adyenPaymentFields_adyenStateData: z.string(),
  dwfrm_billing_adyenPaymentFields_adyenPartialPaymentsOrder: z
    .string()
    .optional(),
  dwfrm_billing_creditCardFields_cardNumber: z.string(),
  dwfrm_billing_creditCardFields_cardType: z.string(),
  adyenPaymentMethod: z.string(),
  adyenIssuerName: z.string().optional(),
  dwfrm_billing_adyenPaymentFields_issuer: z.string().optional(),
  brandCode: z.string(),
  holderName: z.string(),
  dwfrm_billing_adyenPaymentFields_adyenFingerprint: z.string(),
});

// Parse function to validate the form data
export function parseAdyenForm(formData: unknown) {
  // If adyenStateData is a string, parse it into an object
  if (
    typeof formData === "object" &&
    formData !== null &&
    "dwfrm_billing_adyenPaymentFields_adyenStateData" in formData
  ) {
    const data = { ...formData } as any;

    if (
      typeof data.dwfrm_billing_adyenPaymentFields_adyenStateData === "string"
    ) {
      try {
        data.dwfrm_billing_adyenPaymentFields_adyenStateData = JSON.parse(
          data.dwfrm_billing_adyenPaymentFields_adyenStateData
        );
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    return adyenFormSchema.parse(data);
  }

  return adyenFormSchema.parse(formData);
}

// Example usage:
// const validatedData = parseAdyenForm(formDataFromRequest);

export type AdyenFormData = z.infer<typeof adyenFormSchema>;
export type AdyenStateData = z.infer<typeof adyenStateDataSchema>;
