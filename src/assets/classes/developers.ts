// developer list interface
export interface Developer {
    dev_ID: number;
    image_url: string;
    name: string;
    phone: string;
    email: string;
    location: string;
    days: string | null; // could be date tho Im not sure if itll output like Monday - Friday
    hours: string | null;
}

export interface DayOption {
    id: number;
    name: string;
    shortcut: string;
}