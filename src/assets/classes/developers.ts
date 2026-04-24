// developer list interface
export interface Developer {
    dev_ID: any; // just so it be can set to null when creating a new developer from the site, dev_ID is not chosen by the user anyways so it doesn't matter
    image_url: string;
    name: string;
    phone: string;
    email: string;
    location: string;
    hours: string; // could be date tho Im not sure if itll output like Monday - Friday
}