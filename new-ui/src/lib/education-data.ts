/**
 * education-data.ts
 * Static content for the Financial Education / Learn page.
 * Includes flip cards, video lessons, and advisory quiz data.
 */

export const educationCards = [
  { id: "e1", question: "What is an Emergency Fund?", answer: "An emergency fund is 3-6 months of living expenses set aside in a liquid account. It's your financial safety net for unexpected events like job loss or medical emergencies. Think of it as your personal insurance policy.", category: "Foundations", difficulty: "Beginner" },
  { id: "e2", question: "What is Debt-to-Income Ratio?", answer: "DTI ratio = (Total Monthly Debt Payments / Gross Monthly Income) x 100. A DTI below 36% is generally considered healthy. If yours is above 43%, focus on paying down debt before taking on new obligations.", category: "Debt", difficulty: "Intermediate" },
  { id: "e3", question: "How to Control Impulse Spending?", answer: "Use the 24-hour rule: wait a full day before any unplanned purchase over Rs 500. Also try the 'cost per use' method \u2014 if an item costs Rs 3,000 and you'll use it 3 times, it costs Rs 1,000 per use. Often that realization kills the urge.", category: "Behavior", difficulty: "Beginner" },
  { id: "e4", question: "Why Does Budgeting Matter?", answer: "Budgeting is telling your money where to go instead of wondering where it went. People with a written budget save on average 18% more per month than those without one. Even a rough budget beats no budget.", category: "Planning", difficulty: "Beginner" },
  { id: "e5", question: "What is the 50/30/20 Rule?", answer: "50% of take-home pay goes to Needs (rent, food, utilities). 30% goes to Wants (dining, entertainment). 20% goes to Savings and Debt. This rule gives you a simple framework to start budgeting without complex spreadsheets.", category: "Planning", difficulty: "Beginner" },
  { id: "e6", question: "What is a Savings Rate?", answer: "Savings rate = (Amount Saved / Gross Income) x 100. Saving 20% is considered excellent; 10-15% is good; under 5% is concerning. Even saving 1% more each month compounds into significant wealth over time.", category: "Savings", difficulty: "Beginner" },
  { id: "e7", question: "What is Lifestyle Creep?", answer: "Lifestyle creep is when your spending rises as your income rises \u2014 you earn more but save the same amount. To avoid it, commit to saving 50% of every raise before adjusting your lifestyle.", category: "Behavior", difficulty: "Intermediate" },
  { id: "e8", question: "How Does Compounding Work?", answer: "Compounding means earning returns on your returns. Rs 10,000 saved at 8% per year becomes Rs 21,589 in 10 years, Rs 46,610 in 20 years, and Rs 1,00,627 in 30 years \u2014 without adding a single rupee. Time is the most powerful ingredient.", category: "Foundations", difficulty: "Intermediate" },
];

export const videoLessons = [
  { id: "v1", title: "Building a Bullet-Proof Emergency Fund", category: "Risk", duration: "12:34", thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80", youtubeId: "gyMwXuJrbJQ" },
  { id: "v2", title: "Tax-Loss Harvesting: Advanced Strategies", category: "Tax", duration: "18:07", thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80", youtubeId: "p7HKvqRI_Bo" },
  { id: "v3", title: "Portfolio Rebalancing for Maximum Alpha", category: "Portfolio", duration: "22:15", thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80", youtubeId: "PHe0bXAIuk0" },
  { id: "v4", title: "Understanding Market Cycles & Regime Shifts", category: "Markets", duration: "15:42", thumbnail: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&q=80", youtubeId: "Xn7KWR9EOGQ" },
  { id: "v5", title: "Debt Structuring for High Net Worth", category: "Debt", duration: "20:10", thumbnail: "https://images.unsplash.com/photo-1518458028785-8f86f55966c8?w=400&q=80", youtubeId: "WEDIj9JBTC8" },
];

export const advisoryQuiz = [
  {
    question: "What is the primary purpose of asset allocation in wealth management?",
    options: ["Maximising short-term returns", "Reducing systemic risk through diversification", "Eliminating all portfolio volatility", "Timing the market effectively"],
    answer: 1,
    rationale: "Asset allocation distributes investments across asset classes to manage risk-return trade-offs, not to eliminate volatility or time the market.",
  },
  {
    question: "A client with a DTI ratio of 48% should prioritise which action?",
    options: ["Increasing equity exposure", "Accelerating high-interest debt repayment", "Opening new credit lines", "Investing in illiquid alternatives"],
    answer: 1,
    rationale: "A DTI above 43% is considered stressed. Reducing debt load improves financial health before adding investment risk.",
  },
  {
    question: "Which metric best measures portfolio efficiency on a risk-adjusted basis?",
    options: ["Absolute return (CAGR)", "Sharpe Ratio", "Maximum drawdown", "Dividend yield"],
    answer: 1,
    rationale: "The Sharpe Ratio measures excess return per unit of risk (standard deviation), making it the gold standard for risk-adjusted performance.",
  },
  {
    question: "In Modern Portfolio Theory, the Efficient Frontier represents:",
    options: ["The set of portfolios with minimum risk only", "Optimal portfolios offering maximum return for each risk level", "Only equity-heavy allocations", "Government bond yield curves"],
    answer: 1,
    rationale: "The Efficient Frontier plots portfolios that deliver the highest expected return for a given level of risk \u2014 a cornerstone of MPT.",
  },
  {
    question: "What is the recommended emergency buffer for a high-income professional?",
    options: ["1 month of expenses", "3\u20136 months of expenses", "12+ months of expenses", "No buffer if insured"],
    answer: 1,
    rationale: "Financial advisors recommend 3\u20136 months of living expenses in liquid instruments. Higher earners may trend toward 6 months due to longer job-search cycles.",
  },
];
