const questions = [
  // INITIAL SURVEY QUESTIONS
  {
    text: "Are you the main shopper in your house?",
    type: "multiple_choice",
    stage: "initial",
    options: ["Yes", "No"]
  },
  {
    text: "How old are you?",
    type: "multiple_choice",
    stage: "initial",
    options: ["18 - 25", "26 - 30", "31 - 35", "36 - 40", "41 - 45", "46 - 50", "51 - 55", "56 - 60", "61+"]
  },
  {
    text: "What is your gender?",
    type: "multiple_choice",
    stage: "initial",
    options: ["Male", "Female", "Prefer not to say"]
  },
  {
    text: "What is your yearly income?",
    type: "multiple_choice",
    stage: "initial",
    options: ["$50,000 or less", "$51,000 - $100,000", "$101,000 - $150,000", "$151,000 - $200,000", "$201,000 - $250,000", "$251,000+"]
  },
  {
    text: "Do you have children?",
    type: "multiple_choice",
    stage: "initial",
    options: ["0", "1", "2", "3", "4", "5", "6+"],
    followUp: {
      condition: "not_0",
      type: "text",
      placeholder: "Please list the ages of your children (e.g., 5, 8, 12)"
    }
  },
  {
    text: "How many people live in your household?",
    type: "multiple_choice",
    stage: "initial",
    options: ["1", "2", "3", "4", "5", "6+"]
  },
  {
    text: "Do you rent or own?",
    type: "multiple_choice",
    stage: "initial",
    options: ["Rent", "Own", "Neither"]
  },
  {
    text: "How many vacations did you take last year?",
    type: "multiple_choice",
    stage: "initial",
    options: ["0", "1", "2", "3", "4", "5", "6+"]
  },
  {
    text: "Do you have allergies or dietary restrictions?",
    type: "multiple_choice",
    stage: "initial",
    options: ["Yes", "No"],
    followUp: {
      condition: "Yes",
      type: "text",
      placeholder: "Please describe your allergies or dietary restrictions"
    }
  },
  {
    text: "How often do you shop for groceries?",
    type: "multiple_choice",
    stage: "initial",
    options: ["Daily", "Weekly", "Bi-weekly", "Monthly"]
  },
  {
    text: "How much do you usually spend on groceries per week?",
    type: "number",
    stage: "initial",
    options: [],
    placeholder: "Enter amount in dollars (e.g., 150)"
  },

  // WEEKLY SURVEY QUESTIONS
  {
    text: "How many times did you go food shopping this week?",
    type: "multiple_choice",
    stage: "weekly",
    options: ["0", "1", "2", "3", "4", "5", "6+"]
  },
  {
    text: "How many times did you eat leftovers this week?",
    type: "multiple_choice",
    stage: "weekly",
    options: ["0", "1", "2", "3", "4", "5", "6+"]
  },
  {
    text: "How many meals that you didn't finish did you throw out?",
    type: "multiple_choice",
    stage: "weekly",
    options: ["0", "1", "2", "3", "4", "5", "6+"]
  },
  {
    text: "Do you think you wasted less food compared to last week?",
    type: "multiple_choice",
    stage: "weekly",
    options: ["Yes", "No", "I'm not sure"]
  },
  {
    text: "Are you becoming more aware of your amount of food waste/consumption habits?",
    type: "multiple_choice",
    stage: "weekly",
    options: ["Yes", "No", "I'm not sure"]
  },
  {
    text: "Do you often throw away leftover food?",
    type: "multiple_choice",
    stage: "weekly",
    options: ["Yes", "No", "Sometimes"]
  },
  {
    text: "How many meals do you eat at home per week?",
    type: "number",
    stage: "weekly",
    options: [],
    placeholder: "Enter number of meals (e.g., 14)"
  },

  // FINAL SURVEY QUESTIONS
  {
    text: "Did you feel a significant difference in your food waste amounts on a scale of 1-5?",
    type: "multiple_choice",
    stage: "final",
    options: ["1: This app did not help in any way", "2: I felt a slight difference but not a significant one", "3: I feel indifference, I didn't feel a change", "4: This app helped me a lot and I felt a difference", "5: This app was life changing and I felt a significant difference"]
  },
  {
    text: "Are you more aware of what you consumed compared to what you bought while food shopping on a scale of 1-5?",
    type: "multiple_choice",
    stage: "final",
    options: ["1: I did not feel any difference, if anything the opposite", "2: I felt a slight difference but not a significant one", "3: I feel indifference, I didn't feel a change", "4: This app helped me a lot and I felt a difference", "5: This app was life changing and I felt a significant difference"]
  },
  {
    text: "Do you buy less food at the supermarket?",
    type: "multiple_choice",
    stage: "final",
    options: ["Yes, definitely", "I'm not sure", "No"]
  },
  {
    text: "Does it now bother you when you see others waste food after gaining the amount of knowledge and awareness you did through this app?",
    type: "multiple_choice",
    stage: "final",
    options: ["Yes, definitely", "I'm not sure", "No"]
  },
  {
    text: "Would you want to continue using this app?",
    type: "multiple_choice",
    stage: "final",
    options: ["Yes, definitely", "I'm not sure", "No"]
  },
  {
    text: "Was this app helpful?",
    type: "multiple_choice",
    stage: "final",
    options: ["Yes, definitely", "I'm not sure", "No"]
  }
];

export default questions;