export interface Review {
  user: string
  upvotes: number
  text: string
}

export type ResourceType = 'Conference' | 'Hackathon' | 'Community' | 'Online Course' | 'Workshop'

export interface Resource {
  icon: string
  title: string
  type: ResourceType
  desc: string
  meta: string        // e.g. "Dec 2025 · Vancouver" or "Self-paced · Free"
  url?: string
}

export interface Course {
  code: string
  name: string
  status: 'completed' | 'available' | 'recommended' | 'locked'
  credits: number
  category: string
  badge: string
  desc: string
  prereqs: string[]
  unlocks: string[]
  reviews: Review[]
  resources: Resource[]
}

export const courses: Record<string, Course> = {
  cpsc110: {
    code: 'CPSC 110', name: 'Computation, Programs & Programming',
    status: 'completed', credits: 4, category: 'Completed', badge: '✓ Done',
    desc: 'Fundamentals of programming and systematic program design using functional programming in Racket. Covers recursion, abstraction, data representation, and higher-order functions.',
    prereqs: ['None'], unlocks: ['CPSC 210', 'CPSC 121'],
    reviews: [
      { user: 'u/cs_student_ubc', upvotes: 142, text: "Racket feels weird at first but you'll get used to it. The workload is real — don't procrastinate. TAs are super helpful, use office hours!" },
      { user: 'u/firstyear_cs', upvotes: 89, text: 'Best intro course for learning how to think like a programmer. The functional mindset sticks with you throughout your degree.' },
    ],
    resources: [],
  },
  cpsc121: {
    code: 'CPSC 121', name: 'Models of Computation',
    status: 'completed', credits: 4, category: 'Completed', badge: '✓ Done',
    desc: 'Introduction to mathematical foundations of computer science including propositional logic, Boolean algebra, digital circuits, and finite automata.',
    prereqs: ['CPSC 110'], unlocks: ['CPSC 221'],
    reviews: [
      { user: 'u/mathcs_fan', upvotes: 76, text: 'Heavy on discrete math and proofs. Having a discrete math background helps a lot. The labs are actually fun though.' },
      { user: 'u/ubccs_2024', upvotes: 54, text: 'Difficulty varies a lot by section and instructor. Choose your section wisely!' },
    ],
    resources: [],
  },
  math100: {
    code: 'MATH 100', name: 'Differential Calculus',
    status: 'completed', credits: 3, category: 'Completed', badge: '✓ Done',
    desc: 'Limits, derivatives, and applications of differentiation. Essential foundation for science and engineering programs.',
    prereqs: ['Pre-Calculus 12 or equivalent'], unlocks: ['MATH 101', 'MATH 200'],
    reviews: [
      { user: 'u/stem_ubc', upvotes: 63, text: "Not too bad if you have high school calc. Stay on top of WeBWorK assignments and you'll be fine." },
    ],
    resources: [],
  },
  math101: {
    code: 'MATH 101', name: 'Integral Calculus',
    status: 'completed', credits: 3, category: 'Completed', badge: '✓ Done',
    desc: 'Techniques of integration, sequences, series, and their applications. Provides the mathematical foundation for ML and statistics.',
    prereqs: ['MATH 100'], unlocks: ['MATH 200', 'MATH 221'],
    reviews: [
      { user: 'u/calculus_survivor', upvotes: 91, text: 'Noticeably harder than MATH 100. The series portion trips everyone up. Final exam is worth a lot — study accordingly.' },
      { user: 'u/ubc_math_major', upvotes: 48, text: 'The integration applications section is genuinely useful later. Good professor made a big difference for me.' },
    ],
    resources: [],
  },
  cpsc210: {
    code: 'CPSC 210', name: 'Software Construction',
    status: 'completed', credits: 4, category: 'Completed', badge: '✓ Done',
    desc: 'Object-oriented programming, software design principles, design patterns, and testing in Java. Core foundation for software engineering.',
    prereqs: ['CPSC 110'], unlocks: ['CPSC 221', 'CPSC 310', 'CPSC 330'],
    reviews: [
      { user: 'u/java_enjoyer', upvotes: 187, text: 'The personal project is genuinely fun and great for your portfolio. First two weeks are rough getting used to Java, but push through.' },
      { user: 'u/softeng_path', upvotes: 134, text: 'High workload but you actually learn real software dev practices. Worth every hour.' },
      { user: 'u/cs_sophomore', upvotes: 72, text: 'Pay attention to design patterns — they seem abstract now but come up in every job interview later.' },
    ],
    resources: [
      {
        icon: '🏆',
        title: 'nwHacks',
        type: 'Hackathon',
        desc: "Western Canada's largest hackathon hosted at UBC — great first hackathon to apply your CPSC 210 skills on a real project.",
        meta: 'Jan 2026 · UBC Vancouver',
      },
      {
        icon: '🐙',
        title: 'GitHub Student Developer Pack',
        type: 'Workshop',
        desc: 'Free access to 100+ developer tools including GitHub Copilot, JetBrains IDEs, and cloud credits. Essential for any CS student.',
        meta: 'Ongoing · Free with .edu email',
      },
      {
        icon: '🤝',
        title: 'UBC BizTech',
        type: 'Community',
        desc: "UBC's largest tech club — hosts workshops, case competitions, and networking events connecting students with industry.",
        meta: 'Ongoing · UBC Vancouver',
      },
    ],
  },
  cpsc221: {
    code: 'CPSC 221', name: 'Basic Algorithms & Data Structures',
    status: 'available', credits: 4, category: 'Available', badge: 'Available',
    desc: 'Sorting, searching, hashing, trees, and graph algorithms. Prerequisite for most upper-level CS courses.',
    prereqs: ['CPSC 210', 'CPSC 121'], unlocks: ['CPSC 320', 'CPSC 340', 'CPSC 313', 'CPSC 422'],
    reviews: [
      { user: 'u/algo_grind', upvotes: 203, text: 'Essential for coding interviews. Assignment difficulty is inconsistent but the content is gold. Brush up on C++ beforehand.' },
      { user: 'u/ubccs_3rd', upvotes: 158, text: 'Hardest course I had in 2nd year but the most important. Everything you learn here shows up in tech interviews.' },
    ],
    resources: [
      {
        icon: '💻',
        title: 'LeetCode Weekly Contest',
        type: 'Community',
        desc: 'Weekly online algorithm contests to sharpen your problem-solving. CPSC 221 content maps directly to most medium/hard problems.',
        meta: 'Every Sunday · Online · Free',
      },
      {
        icon: '🏆',
        title: 'ICPC North America Regional',
        type: 'Conference',
        desc: 'International Collegiate Programming Contest — team-based algorithm competition. UBC fields competitive teams every year.',
        meta: 'Nov 2025 · Regional sites · Free',
      },
      {
        icon: '🎓',
        title: 'UBC ACM Student Chapter',
        type: 'Community',
        desc: 'Hosts algorithm workshops, mock interview sessions, and practice contests. Perfect companion while taking CPSC 221.',
        meta: 'Ongoing · UBC Vancouver',
      },
    ],
  },
  math200: {
    code: 'MATH 200', name: 'Calculus III',
    status: 'available', credits: 3, category: 'Available', badge: 'Available',
    desc: 'Multivariable functions, partial derivatives, multiple integrals, and vector calculus. Advanced math foundation for ML.',
    prereqs: ['MATH 101'], unlocks: ['MATH 301', 'CPSC 340'],
    reviews: [
      { user: 'u/multivar_pain', upvotes: 67, text: 'Visualizing 3D space is rough at first. Watch YouTube videos alongside lectures. The final carries a lot of weight.' },
    ],
    resources: [
      {
        icon: '📐',
        title: '3Blue1Brown — Calculus Series',
        type: 'Online Course',
        desc: 'Stunning visual explanations of multivariable calculus concepts. Highly recommended to watch alongside MATH 200 lectures.',
        meta: 'Self-paced · Free · YouTube',
      },
    ],
  },
  math221: {
    code: 'MATH 221', name: 'Matrix Algebra',
    status: 'available', credits: 3, category: 'Available', badge: 'Available',
    desc: 'Matrix operations, vector spaces, linear transformations, eigenvalues and eigenvectors. Absolutely essential for ML and AI.',
    prereqs: ['MATH 101'], unlocks: ['CPSC 340', 'MATH 307'],
    reviews: [
      { user: 'u/linearalg_fan', upvotes: 241, text: 'If you want to do ML, this course is non-negotiable. It feels abstract at first but suddenly everything clicks when you start CPSC 340.' },
      { user: 'u/math_cs_double', upvotes: 118, text: '3Blue1Brown on YouTube is a perfect companion to this course. Builds incredible intuition for the material.' },
    ],
    resources: [
      {
        icon: '📐',
        title: '3Blue1Brown — Essence of Linear Algebra',
        type: 'Online Course',
        desc: '16-episode visual series that builds geometric intuition for everything in MATH 221. Watch this and the course will click immediately.',
        meta: 'Self-paced · Free · YouTube',
      },
      {
        icon: '📊',
        title: 'fast.ai — Practical Deep Learning',
        type: 'Online Course',
        desc: 'Shows you exactly how MATH 221 concepts power real neural networks. Great motivation for why linear algebra matters in ML.',
        meta: 'Self-paced · Free',
      },
    ],
  },
  cpsc340: {
    code: 'CPSC 340', name: 'Machine Learning & Data Mining',
    status: 'recommended', credits: 3, category: 'AI Recommended', badge: '★ AI Pick #1',
    desc: 'Core ML theory and algorithms including linear regression, SVMs, decision trees, neural networks, and unsupervised methods. The cornerstone of the AI/ML track.',
    prereqs: ['CPSC 221', 'MATH 221 or MATH 152', 'MATH 200'], unlocks: ['CPSC 440', 'CPSC 422', 'CPSC 532'],
    reviews: [
      { user: 'u/ml_aspirant', upvotes: 312, text: 'Best CS course at UBC, no contest. Perfect balance of math theory and practical implementation. Make sure your prereqs are solid.' },
      { user: 'u/bigtech_intern', upvotes: 287, text: 'Got a Google internship and literally everything in the interviews came from this course. Life-changing class.' },
      { user: 'u/gradschool_bound', upvotes: 195, text: 'Pace is fast. Lock in MATH 221 before this or you will struggle. Professor is incredibly passionate about the material.' },
    ],
    resources: [
      {
        icon: '🧠',
        title: 'NeurIPS 2025',
        type: 'Conference',
        desc: "The world's top ML conference. Attend workshops and talks to see where the field is heading — directly relevant to CPSC 340 topics.",
        meta: 'Dec 2025 · Vancouver Convention Centre',
      },
      {
        icon: '🏆',
        title: 'Kaggle Competitions',
        type: 'Community',
        desc: 'Apply CPSC 340 algorithms on real-world datasets. Even top 30% finishes look great on a resume and build intuition fast.',
        meta: 'Ongoing · Online · Free',
      },
      {
        icon: '🤖',
        title: 'UBC AI Club',
        type: 'Community',
        desc: 'Weekly paper reading sessions, project showcases, and industry speaker events. Great place to find teammates for ML projects.',
        meta: 'Ongoing · UBC Vancouver',
      },
      {
        icon: '📊',
        title: 'fast.ai — Practical Deep Learning',
        type: 'Online Course',
        desc: 'Hands-on complement to CPSC 340 — get neural networks running in PyTorch while the course covers the math underneath.',
        meta: 'Self-paced · Free',
      },
    ],
  },
  cpsc330: {
    code: 'CPSC 330', name: 'Applied Machine Learning',
    status: 'recommended', credits: 3, category: 'AI Recommended', badge: '★ AI Pick #2',
    desc: 'Hands-on ML with Python and scikit-learn. Covers data preprocessing, model selection, evaluation, and real-world ML pipelines.',
    prereqs: ['CPSC 210', 'MATH 200 recommended'], unlocks: ['CPSC 340'],
    reviews: [
      { user: 'u/practical_ml', upvotes: 176, text: 'Way more approachable than CPSC 340 — less math, more Python. Assignments feel like Kaggle competitions which is awesome.' },
      { user: 'u/datascience_path', upvotes: 143, text: 'Perfect if you want to get into data science. You build a real portfolio of projects by the end.' },
    ],
    resources: [
      {
        icon: '🏆',
        title: 'Kaggle Learn',
        type: 'Online Course',
        desc: 'Free micro-courses on pandas, scikit-learn, and ML pipelines — perfectly aligned with CPSC 330 content. Great for building portfolio notebooks.',
        meta: 'Self-paced · Free',
      },
      {
        icon: '📅',
        title: 'Vancouver Data Science Meetup',
        type: 'Community',
        desc: 'Monthly meetup with industry talks and project demos. Good way to see what applied ML looks like in production at local companies.',
        meta: 'Monthly · Vancouver · Free',
      },
      {
        icon: '🧪',
        title: 'DemystifyML Workshop',
        type: 'Workshop',
        desc: 'UBC-hosted half-day workshop covering the full ML lifecycle from data cleaning to model deployment. Beginner-friendly.',
        meta: 'Feb 2026 · UBC Vancouver · Free',
      },
    ],
  },
  cpsc422: {
    code: 'CPSC 422', name: 'Intelligent Systems',
    status: 'locked', credits: 3, category: 'Locked', badge: '○ Prereq needed',
    desc: 'Knowledge representation, reasoning, planning, constraint satisfaction, and learning. Advanced AI concepts building on CPSC 340.',
    prereqs: ['CPSC 322', 'CPSC 340'], unlocks: ['CPSC 424'],
    reviews: [
      { user: 'u/ai_senior', upvotes: 84, text: 'Really interesting once you have the prereqs. Project-heavy course so find good teammates early.' },
    ],
    resources: [
      {
        icon: '🧠',
        title: 'AAAI 2026',
        type: 'Conference',
        desc: "Top academic AI conference covering symbolic reasoning, planning, and constraint satisfaction — the exact topics in CPSC 422.",
        meta: 'Feb 2026 · Philadelphia · Student rates available',
      },
      {
        icon: '🤝',
        title: 'AI Safety Vancouver',
        type: 'Community',
        desc: 'Reading group focused on AI alignment and safety research. Relevant if you\'re heading toward graduate research in intelligent systems.',
        meta: 'Bi-weekly · Vancouver · Free',
      },
    ],
  },
  cpsc440: {
    code: 'CPSC 440', name: 'Advanced Machine Learning',
    status: 'locked', credits: 3, category: 'Locked', badge: '○ Prereq needed',
    desc: 'Deep learning, generative models, Bayesian methods, and reinforcement learning. Cutting-edge ML techniques for advanced students.',
    prereqs: ['CPSC 340'], unlocks: ['CPSC 550'],
    reviews: [
      { user: 'u/deep_learner', upvotes: 156, text: "Basically CPSC 340 on steroids. Heavy reading load with papers but you'll be at the research frontier. Recommended for grad school applicants." },
    ],
    resources: [
      {
        icon: '🧠',
        title: 'NeurIPS 2025',
        type: 'Conference',
        desc: 'Most CPSC 440 paper readings come directly from NeurIPS proceedings. Attending is transformative for understanding the research frontier.',
        meta: 'Dec 2025 · Vancouver Convention Centre',
      },
      {
        icon: '🔬',
        title: 'UBC ML Research Group (MLRG)',
        type: 'Community',
        desc: 'Weekly research talks by UBC faculty and students. Taking CPSC 440 makes you ready to contribute to or collaborate with MLRG projects.',
        meta: 'Weekly · UBC Vancouver · Free',
      },
      {
        icon: '📄',
        title: 'Papers with Code',
        type: 'Online Course',
        desc: 'Browse state-of-the-art ML papers with reproducible code. Pairs perfectly with CPSC 440\'s paper-reading curriculum.',
        meta: 'Ongoing · Free · paperswithcode.com',
      },
    ],
  },
}

export const connections: [string, string][] = [
  ['cpsc110', 'cpsc210'], ['cpsc110', 'cpsc121'],
  ['cpsc121', 'cpsc221'], ['cpsc210', 'cpsc221'],
  ['math100', 'math101'], ['math101', 'math200'], ['math101', 'math221'],
  ['cpsc221', 'cpsc340'], ['math221', 'cpsc340'], ['math200', 'cpsc340'],
  ['cpsc210', 'cpsc330'],
  ['cpsc340', 'cpsc440'], ['cpsc221', 'cpsc422'],
]

export const nodePositions: Record<string, [number, number]> = {
  cpsc110: [20, 50],  cpsc121: [20, 170], math100: [20, 290], math101: [20, 390],
  cpsc210: [195, 50],
  cpsc221: [390, 50], math200: [390, 190], math221: [390, 315],
  cpsc340: [595, 50], cpsc330: [595, 190], cpsc422: [595, 330], cpsc440: [595, 440],
}
