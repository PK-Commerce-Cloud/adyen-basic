"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Pencil, Loader2 } from "lucide-react";
import type { CheckoutResponse, Address } from "@/types/response/checkout";
import { router } from "@inertiajs/react";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdyenCheckout, Card, type CoreConfiguration } from "@adyen/adyen-web";
import "@adyen/adyen-web/styles/adyen.css";
import {
  Address_SaveAddress,
  Adyen_GetPaymentMethods,
  CheckoutServices_SubmitPayment,
  getUrl,
} from "@/generated/routes";

// Define the Adyen form schema
const adyenFormSchema = z.object({
  addressSelector: z.string(),
  dwfrm_billing_addressFields_firstName: z
    .string()
    .min(1, "First name is required"),
  dwfrm_billing_addressFields_lastName: z
    .string()
    .min(1, "Last name is required"),
  dwfrm_billing_addressFields_address1: z
    .string()
    .min(1, "Address is required"),
  dwfrm_billing_addressFields_address2: z.string().optional(),
  dwfrm_billing_addressFields_country: z.string().min(1, "Country is required"),
  dwfrm_billing_addressFields_states_stateCode: z
    .string()
    .min(1, "State is required"),
  dwfrm_billing_addressFields_city: z.string().min(1, "City is required"),
  dwfrm_billing_addressFields_postalCode: z
    .string()
    .min(1, "Postal code is required"),
  csrf_token: z.string(),
  localizedNewAddressTitle: z.string(),
  dwfrm_billing_contactInfoFields_phone: z
    .string()
    .min(1, "Phone number is required"),
  dwfrm_billing_paymentMethod: z
    .string()
    .min(1, { message: "Please select a payment method" }),
  dwfrm_billing_adyenPaymentFields_adyenStateData: z.string().optional(),
  dwfrm_billing_adyenPaymentFields_adyenPartialPaymentsOrder: z
    .string()
    .optional(),
  dwfrm_billing_creditCardFields_cardNumber: z.string().optional(),
  dwfrm_billing_creditCardFields_cardType: z.string().optional(),
  adyenPaymentMethod: z.string().optional(),
  adyenIssuerName: z.string().optional(),
  dwfrm_billing_adyenPaymentFields_issuer: z.string().optional(),
  brandCode: z.string().optional(),
  holderName: z.string().optional(),
  dwfrm_billing_adyenPaymentFields_adyenFingerprint: z.string().optional(),
  dwfrm_billing_shippingAddressUseAsBillingAddress: z.boolean().default(true),
});

type AdyenFormData = z.infer<typeof adyenFormSchema>;

// US States for dropdown
const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

// Countries for dropdown
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "AU", name: "Australia" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "RU", name: "Russia" },
  { code: "ZA", name: "South Africa" },
  { code: "AF", name: "Afghanistan" },
];

type PaymentFormProps = {
  token: string;
  customer?: CheckoutResponse["customer"];
  order: CheckoutResponse["order"];
  expirationYears?: number[];
  onSubmit: () => void;
  adyen: CheckoutResponse["adyen"];
};

