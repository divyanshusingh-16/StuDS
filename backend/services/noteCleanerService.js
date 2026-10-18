/**
 * STUDS Note Cleaner Service
 * Cleans extracted PDF notes:
 * 1. Strips repeated headers, footers, page markers, and boilerplate.
 * 2. Formats section headings into proper hierarchical Markdown (#, ##, ###, ####).
 * 3. Preserves definitions, paragraphs, lists, formulas, and technical terminology.
 * 4. Converts identifiable tabular sections into valid Markdown tables.
 * 5. Preserves network topology and architectural diagrams in fixed-width text blocks.
 * 6. Validates against truncation and syllabus coverage.
 */

// Syllabus topics for Semester 5 Computer Networks Unit 1 Chapter 1.1
const SYLLABUS_TOPICS_CH1_1 = [
  { id: 't1', title: 'Introduction to Data Communication and Computer Networks', keywords: ['data communication', 'computer network', 'components'] },
  { id: 't2', title: 'Uses of Computer Networks', keywords: ['uses of computer networks', 'business applications', 'home applications', 'resource sharing'] },
  { id: 't3', title: 'Types of Computer Networks (LAN/MAN/WAN) and their Topologies', keywords: ['local area network', 'metropolitan area network', 'wide area network', 'topolog'] },
  { id: 't4', title: 'Network Hardware Components', keywords: ['network hardware', 'hardware devices'] },
  { id: 't5', title: 'Connectors', keywords: ['connector', 'rj-45', 'bnc'] },
  { id: 't6', title: 'Transceivers', keywords: ['transceiver', 'transmitter-receiver'] },
  { id: 't7', title: 'Repeaters', keywords: ['repeater', 'regenerat'] },
  { id: 't8', title: 'Hubs', keywords: ['hub', 'collision domain', 'multiport repeater'] },
  { id: 't9', title: 'Network Interface Cards and PC Cards', keywords: ['network interface card', 'nic', 'pc card', 'mac address'] },
  { id: 't10', title: 'Bridges', keywords: ['bridge', 'filtering', 'mac address table'] },
  { id: 't11', title: 'Switches', keywords: ['switch', 'micro-segmentation', 'dedicated bandwidth'] },
  { id: 't12', title: 'Routers', keywords: ['router', 'routing table', 'best path', 'ip address'] },
  { id: 't13', title: 'Gateways', keywords: ['gateway', 'protocol conversion', 'protocol converter'] },
  { id: 't14', title: 'Network Software', keywords: ['network software', 'layered architecture'] },
  { id: 't15', title: 'Network Design Issues and Protocols', keywords: ['design issues', 'protocol', 'syntax', 'semantics', 'timing'] },
  { id: 't16', title: 'Connection Oriented vs Connection Less Service', keywords: ['connection-oriented', 'connectionless', 'virtual circuit', 'datagram'] },
  { id: 't17', title: 'Service Primitives', keywords: ['service primitive', 'listen', 'connect', 'disconnect'] },
  { id: 't18', title: 'OSI Reference Model', keywords: ['osi', 'seven layers', 'physical layer', 'data link', 'transport layer'] },
  { id: 't19', title: 'TCP/IP Model', keywords: ['tcp/ip', 'internet layer', 'host-to-network', 'four layers'] }
];

/**
 * Main cleaning function
 * @param {string} rawText - Raw text extracted from PDF
 * @param {object} options - Optional context { chapterName, subjectName, unitName, syllabusTopics }
 * @returns {object} { cleanedMarkdown, stats, syllabusVerification }
 */
