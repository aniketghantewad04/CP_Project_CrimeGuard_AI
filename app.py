from flask import Flask, render_template, request, jsonify
import pandas as pd
import joblib
import uuid

# ======================================================
# Create Flask App
# ======================================================

app = Flask(__name__)

# ======================================================
# Load Saved Model
# ======================================================

package = joblib.load("crime_resolution_model.pkl")

model = package["model"]
model_columns = package["columns"]

# ======================================================
# Dropdown Lists
# ======================================================

countries = [
    "Australia", "Brazil", "Canada", "Egypt", "France",
    "Germany", "India", "Indonesia", "Mexico", "Nigeria",
    "Pakistan", "South Africa", "Turkey", "UK", "USA"
]

area_types = ["Remote", "Rural", "Suburban", "Urban"]

crime_types = [
    "Arson", "Assault", "Burglary", "Cybercrime",
    "Domestic Violence", "Drug Offense", "Extortion",
    "Fraud", "Kidnapping", "Murder", "Robbery",
    "Sexual Assault", "Theft", "Trafficking", "Vandalism"
]

weapons = ["Blunt Object", "Chemical", "Firearm", "Knife", "Unknown", "Vehicle"]

cctv_list = ["Full Coverage", "No Coverage", "Partial Coverage"]

gang_list = ["No", "Unknown", "Yes"]

suspect_list = [
    "Acquitted", "Arrested", "At Large",
    "Convicted", "Under Investigation", "Unknown"
]

lighting_list = ["No Lighting", "Partially Lit", "Poorly Lit", "Well Lit"]

DROPDOWNS = dict(
    countries=countries, area_types=area_types, crime_types=crime_types,
    weapons=weapons, cctv=cctv_list, gang=gang_list,
    suspects=suspect_list, lighting=lighting_list,
)

# Friendly labels for the "Signal Contribution" chart, grouped by input field
SIGNAL_LABELS = {
    "country": "Country",
    "area_type": "Area Type",
    "crime_type": "Crime Type",
    "crime_severity_score": "Severity",
    "weapon_used": "Weapon",
    "cctv_coverage": "CCTV Coverage",
    "gang_related": "Gang Related",
    "suspect_status": "Suspect Status",
    "lighting_condition": "Lighting",
}

# ======================================================
# Helpers
# ======================================================

def risk_level(probability):
    if probability >= 0.80:
        return "Low Risk", "low"
    elif probability >= 0.60:
        return "Moderate Risk", "mod"
    elif probability >= 0.40:
        return "High Risk", "high"
    else:
        return "Critical Risk", "crit"


def officer_deployment(row):
    severity = float(row["crime_severity_score"])
    if severity >= 9:
        return 6
    elif severity >= 7:
        return 5
    elif severity >= 5:
        return 4
    else:
        return 2


def recommend_actions(row, probability):
    recommendations = []

    if probability < 0.40:
        recommendations.append("Deploy Additional Officers")
        recommendations.append("Assign Senior Investigation Team")

    if float(row["crime_severity_score"]) >= 8:
        recommendations.append("Mark Case as High Priority")

    if row["weapon_used"] in ["Firearm", "Knife", "Chemical"]:
        recommendations.append("Deploy Armed Response Team")

    if row["cctv_coverage"] != "Full Coverage":
        recommendations.append("Increase CCTV Surveillance")

    if row["gang_related"] == "Yes":
        recommendations.append("Notify Anti-Gang Unit")

    if row["suspect_status"] == "Unknown":
        recommendations.append("Launch Immediate Suspect Search")

    if row["lighting_condition"] != "Well Lit":
        recommendations.append("Improve Street Lighting")

    if row["area_type"] == "Urban":
        recommendations.append("Increase Patrol Frequency")

    seen = []
    for r in recommendations:
        if r not in seen:
            seen.append(r)
    return seen


def build_input_df(form):
    return pd.DataFrame({
        "country": [form["country"]],
        "area_type": [form["area_type"]],
        "crime_type": [form["crime_type"]],
        "crime_severity_score": [float(form["crime_severity_score"])],
        "weapon_used": [form["weapon_used"]],
        "cctv_coverage": [form["cctv_coverage"]],
        "gang_related": [form["gang_related"]],
        "suspect_status": [form["suspect_status"]],
        "lighting_condition": [form["lighting_condition"]],
    })


def encode(input_df):
    encoded = pd.get_dummies(input_df)
    encoded = encoded.reindex(columns=model_columns, fill_value=0)
    return encoded


