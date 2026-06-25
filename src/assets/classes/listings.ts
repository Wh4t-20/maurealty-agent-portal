// main property interface
export interface Property {
    listing_id: number;
    listing_title: string;
    agent_name: string;
    property_type: string;
    price: number;
    commission: number;
    location: string;
    lng: number;
    lat: number;
    description: string;
    created_at: Date;
    status: string;
    developer_name: string;
    image_url?: string;
    faq: string;
    fact_sheet?: string;
}

// lot only interface
export interface Lot extends Property {
    block_number: number;
    lot_number: number;
    phase_number: number;
    area: number;
    class: string;
}

// house and lots interface
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
    master_bedroom_area: number;
}

// condominium interface
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

// memorial interface
export interface Memorial extends Property {
    is_urn: boolean;
    is_vault: boolean;
    is_garden: boolean;
    is_estate: boolean;
    is_family_estate: boolean;
    is_pet_memorial: boolean;
}

export interface Images {
    image_url: string;
    display_order: number;
    created_at: number;
}

export function formattedPropertyType (type: string) {
  if (type === 'house_and_lot')
    return 'House and Lot'
  else if (type === 'lot_only')
    return 'Lot Only'
  else if (type === 'condominium')
    return 'Condominium'
  else if (type === 'memorial')
    return 'Memorial'
  else if (type === 'clubshare')
    return 'Clubshare'
  else if (type === 'golfshare')
    return 'Golfshare'
  else
    return 'N/A'
}