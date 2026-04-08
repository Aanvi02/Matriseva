from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Matriseva Backend Running 🚀"

if __name__ == "__main__":
    app.run(debug=True)