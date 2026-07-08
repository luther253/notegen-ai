// Curated Mock templates for popular topics to make the application look incredibly rich
const CURATED_TEMPLATES = {
  'binary search trees': {
    title: 'Understanding Binary Search Trees (BST)',
    content: `# Understanding Binary Search Trees (BST) 🌳

A **Binary Search Tree (BST)** is a node-based binary tree data structure which has the following properties:
* The left subtree of a node contains only nodes with keys lesser than the node's key.
* The right subtree of a node contains only nodes with keys greater than the node's key.
* The left and right subtree must each also be a binary search tree.

## Key Concepts 💡

1. **Root**: The top node of a tree, from which all other nodes are descended.
2. **Leaf Node**: A node with no children (left and right pointers are null).
3. **In-Order Traversal**: A traversal method that visits nodes in the order: Left, Root, Right. For a BST, this visits nodes in ascending sorted order.
4. **Time Complexity**:
   * **Search / Insertion / Deletion**: $O(\\log n)$ in balanced trees, $O(n)$ in skewed trees.

---

## Detailed Explanation 🔍

In a BST, search operations are highly efficient. When searching for a key $X$, we compare it with the root node:
1. If $X$ is equal to the root, we return the root.
2. If $X$ is less than the root, we recursively search the left child.
3. If $X$ is greater than the root, we recursively search the right child.

### Example in JavaScript
Here is a basic implementation of a BST Node and Insertion:

\`\`\`javascript
class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(value) {
    const newNode = new Node(value);
    if (!this.root) {
      this.root = newNode;
      return this;
    }
    let current = this.root;
    while (true) {
      if (value === current.value) return undefined;
      if (value < current.value) {
        if (!current.left) {
          current.left = newNode;
          return this;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = newNode;
          return this;
        }
        current = current.right;
      }
    }
  }
}
\`\`\`

---

## Advantages & Disadvantages ⚖️

### Advantages
* **Efficient searching**: Logarithmic search time under balanced conditions.
* **Dynamic sizing**: Unlike arrays, BST elements are allocated dynamically.
* **Sorted retrieval**: Retrieving elements in sorted order is easily done using an in-order traversal in $O(n)$ time.

### Disadvantages
* **Worst-case performance**: If nodes are inserted in sorted order, the tree becomes a linked list (skewed), degrading search times to $O(n)$.
* **Complexity**: Keeping trees balanced (e.g., using AVL or Red-Black trees) requires additional balancing logic.

---

## Real-world Applications 🌐

* **Database Indexing**: Many databases use B-Trees (a self-balancing generalization of BSTs) to index memory locations.
* **Routing Tables**: IP routing tables use binary trees to find matching subnets.
* **Huffman Coding**: Compression algorithms use binary structures to build codes.

---

## Exam Tips & Common Mistakes 📝

> [!IMPORTANT]
> **Exam Tip**: Remember that the *In-Order Traversal* of a Binary Search Tree always yields a sorted list of elements. If a question asks you to find the sorted elements of a BST, simply perform an in-order traversal!

### Common Mistakes
* **Assuming $O(\\log n)$ is guaranteed**: Students often forget that if the tree is not balanced, the complexity degrades to $O(n)$.
* **Losing Pointers**: When deleting nodes, always ensure you adjust child pointers correctly to avoid memory leaks or orphaned subtrees.

---

## Summary
Binary Search Trees are foundational data structures providing log-time insertion and retrieval when balanced. They form the basis for self-balancing trees used in databases and file systems.`,
    flashcards: [
      { front: 'What is a Binary Search Tree (BST)?', back: 'A node-based binary tree where the left child key is less than the parent key, and the right child key is greater than the parent key.' },
      { front: 'What is the time complexity of searching in a balanced BST?', back: 'O(log n)' },
      { front: 'What traversal method visits a BST in ascending sorted order?', back: 'In-order traversal (Left, Root, Right)' },
      { front: 'What is the worst-case time complexity of a BST?', back: 'O(n), which occurs when the tree becomes skewed (like a linked list).' },
      { front: 'What are AVL trees and Red-Black trees?', back: 'Self-balancing binary search trees that maintain O(log n) time complexity by performing rotations.' }
    ],
    quiz: [
      {
        type: 'mcq',
        question: 'What is the time complexity of searching a value in a skewed (unbalanced) Binary Search Tree?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        answer: 'O(n)'
      },
      {
        type: 'tf',
        question: 'The right subtree of a BST node contains keys smaller than the node\'s key.',
        answer: 'False'
      },
      {
        type: 'short',
        question: 'Which tree traversal visits the nodes in sorted ascending order?',
        answer: 'In-order traversal'
      },
      {
        type: 'mcq',
        question: 'In a BST, which node has no children?',
        options: ['Root node', 'Internal node', 'Leaf node', 'Parent node'],
        answer: 'Leaf node'
      }
    ]
  },
  
  'photosynthesis': {
    title: 'Photosynthesis: Light & Dark Reactions',
    content: `# Photosynthesis: Converting Light to Energy 🌿

**Photosynthesis** is the biological process by which green plants, algae, and some bacteria convert light energy, usually from the sun, into chemical energy (glucose) using water and carbon dioxide.

The overall chemical equation for photosynthesis is:
$$6CO_2 + 6H_2O \\xrightarrow{\\text{Light}} C_6H_{12}O_6 + 6O_2$$

---

## Key Concepts 💡

1. **Chloroplasts**: Organelles in plant cells where photosynthesis occurs.
2. **Chlorophyll**: The primary green pigment in plants that absorbs blue and red light.
3. **Thylakoid**: Disk-like structures inside chloroplasts where the Light Reactions occur.
4. **Stroma**: The fluid-filled space surrounding thylakoids where the Dark Reactions (Calvin Cycle) occur.

---

## Detailed Explanation 🔍

Photosynthesis is split into two primary stages:

### 1. Light-Dependent Reactions
* **Location**: Thylakoid membrane.
* **Mechanism**: Light energy excites electrons in chlorophyll. These electrons pass through the Electron Transport Chain (ETC), generating ATP and NADPH. Water molecules are split (photolysis) to replace these electrons, releasing oxygen ($O_2$) gas as a byproduct.

### 2. Light-Independent Reactions (Calvin Cycle / Dark Reactions)
* **Location**: Stroma.
* **Mechanism**: Uses the ATP and NADPH produced in the light reactions, along with Carbon Dioxide ($CO_2$) from the atmosphere, to produce G3P (a 3-carbon sugar that forms glucose). This is called *carbon fixation*.

---

## Real-world Applications 🌐

* **Agriculture**: Maximizing greenhouse photosynthesis through controlled LED lighting and increased $CO_2$ levels.
* **Carbon Offsetting**: Plantations absorb greenhouse gas carbon dioxide, storing carbon in timber.
* **Solar Energy**: Research into artificial photosynthesis to generate green fuels from sunlight and water.

---

## Exam Tips & Common Mistakes 📝

> [!IMPORTANT]
> **Exam Tip**: The "Dark Reactions" do not require darkness to occur! They are called "light-independent" because they don't directly use photons, but they rely on ATP and NADPH which are generated *only* during the light reactions.

### Common Mistakes
* **Confusing Thylakoids and Stroma**: Remember that Light reactions take place in the **Thylakoid** (since chlorophyll is in the membrane), while Dark reactions fix Carbon in the **Stroma** (fluid).

---

## Summary
Photosynthesis uses chlorophyll to capture sunlight, generating oxygen from water and storing chemical energy in carbohydrates via carbon fixation (Calvin Cycle).`,
    flashcards: [
      { front: 'What organelle is the site of photosynthesis?', back: 'The chloroplast' },
      { front: 'What are the main inputs of photosynthesis?', back: 'Carbon Dioxide (CO2), Water (H2O), and Light energy.' },
      { front: 'Where do the light-dependent reactions take place?', back: 'The thylakoid membranes.' },
      { front: 'Where does the Calvin Cycle (dark reactions) take place?', back: 'The stroma of the chloroplast.' },
      { front: 'What gas is released as a byproduct during light reactions?', back: 'Oxygen (O2)' }
    ],
    quiz: [
      {
        type: 'mcq',
        question: 'Which pigment absorbs light for photosynthesis?',
        options: ['Carotene', 'Chlorophyll', 'Xanthophyll', 'Anthocyanin'],
        answer: 'Chlorophyll'
      },
      {
        type: 'tf',
        question: 'The light-independent reactions (Calvin Cycle) can only occur at night.',
        answer: 'False'
      },
      {
        type: 'short',
        question: 'What is the principal sugar produced by photosynthesis?',
        answer: 'Glucose'
      }
    ]
  }
};

