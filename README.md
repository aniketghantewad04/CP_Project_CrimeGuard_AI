# 🚔 Live link: [https://crimeguard-ai.onrender.com](https://crimeguard-ai.onrender.com)

# 🛡️ CrimeGuard AI: Crime Resolution Predictor

**CrimeGuard AI** is a machine learning–powered web application that predicts the probability of a crime case being resolved based on its circumstances — location, crime type, severity, evidence conditions, and suspect status. Beyond a raw prediction, it generates a risk assessment, recommended officer deployment, and a prioritized action plan for law enforcement decision-making, all delivered in under a second.

---

## ✨ Features

- 🎯 **Resolution Probability Prediction** — Estimates the likelihood that a reported case will be resolved, using a trained ML classification model.
- ⚠️ **Risk Level Assessment** — Classifies each case as Low, Moderate, High, or Critical risk based on the predicted probability.
- 👮 **Officer Deployment Recommendation** — Suggests the number of officers to assign based on crime severity.
- ✅ **Actionable Recommendations** — Auto-generates a prioritized checklist (e.g. deploy armed response, increase CCTV surveillance, notify anti-gang unit) tailored to the case inputs.
- 📊 **Signal Contribution Breakdown** — Shows which input factors (weapon, lighting, CCTV coverage, etc.) pushed the prediction up or down, for model transparency.
- 🕸️ **Case Environment Profile** — A radar-style breakdown of environmental "favourability" factors (lighting, surveillance, suspect clarity, gang involvement, severity).
- 🗂️ **Case History & Reports** — View past analyzed cases and generate case reports.
- 💻 **Clean, Responsive Dashboard UI** — Built with a custom HTML/CSS/JS front end for an intuitive analyst experience.

---

## 🧠 How It Works

1. An analyst enters case details through the dashboard — location, crime type, severity score, weapon used, CCTV coverage, lighting condition, gang involvement, and suspect status.
2. The inputs are encoded and passed to a pre-trained **scikit-learn** classification model (`crime_resolution_model.pkl`).
3. The model returns a resolution probability, which is translated into a risk level, deployment recommendation, and action plan.
4. Results are rendered instantly on the dashboard via a JSON API, with supporting visual breakdowns of what drove the prediction.

The model was trained and evaluated in the accompanying Jupyter notebook (`Crime Rate And Safety Analysis.ipynb`) using a real-world-style crime dataset covering incident details, environmental context, and case outcomes across multiple countries.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Flask 3.0 (Python) |
| ML / Data | scikit-learn, pandas, numpy, joblib |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Model Analysis | Jupyter Notebook |
| PDF Reports | fpdf2 |
| Deployment | Gunicorn |

---

## 📁 Project Structure

```
CrimeGuard_AI/
├── app.py                                  # Flask application & prediction API
├── crime_resolution_model.pkl              # Trained ML model + column schema
├── crime_rate_and_safety_analysis_dataset.csv   # Training dataset
├── Crime Rate And Safety Analysis.ipynb    # Model training & analysis notebook
├── CrimeGuard AI Documentation.pdf         # Project documentation
├── CrimeGuard_AI_Presentation.pptx         # Project presentation
├── requirements.txt                        # Python dependencies
├── LICENSE                                 # MIT License
├── static/
│   ├── css/style.css                       # Dashboard styling
│   ├── favicon1.ico
│   └── js/
│       ├── main.js
│       ├── predict-form.js                 # Handles prediction form submission
│       ├── case-report.js
│       └── history.js
└── templates/
    ├── base.html                           # Shared layout
    ├── index.html                          # Main prediction dashboard
    ├── history.html                        # Case history view
    ├── case_report.html                    # Case report view
    └── about.html                          # About page
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/aniketghantewad04/CP_Project_CrimeGuard_AI.git
cd CP_Project_CrimeGuard_AI

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run the App

```bash
python app.py
```

The app will start on `http://localhost:8080`.

### Production Deployment

```bash
gunicorn -b 0.0.0.0:8080 app:app
```

---

## 📊 Dataset

The model is trained on a crime and safety analysis dataset containing fields such as country, area type, crime type, severity score, weapon used, CCTV coverage, lighting condition, gang involvement, suspect status, and final case resolution outcome — across multiple countries and area types.

---

## 🎯 Prediction Inputs

| Field | Description |
|---|---|
| Country | Location of the incident |
| Area Type | Remote, Rural, Suburban, or Urban |
| Crime Type | e.g. Theft, Assault, Cybercrime, Robbery |
| Severity Score | 1–10 scale |
| Weapon Used | Firearm, Knife, Blunt Object, Chemical, Vehicle, Unknown |
| CCTV Coverage | Full, Partial, or No Coverage |
| Lighting Condition | Well Lit, Partially Lit, Poorly Lit, No Lighting |
| Gang Related | Yes / No / Unknown |
| Suspect Status | Arrested, At Large, Under Investigation, etc. |

---

## 📄 Documentation

- 📘 Full project documentation: `CrimeGuard AI Documentation.pdf`
- 🖥️ Project presentation: `CrimeGuard_AI_Presentation.pptx`
- 📓 Model training & EDA notebook: `Crime Rate And Safety Analysis.ipynb`

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---


<div align="center">

### 🛡️ CrimeGuard AI

**Designed & Developed by Aniket Ghantewad • 2026**

*An intelligent machine learning platform for crime resolution prediction, risk assessment, and decision support.*

</div>
