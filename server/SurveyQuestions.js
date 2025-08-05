 const questions = [
      {
        text: "How often do you shop for groceries?",
        type: "multiple_choice",
        stage: "initial",
        options: ["Daily", "Weekly", "Bi-weekly", "Monthly"]
      },
      {
        text: "How much do you usually spend on groceries per week?",
        type: "text",
        stage: "initial",
        options: []
      },
      {
        text: "Do you often throw away leftover food?",
        type: "multiple_choice",
        stage: "weekly",
        options: ["Yes", "No", "Sometimes"]
      },
      {
        text: "How many meals do you eat at home per week?",
        type: "text",
        stage: "weekly",
        options: []
      }
    ];

    export default questions