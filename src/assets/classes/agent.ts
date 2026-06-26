export interface AgentProfile {
    agent_ID: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    age: number;
    sex: string;
    birth_date: string;
    home_address: string;
    contact_number: string;
    email_address: string;
    hire_date: string;
    position_ID: number;
    admin_access: boolean;
    profile_url: string;
}

export const positionMap: Record<number, string> = {
    1: 'Property Sales Specialist',
    2: 'Property Sales Supervisor',
    3: 'Investment Manager'
}