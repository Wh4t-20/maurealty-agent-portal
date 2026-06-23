// developer list interface
export interface Developer {
    dev_ID: any; // just so it be can set to null when creating a new developer from the site, dev_ID is not chosen by the user anyways so it doesn't matter
    profile_url: string;
    name: string;
    contact_number: string;
    contact_email: string;
    location: string;
    available_days: number; // could be date tho Im not sure if itll output like Monday - Friday
    hours: string;
}   

export interface DayOption {
    id: number;
    name: string;
    shortcut: string;
}