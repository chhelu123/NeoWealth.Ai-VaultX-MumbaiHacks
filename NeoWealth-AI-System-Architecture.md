# 🏗️ NeoWealth.AI - Complete Agentic AI System Architecture

## 1️⃣ High-Level System Architecture

The system is built in **4 core layers**:
1. **Data Sources** (User's Real World Money Activity)
2. **Ingestion & Processing Layer**
3. **Agentic AI Layer** (All the "brains")
4. **Application Layer** (Wallet, NeoCoins, Hives, App UI)

## 🏗 Overall Architecture Diagram

```
                     +----------------------+
                     |   External Sources   |
                     |  (Banks, UPI, SMS)   |
                     +----------+-----------+
                                |
                                v
                   +----------------------------+
                   |  1. Ingestion Layer        |
                   |----------------------------|
                   | - SMS Parser Service       |
                   | - Bank/UPI API Connectors  |
                   | - Webhooks (investments)   |
                   +--------------+-------------+
                                  |
                         Normalized Transactions
                                  |
                                  v
          +--------------------------------------------------+
          |      2. Event Bus / Message Queue (Kafka/SQS)    |
          +----------------+----------------+----------------+
                           |                |
                           |                |
                           v                v
     +-------------------------+   +--------------------------+
     | 3A. Transaction Monitor |   | 3B. Behavior Analyzer    |
     |       Agent             |   |       Agent              |
     +------------+------------+   +------------+-------------+
                  |                             |
                  v                             v
        +-----------------+           +-----------------------+
        | User Spend/     |           | User Behavior Models  |
        | Income Profile  |           | (risk, habits, score) |
        +--------+--------+           +-----------+-----------+
                 |                                |
                 v                                v
       +---------------------+        +-------------------------+
       | 3C. Goal Optimizer  |<------>| 3D. Reward Agent        |
       |       Agent         |        | (NeoCoin Calculator)    |
       +----------+----------+        +-----------+------------+
                  |                               |
                  v                               v
        +--------------------+        +-------------------------+
        | User Goals / Plans |        | NeoCoin Ledger / Wallet |
        +----------+---------+        +-----------+-------------+
                  |                               |
                  +---------------+---------------+
                                  |
                                  v
                       +-------------------------+
                       | 3E. Hive Matching Agent |
                       | 3F. Hive Investment AI  |
                       +------------+------------+
                                    |
                          Hives, Group Strategy
                                    |
                                    v
            +------------------------------------------------+
            |         4. Application Layer                   |
            |------------------------------------------------|
            | - User Wallet & NeoCoins                       |
            | - Hive Dashboard                               |
            | - Twin Dashboard (Cashflow.AI, etc.)           |
            | - Notification & Coaching Service              |
            +------------------------------------------------+
                                    |
                                    v
                         +-----------------------+
                         |   Mobile / Web App    |
                         | (React/React Native)  |
                         +-----------------------+
```

## 2️⃣ The 7 Autonomous Agents - Detailed Specifications

### 🔹 1. Transaction Monitor Agent

**Input:**
- Parsed SMS alerts
- Webhook events from UPI/banks
- Manual tags (rare cases)

**What it does:**
- Identifies transaction type: income / expense / transfer / loan / EMIs / investment
- Classifies category: food, rent, shopping, travel, etc.
- Updates user transaction history & daily summary
- Detects anomalies and potential fraud

**Output:**
```json
{
  "user_id": "U123",
  "amount": -450,
  "category": "Food",
  "channel": "UPI",
  "timestamp": "2024-01-15T14:30:00Z",
  "merchant": "Zomato",
  "anomaly_score": 0.1
}
```

**Feeds:** Behavior Analyzer & Goal Optimizer

---

### 🔹 2. Behavior Analyzer Agent

**Input:**
- Stream of TransactionEvents
- Historical user data
- Market trends and seasonal patterns

**What it does:**
- Builds/updates ML models for:
  - Overspending risk prediction
  - Monthly cashflow forecasting
  - Goal completion probability
  - Spending pattern analysis (weekends vs weekdays)
- Maintains comprehensive user behavior profile

**Output:**
```json
{
  "user_id": "U123",
  "risk_score": 0.63,
  "overspend_likelihood": 0.72,
  "savings_potential": 1200,
  "segment": "Student - Medium Risk",
  "spending_patterns": {
    "weekend_multiplier": 1.4,
    "food_trend": "increasing",
    "subscription_waste": 450
  }
}
```

**Feeds:** Goal Optimizer, Hive Matching Agent, Coaching Service

---

### 🔹 3. Goal Optimizer Agent

**Input:**
- BehaviorProfile updates
- User's current goals (e.g., "Save ₹10,000 in 3 months")
- Real-time transaction data
- Market conditions

**What it does:**
- **Autonomous Decision Making:**
  - "Increase weekly saving by ₹100"
  - "Extend goal by 2 weeks"
  - "Split one big goal into two smaller goals"
- **Automatic Adjustments:**
  - Goal amounts based on spending patterns
  - Deadlines based on progress
  - Investment routes based on risk profile

**Output:**
```json
{
  "user_id": "U123",
  "goal_id": "G456",
  "target_amount": 12000,
  "weekly_contribution": 750,
  "adjusted_end_date": "2026-03-10",
  "confidence_score": 0.85,
  "adjustment_reason": "spending_pattern_change"
}
```

**Triggers:** Reward Agent (milestone achievements), Notification Service

---

### 🔹 4. Reward Agent (NeoCoin Engine)

**Input:**
- GoalPlan updates and milestones
- User positive actions (savings, investments, streaks)
- Behavioral improvements (reduced spending, better discipline)
- Hive participation and performance

**What it does:**
- **Evaluates reward rules:**
  - "Saved > planned amount"
  - "No food delivery for 7 days"
  - "Completed Hive challenge"
  - "Consistent SIP for 3 months"
- **Calculates NeoCoin rewards/penalties**
- **Writes to NeoCoin Ledger**

**Output:**
```json
{
  "user_id": "U123",
  "neo_coins": 25,
  "reason": "Completed weekly saving challenge",
  "multiplier": 1.2,
  "streak_bonus": 5,
  "transaction_id": "NC789"
}
```

**Updates:** User wallet balance, triggers celebration notifications

---

### 🔹 5. Hive Matching Agent

**Input:**
- User BehaviorProfile
- Current GoalPlan
- Risk tolerance levels
- Saving capacity and patterns
- Geographic preferences (optional)

**What it does:**
- **Finds optimal Hive matches:**
  - Similar income brackets
  - Compatible goal types (emergency fund, travel, etc.)
  - Matching risk tolerance
  - Complementary saving schedules
- **Ensures privacy:** No identity sharing, anonymous matching
- **Balances Hives:** Prevents inactive or unbalanced groups

**Output:**
```json
{
  "user_id": "U123",
  "hive_id": "H987",
  "role": "member",
  "match_score": 0.89,
  "hive_metadata": {
    "size": 12,
    "avg_goal": 15000,
    "risk_level": "medium"
  }
}
```

**Updates:** Hive composition, member analytics

---

### 🔹 6. Hive Investment Agent (Future Phase)

**Input:**
- All members' contribution schedules
- Collective risk profile
- Market data from external APIs
- Investment performance metrics

**What it does:**
- **Portfolio Management:**
  - Asset allocation optimization (liquid, MF, gold, etc.)
  - Monthly rebalancing based on performance
  - Risk mitigation during market volatility
- **Group Strategy:**
  - Collective buying power advantages
  - Diversification across member preferences
  - Performance tracking and reporting

**Output:**
```json
{
  "hive_id": "H987",
  "allocation": {
    "liquid_fund": 0.3,
    "index_fund": 0.5,
    "gold": 0.2
  },
  "expected_return": 0.12,
  "risk_score": 0.4,
  "rebalance_date": "2024-02-01"
}
```

**Executes:** Investment transactions, portfolio rebalancing

---

### 🔹 7. Coaching / Notification Agent

**Input:**
- BehaviorProfile changes
- GoalPlan updates
- RewardEvents
- Hive progress and milestones
- Market opportunities

**What it does:**
- **Crafts personalized messages:**
  - "You are ₹400 away from hitting your weekly target."
  - "Your Hive is 90% to the challenge goal."
  - "You saved 18% more compared to last month!"
- **Uses AI for message optimization:**
  - Templates + LLM for human-like communication
  - Timing optimization based on user behavior
  - A/B testing for message effectiveness

**Output:**
- Push notifications
- In-app messages
- Email summaries
- Achievement celebrations

## 3️⃣ Pillars vs Agents Mapping

### 🧠 Pillar 1: Personal Financial Twin
**Built from:**
- Transaction Monitor Agent
- Behavior Analyzer Agent  
- Goal Optimizer Agent
- Coaching Agent

**Result:** The "brain" that understands and manages each user individually

### 🪙 Pillar 2: NeoCoin Economy  
**Powered by:**
- Reward Agent
- Data Monetization & Affiliate Engine (backend services)
- Wallet & Ledger service

**Result:** The "incentive engine" that makes good behavior rewarding

### 👥 Pillar 3: Community Hive Intelligence
**Powered by:**
- Hive Matching Agent
- Hive Investment Agent
- Group-level analytics & reward rules

**Result:** The "collective intelligence" layer that improves returns + discipline

## 4️⃣ Real-Life Scenario: Complete Agent Flow

**Scenario:** User spends ₹450 on Zomato

### Step-by-Step Agent Interaction:

1. **SMS arrives:** "Paid ₹450 to ZOMATO via UPI..."

2. **Ingestion Layer** parses SMS → creates TransactionEvent

3. **Transaction Monitor Agent** categorizes as "Food / Eating Out"

4. **Event Bus** distributes to relevant agents

5. **Behavior Analyzer Agent:**
   - Updates pattern: "High food spending this week"
   - Recalculates risk scores and spending forecasts

6. **Goal Optimizer Agent:**
   - Sees reduced free cash for weekly savings
   - Decides: adjust plan or raise intervention flag

7. **Coaching Agent** sends personalized nudge:
   - "You've spent ₹1,800 on food this week, 20% above usual. Want to pause ordering for 2 days and earn extra NeoCoins?"

8. **If user accepts challenge:**
   - **Reward Agent** monitors compliance
   - After 2 days without food delivery: +20 NeoCoins

9. **Behavior Analyzer** updates:
   - Improved self-control score
   - Better goal completion probability

10. **Hive Matching Agent** considers:
    - Updated behavior for future Hive assignments
    - Potential bonus rewards for Hive performance

**Result:** Complete autonomous cycle of perception → reasoning → action → feedback → learning

## 5️⃣ Technical Stack Considerations

### Core Technologies:
- **Event Bus:** Apache Kafka / AWS SQS
- **ML/AI:** Python (scikit-learn, TensorFlow)
- **Real-time Processing:** Apache Spark / AWS Kinesis
- **Database:** PostgreSQL + Redis (caching)
- **API Gateway:** Kong / AWS API Gateway
- **Microservices:** Docker + Kubernetes
- **Mobile:** React Native
- **Web:** React.js

### Scalability Features:
- Horizontal scaling for each agent
- Event-driven architecture for loose coupling
- Caching layers for real-time responses
- Load balancing across agent instances

This architecture creates a **truly autonomous financial ecosystem** where AI agents work together to build user wealth automatically! 🚀