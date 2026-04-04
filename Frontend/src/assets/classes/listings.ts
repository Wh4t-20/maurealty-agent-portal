export interface Property {
    listing_id: number;
    image_url: string;
    agent_id: number;
    property_type: string;
    price: number;
    commission: number;
    location: string;
    description: string;
    created_at: string;
    is_active: boolean;
}

export interface Lot extends Property {
    block_number: string;
    lot_number: number;
    phase_number: number;
    area: number;
    class: string;
}

export interface HouseAndLot extends Property {
    one_storey: boolean;
    with_loft: boolean;
    two_storey: boolean;
    townhome: boolean;
    rowhouse: boolean;
    lot_area: number;
    floor_area: number;
    room_count: number;
    toilet_count: number;
    helper_room_count: number;
    driver_room_count: number;
    carpark_count: number;
}

export interface Condominium extends Property {
    class: string;
    unit_number: number;
    carpark_count: number;
    is_studio_type: boolean;
    is_BR_unit: boolean;
    is_villa: boolean;
    is_garden_villa: boolean;
    is_penthouse: boolean;
    balcony_count: number;
    bedroom_count: number;
}

export interface Memorial extends Property {
    is_urn: boolean;
    is_vault: boolean;
    is_garden: boolean;
    is_estate: boolean;
    is_family_estate: boolean;
    is_pet_memorial: boolean;
}