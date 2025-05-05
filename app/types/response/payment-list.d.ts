export interface PaymentListProps {
    currentCustomer:    CurrentCustomer;
    staticUrl:          string;
    navBar:             NavBar;
    locale:             string;
    action:             string;
    queryString:        string;
    tracking_consent:   null;
    csrf:               CSRF;
    paymentInstruments: PaymentInstrument[];
    noSavedPayments:    boolean;
    actionUrl:          string;
    addPaymentUrl:      string;
    breadcrumbs:        Breadcrumb[];
}

export interface Breadcrumb {
    htmlValue: string;
    url:       string;
}

export interface CSRF {
    tokenName: string;
    token:     string;
}

export interface CurrentCustomer {
    raw:         Raw;
    profile:     Profile;
    addressBook: AddressBook;
    wallet:      Wallet;
}

export interface AddressBook {
    preferredAddress: Address;
    addresses:        Address[];
}

export interface Address {
    address1:    string;
    address2:    null;
    city:        string;
    companyName: null;
    countryCode: CountryCode;
    firstName:   string;
    lastName:    string;
    ID:          string;
    phone:       string;
    postalCode:  string;
    stateCode:   string;
    postBox:     null;
    salutation:  null;
    secondName:  null;
    suffix:      null;
    suite:       null;
    title:       null;
    raw:         Raw;
}

export interface CountryCode {
    displayValue: string;
    value:        string;
}

export interface Raw {
}

export interface Profile {
    lastName:   string;
    firstName:  string;
    email:      string;
    phone:      string;
    customerNo: string;
}

export interface Wallet {
    paymentInstruments: PaymentInstrument[];
}

export interface PaymentInstrument {
    creditCardHolder:          string;
    maskedCreditCardNumber:    string;
    creditCardType:            string;
    creditCardExpirationMonth: number;
    creditCardExpirationYear:  number;
    UUID:                      string;
    creditCardNumber?:         string;
    raw?:                      Raw;
    cardTypeImage?:            CardTypeImage;
}

export interface CardTypeImage {
    src: Raw;
    alt: string;
}

export interface NavBar {
    categories: Category[];
}

export interface Category {
    name:                  string;
    url:                   string;
    id:                    string;
    subCategories?:        CategorySubCategory[];
    complexSubCategories?: boolean;
}

export interface CategorySubCategory {
    name:                  string;
    url:                   string;
    id:                    string;
    subCategories?:        SubCategorySubCategory[];
    complexSubCategories?: boolean;
}

export interface SubCategorySubCategory {
    name: string;
    url:  string;
    id:   string;
}
