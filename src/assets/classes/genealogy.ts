// developer list interface
export interface Genealogy {
    first_name: string;
    middle_name: string;
    last_name: string;
    position: string;
    children?: Genealogy[];
  }
  
  // sample genealogy tree data
  export const genealogyData: Genealogy = {
    first_name: "Cole",
    middle_name: "Delas",
    last_name: "Unson",
    position: "Property Specialist",
    children: [
      {
        first_name: "Carl",
        middle_name: "Benedict",
        last_name: "Santillan",
        position: "Property Advisor",
        children: [
          {
            first_name: "Russell",
            middle_name: "Reyes",
            last_name: "Beduya",
            position: "Property Advisor",
            children: [
              {
                first_name: "Angelo",
                middle_name: "Marie",
                last_name: "Manlangit",
                position: "Investment Manager",
                children: [],
              },
              {
                first_name: "Jhon Dexter",
                middle_name: "Mae",
                last_name: "Rico",
                position: "Investment Manager",
                children: [],
              },
            ],
          },
          {
            first_name: "Ryan",
            middle_name: "Anthony",
            last_name: "Retutal",
            position: "Property Advisor",
            children: [
              {
                first_name: "Russell",
                middle_name: "Lorenz",
                last_name: "Beduyas",
                position: "Investment Manager",
                children: [],
              },
              {
                first_name: "Russell",
                middle_name: "Lorenz",
                last_name: "Beduyas",
                position: "Investment Manager",
                children: [],
              },
            ],
          },
        ],
      },
      {
        first_name: "Cole",
        middle_name: "Lopez",
        last_name: "Cruz",
        position: "Property Specialist",
        children: [
          {
            first_name: "Carlos",
            middle_name: "Jose",
            last_name: "Lopez",
            position: "Property Advisor",
            children: [
                {
                    first_name: "Cole",
                    middle_name: "Lopez",
                    last_name: "Cruz",
                    position: "Investment Manager",
                    children: [
                    {
                        first_name: "Cole",
                        middle_name: "Lopez",
                        last_name: "Cruz",
                        position: "Investment Manager",
                        children: [],
                    }
                ],
                }
            ],
          },
          {
            first_name: "Luis",
                middle_name: "Angelo",
                last_name: "Gomez",
                position: "Property Advisor",
                children: [],
          }
        ],
      },
      {
        first_name: "Bea",
        middle_name: "Grace",
        last_name: "Tan",
        position: "Property Specialist",
        children: [
        {
            first_name: "Luis",
                middle_name: "Angelo",
                last_name: "Gomez",
                position: "Property Advisor",
                children: [],
        },
        {
            first_name: "Luis",
                middle_name: "Angelo",
                last_name: "Gomez",
                position: "Property Advisor",
                children: [
                    {
                        first_name: " Cole",
                        middle_name: "Andrei",
                        last_name: "Unson",
                        position: "Investment Manager",
                        children: [],
                    }
                ],
        }
        ],
        
      },
    ],
  };