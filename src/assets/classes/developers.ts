// developer list interface
export interface Developer {
    dev_ID: number;
    image_url: string;
    name: string;
    phone: string;
    email: string;
    location: string;
    OfficeHours: OfficeHourSlot[] | []; // Optional property for office hours
}

export interface DayOption {
    id: number;
    name: string;
    shortcut: string;
}

export const days: DayOption[] = [
    { id: 1, name: 'Monday', shortcut: 'Mon' },
    { id: 2, name: 'Tuesday', shortcut: 'Tue' },
    { id: 3, name: 'Wednesday', shortcut: 'Wed' },
    { id: 4, name: 'Thursday', shortcut: 'Thu' },
    { id: 5, name: 'Friday', shortcut: 'Fri' },
    { id: 6, name: 'Saturday', shortcut: 'Sat' },
    { id: 7, name: 'Sunday', shortcut: 'Sun' },
    { id: 8, name: 'Holiday', shortcut: 'Hol'}
]

export interface OfficeHourSlot {
    selectedDays: DayOption[];
    openTime: string;
    closeTime: string;
    isOpenUnavailable?: boolean; // if unavailable open time (would be null in db)
    isCloseUnavailable?: boolean; // same as comment above but close time
}