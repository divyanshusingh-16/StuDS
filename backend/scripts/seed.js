require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const Content = require('../models/Content');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studs_portal';

const SEM4_CSE_SUBJECTS = [
  { name: 'Universal Human Values, Ethics and Life Skills-2', code: 'UHV401' },
  { name: 'Operating Systems', code: 'CS402' },
  { name: 'Software Engineering', code: 'CS403' },
  { name: 'Competitive Coding-I', code: 'CS404' },
  { name: 'Full Stack Development-I', code: 'CS405' },
  { name: 'Design and Analysis of Algorithms', code: 'CS406' },
  { name: 'Object Oriented Programming Using Java', code: 'CS407' },
  { name: 'Aptitude - II', code: 'GE402' },
  { name: 'Soft Skills - II', code: 'GE403' }
];

const SEM5_CSE_SUBJECTS = [
  { name: 'Project Based Learning in Java', code: 'CS501' },
  { name: 'Full Stack Development - II', code: 'CS502' },
  { name: 'Competitive Coding-II', code: 'CS503' },
  { name: 'Computer Networks', code: 'CS504' },
  { name: 'Probability and Statistics', code: 'MA501' },
  { name: 'Soft Skills-III', code: 'GE501' },
  { name: 'Aptitude-III', code: 'GE502' }
];

const seedDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);

    console.log('🗑️ Clearing legacy records...');
    await Subject.deleteMany({});
    await Unit.deleteMany({});
    await Content.deleteMany({});

    console.log('📥 Injecting university curriculum tracks...');

    // ----------------------------------------------------
    // TRACK 1: Engineering — Computer Science (CSE) — Sem 4
    // ----------------------------------------------------
    const cseSubjects = [];
    for (const { name, code } of SEM4_CSE_SUBJECTS) {
      const subject = new Subject({
        subjectName: name,
        subjectCode: code,
        semester: 4,
        department: 'Engineering (B.E./M.E.)',
        course: 'Engineering (B.E./M.E.): Computer Science (CSE)',
        specialization: 'Computer Science (CSE)'
      });
      await subject.save();
      cseSubjects.push(subject);
    }

    const daaSubject = cseSubjects.find(s => s.subjectName === 'Design and Analysis of Algorithms');
    if (daaSubject) {
      const daaUnit = new Unit({
        subjectId: daaSubject._id,
        unitNumber: 1,
        unitName: 'Algorithm Complexity & Asymptotic Notation',
        chapters: [
          { chapterId: 'cse-daa-u1-c1', chapterName: 'Big-O, Omega, and Theta Analysis' }
        ]
      });
      await daaUnit.save();

      const daaContent = new Content({
        chapterId: 'cse-daa-u1-c1',
        fullNotesMarkdown: `# Big-O, Omega, and Theta Analysis\n\nAsymptotic notation provides a mathematical framework for describing algorithm efficiency as input size grows.\n\n## Key Notations\n- **Big-O (O):** Upper bound on time complexity. Describes the worst-case scenario.\n- **Omega (Ω):** Lower bound on time complexity. Describes the best-case scenario.\n- **Theta (Θ):** Tight bound. When upper and lower bounds match.\n\n## Common Complexities\n| Notation | Name | Example |\n|----------|------|---------|\n| O(1) | Constant | Array index access |\n| O(log n) | Logarithmic | Binary search |\n| O(n) | Linear | Linear search |\n| O(n log n) | Linearithmic | Merge sort |\n| O(n²) | Quadratic | Bubble sort |\n\nUnderstanding these classes is essential for choosing optimal data structures and algorithms for any given problem.`,
        shortNotes: [
          'Big-O describes worst-case upper bound.',
          'Omega describes best-case lower bound.',
          'Theta provides a tight bound when both match.',
          'O(n log n) is optimal for comparison-based sorting.',
          'Constant O(1) means execution time is independent of input size.'
        ],
        pyqLinks: [
          { year: 2024, fileUrl: 'https://example.com/pyq/2024-daa.pdf' },
          { year: 2025, fileUrl: 'https://example.com/pyq/2025-daa.pdf' }
        ],
        quizData: [
          {
            question: 'What does Big-O notation describe?',
            options: ['Best case', 'Average case', 'Worst case upper bound', 'Exact runtime'],
            correctAnswer: 'Worst case upper bound'
          },
          {
            question: 'What is the time complexity of binary search?',
            options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
            correctAnswer: 'O(log n)'
          },
          {
            question: 'Which notation provides a tight bound?',
            options: ['Big-O', 'Omega', 'Theta', 'Little-o'],
            correctAnswer: 'Theta'
          }
        ],
        aiSummary: '1. Asymptotic notation classifies algorithms by growth rate.\n2. Big-O captures worst-case behavior.\n3. Omega captures best-case behavior.\n4. Theta captures tight bounds when both coincide.\n5. Choosing the right complexity class is fundamental to performant software design.'
      });
      await daaContent.save();
    }

    // ----------------------------------------------------
    // TRACK 1b: Engineering — Computer Science (CSE) — Sem 5
    // ----------------------------------------------------
    for (const { name, code } of SEM5_CSE_SUBJECTS) {
      const subject = new Subject({
        subjectName: name,
        subjectCode: code,
        semester: 5,
        department: 'Engineering (B.E./M.E.)',
        course: 'Engineering (B.E./M.E.): Computer Science (CSE)',
        specialization: 'Computer Science (CSE)'
      });
      await subject.save();
    }

    // ----------------------------------------------------
    // TRACK 2: Computing (BCA - Agentic AI)
    // ----------------------------------------------------
    const compSubject = new Subject({
      subjectName: 'Introduction to LLMs and Multi-Agent Frameworks',
      subjectCode: 'AI401',
      semester: 4,
      department: 'Computing (BCA/MCA)',
      course: 'Computing (BCA/MCA): Agentic AI',
      specialization: 'Agentic AI'
    });
    await compSubject.save();

    const compUnit = new Unit({
      subjectId: compSubject._id,
      unitNumber: 1,
      unitName: 'Foundations of Autonomous Agents',
      chapters: [
        { chapterId: 'comp-u1-c1', chapterName: 'Designing Agentic Workflows and ReAct Logic' }
      ]
    });
    await compUnit.save();

    const compContent = new Content({
      chapterId: 'comp-u1-c1',
      fullNotesMarkdown: `# Designing Agentic Workflows and ReAct Logic\n\nAgentic AI focuses on creating systems that operate autonomously to achieve complex goals. The ReAct (Reason + Act) pattern is a foundational paradigm for agentic behavior.\n\n## The ReAct Loop\n1. **Thought:** The agent analyzes the current state and tasks pending.\n2. **Action:** The agent selects and executes a tool or API.\n3. **Observation:** The agent ingests the result of the action into memory.\n\nThis cycle continues iteratively until the agent determines the final goal is met. Agentic workflows require explicit failure handling and context window management to prevent hallucination cascades.`,
      shortNotes: [
        'Agentic AI implies autonomy and goal-seeking behavior.',
        'ReAct stands for Reason and Act.',
        'The primary loop consists of Thought, Action, and Observation.',
        'Tool use is critical for acting on the external environment.',
        'Context window management is essential for long-running tasks.'
      ],
      pyqLinks: [
        { year: 2024, fileUrl: 'https://example.com/pyq/2024-ai.pdf' }
      ],
      quizData: [
        {
          question: 'What does ReAct stand for in agentic frameworks?',
          options: ['Read and Act', 'Reason and Act', 'React and Anticipate', 'Recall and Action'],
          correctAnswer: 'Reason and Act'
        },
        {
          question: 'Which of these is NOT a standard step in the ReAct loop?',
          options: ['Thought', 'Action', 'Observation', 'Compilation'],
          correctAnswer: 'Compilation'
        },
        {
          question: 'Why is context window management important for autonomous agents?',
          options: ['To save API costs only', 'To prevent context overflow and hallucination cascades', 'To increase CPU speed', 'To bypass authentication'],
          correctAnswer: 'To prevent context overflow and hallucination cascades'
        }
      ],
      aiSummary: 'Agentic AI leverages autonomous loops to accomplish goals. The ReAct pattern (Thought, Action, Observation) grounds the agent in logic and environmental interaction. Robust workflows necessitate strict tool execution handling and careful memory management.'
    });
    await compContent.save();

    console.log('✅ Premium study content seeded successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDatabase();
