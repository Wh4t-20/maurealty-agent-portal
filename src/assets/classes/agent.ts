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

// Sales sponsorship ladder, derived from the MRB Sales Flow + Commission Releasing
// docs (base selling agent -> upline override tiers). PROVISIONAL — pending client
// confirmation at the next meeting; the TL-vs-Supervisor ordering is the open question.
// Operational roles (Sales Coordinator, IT, Messenger, Accounting, Finance, Audit) are
// job functions, NOT genealogy ranks (no tree override), so they are intentionally excluded.
// This map is the live source of truth while the DB `positions` table is empty;
// genealogyService prefers the DB value and falls back here.
export const positionMap: Record<number, string> = {
    1: 'Property Sales Specialist', // selling agent — earns 60/70/80% by rank
    2: 'Team Leader',               // leads a team
    3: 'Supervisor',                // upline override tier ("Upline Supervisor")
    4: 'Manager'                    // upline override tier ("Upline Manager")
}

export const getAge = (birth_date: string) => {
  if (!birth_date) return -1
  
  const today = new Date()
  const birthDate = new Date(birth_date)
  
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDifference = today.getMonth() - birthDate.getMonth()
  
  // if the birthday hasn't happened yet this year, subtract 1 from the age
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}