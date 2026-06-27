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