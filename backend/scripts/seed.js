require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const Content = require('../models/Content');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studs_portal';

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
    // TRACK 1: Engineering (B.E. - CSE (IBM Specialization))
    // ----------------------------------------------------
    const engSubject = new Subject({
      subjectName: 'Data Structures & Algorithms',
      subjectCode: 'CS301',
      semester: 4,
      department: 'Engineering',
      course: 'B.E. - CSE (IBM Specialization)',
      specialization: 'IBM Specialization'
    });
    await engSubject.save();

    const engUnit = new Unit({
      subjectId: engSubject._id,
      unitNumber: 1,
      unitName: 'Linked Lists & Stacks',
      chapters: [
        { chapterId: 'eng-u1-c1', chapterName: 'Singly Linked List Traversals' }
      ]
    });
    await engUnit.save();

    const engContent = new Content({
      chapterId: 'eng-u1-c1',
      fullNotesMarkdown: `# Singly Linked List Traversals\n\nA singly linked list is a linear data structure where elements are not stored in contiguous memory locations. Each element is a separate object called a node. Each node contains data and a reference (link) to the next node in the sequence.\n\n## Time Complexity\n- Access: O(n)\n- Search: O(n)\n- Insertion: O(1) if at head, O(n) otherwise\n- Deletion: O(1) if at head, O(n) otherwise\n\nTraversing the list requires visiting every node sequentially, leading to a strict O(n) time complexity for a full traversal.`,
      shortNotes: [
        'Nodes contain data and a next pointer.',
        'Head node points to the first element.',
        'Last node next pointer is null.',
        'Memory allocation is non-contiguous.',
        'Strict O(n) time complexity for deep traversals.'
      ],
      pyqLinks: [
        { year: 2024, fileUrl: 'https://example.com/pyq/2024-dsa.pdf' },
        { year: 2025, fileUrl: 'https://example.com/pyq/2025-dsa.pdf' }
      ],
      quizData: [
        {
          question: 'What is the time complexity of traversing a singly linked list?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
          correctAnswer: 'O(n)'
        },
        {
          question: 'What does the last node of a singly linked list point to?',
          options: ['Head', 'Previous Node', 'Null', 'Random Memory'],
          correctAnswer: 'Null'
        },
        {
          question: 'Are nodes in a linked list stored in contiguous memory?',
          options: ['Yes', 'No', 'Sometimes', 'Only in C++'],
          correctAnswer: 'No'
        }
      ],
      aiSummary: '1. Linked lists are dynamic data structures.\n2. Elements are distributed across memory.\n3. Nodes link together via pointers.\n4. Traversing requires following pointers sequentially.\n5. O(n) complexity characterizes standard full traversal.'
    });
    await engContent.save();

    // ----------------------------------------------------
    // TRACK 2: Computing (BCA - Agentic AI)
    // ----------------------------------------------------
    const compSubject = new Subject({
      subjectName: 'Introduction to LLMs and Multi-Agent Frameworks',
      subjectCode: 'AI401',
      semester: 4,
      department: 'Computing',
      course: 'BCA - Agentic AI',
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