def signal_contributions(original_row, encoded_row):
    """
    Contribution of each *input field* to the model's log-odds output,
    computed straight from this case's own values and the model's learned
    coefficients — nothing here comes from the CSV dataset.
    """
    coefs = model.coef_[0]
    per_column = {col: float(encoded_row[col].iloc[0]) * float(coefs[i])
                  for i, col in enumerate(model_columns)}

    # Roll encoded one-hot columns back up to their parent field
    field_totals = {field: 0.0 for field in SIGNAL_LABELS}
    for col, contrib in per_column.items():
        for field in SIGNAL_LABELS:
            if col == field or col.startswith(field + "_"):
                field_totals[field] += contrib
                break

    items = [
        {"label": SIGNAL_LABELS[field], "value": round(val, 4)}
        for field, val in field_totals.items()
    ]
    items.sort(key=lambda x: abs(x["value"]), reverse=True)
    return items


def signal_profile(row):
    """0-1 'favourability' score per environmental factor, for the radar chart."""
    cctv_score = {"Full Coverage": 1.0, "Partial Coverage": 0.5, "No Coverage": 0.0}
    lighting_score = {"Well Lit": 1.0, "Partially Lit": 0.6, "Poorly Lit": 0.3, "No Lighting": 0.0}
    suspect_score = {
        "Convicted": 1.0, "Arrested": 0.85, "Under Investigation": 0.5,
        "Acquitted": 0.35, "At Large": 0.15, "Unknown": 0.1,
    }
    gang_score = {"No": 1.0, "Unknown": 0.5, "Yes": 0.0}
    severity = float(row["crime_severity_score"])

    return [
        {"label": "CCTV Coverage", "value": cctv_score.get(row["cctv_coverage"], 0.5)},
        {"label": "Lighting", "value": lighting_score.get(row["lighting_condition"], 0.5)},
        {"label": "Suspect Clarity", "value": suspect_score.get(row["suspect_status"], 0.5)},
        {"label": "Gang-Free", "value": gang_score.get(row["gang_related"], 0.5)},
        {"label": "Low Severity", "value": round(max(0.0, 1 - severity / 10), 2)},
    ]


def run_prediction(form):
    input_df = build_input_df(form)
    original_row = input_df.iloc[0]
    encoded_row = encode(input_df)

    prediction = int(model.predict(encoded_row)[0])
    probability = float(model.predict_proba(encoded_row)[0][1])

    risk_text, risk_key = risk_level(probability)
    officers = officer_deployment(original_row)
    recommendations = recommend_actions(original_row, probability)
    contributions = signal_contributions(original_row, encoded_row)
    profile = signal_profile(original_row)

    return {
        "id": uuid.uuid4().hex[:8].upper(),
        "prediction": prediction,
        "verdict": "Likely to Resolve" if prediction == 1 else "Resolution Unlikely",
        "probability": round(probability * 100, 2),
        "risk": risk_text,
        "risk_key": risk_key,
        "officers": officers,
        "recommendations": recommendations,
        "contributions": contributions,
        "profile": profile,
        "inputs": {
            "country": original_row["country"],
            "area_type": original_row["area_type"],
            "crime_type": original_row["crime_type"],
            "crime_severity_score": original_row["crime_severity_score"],
            "weapon_used": original_row["weapon_used"],
            "cctv_coverage": original_row["cctv_coverage"],
            "gang_related": original_row["gang_related"],
            "suspect_status": original_row["suspect_status"],
            "lighting_condition": original_row["lighting_condition"],
        },
    }


# ======================================================
# Page Routes
# ======================================================

@app.route("/")
def home():
    return render_template("index.html", active="home", **DROPDOWNS)


@app.route("/history")
def history():
    return render_template("history.html", active="history", **DROPDOWNS)


@app.route("/about")
def about():
    return render_template("about.html", active="about", **DROPDOWNS)


@app.route("/case-report")
def case_report():
    return render_template("case_report.html", active="history", **DROPDOWNS)


# ======================================================
# Prediction API (JSON) — used by Home, Insights, Case Report (all client-side JS)
# ======================================================

@app.route("/api/predict", methods=["POST"])
def api_predict():
    form = request.form if request.form else request.json
    result = run_prediction(form)
    return jsonify(result)


# ======================================================
# Legacy server-rendered predict route (kept for compatibility)
# ======================================================

@app.route("/predict", methods=["POST"])
def predict():
    result = run_prediction(request.form)

    if result["prediction"] == 1:
        prediction_text = "✅ High Chance of Crime Resolution"
    else:
        prediction_text = "❌ Low Chance of Crime Resolution"

    return render_template(
        "index.html",
        active="home",
        prediction=prediction_text,
        probability=result["probability"],
        risk=result["risk"],
        officers=result["officers"],
        recommendations=result["recommendations"],
        **DROPDOWNS
    )


# ======================================================
# Run Flask
# ======================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)