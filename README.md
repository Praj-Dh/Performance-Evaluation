<div align="center">
  <h1>📈 Enterprise Performance Evaluation <br/> <sup>(Accountability Platform)</sup></h1>
  <p><strong>A modular, empirical performance tracking engine built on data-driven metrics, 360-degree feedback, and objective evaluation algorithms!</strong></p>
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/)
  [![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

</div>

---

## 📌 Overview

**Enterprise Performance Evaluation** serves as a full-stack engineering platform designed to synthesize quantitative and qualitative data into actionable HR insights. It mitigates cognitive biases—specifically recency bias—by employing weighted scoring algorithms to ensure fair, transparent, and data-driven career progression.

Rather than relying on subjective memory, this platform provides a continuous, verifiable record of performance, accurately reflecting an individual’s value to the organization over time through holistic scoring.

---

## ✨ Features

### 📊 Granular Contribution Tracking
*   **Engineering Metrics:** Automated analysis of technical workflow contributions, pull request frequencies, and deployment velocity.
*   **Quality Assurance:** Direct integration concepts to track test coverage and reliability.

### 📝 Qualitative Synthesis
*   **360-Degree Feedback:** Multi-directional input from peers, subordinates, and supervisors to capture interpersonal and collaborative impact in real-time.
*   **Frictionless Recognition:** A dedicated interface for logging "Recognition Points" and anecdotal evidence as it happens, preventing data loss over long review cycles.

### ⚖️ Objective Evaluation Algorithms
*   **Bias Mitigation:** Customizable weighting logic that prioritizes consistent performance over the entire evaluation period instead of just recent events.
*   **Detailed Audit Trails:** Transparent views showing exactly how a performance score was calculated, providing clear evidence for compensation and promotion decisions.

---

## 🛠️ Tech Stack

**Frontend**
*   [React](https://reactjs.org/) & [Next.js](https://nextjs.org/)

**Backend & Database**
*   [PHP 8.x](https://www.php.net/) (REST API Server)
*   [MySQL / MariaDB](https://www.mysql.com/) (Data Persistence)

---

## 🚀 Getting Started

The platform includes an automated development script that stands up the database, runs migrations, and seeds dummy data instantly.

### Prerequisites
*   [Node.js](https://nodejs.org/) v20.x or higher
*   [PHP](https://www.php.net/) 8.x
*   [MySQL](https://www.mysql.com/) (or MariaDB)

### Run Locally

1. **Clone the repository:**
   ```bash
   git clone git@github.com:Praj-Dh/Performance-Evaluation.git
   cd Performance-Evaluation
   ```

2. **Start the application (starts backend, frontend, and seeds data):**
   ```bash
   ./scripts/dev.sh
   ```

3. **Open in browser:**
   Navigate to the platform at [http://localhost:3000](http://localhost:3000)

### ⚙️ Ports
*   **Frontend (Next.js):** `:3000`
*   **Backend (PHP API):** `:8080` *(Internal/External API routing)*

---

## 👔 Demo Instructions

The local development script (`./scripts/dev.sh`) automatically seeds the database with a fictional company ("Northwind Labs") so you can explore the dashboard from different perspectives. 

All demo accounts use the password: `Password123!`

### 👤 Employee View
**Login as:** `morgan.lee.0@example.com`
*   **What to look for:** View Morgan's personalized performance dashboard, track past annual and mid-year reviews, check upcoming calendar events, and request feedback from peers. Notice how the metrics and "Recognition Points" are displayed clearly for the individual contributor.

### 👥 Manager View
**Login as:** `alex.manager@example.com`
*   **What to look for:** As an Engineering Manager, Alex has access to team-wide overviews. You can view the performance records of direct reports (like Morgan), check pending feedback requests, facilitate team retrospectives, and submit actual performance scores using the objective evaluation tools. 

---

<div align="center">
  <i>Developed to ensure fair, transparent, and data-driven career progression.</i>
</div>