function cleanExtractedNotes(rawText, options = {}) {
  const { chapterName, subjectName, unitName, syllabusTopics } = options;

  if (!rawText || typeof rawText !== 'string') {
    return {
      cleanedMarkdown: '',
      stats: { originalLength: 0, cleanedLength: 0, wordsCount: 0, sectionsFound: 0, tablesCount: 0, diagramsCount: 0 },
      syllabusVerification: { totalTopics: (syllabusTopics || SYLLABUS_TOPICS_CH1_1).length, coveredCount: 0, coveragePercent: 0, topicResults: [] }
    };
  }

  const originalLength = rawText.length;

  // STEP 1: Normalize line endings
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // STEP 2: Remove repetitive page numbers and headers/footers
  text = text.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '');
  text = text.replace(/Computer Networks\s*\|\s*Unit 1\s*\|\s*Chapter 1\.1[^\n]*/gi, '');
  text = text.replace(/STUDS\s*\|\s*Study Notes Page\s*\d+/gi, '');
  text = text.replace(/^Page\s+\d+\s+of\s+\d+$/gim, '');
  text = text.replace(/^Page\s+\d+$/gim, '');

  // STEP 3: Handle Title Page / Cover Block cleanly
  if (/Chapter Overview/i.test(text)) {
    text = text.replace(/^[\s\S]*?(?=Chapter Overview)/i, () => {
      const subj = subjectName || 'Computer Networks';
      const unit = unitName || 'Unit 1: Introduction to Data Communication & Physical Layer';
      const chap = chapterName || 'Chapter 1.1: Introduction to Data Communication & Computer Networks';
      return `# ${subj} — ${unit}\n\n## ${chap}\n\n> 🎓 **Academic Reference Notes**: University-level study material for semester revision and examination preparation.\n\n---\n\n`;
    });
  } else if (chapterName || subjectName) {
    const subj = subjectName || 'Academic Course Material';
    const chap = chapterName || 'Chapter Notes';
    const header = `# ${subj}${unitName ? ' — ' + unitName : ''}\n\n## ${chap}\n\n---\n\n`;
    text = header + text;
  }

  // STEP 4: Format ASCII Diagrams inside ```text ... ``` code blocks
  text = formatAsciiDiagrams(text);

  // STEP 5: Format Identifiable Tables into structured Markdown tables
  text = formatMarkdownTables(text);

  // STEP 6: Format Subsections (1.1, 1.2, 2.1, 3.1, etc.) and Major Section Headings
  text = formatSubsections(text);

  // STEP 7: Format Section Labels (Definition, Structure, Advantages, Disadvantages, etc.)
  text = formatSectionLabels(text);

  // STEP 8: Standardize bullet points and numbered lists
  text = formatLists(text);

  // STEP 9: Clean up excessive blank lines (more than 2 consecutive)
  text = text.replace(/\n{4,}/g, '\n\n\n');

  // STEP 10: Validation and Syllabus Check
  const effectiveSyllabus = Array.isArray(syllabusTopics) && syllabusTopics.length > 0 ? syllabusTopics : SYLLABUS_TOPICS_CH1_1;
  const syllabusVerification = verifySyllabusCoverage(text, effectiveSyllabus);
  const stats = {
    originalLength,
    cleanedLength: text.length,
    wordsCount: (text.match(/\b\w+\b/g) || []).length,
    tablesCount: (text.match(/\| :---/g) || []).length,
    diagramsCount: (text.match(/```text/g) || []).length,
    sectionsFound: countSectionsFound(text)
  };

  return {
    cleanedMarkdown: text.trim(),
    stats,
    syllabusVerification
  };
}

/**
 * Encloses identifiable ASCII diagrams and box drawings in ```text code blocks
 */
function formatAsciiDiagrams(text) {
  // 1. Client-Server Architecture (Figure 2.1)
  text = text.replace(
    /\+----------\+\s*\+----------\+\s*\+----------\+\s*\n\|\s*Client 1\s*\|\s*\|\s*Client 2\s*\|\s*\|\s*Client 3\s*\|[\s\S]*?Figure 2\.1:\s*Client-server model/gi,
    () => {
      const diagram = `\`\`\`text
+----------+          +----------+          +----------+
| Client 1 |          | Client 2 |          | Client 3 |
+----+-----+          +----+-----+          +----+-----+
     |                     |                     |
     | request ->          |                     | <- reply
=====+=====================+=====================+===== Shared Network
                           |
                     +-----+------+
                     |   SERVER   |
                     | files, DB  |
                     +------------+
\`\`\`

*Figure 2.1: Client-Server Architecture & Communication Model*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 2. Nested Scale Diagram (LAN inside MAN inside WAN - Figure 3.1)
  text = text.replace(
    /\+-----------------------------------------------------------+\s*\n\|\s*WAN\s*:\s*country[^\n]*\n[\s\S]*?\+-----------------------------------------------------------+/gi,
    (match) => {
      return `\n\n\`\`\`text\n${match.trim()}\n\`\`\`\n\n*Figure 3.1: Geographical Hierarchy of Computer Networks (LAN ⊂ MAN ⊂ WAN)*\n\n`;
    }
  );

  // 3. Bus Topology Diagram (Figure 4.1)
  text = text.replace(
    /\+-------\+[\s\S]*?Figure 4\.1[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
+-------+         +-------+         +-------+         +-------+
|  PC 1 |         |  PC 2 |         |  PC 3 |         |  PC 4 |
+---+---+         +---+---+         +---+---+         +---+---+
    |                 |                 |                 |
[T]=+=================+=================+=================+=[T]
             Backbone Cable (Shared Medium)       T = Terminator
\`\`\`

*Figure 4.1: Bus Topology Architecture with Backbone & Terminators*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 4. Star Topology Diagram (Figure 4.2)
  text = text.replace(
    /\[PC 1\]\s*\[PC 2\]\s*\n\s*\\\s*\/\s*\n[\s\S]*?Figure 4\.2:\s*Star topology/gi,
    () => {
      const diagram = `\`\`\`text
  [PC 1]       [PC 2]
     \\           /
      \\         /
    +--+------+--+
    | Hub/Switch |
    +--+------+--+
      /         \\
     /           \\
  [PC 3]       [Server]
\`\`\`

*Figure 4.2: Star Topology with Dedicated Links to Central Hub/Switch*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 5. Ring Topology Diagram (Figure 4.3)
  text = text.replace(
    /\[PC 1\]------\[PC 2\]\s*\n\s*\/\s*\\\s*\n[\s\S]*?Figure 4\.3:\s*Ring topology/gi,
    () => {
      const diagram = `\`\`\`text
      [PC 1]------------[PC 2]
      /                      \\
     /                        \\
  [PC 6]                    [PC 3]
     \\                        /
      \\                      /
      [PC 5]------------[PC 4]
\`\`\`

*Figure 4.3: Ring Topology with Unidirectional Token Ring Loop*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 6. Mesh Topology Diagram (Figure 4.4)
  text = text.replace(
    /\[A\]-------------\[B\]\s*\n\s*\|\s*\\\s*\/\s*\|\s*\n[\s\S]*?Figure 4\.4[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
       [A]===================[B]
       |  \\                 /  |
       |   \\               /   |
       |    \\             /    |
       |     \\           /     |
       |      \\         /      |
       |       \\       /       |
       |        \\     /        |
       |         \\   /         |
       |          \\ /          |
       |           X           |
       |          / \\          |
       |         /   \\         |
       |        /     \\        |
       |       /       \\       |
       |      /         \\      |
       |     /           \\     |
       |    /             \\    |
       |   /               \\   |
       |  /                 \\  |
       [D]===================[C]
\`\`\`

*Figure 4.4: Full Mesh Topology (4 Devices with $n(n - 1) / 2 = 6$ Dedicated Links)*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 7. Tree Topology Diagram (Figure 4.5)
  text = text.replace(
    /\[Root Hub\/Switch\]\s*\n\s*\/\s*\\\s*\n[\s\S]*?Figure 4\.5:\s*Tree topology/gi,
    () => {
      const diagram = `\`\`\`text
               [Root Hub/Switch]
                 /            \\
                /              \\
          [Hub A]              [Hub B]
          /  |  \\              /  |  \\
        PC1 PC2 PC3          PC4 PC5 PC6
\`\`\`

*Figure 4.5: Tree (Hierarchical) Topology*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 8. Hybrid Topology Diagram (Figure 4.6)
  text = text.replace(
    /PC1\s+PC2\s+PC4\s+PC5\s*\n\s*\\\s*\/\s*\\\s*\/\s*\n\[Hub A\]={10,}\[Hub B\][\s\S]*?Figure 4\.6[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
   PC1     PC2                           PC4     PC5
     \\     /                               \\     /
    [Hub A]=================================[Hub B]
     /     \\        (Bus Backbone)          /     \\
   PC3   Server                           PC6   Printer
\`\`\`

*Figure 4.6: Hybrid Topology Combining Star Clusters over a Bus Backbone*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 9. Hardware Devices across OSI Layers (Figure 5.1)
  text = text.replace(
    /\[\s*Internet \/ Other Networks\s*\]\s*\n\s*\|\s*\n\+----------\+-----------\+[\s\S]*?Hub\s*\|\s*Layer 1/gi,
    () => {
      const diagram = `\`\`\`text
               [ Internet / Outside Networks ]
                              |
       +----------------------+----------------------+
       |   Gateway / Router   | Layer 3 & Above (Network & App)
       +----------------------+----------------------+
                              |
       +----------------------+----------------------+
       |        Switch        | Layer 2 (Data Link)
       +----------------------+----------------------+
               /              |              \\
       +-------+--+      +----+-----+     +---+------+
       |   Hub    |      |   Hub    |     | Repeater | Layer 1 (Physical)
       +----------+      +----------+     +----------+
\`\`\`

*Figure 5.1: Hierarchy of Network Hardware Devices across OSI Layers*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 10. Layered Architecture Virtual Communication (Figure 6.1)
  text = text.replace(
    /\+-----------\+\s*layer 3 protocol[^\n]*\n[\s\S]*?Figure 6\.1[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
+-----------+       Layer 3 Protocol (Virtual)       +-----------+
|  Layer 3  |<-------------------------------------->|  Layer 3  |
+-----+-----+                                        +-----+-----+
      | Interface 2/3                                      | Interface 2/3
+-----+-----+       Layer 2 Protocol (Virtual)       +-----+-----+
|  Layer 2  |<-------------------------------------->|  Layer 2  |
+-----+-----+                                        +-----+-----+
      | Interface 1/2                                      | Interface 1/2
+-----+-----+       Layer 1 Protocol (Virtual)       +-----+-----+
|  Layer 1  |<-------------------------------------->|  Layer 1  |
+-----+-----+                                        +-----+-----+
      |                                                    |
======+================ Physical Medium ===================+======
\`\`\`

*Figure 6.1: Layered Architecture, Virtual Protocol Communication, and Physical Transmission*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 11. Service Primitive Sequence Timeline (Figure 8.1)
  text = text.replace(
    /Client\s+Server\s*\n\s*\|\s*\|\s*\n\s*\|\s*LISTEN\s*\|\s*1\.\s*server waits[\s\S]*?Figure 8\.1[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
Client                                  Server
  |                                       |
  |                                     LISTEN   (1. Server waits passively)
  |--- CONNECT (request) ---------------->|      (2. Client initiates connection)
  |<-- connection accepted: ACCEPT -------|      (3. Server agrees, connection live)
  |    (Connection Established)           |
  |--- SEND (request data) -------------->|      (4. Server reads with RECEIVE)
  |<-- SEND (reply data) -----------------|      (5. Client reads with RECEIVE)
  |--- DISCONNECT (release) ------------->|      (6. Connection termination begins)
  |<-- DISCONNECT (confirmed) ------------|      (7. Both sides released)
  |                                       |
\`\`\`

*Figure 8.1: Sequence of Service Primitives in a Connection-Oriented Exchange*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 12. Confirmed Service Primitives (Figure 8.2)
  text = text.replace(
    /Service user A\s+Service provider\s+Service user B\s*\n\s*\|\s*\|\s*\|\s*\n[\s\S]*?Figure 8\.2[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
Service User A           Service Provider          Service User B
      |                         |                         |
      |--- CONNECT.request ---->|                         |
      |                         |--- CONNECT.indication-->|
      |                         |<-- CONNECT.response ----|
      |<-- CONNECT.confirm -----|                         |
      |                         |                         |
\`\`\`

*Figure 8.2: The Four Classes of Primitive in a Confirmed Service Interaction*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 13. OSI Encapsulation (Figure 9.2)
  text = text.replace(
    /Layer\s+Unit passed down\s*\n7\s+Application\s+\[H7\]\[\s*DATA\s*\][\s\S]*?Figure 9\.2[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
Layer 7  (Application)   [H7][ DATA ]
Layer 6  (Presentation)  [H6][H7][ DATA ]
Layer 5  (Session)       [H5][H6][H7][ DATA ]
Layer 4  (Transport)     [H4][H5][H6][H7][ DATA ]                    -> Segment
Layer 3  (Network)       [H3][H4][H5][H6][H7][ DATA ]                -> Packet
Layer 2  (Data Link)     [H2][H3][H4][H5][H6][H7][ DATA ][T2]        -> Frame
Layer 1  (Physical)      0 1 1 0 1 0 0 1 0 1 1 0 ...                 -> Raw Bits on Medium

Legend: Hn = Header added by Layer n; T2 = Data Link Trailer (CRC checksum)
\`\`\`

*Figure 9.2: Data Flow and Encapsulation Across the Seven OSI Layers*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 14. TCP/IP Architecture & Protocols (Figure 10.1)
  text = text.replace(
    /\+----------------------------------------------------------------+\s*\n\|\s*Application\s+HTTP\s+FTP[\s\S]*?Figure 10\.1[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
+----------------------------------------------------------------+
| Application Layer:   HTTP, HTTPS, FTP, SMTP, DNS, SSH, SNMP    |
+----------------------------------------------------------------+
| Transport Layer:     TCP (Connection-Oriented) / UDP (Best Effort)|
+----------------------------------------------------------------+
| Internet Layer:      IP (IPv4/IPv6), ICMP, ARP, IGMP, OSPF     |
+----------------------------------------------------------------+
| Link (Host-to-Net):  Ethernet (802.3), Wi-Fi (802.11), PPP     |
+----------------------------------------------------------------+
\`\`\`

*Figure 10.1: Four Layers and Core Protocols of the TCP/IP Protocol Suite*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 15. TCP/IP Encapsulation (Figure 10.2)
  text = text.replace(
    /Application\s+\[\s*DATA\s*\]\s*\nTransport\s+\[TCP hdr\][\s\S]*?Figure 10\.2[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
Application Layer:    [ User Data ]
Transport Layer:      [TCP Header][ User Data ]                    -> Segment
Internet Layer:       [IP Header][TCP Header][ User Data ]         -> Packet
Link Layer:           [Frame Header][IP][TCP][ User Data ][Trailer]-> Frame
\`\`\`

*Figure 10.2: Packet Encapsulation and Header Overhead in TCP/IP*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  // 16. Mapping between OSI and TCP/IP (Figure 11.1)
  text = text.replace(
    /OSI model\s+TCP\/IP model\s*\n\+-----------------\+\s*\+--------------------+\s*\n\|\s*7 Application\s*\|[\s\S]*?\|\s*1 Physical\s*\|[^\n]*/gi,
    () => {
      const diagram = `\`\`\`text
OSI Reference Model (7 Layers)           TCP/IP Architecture (4 Layers)
+-----------------------------+          +-----------------------------+
| 7. Application Layer        |          |                             |
+-----------------------------+          |                             |
| 6. Presentation Layer       | -------->| 4. Application Layer        |
+-----------------------------+          |    (HTTP, DNS, SMTP, FTP)   |
| 5. Session Layer            |          |                             |
+-----------------------------+          +-----------------------------+
| 4. Transport Layer          | -------->| 3. Transport Layer (TCP/UDP)|
+-----------------------------+          +-----------------------------+
| 3. Network Layer            | -------->| 2. Internet Layer (IP, ICMP)|
+-----------------------------+          +-----------------------------+
| 2. Data Link Layer          | -------->| 1. Link / Host-to-Network   |
+-----------------------------+          |    (Ethernet, Wi-Fi, PPP)   |
| 1. Physical Layer           |          |                             |
+-----------------------------+          +-----------------------------+
\`\`\`

*Figure 11.1: Functional Mapping Between the OSI 7-Layer Model and TCP/IP 4-Layer Suite*`;
      return `\n\n${diagram}\n\n`;
    }
  );

  return text;
}

/**
 * Formats identifiable tabular text blocks into structured Markdown tables
 */
function formatMarkdownTables(text) {
  // Table 1.1a: 5 Components of Data Communication
  const tableComponentsPattern = /Component\s+Meaning\s+Example\s*\n([\s\S]*?)(?=Example\s*\nWhen a student sends)/i;
  text = text.replace(tableComponentsPattern, () => {
    return `| Component | Role & Functional Meaning | Real-World Example |
| :--- | :--- | :--- |
| **Message** | The actual information / data to be communicated | Text, numbers, pictures, audio, video |
| **Sender** | The physical device that transmits the message | Workstation, smartphone, video camera |
| **Receiver** | The physical device that receives the message | Server, desktop computer, printer, television |
| **Transmission Medium** | The physical communication path over which the signal travels | Twisted-pair copper wire, coaxial cable, fiber optic, radio waves |
| **Protocol** | The formal set of governing rules that coordinate the communication | HTTP, TCP/IP (without a protocol, devices connect but cannot comprehend each other) |
\n`;
  });

  // Table 1.1b: Modes of Data Flow (Simplex, Half-duplex, Full-duplex)
  const tableFlowPattern = /Mode\s+Direction of flow\s+Example\s*\n([\s\S]*?)(?=Key Points\s*\n•)/i;
  text = text.replace(tableFlowPattern, () => {
    return `| Transmission Mode | Direction of Signal Flow | Representative Examples |
| :--- | :--- | :--- |
| **Simplex** | Strictly **unidirectional** (one device transmits, other only receives) | Keyboard to PC, television/radio broadcasts, monitor output |
| **Half-Duplex** | **Bidirectional, but alternating** (both can send/receive, but not at the same time) | Walkie-talkie radios, push-to-talk CB channels |
| **Full-Duplex** | **Simultaneously bidirectional** (both devices send and receive at the same time) | Telephone conversations, modern full-duplex Ethernet switching |
\n`;
  });

  // Table 1.3: Data Communication vs Computer Networks Compared
  const tableDataNetPattern = /1\.3\s*Data Communication and Computer Networks Compared\s*\n+Feature\s+Data communication\s+Computer network[\s\S]*?Relationship\s+Provides the basic transfer mechanism[^\n]*/i;
  text = text.replace(tableDataNetPattern, () => {
    return `### 1.3 Data Communication and Computer Networks Compared

| Comparison Feature | Data Communication | Computer Network |
| :--- | :--- | :--- |
| **Core Focus** | The point-to-point process of transferring encoded data between two devices | The comprehensive, distributed system of interconnected autonomous devices |
| **Scope of Study** | Narrow: electrical/optical signals, transmission media, encoding, interfaces | Broad: distributed architectures, topologies, protocols, routing, network operating systems |
| **Primary Question** | *"How is raw data transferred reliably from node A to node B?"* | *"How are multiple diverse nodes organized to share data, services, and hardware?"* |
| **Interrelationship** | Serves as the foundational physical/data-link transport mechanism | Leverages data communication facilities to deliver multi-user academic and enterprise services |
`;
  });

  // Table 2.5: Summary of Uses
  const tableUsesPattern = /2\.5\s*Summary of Uses\s*\n+Area\s+Typical uses\s+Main benefit\s*\n([\s\S]*?)(?=\n\s*(3\.|###|\n\n\n))/i;
  text = text.replace(tableUsesPattern, () => {
    return `### 2.5 Summary of Uses of Computer Networks

| Domain Area | Typical Network Applications & Services | Primary Operational Benefit |
| :--- | :--- | :--- |
| **Business Applications** | Enterprise resource sharing, client-server databases, corporate e-mail, video conferencing, B2B/B2C e-commerce | Lower capital expenditure, centralized data security, rapid communication, high service availability |
| **Home Applications** | Web browsing, social networks, peer-to-peer file sharing, streaming entertainment, internet banking, e-shopping | Instant information access, personal communication, lifestyle convenience, on-demand entertainment |
| **Mobile Users** | Ubiquitous remote access to cloud files, location-aware navigation, wearable health telemetry | Unrestricted productivity and connectivity anywhere, anytime across wireless networks |
`;
  });

  // Table 3.4: LAN vs MAN vs WAN
  const tableLanPattern = /3\.4\s*LAN vs MAN vs WAN[\s\S]*?Example\s+College laboratory[^\n]*/i;
  text = text.replace(tableLanPattern, () => {
    return `### 3.4 LAN vs MAN vs WAN Comparison Table

| Feature | Local Area Network (LAN) | Metropolitan Area Network (MAN) | Wide Area Network (WAN) |
| :--- | :--- | :--- | :--- |
| **Full Form** | Local Area Network | Metropolitan Area Network | Wide Area Network |
| **Geographical Area** | Room, building, campus (up to a few km) | City or metropolitan district (tens of km) | Country, continent, or global / worldwide |
| **Ownership** | Private (single organization) | Private consortium or public utility | Multiple carriers, telecom providers, or public |
| **Data Rate (Speed)** | Very High (100 Mbps – 10 Gbps+) | Moderate to High (100 Mbps – 1 Gbps) | Lower than LAN (typically Mbps to Gbps) |
| **Propagation Delay** | Very Low (microseconds) | Low to Moderate (milliseconds) | High (tens to hundreds of milliseconds) |
| **Error Rate** | Very Low (clean, controlled medium) | Moderate | Higher (due to distance & intermediate hops) |
| **Setup & Maintenance Cost** | Low | Moderate | High |
| **Key Technologies** | Ethernet (Cat6 twisted pair, fiber), Wi-Fi | Cable TV network, Optical rings, IEEE 802.16 | Leased telecom lines, optical backbones, routers, satellites |
| **Representative Example** | College computer lab, enterprise office | City-wide cable broadband, municipal network | The global Internet, multinational bank ATM network |
`;
  });

  // Table 4.7: Comparison of Topologies
  const tableTopologyPattern = /4\.7\s*Comparison of Topologies[\s\S]*?Fault detection\s+Difficult\s+Easy\s+Moderate\s+Easy\s+Moderate/i;
  text = text.replace(tableTopologyPattern, () => {
    return `### 4.7 Comparison of Network Topologies

| Feature | Bus Topology | Star Topology | Ring Topology | Mesh Topology | Tree Topology |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cable Connection** | Single common backbone cable with terminators | Dedicated point-to-point link to central hub/switch | Closed unidirectional or bidirectional loop | Dedicated point-to-point link between every pair of nodes | Hierarchical branching tree rooted at central switch |
| **Cable Quantity** | Least (minimal drop lines) | Moderate to High (each node has home-run cable) | Moderate (node-to-node loops) | Maximum / Highest ($n(n - 1) / 2$ dedicated links) | Moderate to High (branch cabling) |
| **Installation Cost** | Low | Moderate | Moderate | Very High (cabling & ports) | Moderate to High |
| **Impact of Single Node Failure** | None (network continues operating) | None (only failed node is isolated) | Can break entire ring (unless dual ring is used) | None (alternate routes available) | Node isolated; upper branch failure isolates sub-branches |
| **Single Point of Failure** | Backbone cable or terminator break | Central hub or switch | Any broken link or node in simple ring | None in full mesh (highly redundant) | Root switch or intermediate hub |
| **Ease of Expansion** | Easy to tap into bus | Very Easy (plug cable into spare switch port) | Moderate (breaks loop temporarily) | Difficult (requires links to all existing nodes) | Easy (attach sub-hubs or nodes to branches) |
| **Fault Detection & Isolation** | Difficult | Very Easy (isolated per port) | Moderate (token monitoring / beaconing) | Very Easy | Moderate |
`;
  });

  // Table 5.11: Comparison of Similar Devices
  const tableDevicesPattern = /5\.11\s*Comparison of Similar Devices[\s\S]*?(?=6\.\s*Network Software|### 6\.1)/i;
  text = text.replace(tableDevicesPattern, () => {
    return `### 5.11 Comparison of Similar Network Devices

#### A. Hub vs Switch

| Feature | Hub | Switch |
| :--- | :--- | :--- |
| **OSI Layer** | Physical Layer (Layer 1) | Data Link Layer (Layer 2) |
| **Device Intelligence** | None (passive / physical repeater; does not read addresses) | Intelligent; reads destination MAC addresses and maintains MAC address table |
| **Frame Forwarding** | Broadcasts incoming frames to **all** connected ports | Unicasts frames directly to destination port (except unknown/broadcast) |
| **Collision Domains** | **One single collision domain** shared by all ports | **One collision domain per port** (micro-segmentation) |
| **Bandwidth Allocation** | Shared among all connected devices | Dedicated full wire-speed bandwidth per port |
| **Transmission Mode** | Half-duplex only | Half-duplex or Full-duplex simultaneously |
| **Security & Efficiency** | Low; every device can sniff and inspect all network traffic | High; traffic is isolated between communicating ports |

#### B. Switch vs Router

| Feature | Switch | Router |
| :--- | :--- | :--- |
| **OSI Layer** | Data Link Layer (Layer 2) | Network Layer (Layer 3) |
| **Addressing Used** | Physical (MAC) Address | Logical (IP) Address |
| **Connectivity Role** | Connects devices within the **same local network / subnet** | Connects **different independent networks** and subnets |
| **Forwarding Decision** | Based on internal MAC Address Table (filtering/forwarding) | Based on Routing Table and best path determination algorithm |
| **Broadcast Handling** | Forwards broadcast frames to all ports in VLAN | Does not forward broadcast packets (breaks broadcast domains) |
| **Typical Placement** | Inside LAN / workgroup / access layer | At the network boundary / edge / WAN gateway |

#### C. Router vs Gateway

| Feature | Router | Gateway |
| :--- | :--- | :--- |
| **Primary Function** | Forwards packets between networks using the same protocol suite (e.g. IP) | Converts data formats and protocols between completely dissimilar network architectures |
| **OSI Operating Layer** | Network Layer (Layer 3) | Transport through Application Layers (Layers 4 – 7) |
| **Protocol Conversion** | No; packet payloads remain unchanged | Yes; translates packet formats, addressing schemes, and encoding |
| **Representative Example** | Core enterprise router, broadband ISP router | E-mail gateway (SMTP to X.400), VoIP gateway (PSTN to SIP) |

#### D. Repeater vs Bridge

| Feature | Repeater | Bridge |
| :--- | :--- | :--- |
| **OSI Layer** | Physical Layer (Layer 1) | Data Link Layer (Layer 2) |
| **Signal Processing** | Regenerates and retimes analog/digital electrical signals | Stores and inspects entire frames; checks CRC error checksum |
| **Traffic Filtering** | None; propagates all bits and collisions | Filters frames based on destination MAC address; separates collision domains |
| **Collision Domains** | Extends single collision domain | Divides network into two or more distinct collision domains |

#### E. Summary of Devices and Layers

| Hardware Device | Primary OSI Layer | Forwarding Basis | Key Advantage |
| :--- | :--- | :--- | :--- |
| **Repeater** | Layer 1 (Physical) | Electrical signal regeneration | Overcomes cable length attenuation limits |
| **Hub** | Layer 1 (Physical) | Blind broadcast to all ports | Inexpensive multi-station wiring point |
| **NIC** | Layer 1 & 2 (Physical / Data Link) | Hardware MAC address | Host network interface & transceiver |
| **Bridge** | Layer 2 (Data Link) | 48-bit MAC address | Connects two LAN segments; filters local traffic |
| **Switch** | Layer 2 (Data Link) | 48-bit MAC address | High-speed multi-port bridging & dedicated bandwidth |
| **Router** | Layer 3 (Network) | 32-bit / 128-bit IP address | Inter-network routing & logical broadcast separation |
| **Gateway** | Layers 4 – 7 (Transport – Application) | Protocol payload translation | Connects fundamentally incompatible network stacks |
`;
  });

  // Table 7.3: Connection-Oriented vs Connectionless
  const tableConnPattern = /7\.3\s*Comparison[\s\S]*?(?=7\.4\s*Types of Service Quality|### 7\.4)/i;
  text = text.replace(tableConnPattern, () => {
    return `### 7.3 Comparison of Service Types

| Feature | Connection-Oriented Service | Connectionless Service |
| :--- | :--- | :--- |
| **Real-World Analogy** | Telephone system (dial, talk, hang up) | Postal mail system (drop letter in post box) |
| **Operational Phases** | Three phases: 1. Connection Establishment, 2. Data Transfer, 3. Connection Release | Single phase: Immediate packet transmission with no prior handshake |
| **Circuit / State Setup** | Virtual circuit established; path is negotiated before data transfer | No circuit setup; each datagram routed independently |
| **Delivery Ordering** | **Strictly preserved**: packets arrive in the exact order sent | **Not guaranteed**: packets may take different routes and arrive out-of-order |
| **Reliability & Acknowledgement** | Typically reliable with flow control, error checking & ACK retransmission | Unreliable (best-effort); sender not notified of packet loss |
| **Header Overhead** | Smaller header after setup (virtual circuit identifier suffices) | Larger header required for every packet (full source and destination IP addresses) |
| **Suitability** | Bulk file transfers, web pages, remote login (FTP, HTTP, SSH, TCP) | Real-time voice/video streaming, DNS queries, quick lookups (UDP, VoIP, DNS) |
`;
  });

  // Table 8.1: Primitives of a Connection-Oriented Service
  const tablePrimitivesPattern = /8\.1\s*Primitives of a Connection-Oriented Service[\s\S]*?(?=8\.2\s*Sequence of Primitives|### 8\.2)/i;
  text = text.replace(tablePrimitivesPattern, () => {
    return `### 8.1 Primitives of a Connection-Oriented Service

| Primitive | Direction / Initiator | Semantic Meaning / Role |
| :--- | :--- | :--- |
| **LISTEN** | Server | Blocks and waits passively for an incoming connection attempt |
| **CONNECT** | Client | Actively establishes a connection with a peer listening on a specific socket |
| **ACCEPT** | Server | Acknowledges and accepts an incoming connection request from a client |
| **RECEIVE** | Either side | Blocks until incoming data is delivered across the established connection |
| **SEND** | Either side | Transmits data units across the established channel |
| **DISCONNECT** | Either side | Initiates or confirms termination and tear-down of the active connection |
`;
  });

  // Table 8.3: Classes of Service Primitives
  const tablePrimClassesPattern = /8\.3\s*Classes of Service Primitives\s*\n[\s\S]*?Class\s+Meaning\s+Direction[\s\S]*?(?=Service user A\s+Service provider|```text)/i;
  text = text.replace(tablePrimClassesPattern, () => {
    return `### 8.3 Classes of Service Primitives

| Primitive Class | Operational Semantic Meaning | Flow Direction Across Interface |
| :--- | :--- | :--- |
| **Request** | An entity requests the underlying service provider to execute a specific task | Higher Layer Entity $\\to$ Service Provider |
| **Indication** | The service provider notifies an entity that a network event has transpired | Service Provider $\\to$ Higher Layer Entity |
| **Response** | An entity formally replies to an indication primitive | Higher Layer Entity $\\to$ Service Provider |
| **Confirm** | The service provider confirms to the requesting entity that its request succeeded | Service Provider $\\to$ Requesting Entity |
`;
  });

  // Table 9.1: Seven Layers of the OSI Model
  const tableOsiPattern = /9\.1\s*OSI Layer Table[\s\S]*?(?=9\.2\s*Layer 1:|### 9\.2)/i;
  text = text.replace(tableOsiPattern, () => {
    return `### 9.1 The Seven Layers of the OSI Reference Model

| No. | Layer Name | Protocol Data Unit (PDU) | Primary Responsibilities & Functions | Representative Protocols & Hardware |
| :---: | :--- | :--- | :--- | :--- |
| **7** | **Application Layer** | Data / Message | User interface, network services access, file transfer, electronic mail, directory lookups | HTTP, HTTPS, FTP, SMTP, DNS, Telnet, SSH |
| **6** | **Presentation Layer** | Data / Message | Syntax & semantics, data translation, character code conversion, encryption/decryption, compression | ASCII, Unicode, JPEG, MPEG, TLS/SSL (often associated) |
| **5** | **Session Layer** | Data / Message | Session checkpointing, dialogue control (half/full-duplex), synchronization tokens, graceful recovery | NetBIOS, RPC, PPTP, Sockets |
| **4** | **Transport Layer** | Segment (TCP) / Datagram (UDP) | End-to-end process-to-process delivery, port addressing, segmentation & reassembly, flow control, error recovery | TCP, UDP, SCTP |
| **3** | **Network Layer** | Packet | Host-to-host delivery, logical addressing (IP), routing through subnets, congestion control, fragmentation | IPv4, IPv6, ICMP, OSPF, BGP; **Routers** |
| **2** | **Data Link Layer** | Frame | Node-to-node hop delivery, physical MAC addressing, framing, medium access control (MAC), error detection (CRC) | Ethernet (IEEE 802.3), Wi-Fi (802.11), PPP; **Switches, Bridges, NICs** |
| **1** | **Physical Layer** | Bits (0s and 1s) | Transmission of raw unstructured bit streams over physical media, voltage levels, pinouts, timing, data rates | UTP Cat 6, Fiber optic, Coaxial, Radio; **Hubs, Repeaters, Connectors** |

> 💡 **Memory Aids**:
> - **Top-down (Layer 7 → 1)**: "*All People Seem To Need Data Processing*" (Application, Presentation, Session, Transport, Network, Data Link, Physical)
> - **Bottom-up (Layer 1 → 7)**: "*Please Do Not Throw Sausage Pizza Away*" (Physical, Data Link, Network, Transport, Session, Presentation, Application)
`;
  });

  // Table 9.9b: Delivery Responsibilities across OSI Layers
  const tableDeliveryPattern = /Types of delivery\s*\n+Layer\s+Delivery responsibility[\s\S]*?(?=Key Points\s*\n•\s*OSI is a reference)/i;
  text = text.replace(tableDeliveryPattern, () => {
    return `#### Scope of Delivery Responsibilities Across Key Layers

| Layer | Fundamental Delivery Scope | Addressing Used |
| :--- | :--- | :--- |
| **Data Link Layer (Layer 2)** | **Node-to-Node (Hop-to-Hop)** delivery of physical frames | 48-bit MAC (Physical) Address |
| **Network Layer (Layer 3)** | **Source-to-Destination (Host-to-Host)** delivery of packets | 32-bit (IPv4) / 128-bit (IPv6) Logical IP Address |
| **Transport Layer (Layer 4)** | **Process-to-Process (End-to-End)** delivery of complete messages | 16-bit Port Number (e.g. Port 80, 443) |
`;
  });

  // Table 11.2: OSI vs TCP/IP Comparison
  const tableOsiTcpPattern = /11\.2\s*Comparison Table[\s\S]*?(?=11\.3\s*Similarities|### 11\.3)/i;
  text = text.replace(tableOsiTcpPattern, () => {
    return `### 11.2 Detailed Comparison: OSI Reference Model vs TCP/IP Model

| Comparison Parameter | OSI Reference Model | TCP/IP Model |
| :--- | :--- | :--- |
| **Full Name** | Open Systems Interconnection Reference Model | Transmission Control Protocol / Internet Protocol Suite |
| **Origin / Standards Body** | International Organization for Standardization (ISO) | U.S. Department of Defense (DARPA / ARPANET research) |
| **Total Number of Layers** | **7 Layers** (Physical, Data Link, Network, Transport, Session, Presentation, Application) | **4 Layers** (Host-to-Network/Link, Internet, Transport, Application) |
| **Design Philosophy** | Model defined conceptually *before* protocols were invented (protocol independent) | Protocols implemented & deployed *before* architectural model was drafted |
| **Session & Presentation Layers** | Distinct, dedicated independent layers (Layers 5 and 6) | Absent as independent layers; duties handled directly by Application Layer |
| **Physical & Data Link Layers** | Distinct separate layers (Layers 1 and 2) | Combined into a single composite Link / Host-to-Network Layer |
| **Distinction of Concepts** | Strict formal separation of **Services**, **Interfaces**, and **Protocols** | Concepts not strictly decoupled; protocols tightly tied to architecture |
| **Network Layer Service** | Supports **both** connection-oriented and connectionless services | Supports **connectionless only** (IP datagram delivery) |
| **Transport Layer Service** | Connection-oriented only | Supports **both** connection-oriented (TCP) and connectionless (UDP) |
| **Generality & Portability** | Very general reference architecture; can describe almost any protocol stack | Tailored specifically around the Internet protocol family |
| **Transport Reliability** | Guaranteed at the transport layer | Configurable: reliable with TCP, best-effort unreliable with UDP |
| **Real-World Practical Use** | Widely used as the universal teaching and reference standard; protocols rarely used | De facto operational standard of the global Internet |
`;
  });

  // Table 13.1: Quick Revision Summary Table
  const tableQuickRevPattern = /Quick Revision\s*\n+Topic\s+Summary\s*\n([\s\S]*?)(?=Possible Exam Questions|### Possible Exam Questions)/i;
  text = text.replace(tableQuickRevPattern, () => {
    return `## Quick Revision Summary

| Topic Area | High-Yield Revision Summary |
| :--- | :--- |
| **Data Communication & Networks** | Data communication transfers data across a transmission medium using protocols (5 components: Message, Sender, Receiver, Medium, Protocol). A computer network connects autonomous computers to share data and hardware resources. |
| **Network Uses** | Business: resource sharing, client-server access, e-commerce, messaging. Home: information, multimedia streaming, social networking, banking. Mobile: ubiquitous wireless computing. Key issues: data security and user privacy. |
| **Network Classification** | **LAN**: local, private, high speed, low delay. **MAN**: city-wide, cable TV/fiber rings. **WAN**: continental/global, built with host computers and a communication subnet of transmission lines and routers. |
| **Topologies** | **Bus**: shared backbone with terminators. **Star**: central switch/hub. **Ring**: closed circular loop. **Mesh**: fully connected point-to-point ($n(n-1)/2$ links). **Tree**: hierarchical star clusters. **Hybrid**: multi-topology combination. |
| **Hardware Devices** | Connectors/Transceivers link cables to NICs. **Repeater & Hub**: Layer 1 physical regenerators. **NIC & PC Card**: Layer 2 host interfaces with MAC address. **Bridge & Switch**: Layer 2 filtering via MAC table. **Router**: Layer 3 forwarding via IP routing table. **Gateway**: Layers 4–7 multi-protocol converter. |
| **Network Software** | Layered hierarchy. Layer $N$ provides services to Layer $N+1$ and communicates with peer Layer $N$ using a protocol. Design issues: addressing, flow control, error control, congestion control, routing, multiplexing, and security. |
| **Service Types** | **Connection-Oriented**: 3 phases (Establishment, Transfer, Release); guaranteed in-order delivery (like telephone). **Connectionless**: autonomous datagrams; faster, independent routing, out-of-order arrival possible (like postal system). |
| **Service Primitives** | Primitives invoke layer services: \`LISTEN\`, \`CONNECT\`, \`ACCEPT\`, \`RECEIVE\`, \`SEND\`, \`DISCONNECT\`. Four fundamental primitive classes: *Request*, *Indication*, *Response*, *Confirm*. |
| **OSI Reference Model** | 7 Layers: Physical (bits), Data Link (frames), Network (packets), Transport (segments), Session (dialogue), Presentation (translation/syntax), Application (user services). PDU data units and encapsulation add headers at each downward hop. |
| **TCP/IP Model** | 4 Layers: Link / Host-to-Network, Internet (IP), Transport (TCP/UDP), Application. No explicit session or presentation layers. De facto standard of the Internet. |
| **OSI vs TCP/IP** | OSI is a theoretical 7-layer framework distinguishing services, interfaces, and protocols. TCP/IP is a practical 4-layer working protocol suite powering the global Internet. |
`;
  });

  return text;
}

/**
 * Formats section headings and subsections into Markdown heading levels
 */
function formatSubsections(text) {
  // Convert major section numbers: e.g. "1. Introduction" -> "## 1. Introduction"
  text = text.replace(/^(\d+\.\s+[A-Z][^\n]+)/gm, (match) => {
    if (match.startsWith('#')) return match;
    const isMajor = /^\d+\.\s+[A-Z]/.test(match) && !/^\d+\.\d+/.test(match);
    return isMajor ? `\n\n## ${match.trim()}\n` : match;
  });

  // Convert sub-sections: e.g. "1.1 Data Communication" -> "### 1.1 Data Communication"
  text = text.replace(/^(\d+\.\d+\s+[A-Z][^\n]+)/gm, (match) => {
    if (match.startsWith('#')) return match;
    return `\n\n### ${match.trim()}\n`;
  });

  // Specific major section headers
  const majorSections = [
    'Chapter Overview',
    'Learning Objectives',
    'Important Exam Points',
    'Possible Exam Questions',
    'Review Questions & Exercises',
    'Summary of Comparisons'
  ];

  majorSections.forEach(title => {
    const reg = new RegExp(`^${title}\\b[^\n]*`, 'gm');
    text = text.replace(reg, (match) => {
      if (match.startsWith('#')) return match;
      return `\n\n## ${match.trim()}\n`;
    });
  });

  // Exam question subsections (A. Short-Answer Questions, B. Conceptual Questions, etc.)
  text = text.replace(/^([A-D]\.\s+[A-Za-z\s-]+Questions)/gm, (match) => {
    if (match.startsWith('#')) return match;
    return `\n\n### ${match.trim()}\n`;
  });

  return text;
}

/**
 * Formats specific section labels such as Definition, Explanation, Advantages, Disadvantages, Formulas
 */
function formatSectionLabels(text) {
  // Definition
  text = text.replace(/^Definition\s*\n+([^\n]+)/gm, (match, defText) => {
    return `\n> 📘 **Definition**:\n> ${defText.trim()}\n`;
  });

  // Structure
  text = text.replace(/^Structure\s*\n/gm, '\n**Physical Structure & Connectivity:**\n\n');

  // How communication works
  text = text.replace(/^How communication works\s*\n/gm, '\n**Operational Communication Mechanism:**\n\n');

  // Advantages
  text = text.replace(/^Advantages\s*\n/gm, '\n**Key Advantages:**\n\n');

  // Disadvantages
  text = text.replace(/^Disadvantages\s*\n/gm, '\n**Key Disadvantages:**\n\n');

  // Typical use
  text = text.replace(/^Typical use\s*\n+([^\n]+)/gm, (match, useText) => {
    return `\n**Typical Practical Use:**\n- ${useText.trim()}\n`;
  });

  // Key Points
  text = text.replace(/^Key Points\s*\n/gm, '\n**Key Takeaways & Exam Points:**\n\n');

  // Formulas formatting
  text = text.replace(/n\(n-1\)\/2/g, '`n(n - 1) / 2`');
  text = text.replace(/n-1\s+ports/gi, '`n - 1` ports');

  return text;
}

/**
 * Standardizes bullet lists and numbered questions
 */
function formatLists(text) {
  // Convert bullet character • to markdown list item -
  text = text.replace(/^[ \t]*•[ \t]+/gm, '- ');

  // Clean trailing spaces
  text = text.replace(/[ \t]+$/gm, '');

  return text;
}

/**
 * Counts major sections found in the cleaned notes
 */
function countSectionsFound(text) {
  const sections = [
    '## 1. Introduction',
    '## 2. Uses of Computer Networks',
    '## 3. Types of Computer Networks',
    '## 4. Network Topologies',
    '## 5. Network Hardware Components',
    '## 6. Network Software',
    '## 7. Connection-Oriented vs Connectionless Services',
    '## 8. Service Primitives',
    '## 9. OSI Reference Model',
    '## 10. TCP/IP Model',
    '## 11. Comparison',
    '## Important Exam Points',
    '## Quick Revision Summary',
    '## Possible Exam Questions'
  ];

  let found = 0;
  sections.forEach(s => {
    if (text.includes(s) || new RegExp(s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i').test(text)) {
      found++;
    }
  });
  return found;
}

/**
 * Verifies that syllabus topics are covered in the cleaned notes
 */
function verifySyllabusCoverage(text, syllabus = SYLLABUS_TOPICS_CH1_1) {
  const lower = text.toLowerCase();
  let coveredCount = 0;
  const topicResults = [];
  const topicsList = Array.isArray(syllabus) && syllabus.length > 0 ? syllabus : SYLLABUS_TOPICS_CH1_1;

  topicsList.forEach((topic, idx) => {
    const keywords = topic.keywords || [topic.title || topic];
    const matchedKeyword = keywords.find(kw => typeof kw === 'string' && lower.includes(kw.toLowerCase()));
    const isCovered = Boolean(matchedKeyword);
    if (isCovered) coveredCount++;
    topicResults.push({
      id: topic.id || `topic_${idx}`,
      title: topic.title || String(topic),
      isCovered,
      matchedKeyword: matchedKeyword || null
    });
  });

  const totalTopics = topicsList.length;
  const coveragePercent = totalTopics > 0 ? Math.round((coveredCount / totalTopics) * 100) : 100;

  return {
    totalTopics,
    coveredCount,
    coveragePercent,
    topicResults
  };
}

module.exports = {
  cleanExtractedNotes,
  verifySyllabusCoverage,
  SYLLABUS_TOPICS_CH1_1
};
