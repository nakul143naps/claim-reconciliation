# AI Tools Usage & Engineering Attribution Report

> **Candidate**: Nakul Kothlapur  
> **Role**: Forward Deployed Engineer (FDE) — Stitch Fin  
> **Project**: Enterprise Healthcare Claim Reconciliation Engine  
> **Live Production AWS Demo**: [http://67.202.41.44](http://67.202.41.44)  
> **GitHub Repository**: [https://github.com/nakul143naps/claim-reconciliation](https://github.com/nakul143naps/claim-reconciliation)  

---

## 1. My Approach to Using AI

For this project, I used **Google DeepMind Antigravity CLI** as an interactive pair-programming partner.

My philosophy throughout the build was simple:
- **I acted as the tech lead and architect**: I made all the core decisions regarding database schema, business rules, architectural layers, product features, and AWS deployment.
- **AI acted as my speed accelerator**: I used AI to write boilerplate code, scaffold UI components, draft test cases, and assist with cloud deployment commands under my direct instruction.
- **I verified everything**: Every line of code, database query, and mathematical calculation was tested, reviewed, and verified by me to ensure full accuracy.

---

## 2. Step-by-Step Breakdown: What I Decided vs. How AI Assisted

### Step 1: Database Design & Docker Containerization
* **My Decisions**:
  - I chose to run **MySQL 8.0 inside a Docker container** so the database is completely isolated, reproducible, and easy to run on any machine.
  - I designed the tables (`claims` and `remittances`), primary keys, foreign keys, and indexes.
  - I made the decision to store **all currency as integer cents** (`BigInteger` in MySQL) to completely eliminate floating-point rounding errors.
  - I designed the **dual-column schema** for remittances: storing the original claim string in `source_claim_id`, while making `claim_id` a nullable foreign key. This ensures that when a payment arrives for an unknown claim, the cash is never thrown away and no fake claim is invented.
* **How AI Assisted**:
  - AI helped write the exact SQLAlchemy ORM class syntax and configured the `docker-compose.yml` file based on my specifications.

---

### Step 2: Product Research & Enterprise UI
* **My Decisions**:
  - Instead of building a plain table, I researched top healthcare and fintech platforms online (like ClaimBook, RevSync Health, and PayerWorks) to see how real-world billing tools work.
  - I decided to make the frontend look and feel like an enterprise B2B SaaS platform. I directed the addition of:
    - A **How It Works** section explaining the 3-step reconciliation workflow.
    - A **Technical FAQ** explaining integer precision and orphan handling.
    - A **Request Demo** lead capture popup.
    - A **Denial Appeal Playbook** that gives billing teams actionable appeal steps for denial codes (`CO-16`, `CO-50`, `CO-197`).
    - An interactive **Financial Settlement Progress Bar** showing cash collected vs. write-offs vs. unpaid balance.
* **How AI Assisted**:
  - AI helped scaffold the React TypeScript components, Lucide icons, and Tailwind CSS styling based on the design concepts and layouts I described.

---

### Step 3: Layered Architecture & Separation of Concerns
* **My Decisions**:
  - I wanted the codebase to be clean, modular, and easy to explain in an interview. I instructed the separation of concerns into distinct layers:
    1. **Pure Calculation Engine (`reconciliation.py`)**: Pure math with **zero database dependencies**, making it 100% deterministic and unit-testable in microseconds.
    2. **Repository Layer (`claim_repository.py`)**: Centralized SQL queries and pagination logic.
    3. **Ingestion Service (`import_service.py`)**: Clean file parsing and validation logic.
    4. **API Router Layer (`api/`)**: Clean FastAPI endpoints (`/summary`, `/claims`, `/remittances`, `/import`, `/health`).
  - I designed the Pydantic schemas to maintain strict contracts between the backend and frontend.
* **How AI Assisted**:
  - AI helped write the repetitive Pydantic model definitions, FastAPI router wiring, and query parameter validation.

---

### Step 4: CSV Batch Ingestion & Scale Testing
* **My Decisions**:
  - I wanted interviewers to be able to test the platform with large, messy datasets without needing terminal access.
  - I designed a drag-and-drop CSV batch upload feature and a **1-click Benchmark Reset** button.
  - I established the rule that **one bad row should not crash an entire file**. I directed the use of row-level SQL Savepoints (`db.begin_nested()`), so valid rows are committed while invalid rows are rejected with helpful error messages.
  - I added automatic orphan re-linking: when a new claim is imported, any previously orphaned remittances waiting for it are linked automatically.
* **How AI Assisted**:
  - AI helped implement the CSV parsing loop and generate synthetic scale datasets (`claims_large.csv`) for testing.

---

### Step 5: Live AWS EC2 Deployment
* **My Decisions**:
  - I decided to deploy the platform live on **AWS EC2** so the hiring team could interact with the real working app immediately without having to install Docker or Python locally.
* **How AI Assisted**:
  - AI provided the Linux shell commands to configure the EC2 instance, including:
    - Expanding the AWS EBS disk online from 8 GB to 20 GB to fix disk exhaustion.
    - Creating a 2 GB swapfile on the SSD so Docker and Node builds wouldn't crash from out-of-memory errors on a `t3.micro`.
    - Setting up systemd background daemons and reverse-proxying.

---

## 3. Where I Reviewed and Corrected the AI

Throughout the project, I actively reviewed the AI's suggestions and corrected it when it made naive assumptions:

1. **Handling Claims Without Remittances**:
   - The AI initially considered setting the outstanding difference to the full billed amount. I corrected this: if a claim has no remittances, `difference_cents` must be `null` because an unadjudicated claim is not yet confirmed debt.
2. **Denial History vs. Balanced Status**:
   - The AI initially assumed that if a claim balances to $0, its denial flags could be cleared. I corrected this: in healthcare RCM, prior denial codes (like `CO-197` on claim `C1007`) must remain visible in the audit trail because repeat denials signal authorization leakage.

---

## 4. Verification & Testing

I verified the entire platform using a comprehensive test strategy:
- **38 Automated Pytest Tests**: 14 unit calculation tests, 10 CSV import tests, 10 API integration tests, and 4 scale benchmark tests.
- **Frontend Verification**: Clean `npm run build` with 0 TypeScript errors.
- **Database Parity**: Verified that all financial calculations strictly match the assignment's benchmark values.
