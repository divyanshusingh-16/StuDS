const mongoose = require('mongoose');
require('dotenv').config();
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');

const syllabusData = {
  'Computer Networks': [
    {
      unitNumber: 1,
      unitName: 'Introduction to Data Communication & Physical Layer',
      contactHours: 15,
      chapters: [
        {
          chapterName: '1.1 Introduction',
          topics: [
            'Introduction to Data Communication and Computer Networks',
            'Uses of Computer Networks',
            'Types of Computer Networks (LAN/MAN/WAN) and their Topologies',
            'Network Hardware Components',
            'Connectors',
            'Transceivers',
            'Repeaters',
            'Hubs',
            'Network Interface Cards and PC Cards',
            'Bridges',
            'Switches',
            'Routers',
            'Gateways',
            'Network Software',
            'Network Design Issues and Protocols',
            'Connection Oriented vs Connection Less Service',
            'Service Primitives',
            'OSI Reference Model',
            'TCP/IP Model'
          ]
        },
        {
          chapterName: '1.2 Physical Layer',
          topics: [
            'Analog and Digital Data and Signals',
            'Bit Rate',
            'Baud Rate',
            'Bandwidth',
            'Attenuation',
            'Distortion',
            'Capacity',
            'Nyquist Formula',
            'Shannon Formula'
          ]
        },
        {
          chapterName: '1.3 Transmission Media',
          topics: [
            'Guided and Unguided Media',
            'Twisted Pair',
            'Coaxial Cable',
            'Fiber Optics',
            'Wireless Transmission',
            'Radio',
            'Microwave',
            'Infrared',
            'Wireless Networks',
            'WiFi',
            'Bluetooth',
            '5G Basics'
          ]
        }
      ]
    },
    {
      unitNumber: 2,
      unitName: 'Data Link Layer & Network Layer',
      contactHours: 15,
      chapters: [
        {
          chapterName: '2.1 Data Link Layer',
          topics: [
            'Design Issues',
            'Error Detection and Correction',
            'Coding Methods',
            'Sliding Window Protocols',
            'One-bit',
            'Go Back N',
            'Selective Repeat',
            'Media Access Control Layer',
            'Pure ALOHA',
            'Slotted ALOHA',
            'CSMA/CD',
            'CSMA/CA',
            'HDLC',
            'PPP'
          ]
        },
        {
          chapterName: '2.2 Network Layer',
          topics: [
            'IP Addressing',
            'Classful Addressing',
            'Classless Addressing',
            'Sub-netting',
            'Super Netting',
            'Routing Algorithms',
            'Optimality Principle',
            'Shortest Path Routing',
            'Flooding',
            'Distance Vector Routing',
            'Link State Routing',
            'Congestion Control',
            'Congestion Prevention Policies',
            'Leaky Bucket Algorithm',
            'Token Bucket Algorithm'
          ]
        }
      ]
    },
    {
      unitNumber: 3,
      unitName: 'Protocols, Network Security & Case Study',
      contactHours: 15,
      chapters: [
        {
          chapterName: '3.1 Protocols in Upper Layers',
          topics: [
            'IPv4',
            'IPv6',
            'TCP',
            'UDP',
            'Packet Formats',
            'Structure and Comparison',
            'DNS',
            'SNMP',
            'FTP',
            'HTTP',
            'WWW',
            'POP3',
            'IMAP',
            'Email',
            'TELNET',
            'SSH'
          ]
        },
        {
          chapterName: '3.2 Network Security',
          topics: [
            'Security Attacks',
            'Cryptography',
            'Types of Ciphers',
            'Public Key',
            'Private Key',
            'Digital Signatures',
            'Firewalls',
            'Intrusion Detection System (IDS)',
            'IPSec'
          ]
        },
        {
          chapterName: '3.3 Case Study',
          topics: [
            'Implementation and Design of Campus Area Network (CAN) for a University',
            'Wi-Fi Network Deployment in Educational Institutions',
            'Drone Communication Networks'
          ]
        }
      ]
    }
  ],
  'Competitive Coding – II': [
    {
      unitNumber: 1,
      unitName: 'Intro to Competitive Programming',
      contactHours: null,
      chapters: [
        {
          chapterName: 'Experiment 1 — Arrays',
          topics: [
            'Plus One (https://leetcode.com/problems/plus-one)',
            '4Sum (https://leetcode.com/problems/4sum/)',
            'Maximum Performance of a Team (https://leetcode.com/problems/maximum-performance-of-a-team/)'
          ]
        },
        {
          chapterName: 'Experiment 2 — Strings',
          topics: [
            'Length of Last Word (https://leetcode.com/problems/length-of-last-word)',
            'Generate Parentheses (https://leetcode.com/problems/generate-parentheses)',
            'Text Justification (https://leetcode.com/problems/text-justification)'
          ]
        },
        {
          chapterName: 'Experiment 3 — Binary Search',
          topics: [
            'Sqrt(x) (https://leetcode.com/problems/sqrtx)',
            'Search in Rotated Sorted Array II (https://leetcode.com/problems/search-in-rotated-sorted-array-ii)',
            'Find Minimum in Rotated Sorted Array II (https://leetcode.com/problems/find-minimum-in-rotated-sortedarray-ii)'
          ]
        },
        {
          chapterName: 'Experiment 4 — Monotonic Stack',
          topics: [
            'Next Greater Element I (https://leetcode.com/problems/next-greater-element-i)',
            'Next Greater Element II (https://leetcode.com/problems/next-greater-element-ii)',
            'Create Maximum Number (https://leetcode.com/problems/create-maximum-number/)'
          ]
        }
      ]
    },
    {
      unitNumber: 2,
      unitName: 'Optimization Techniques',
      contactHours: null,
      chapters: [
        {
          chapterName: 'Experiment 5 — Heap (Priority Queue)',
          topics: [
            'Relative Ranks (https://leetcode.com/problems/relative-ranks)',
            'Task Scheduler (https://leetcode.com/problems/task-scheduler)',
            'Sliding Window Maximum (https://leetcode.com/problems/sliding-window-maximum)'
          ]
        },
        {
          chapterName: 'Experiment 6 — Hashing',
          topics: [
            'Isomorphic Strings (https://leetcode.com/problems/isomorphic-strings)',
            'Clone Graph (https://leetcode.com/problems/clone-graph)',
            'Word Ladder (https://leetcode.com/problems/word-ladder)'
          ]
        },
        {
          chapterName: 'Experiment 7 — Sliding Window',
          topics: [
            'Maximum Average Subarray I (https://leetcode.com/problems/maximum-average-subarray-i)',
            'Longest Substring with At Least K Repeating Characters (https://leetcode.com/problems/longest-substring-with-at-least-krepeating-characters)',
            'Sliding Window Median (https://leetcode.com/problems/sliding-window-median)'
          ]
        }
      ]
    },
    {
      unitNumber: 3,
      unitName: 'Advanced Algorithm Design',
      contactHours: null,
      chapters: [
        {
          chapterName: 'Experiment 8 — Dynamic Programming',
          topics: [
            'Divisor Game (https://leetcode.com/problems/divisor-game)',
            'Edit Distance (https://leetcode.com/problems/edit-distance/)',
            'Longest Valid Parentheses (https://leetcode.com/problems/longest-valid-parentheses/)'
          ]
        },
        {
          chapterName: 'Experiment 9 — Trees',
          topics: [
            'Convert Sorted Array to Binary Search Tree (https://leetcode.com/problems/convert-sorted-array-to-binarysearch-tree/)',
            'Construct Binary Tree from Preorder and Inorder Traversal (https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal)',
            'Sum of Distances in Tree (https://leetcode.com/problems/sum-of-distances-in-tree)'
          ]
        },
        {
          chapterName: 'Experiment 10 — Graphs',
          topics: [
            'Find Center of Star Graph (https://leetcode.com/problems/find-center-of-star-graph/)',
            'Is Graph Bipartite? (https://leetcode.com/problems/is-graph-bipartite/)',
            'Redundant Connection II (https://leetcode.com/problems/redundant-connection-ii/)'
          ]
        }
      ]
    }
  ],
  'Aptitude – III': [
    {
      unitNumber: 1,
      unitName: 'Unit 1',
      contactHours: 10,
      chapters: [
        {
          chapterName: '1.1 LCM – HCF',
          topics: [
            'Introduction of LCM and HCF',
            'Finding HCF and LCM by different methods',
            'Product of 2 numbers = LCM × HCF',
            'Problems based on same and different remainders',
            'Traffic Light Problems',
            'Ringing Bell Problems',
            'Circular Track Problems',
            'Maximum Size Tape Problems',
            'Data Sufficiency Problems'
          ]
        },
        {
          chapterName: '1.2 Time, Speed & Distance',
          topics: [
            'Speed Conversions',
            'm/s to km/h',
            'km/h to m/s',
            'Time, Speed and Distance',
            'Average Speed',
            'Relative Speed',
            'Policeman and Thief Problems',
            'Early/Late Arrival Problems',
            'Data Sufficiency Problems'
          ]
        },
        {
          chapterName: '1.3 Problems on Trains',
          topics: [
            'Trains Running in Opposite Direction',
            'Trains Running in Same Direction',
            'Crossing a Pole',
            'Crossing a Platform',
            'Crossing a Person',
            'Data Sufficiency Problems'
          ]
        },
        {
          chapterName: '1.4 Boat & Stream / Linear & Circular Races',
          topics: [
            'Downstream',
            'Upstream',
            'Speed of Boat with Respect to River',
            'Finding Time',
            'Finding Total Distance',
            'Data Sufficiency',
            'Linear Races',
            'Circular Races',
            'Head Starts',
            'Dead Heat',
            'Meeting Points',
            'Meeting at Starting Point',
            'Meeting in Between',
            'Data Sufficiency'
          ]
        }
      ]
    },
    {
      unitNumber: 2,
      unitName: 'Unit 2',
      contactHours: 10,
      chapters: [
        {
          chapterName: '2.1 Calendar',
          topics: [
            'Finding the Day on a Given Date',
            'Odd Days'
          ]
        },
        {
          chapterName: '2.2 Time & Work / Work & Wages',
          topics: [
            'LCM Method',
            'Efficiency Ratio',
            'Efficiency of Manpower',
            'Data Interpretation',
            'Data Sufficiency',
            'Comparing Worker Efficiency',
            'Wages Based on Work Done'
          ]
        },
        {
          chapterName: '2.3 Pipes and Cistern / Chain Rule',
          topics: [
            'Time and Work Application',
            'Negative Work',
            'Basic and Complex Problems',
            'Data Interpretation',
            'Data Sufficiency',
            'Direct Proportion',
            'Indirect Proportion'
          ]
        },
        {
          chapterName: '2.4 Permutation and Combination',
          topics: [
            'Fundamental Counting Principle',
            'AND',
            'OR',
            'Permutation',
            'Combination',
            'Properties of P and C',
            'Circular Permutation',
            'Data Sufficiency',
            'Miscellaneous Problems'
          ]
        }
      ]
    },
    {
      unitNumber: 3,
      unitName: 'Unit 3',
      contactHours: 10,
      chapters: [
        {
          chapterName: '3.1 Sequence and Series',
          topics: [
            'Arithmetic Progression',
            'Geometric Progression',
            'Mean of AP',
            'Mean of GP',
            'Sum and nth Term',
            'Applications',
            'Data Sufficiency'
          ]
        },
        {
          chapterName: '3.2 Surface Area (Mensuration – 3D)',
          topics: [
            'Total Surface Area',
            'Curved Surface Area',
            '3-D Figures',
            'Properties of 3-D Figures',
            'Related Problems'
          ]
        },
        {
          chapterName: '3.3 Volume (Mensuration – 3D)',
          topics: [
            'Volume of 3-D Figures',
            'Properties of 3-D Figures',
            'Related Problems'
          ]
        },
        {
          chapterName: '3.4 Seating Arrangements (Square & Rectangle)',
          topics: [
            'Square Seating Arrangements',
            'Rectangular Seating Arrangements'
          ]
        }
      ]
    }
  ],
  'Project Based Learning in Java': [
    {
      unitNumber: 1,
      unitName: 'Core Java Programming Concepts',
      contactHours: 20,
      chapters: [
        {
          chapterName: '1.1 Java Fundamentals',
          topics: [
            'Introduction to Java',
            'Difference Between C++ and Java',
            'Keywords',
            'Tokens',
            'Data Types',
            'public',
            'private',
            'protected'
          ]
        },
        {
          chapterName: '1.2 OOPS using Java',
          topics: [
            'Class',
            'Method',
            'Inheritance',
            'Abstraction',
            'Polymorphism',
            'Encapsulation',
            'Data Privacy',
            'Method Overloading',
            'Method Overriding'
          ]
        },
        {
          chapterName: '1.3 Exception Handling',
          topics: [
            'Introduction to Exceptions',
            'Error vs Exception',
            'try',
            'catch',
            'throw'
          ]
        }
      ]
    },
    {
      unitNumber: 2,
      unitName: 'Advanced Java Programming and Database Connectivity',
      contactHours: 20,
      chapters: [
        {
          chapterName: '2.1 Collection Framework and Multithreading',
          topics: [
            'Collections',
            'ArrayList',
            'LinkedList',
            'HashMap',
            'TreeMap',
            'HashSet',
            'Multithreading',
            'Thread Synchronization',
            'Thread Priority',
            'Thread Life Cycle'
          ]
        },
        {
          chapterName: '2.2 Wrapper Classes, I/O Streams and Lambda Expression',
          topics: [
            'Wrapper Classes',
            'Integer',
            'Character',
            'Long',
            'Boolean',
            'Autoboxing',
            'Unboxing',
            'Byte Stream',
            'Character Stream',
            'Object Serialization',
            'Cloning',
            'Lambda Syntax',
            'Functional Interfaces',
            'Method References',
            'Stream Operations',
            'Sorting',
            'Filtering',
            'Mapping',
            'Reducing'
          ]
        },
        {
          chapterName: '2.3 JDBC',
          topics: [
            'Database Connectivity',
            'Types of Drivers',
            'Connection Example',
            'CRUD Operations',
            'Java Database Connectivity',
            'MVC Model',
            'Sequence',
            'Dual Table',
            'Date Type Management in Java'
          ]
        }
      ]
    },
    {
      unitNumber: 3,
      unitName: 'Enterprise Java Development and RESTful Services',
      contactHours: 20,
      chapters: [
        {
          chapterName: '3.1 Servlet/JSP, Spring Core, Hibernate/JPA',
          topics: [
            'Servlet',
            'JSP',
            'Spring',
            'Spring Core Internals',
            'IoC Container',
            'Bean Lifecycle',
            '@Component',
            '@Service',
            '@Repository',
            '@Autowired',
            '@Configuration',
            '@Bean',
            'Constructor Injection',
            'Setter Injection',
            'Field Injection',
            'Spring Boot Auto-Configuration',
            'application.properties',
            'Spring Data JPA',
            'Hibernate',
            '@Entity',
            '@Table',
            '@Id',
            '@GeneratedValue',
            '@OneToMany',
            '@ManyToOne',
            '@ManyToMany',
            'Transaction Management',
            '@Transactional',
            '@ExceptionHandler',
            '@ControllerAdvice',
            'Custom Error Responses'
          ]
        },
        {
          chapterName: '3.2 REST APIs and Design Patterns',
          topics: [
            'REST Architecture',
            'HTTP Methods',
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'RESTful APIs using Spring Boot',
            '@RestController',
            '@RequestMapping',
            '@PathVariable',
            '@RequestBody',
            'JSON Serialization',
            'Jackson',
            'RestTemplate',
            'WebClient',
            'Design Patterns',
            'Singleton',
            'Factory',
            'Observer',
            'Strategy',
            'Applying Design Patterns in Java Projects'
          ]
        }
      ]
    }
  ],
  'Probability and Statistics': [
    {
      unitNumber: 1,
      unitName: 'Basic Statistics and Probability',
      contactHours: 20,
      chapters: [
        {
          chapterName: '1.1 Measures of Central Tendency and Dispersion',
          topics: [
            'Measures of Central Tendency',
            'Arithmetic Mean',
            'Median',
            'Mode',
            'Geometric Mean',
            'Harmonic Mean',
            'Measures of Dispersion',
            'Range',
            'Mean Deviation',
            'Variance',
            'Standard Deviation',
            'Coefficient of Variation'
          ]
        },
        {
          chapterName: '1.2 Moments, Skewness and Kurtosis',
          topics: [
            'Moments',
            'Central Moments',
            'Relationship Between Moments and Central Moments',
            'Measures Based on Moments',
            'Skewness',
            'Positive Skewness',
            'Negative Skewness',
            'Karl Pearson’s Coefficient of Skewness',
            'Bowley’s Coefficient of Skewness',
            'Kurtosis',
            'Mesokurtic Distribution',
            'Leptokurtic Distribution',
            'Platykurtic Distribution',
            'Coefficient of Kurtosis'
          ]
        },
        {
          chapterName: '1.3 Probability Distributions',
          topics: [
            'Bayes\' Rule',
            'Conditional Probability',
            'Bayes\' Theorem',
            'Applications of Bayes\' Rule',
            'Random Variable',
            'Discrete Random Variable',
            'Continuous Random Variable',
            'Probability Mass Function (PMF)',
            'Probability Density Function (PDF)',
            'Cumulative Distribution Function (CDF)',
            'Binomial Distribution',
            'Poisson Distribution',
            'Normal Distribution',
            'Mean and Variance',
            'Probability Calculations'
          ]
        }
      ]
    },
    {
      unitNumber: 2,
      unitName: 'Curve Fitting and Bivariate Analysis',
      contactHours: 20,
      chapters: [
        {
          chapterName: '2.1 Bivariate Distributions and Conditional Densities',
          topics: [
            'Bivariate Distribution',
            'Joint Probability Distribution',
            'Marginal Distributions',
            'Properties of Bivariate Distributions',
            'Conditional Probability Density Function',
            'Conditional Distribution',
            'Conditional Mean and Variance'
          ]
        },
        {
          chapterName: '2.2 Curve Fitting by Least Squares Method',
          topics: [
            'Least Squares Method',
            'Straight Line',
            'Equation of Straight Line',
            'Determination of Constants',
            'Second Degree Parabola',
            'Exponential Curves',
            'Power Curves'
          ]
        },
        {
          chapterName: '2.3 Correlation and Regression Analysis',
          topics: [
            'Scatter Diagram',
            'Karl Pearson’s Correlation Coefficient',
            'Properties of Correlation',
            'Interpretation of Correlation',
            'Regression Analysis',
            'Regression Lines',
            'Regression Coefficients',
            'Regression Equations',
            'Properties of Regression',
            'Rank Correlation',
            'Spearman’s Rank Correlation Coefficient',
            'Calculation of Rank Correlation'
          ]
        }
      ]
    },
    {
      unitNumber: 3,
      unitName: 'Sampling Distribution',
      contactHours: 20,
      chapters: [
        {
          chapterName: '3.1 Small Sampling Tests and Chi-Square Tests',
          topics: [
            'Test for Single Mean',
            't-Test',
            'Difference of Means',
            'Correlation Coefficients',
            'Test for Ratio of Variances',
            'F-Test',
            'Chi-Square Tests',
            'Goodness of Fit',
            'Independence of Attributes'
          ]
        },
        {
          chapterName: '3.2 Large Sampling Tests',
          topics: [
            'Test of Significance',
            'Null Hypothesis',
            'Alternative Hypothesis',
            'Level of Significance',
            'Critical Region',
            'Types of Errors',
            'One-Tailed Tests',
            'Two-Tailed Tests',
            'Large Sample Test for Single Proportion',
            'Z-Test Statistic',
            'Difference of Proportions',
            'Single Mean',
            'Difference of Means',
            'Difference of Standard Deviations'
          ]
        }
      ]
    }
  ]
};

async function syncSyllabus() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studs_portal');
    console.log('Connected to DB');

    for (const [subjectName, units] of Object.entries(syllabusData)) {
      const subject = await Subject.findOne({ subjectName, semester: 5 });
      if (!subject) {
        console.log(`Subject not found: ${subjectName}`);
        continue;
      }
      
      console.log(`Processing subject: ${subjectName} (${subject._id})`);

      for (const unitData of units) {
        let unit = await Unit.findOne({ subjectId: subject._id, unitNumber: unitData.unitNumber });
        if (!unit) {
          unit = new Unit({
            subjectId: subject._id,
            unitNumber: unitData.unitNumber,
            unitName: unitData.unitName,
            contactHours: unitData.contactHours,
            chapters: unitData.chapters
          });
          await unit.save();
          console.log(`Created Unit ${unitData.unitNumber} for ${subjectName}`);
        } else {
          unit.unitName = unitData.unitName;
          unit.contactHours = unitData.contactHours;
          unit.chapters = unitData.chapters;
          await unit.save();
          console.log(`Updated Unit ${unitData.unitNumber} for ${subjectName}`);
        }
      }
    }

    console.log('Syllabus sync complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing syllabus:', error);
    process.exit(1);
  }
}

syncSyllabus();