// Generate high quality generic fallback note for other subjects
export const generateMockNote = (subject, topic, difficulty, length, style, language, extra = '') => {
  const cleanTopic = topic.toLowerCase().trim();
  
  if (CURATED_TEMPLATES[cleanTopic]) {
    const template = CURATED_TEMPLATES[cleanTopic];
    return {
      title: template.title,
      content: template.content,
      flashcards: template.flashcards,
      quiz: template.quiz
    };
  }

  // Generate dynamic note content for custom topics
  const title = `Comprehensive Study Guide: ${topic}`;
  
  const content = `# Study Guide: ${topic} 📘

> [!NOTE]
> **Mock Note Mode**: You are currently viewing a dynamically structured note template. To unlock fully customized live AI notes generated by Google Gemini, please configure your **Gemini API Key** in the **Settings** page!

This note covers **${topic}** under the subject of **${subject}** tailored to a **${difficulty}** difficulty level.

## Introduction 🌟
${topic} represents a crucial area of study in ${subject}. It deals with fundamental principles that govern how systems behave and interact. Understanding this topic helps establish a strong baseline for advanced coursework.
${extra ? `\n> **Custom Instructions applied**: ${extra}\n` : ''}

## Key Concepts 💡

* **Primary Element**: The focal point of the study, defining how variables interact within the domain.
* **Theoretical Framework**: The set of equations, rules, or constructs that support these ideas.
* **Practical Implementation**: Applying theory to actual experiments, equations, or source code.
* **Critical Variables**: Factors that modify outcomes, including bounds, limits, and environmental variables.

---

## Detailed Explanation & Analysis 🔍

To understand ${topic}, we must examine its internal mechanics. Under the **${difficulty}** standard, we analyze:
1. **Core Mechanism**: How the primary components interact.
2. **System Constraints**: The rules governing stability and performance.
3. **Application Protocol**: The steps taken to use these concepts in problem solving.

### Example Scenario
Let's consider a practical illustration. If we apply this in a standard laboratory or calculation environment, we evaluate the following step-by-step model:
* **Step 1**: Identify key parameters and constraints.
* **Step 2**: Calculate base coefficients or apply formulas.
* **Step 3**: Formulate conclusions based on the resulting values.

---

## Advantages & Disadvantages ⚖️

### Advantages
* **Reliability**: Established principles provide a stable foundation for calculations and modeling.
* **Predictability**: Standard variables lead to reproducible results in most environments.
* **Clarity**: Offers simplified models to explain complex real-world behaviors.

### Disadvantages
* **Assumptions**: Models often rely on idealized circumstances (e.g., ignoring friction or noise).
* **Scalability limits**: Methods that work for small scales may break down in larger systems.

---

## Real-world Applications 🌐

* **Industry Engineering**: These ideas are used to build commercial applications and infrastructure.
* **Scientific Research**: Forming the basis for peer-reviewed studies and new technology.
* **Daily Optimization**: Improving performance of consumer goods, computing, or logistics.

---

## Exam Tips & Common Mistakes 📝

> [!IMPORTANT]
> **Exam Tip**: When writing essay or calculation answers about ${topic}, always state the underlying assumptions first (e.g., "assuming ideal conditions"). This secures extra points for methodology!

### Common Mistakes
* **Ignoring Units/Bounds**: Confusing input dimensions or boundary constraints, leading to scale errors.
* **Oversimplification**: Treating dynamic systems as static, which ignores critical feedback loops.

---

## Summary
${topic} is an essential cornerstone of ${subject}. Applying active study techniques (such as flashcards and mock tests) is recommended to lock in these concepts before examination.`;

  const flashcards = [
    { front: `What is the core definition of ${topic}?`, back: `An essential concept in ${subject} dealing with core theoretical frameworks and structural analysis.` },
    { front: `Name one major advantage of studying ${topic}.`, back: `Provides reliable, predictable, and clear foundational models for solving complex problems.` },
    { front: `What is a common mistake students make with ${topic}?`, back: `Ignoring boundary constraints and units of measurement during calculation.` },
    { front: `What difficulty is this ${topic} study guide targeted at?`, back: `This notes set is specifically tailored for a ${difficulty} level of study.` }
  ];

  const quiz = [
    {
      type: 'mcq',
      question: `Under which subject is the topic "${topic}" categorized?`,
      options: [subject, 'Unrelated Subject', 'General Studies', 'Advanced Arts'],
      answer: subject
    },
    {
      type: 'tf',
      question: `True or False: ${topic} is considered a minor topic with no real-world application.`,
      answer: 'False'
    },
    {
      type: 'short',
      question: `What difficulty level is this guide configured for?`,
      answer: difficulty
    }
  ];

  return { title, content, flashcards, quiz };
};
