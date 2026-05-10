const storyData = {
  startScene: "wake_up",
  scenes: {
    wake_up: {
      speaker: "Narrator",
      text: "Your alarm blares at 6:30 AM. Today is your first day at Trentham Academy. Your uniform is ready, your stomach is full of butterflies, and the bus leaves in 25 minutes.",
      choices: [
        { text: "Get up immediately and review your schedule.", next: "bus_stop", confidence: 8 },
        { text: "Stay in bed for 10 more minutes.", next: "late_panic", confidence: -6 },
        { text: "Send your best friend a voice note for support.", next: "pep_talk", confidence: 4 }
      ]
    },
    pep_talk: {
      speaker: "Best Friend",
      text: "\"You've got this. New place, same legend.\" You laugh and feel your shoulders relax.",
      choices: [
        { text: "Leave on time and walk confidently.", next: "bus_stop", confidence: 6 },
        { text: "Spend extra time picking the perfect shoes.", next: "late_panic", confidence: -2 }
      ]
    },
    late_panic: {
      speaker: "Narrator",
      text: "You jump out of bed. Toothpaste on your blazer, one sock missing, bus horn already outside.",
      choices: [
        { text: "Sprint to the bus and apologize to everyone.", next: "bus_stop_late", confidence: -4 },
        { text: "Ask a parent for a ride and calm down.", next: "front_gate", confidence: 2 }
      ]
    },
    bus_stop: {
      speaker: "Bus Driver",
      text: "\"First day? Sit wherever and hold on.\" The bus is loud with students from every year level.",
      choices: [
        { text: "Sit near the front and listen quietly.", next: "meet_riley", confidence: 2 },
        { text: "Sit with a lively group at the back.", next: "meet_energetic_group", confidence: 4 },
        { text: "Stand and ask if this goes to Block C.", next: "meet_teacher_on_bus", confidence: 5 }
      ]
    },
    bus_stop_late: {
      speaker: "Student",
      text: "\"Whoa, dramatic entrance.\" Some students laugh, but one person makes room and smiles.",
      choices: [
        { text: "Laugh it off and join them.", next: "meet_energetic_group", confidence: 3 },
        { text: "Keep your head down and check your map app.", next: "front_gate", confidence: 0 }
      ]
    },
    meet_riley: {
      speaker: "Riley",
      text: "\"I'm Riley. Also new. Want to partner up so we don't get lost?\"",
      choices: [
        { text: "Agree and compare class timetables.", next: "front_gate", confidence: 6 },
        { text: "Politely decline, you want to try solo.", next: "front_gate", confidence: 1 }
      ]
    },
    meet_energetic_group: {
      speaker: "Zane",
      text: "\"New kid! We're doing lunch challenge rankings today.\" The group is chaotic but friendly.",
      choices: [
        { text: "Join the banter and introduce yourself.", next: "front_gate", confidence: 5 },
        { text: "Smile but stay mostly quiet.", next: "front_gate", confidence: 1 }
      ]
    },
    meet_teacher_on_bus: {
      speaker: "Ms. Hall",
      text: "\"Great question. I teach Science there. Nice initiative.\" She points out key buildings through the window.",
      choices: [
        { text: "Thank her and remember landmarks.", next: "front_gate", confidence: 7 },
        { text: "Nod and return to your seat.", next: "front_gate", confidence: 3 }
      ]
    },
    front_gate: {
      speaker: "Narrator",
      text: "The gates tower ahead. Hundreds of students stream in. A prefect hands you a small campus map.",
      choices: [
        { text: "Head to assembly hall early.", next: "assembly", confidence: 5 },
        { text: "Explore the courtyard first.", next: "courtyard_event", confidence: 2 },
        { text: "Find your cloakroom peg before anything else.", next: "locker_problem", confidence: 3 }
      ]
    },
    courtyard_event: {
      speaker: "Narrator",
      text: "You see a robotics demo booth and a mini basketball shooting station. Two very different crowds.",
      choices: [
        { text: "Try the robotics puzzle challenge.", next: "robotics_puzzle", confidence: 4 },
        { text: "Take three shots at the hoop station.", next: "sports_corner", confidence: 3 },
        { text: "Skip both and run to assembly.", next: "assembly", confidence: 1 }
      ]
    },
    locker_problem: {
      speaker: "Narrator",
      text: "The cloakroom tag reader glitches — your peg won't register. A line forms behind you. Someone mutters, \"Classic first day.\"",
      choices: [
        { text: "Ask a nearby student for help.", next: "locker_help", confidence: 4 },
        { text: "Force it and hope for the best.", next: "locker_fail", confidence: -5 },
        { text: "Leave it and go to assembly.", next: "assembly", confidence: 0 }
      ]
    },
    locker_help: {
      speaker: "Amara",
      text: "\"Hold your badge flat on the sensor — green blink means OK.\" The peg frees up. \"I'm Amara, by the way.\"",
      choices: [
        { text: "Thank Amara and ask if she is in your year.", next: "assembly", confidence: 6 },
        { text: "Thank her and hurry off silently.", next: "assembly", confidence: 2 }
      ]
    },
    locker_fail: {
      speaker: "Narrator",
      text: "The reader still refuses your tag and now your hands hurt. A staff member notices and escorts you to assembly.",
      choices: [
        { text: "Take a breath and reset your mood.", next: "assembly", confidence: 1 },
        { text: "Stay annoyed and replay the moment.", next: "assembly", confidence: -4 }
      ]
    },
    robotics_puzzle: {
      speaker: "STEM Captain",
      text: "You solve the wire-routing puzzle faster than most. A few students clap.",
      choices: [
        { text: "Sign up interest for robotics club.", next: "assembly", confidence: 7 },
        { text: "Smile and quietly walk to assembly.", next: "assembly", confidence: 3 }
      ]
    },
    sports_corner: {
      speaker: "Coach Patel",
      text: "Two swishes and one rim-out. \"Solid start,\" says Coach Patel. \"Trials next week.\"",
      choices: [
        { text: "Ask about trials and requirements.", next: "assembly", confidence: 6 },
        { text: "Say maybe and head to assembly.", next: "assembly", confidence: 2 }
      ]
    },
    assembly: {
      speaker: "Principal",
      text: "\"At Trentham Academy, curiosity and courage matter.\" Students applaud as orientation begins.",
      choices: [
        { text: "Volunteer to introduce yourself when asked.", next: "intro_speech", confidence: 8 },
        { text: "Stay seated and observe everything.", next: "first_class_corridor", confidence: 2 },
        { text: "Whisper to the student next to you first.", next: "meeting_neighbor", confidence: 4 }
      ]
    },
    intro_speech: {
      speaker: "You",
      text: "\"Hi, I'm new, excited, and slightly terrified - but ready.\" Laughter and warm applause fills the hall.",
      choices: [
        { text: "Take that momentum into first class.", next: "first_class_corridor", confidence: 7 }
      ]
    },
    meeting_neighbor: {
      speaker: "Neighbor",
      text: "\"Nice to meet you. I'm Juno. We both have English first.\"",
      choices: [
        { text: "Walk with Juno to class.", next: "english_class", confidence: 5 },
        { text: "Say thanks and navigate solo.", next: "first_class_corridor", confidence: 1 }
      ]
    },
    first_class_corridor: {
      speaker: "Narrator",
      text: "The corridor is packed. Bell rings. You need to choose quickly: English upstairs or Science lab downstairs first?",
      choices: [
        { text: "Go to English.", next: "english_class", confidence: 2 },
        { text: "Go to Science.", next: "science_class", confidence: 2 },
        { text: "Ask a prefect for exact directions.", next: "prefect_help", confidence: 5 }
      ]
    },
    prefect_help: {
      speaker: "Prefect",
      text: "\"Smart move asking. English now, Science after break.\"",
      choices: [
        { text: "Thank them and get to English.", next: "english_class", confidence: 4 }
      ]
    },
    english_class: {
      speaker: "Mr. Lane",
      text: "\"Write one paragraph: Who are you when no one is watching?\" It's personal, and everyone seems focused.",
      choices: [
        { text: "Write honestly from the heart.", next: "english_share", confidence: 6 },
        { text: "Write a safe but polished answer.", next: "english_share", confidence: 2 },
        { text: "Get stuck and ask for help.", next: "english_help", confidence: 3 }
      ]
    },
    english_help: {
      speaker: "Mr. Lane",
      text: "\"Start with one sentence: 'When no one is watching, I...'\" The prompt unlocks your thoughts.",
      choices: [
        { text: "Finish with confidence.", next: "english_share", confidence: 5 },
        { text: "Keep it short and simple.", next: "english_share", confidence: 1 }
      ]
    },
    english_share: {
      speaker: "Mr. Lane",
      text: "He asks for volunteers to read. The room goes quiet.",
      choices: [
        { text: "Read your paragraph aloud.", next: "science_class", confidence: 7 },
        { text: "Let someone else go first.", next: "science_class", confidence: 2 }
      ]
    },
    science_class: {
      speaker: "Ms. Hall",
      text: "\"First experiment: safe volcano reaction. Teams of three.\" Your group looks at you expectantly.",
      choices: [
        { text: "Take leadership and assign roles.", next: "science_result", confidence: 7 },
        { text: "Suggest ideas but let others lead.", next: "science_result", confidence: 3 },
        { text: "Stay quiet and follow instructions.", next: "science_result", confidence: -1 }
      ]
    },
    science_result: {
      speaker: "Narrator",
      text: "Your volcano erupts with perfect timing. The foam nearly reaches the target marker.",
      choices: [
        { text: "Celebrate with your team.", next: "lunch_hub", confidence: 4 },
        { text: "Clean up quietly and head out.", next: "lunch_hub", confidence: 1 }
      ]
    },
    lunch_hub: {
      speaker: "Narrator",
      text: "Lunch break. Three invitations at once: robotics table, sports table, and arts studio open-session.",
      choices: [
        { text: "Join robotics and solve mini coding puzzle.", next: "club_robotics", confidence: 5 },
        { text: "Join sports table challenge round.", next: "club_sports", confidence: 5 },
        { text: "Visit arts studio sketch sprint.", next: "club_arts", confidence: 5 },
        { text: "Sit alone and recharge.", next: "quiet_lunch", confidence: 1 }
      ]
    },
    club_robotics: {
      speaker: "STEM Captain",
      text: "\"You think in systems. We need that.\" They invite you to an after-school prototype sprint.",
      choices: [
        { text: "Accept and commit to prototype sprint.", next: "afternoon_crossroads", confidence: 8 },
        { text: "Maybe later, for now just observe.", next: "afternoon_crossroads", confidence: 3 }
      ]
    },
    club_sports: {
      speaker: "Zane",
      text: "You crush the reflex mini-game and students chant your nickname after one round.",
      choices: [
        { text: "Lean in and sign up for trials.", next: "afternoon_crossroads", confidence: 7 },
        { text: "Enjoy the moment but keep it casual.", next: "afternoon_crossroads", confidence: 3 }
      ]
    },
    club_arts: {
      speaker: "Art Mentor",
      text: "\"Strong perspective lines. Ever considered design club?\" Your sketch gets pinned to the wall.",
      choices: [
        { text: "Join design club mailing list.", next: "afternoon_crossroads", confidence: 7 },
        { text: "Say thanks and slip away quietly.", next: "afternoon_crossroads", confidence: 3 }
      ]
    },
    quiet_lunch: {
      speaker: "Narrator",
      text: "You sit under a tree. Calm returns. A student nearby smiles and offers half their fries.",
      choices: [
        { text: "Chat with them and swap stories.", next: "afternoon_crossroads", confidence: 4 },
        { text: "Thank them, keep enjoying the quiet.", next: "afternoon_crossroads", confidence: 1 }
      ]
    },
    afternoon_crossroads: {
      speaker: "Narrator",
      text: "Final period has a surprise: collaborative challenge or short quiz. Teacher lets students choose format.",
      choices: [
        { text: "Choose collaborative challenge.", next: "final_challenge", confidence: 5 },
        { text: "Choose the short quiz.", next: "final_quiz", confidence: 2 }
      ]
    },
    final_challenge: {
      speaker: "Teacher",
      text: "\"Design a solution to reduce lunchtime waste in 20 minutes.\" Teams begin brainstorming fast.",
      choices: [
        { text: "Pitch your idea boldly.", next: "end_check", confidence: 9 },
        { text: "Support someone else's idea with improvements.", next: "end_check", confidence: 5 },
        { text: "Do only your assigned part.", next: "end_check", confidence: 1 }
      ]
    },
    final_quiz: {
      speaker: "Teacher",
      text: "The quiz is harder than expected, but still fair. You finish with seconds to spare.",
      choices: [
        { text: "Hand it in confidently.", next: "end_check", confidence: 4 },
        { text: "Second-guess and change many answers.", next: "end_check", confidence: -3 }
      ]
    },
    end_check: {
      speaker: "Narrator",
      text: "The final bell rings. First day complete. You stand at the gate, thinking about what this place might become for you.",
      choices: [
        { text: "See your ending", next: "ending_router", confidence: 0 }
      ]
    },
    ending_shining: {
      speaker: "Ending: Rising Star",
      ending: true,
      text: "You leave campus glowing with momentum. Teachers know your name, classmates invite you into projects, and your confidence surges. Trentham Academy feels like the start of your best chapter yet.",
      choices: []
    },
    ending_balanced: {
      speaker: "Ending: Steady Climber",
      ending: true,
      text: "You had wins, awkward moments, and meaningful connections. Not perfect - real. You head home with clear goals and the feeling that tomorrow can be even better.",
      choices: []
    },
    ending_quiet: {
      speaker: "Ending: Quiet Observer",
      ending: true,
      text: "You stayed mostly in the background, but learned the rhythm of the school. It was a cautious start, and that's okay. Confidence can grow one small step at a time.",
      choices: []
    },
    ending_reset: {
      speaker: "Ending: Rough Start, Fresh Tomorrow",
      ending: true,
      text: "Today felt heavy, and some choices backfired. Still, first days are practice rounds. Tomorrow you can return sharper, braver, and ready for a better run.",
      choices: []
    }
  }
};