export default function PaymentForm({
  token,
  customer,
  order,
  expirationYears = [],
  adyen,
  onSubmit,
}: PaymentFormProps) {
  const [showBillingAddress, setShowBillingAddress] = useState(false);
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [card, setCard] = useState<Card>();
  const [adyenFingerprint, setAdyenFingerprint] = useState<string>("");
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Get shipping address to use as default for billing if needed
  const shippingAddress =
    customer?.addresses?.find(
      (addr) => addr.addressId === order?.billing?.matchingAddressId
    ) || customer?.preferredAddress;

  const form = useForm<AdyenFormData>({
    resolver: zodResolver(adyenFormSchema),
    defaultValues: {
      addressSelector: order?.billing?.matchingAddressId || "",
      dwfrm_billing_addressFields_firstName:
        order?.billing?.billingAddress?.address?.firstName ||
        shippingAddress?.firstName ||
        "",
      dwfrm_billing_addressFields_lastName:
        order?.billing?.billingAddress?.address?.lastName ||
        shippingAddress?.lastName ||
        "",
      dwfrm_billing_addressFields_address1:
        order?.billing?.billingAddress?.address?.address1 ||
        shippingAddress?.address1 ||
        "",
      dwfrm_billing_addressFields_address2:
        order?.billing?.billingAddress?.address?.address2 ||
        shippingAddress?.address2 ||
        "",
      dwfrm_billing_addressFields_country:
        order?.billing?.billingAddress?.address?.countryCode?.value ||
        shippingAddress?.countryCode?.value ||
        "US",
      dwfrm_billing_addressFields_states_stateCode:
        order?.billing?.billingAddress?.address?.stateCode || "AL",
      dwfrm_billing_addressFields_city:
        order?.billing?.billingAddress?.address?.city ||
        shippingAddress?.city ||
        "",
      dwfrm_billing_addressFields_postalCode:
        order?.billing?.billingAddress?.address?.postalCode ||
        shippingAddress?.postalCode ||
        "",
      csrf_token: token,
      localizedNewAddressTitle: "New Address",
      dwfrm_billing_contactInfoFields_phone:
        order?.billing?.billingAddress?.address?.phone ||
        shippingAddress?.phone ||
        "",
      dwfrm_billing_paymentMethod: "AdyenComponent",
      dwfrm_billing_adyenPaymentFields_adyenStateData: "",
      dwfrm_billing_adyenPaymentFields_adyenPartialPaymentsOrder: "",
      dwfrm_billing_creditCardFields_cardNumber: "",
      dwfrm_billing_creditCardFields_cardType: "visa",
      adyenPaymentMethod: "Cards",
      adyenIssuerName: "",
      dwfrm_billing_adyenPaymentFields_issuer: "",
      brandCode: "",
      holderName: "",
      dwfrm_billing_adyenPaymentFields_adyenFingerprint: "",
      dwfrm_billing_shippingAddressUseAsBillingAddress: true,
    },
  });

  const editForm = useForm<AdyenFormData>({
    resolver: zodResolver(adyenFormSchema),
    defaultValues: {
      addressSelector: "",
      dwfrm_billing_addressFields_firstName: "",
      dwfrm_billing_addressFields_lastName: "",
      dwfrm_billing_addressFields_address1: "",
      dwfrm_billing_addressFields_address2: "",
      dwfrm_billing_addressFields_country: "US",
      dwfrm_billing_addressFields_states_stateCode: "AL",
      dwfrm_billing_addressFields_city: "",
      dwfrm_billing_addressFields_postalCode: "",
      csrf_token: token,
      localizedNewAddressTitle: "New Address",
      dwfrm_billing_contactInfoFields_phone: "",
      dwfrm_billing_paymentMethod: "AdyenComponent",
      dwfrm_billing_adyenPaymentFields_adyenStateData: "",
      dwfrm_billing_adyenPaymentFields_adyenPartialPaymentsOrder: "",
      dwfrm_billing_creditCardFields_cardNumber: "",
      dwfrm_billing_creditCardFields_cardType: "visa",
      adyenPaymentMethod: "Cards",
      adyenIssuerName: "",
      dwfrm_billing_adyenPaymentFields_issuer: "",
      brandCode: "",
      holderName: "",
      dwfrm_billing_adyenPaymentFields_adyenFingerprint: "",
      dwfrm_billing_shippingAddressUseAsBillingAddress: true,
    },
  });

  const submitPayment = useMutation({
    mutationFn: async (formData: AdyenFormData) => {
      // Ensure the fingerprint is included
      const updatedFormData = {
        ...formData,
        dwfrm_billing_adyenPaymentFields_adyenFingerprint: adyenFingerprint,
        csrf_token: token,
      };

      // Submit full payment form
      const { data } = await axios.postForm(
        getUrl(CheckoutServices_SubmitPayment),
        updatedFormData
      );
      return data;
    },
    onSuccess: () => {
      router.reload({
        data: {
          stage: "placeOrder",
        },
      });

      onSubmit();
    },
    onError: (error) => {
      console.error("Error submitting payment:", error);
    },
  });

  const updateBillingAddress = useMutation({
    mutationFn: async (formData: AdyenFormData) => {
      const { data } = await axios.postForm(getUrl(Address_SaveAddress), {
        ...formData,
        addressId: editingAddress?.addressId,
        csrf_token: token,
      });
      return data;
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      router.reload({
        data: {
          stage: "payment",
        },
      });
    },
    onError: (error) => {
      console.error("Error updating address:", error);
    },
  });

  const paymentMethod = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      const { data } = await axios.postForm(getUrl(Adyen_GetPaymentMethods), {
        csrf_token: token,
      });
      return data;
    },
  });

  function handleSubmit(values: AdyenFormData) {
    // The card.submit() will trigger the onSubmit callback in the Adyen component
    // which will update the form values before the actual form submission
    if (
      card &&
      (values.dwfrm_billing_paymentMethod === "AdyenComponent" ||
        values.dwfrm_billing_paymentMethod === "CREDIT_CARD")
    ) {
      card.submit();
      // No need for additional submission as it's handled in the onSubmit callback of the Adyen component
    } else {
      // For non-Adyen payment methods, submit directly
      submitPayment.mutate({
        ...values,
        csrf_token: token,
      });
    }
  }

  function handleEditSubmit(values: AdyenFormData) {
    setEditFormError(null);
    updateBillingAddress.mutate(values, {
      onError: (error) => {
        console.error("Error updating address:", error);
        setEditFormError("Failed to update address. Please try again.");
      },
    });
  }

  function startEditingAddress(address: Address) {
    setEditingAddress(address);
    setIsEditDialogOpen(true);
  }

  // Set up edit form when editing an address
  useEffect(() => {
    if (editingAddress) {
      editForm.setValue(
        "dwfrm_billing_addressFields_firstName",
        editingAddress.firstName
      );
      editForm.setValue(
        "dwfrm_billing_addressFields_lastName",
        editingAddress.lastName
      );
      editForm.setValue(
        "dwfrm_billing_addressFields_address1",
        editingAddress.address1
      );
      editForm.setValue(
        "dwfrm_billing_addressFields_address2",
        editingAddress.address2 || ""
      );
      editForm.setValue(
        "dwfrm_billing_addressFields_country",
        editingAddress.countryCode.value
      );
      editForm.setValue(
        "dwfrm_billing_addressFields_city",
        editingAddress.city
      );
      editForm.setValue(
        "dwfrm_billing_addressFields_postalCode",
        editingAddress.postalCode
      );
      editForm.setValue(
        "dwfrm_billing_contactInfoFields_phone",
        editingAddress.phone
      );
    }
  }, [editingAddress, editForm]);

  // Watch for changes to sameAsShipping
  const sameAsShipping = form.watch(
    "dwfrm_billing_shippingAddressUseAsBillingAddress"
  );
  const paymentMethodValue = form.watch("dwfrm_billing_paymentMethod");

  // Adyen configuration
  const configuration: CoreConfiguration = {
    clientKey: adyen.clientKey,
    environment: adyen.environment,
    locale: "en-US",
    countryCode: "US",
    paymentMethodsResponse: paymentMethod.data,
    showPayButton: false,
  };

  // Initialize Adyen
  useEffect(() => {
    const init = async () => {
      const checkout = await AdyenCheckout(configuration);
      const newCard = new Card(checkout, {
        brands: ["visa", "mc"], // Only allow Visa and Mastercard
        onSubmit(state, component, actions) {
          // Update the form with the Adyen state data
          const stateData = JSON.stringify(state.data);
          form.setValue(
            "dwfrm_billing_adyenPaymentFields_adyenStateData",
            stateData
          );

          // Extract and set the brand code and holder name
          if (state.data.paymentMethod) {
            form.setValue(
              "brandCode",
              state.data.paymentMethod.type || "scheme"
            );
            form.setValue(
              "holderName",
              state.data.paymentMethod.holderName || ""
            );
          }

          // Extract fingerprint if available
          if (
            state.data.paymentMethod &&
            state.data.paymentMethod.encryptedSecurityCode
          ) {
            // This is a placeholder - in a real implementation, you'd extract the fingerprint from the Adyen response
            const fingerprintMatch = stateData.match(/fingerprint":"([^"]+)/);
            if (fingerprintMatch && fingerprintMatch[1]) {
              setAdyenFingerprint(fingerprintMatch[1]);
              form.setValue(
                "dwfrm_billing_adyenPaymentFields_adyenFingerprint",
                fingerprintMatch[1]
              );
            }
          }

          // Submit the form with all the updated values
          setTimeout(() => {
            submitPayment.mutate({
              ...form.getValues(),
              dwfrm_billing_adyenPaymentFields_adyenStateData: stateData,
              dwfrm_billing_adyenPaymentFields_adyenFingerprint:
                adyenFingerprint || "",
              csrf_token: token,
            });
          }, 100);
        },
        onChange: function (state) {
          // You can also get brand info in the general onChange handler
          if (state.data.paymentMethod && state.data.paymentMethod.brand) {
            form.setValue(
              "dwfrm_billing_creditCardFields_cardType",
              state.data.paymentMethod.brand
            );
          }
        },
        onFieldValid(data) {
          if (data.endDigits) {
            form.setValue(
              "dwfrm_billing_creditCardFields_cardNumber",
              `************${data.endDigits}`
            );
          }
        },
      }).mount("#component-container");
      setCard(newCard);
    };

    if (paymentMethod.data) {
      init();
    }
  }, [paymentMethod.data, form]);

  // Get available payment methods from order
  const paymentMethods =
    order?.billing?.payment?.applicablePaymentMethods || [];

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Hidden fields for Adyen data */}
          <Controller
            control={form.control}
            name="dwfrm_billing_adyenPaymentFields_adyenStateData"
            render={({ field }) => {
              return <input type="hidden" {...field} />;
            }}
          />

          <Controller
            control={form.control}
            name="brandCode"
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <Controller
            control={form.control}
            name="holderName"
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <Controller
            control={form.control}
            name="dwfrm_billing_adyenPaymentFields_adyenFingerprint"
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <Controller
            control={form.control}
            name="dwfrm_billing_creditCardFields_cardNumber"
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <Controller
            control={form.control}
            name="dwfrm_billing_creditCardFields_cardType"
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <Controller
            control={form.control}
            name="adyenPaymentMethod"
            render={({ field }) => (
              <input type="hidden" value="Cards" {...field} />
            )}
          />

          <Controller
            control={form.control}
            name="dwfrm_billing_adyenPaymentFields_adyenPartialPaymentsOrder"
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Credit Card Information</h3>

            <div className="rounded-md border p-4">
              <div id="component-container" className="min-h-[200px]"></div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Billing Address</h3>
            </div>

            <FormField
              control={form.control}
              name="dwfrm_billing_shippingAddressUseAsBillingAddress"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setUseShippingAsBilling(!!checked);
                        setShowBillingAddress(!checked);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Same as shipping address</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {sameAsShipping ? (
              <div className="border p-4 rounded-md mt-4 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Your billing address will be the same as your shipping
                  address.
                </p>
              </div>
            ) : (
              <>
                {order?.billing?.billingAddress?.address && (
                  <div className="border p-4 rounded-md mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {order.billing.billingAddress.address.firstName}{" "}
                          {order.billing.billingAddress.address.lastName}
                        </p>
                        <p>{order.billing.billingAddress.address.address1}</p>
                        {order.billing.billingAddress.address.address2 && (
                          <p>{order.billing.billingAddress.address.address2}</p>
                        )}
                        <p>
                          {order.billing.billingAddress.address.city},{" "}
                          {order.billing.billingAddress.address.postalCode}
                        </p>
                        <p>
                          {
                            order.billing.billingAddress.address.countryCode
                              .displayValue
                          }
                        </p>
                        <p>{order.billing.billingAddress.address.phone}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          startEditingAddress(
                            order.billing.billingAddress.address
                          )
                        }
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit address</span>
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="dwfrm_billing_addressFields_firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dwfrm_billing_addressFields_lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dwfrm_billing_addressFields_address1"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dwfrm_billing_addressFields_address2"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt, Suite, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dwfrm_billing_addressFields_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem
                                key={country.code}
                                value={country.code}
                              >
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dwfrm_billing_addressFields_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dwfrm_billing_addressFields_postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dwfrm_billing_addressFields_states_stateCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dwfrm_billing_contactInfoFields_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitPayment.isPending}
          >
            {submitPayment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to Review Order"
            )}
          </Button>
        </form>
      </Form>

      {/* Edit Billing Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Billing Address</DialogTitle>
            <DialogDescription>
              Make changes to your billing address.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              {editFormError && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
                  {editFormError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="dwfrm_billing_addressFields_firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dwfrm_billing_addressFields_lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dwfrm_billing_addressFields_address1"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dwfrm_billing_addressFields_address2"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apt, Suite, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dwfrm_billing_addressFields_country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dwfrm_billing_addressFields_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dwfrm_billing_addressFields_postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dwfrm_billing_addressFields_states_stateCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="dwfrm_billing_contactInfoFields_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateBillingAddress.isPending}>
                  {updateBillingAddress.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
