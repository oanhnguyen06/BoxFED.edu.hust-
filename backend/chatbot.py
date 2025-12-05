import os
import re
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from docx import Document
from openai import OpenAI

# ======================================
# KẾT NỐI OLLAMA LOCAL
# ======================================
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"
)

# ======================================
# FLASK APP
# ======================================
app = Flask(__name__)
CORS(app)

DATA_DIR = Path(__file__).parent / "data"


# ======================================
# HÀM ĐỌC NỘI DUNG DOCX
# ======================================
def docx_to_text(filepath: Path) -> str:
    doc = Document(filepath)
    return "\n".join([p.text.strip() for p in doc.paragraphs if p.text.strip()])


# ======================================
# TÌM ĐOẠN LIÊN QUAN DỰA TRÊN TỪ KHÓA
# ======================================
def find_relevant(full_text: str, question: str, max_chars=2500):
    parts = [p.strip() for p in full_text.split("\n") if p.strip()]

    keywords = [w for w in re.split(r"[\s,;:.!?]+", question) if w]

    matched = []
    for p in parts:
        low = p.lower()
        if any(k.lower() in low for k in keywords):
            matched.append(p)

    # nếu không có gì → dùng toàn file
    if not matched:
        joined = full_text
    else:
        joined = "\n\n".join(matched)

    if len(joined) > max_chars:
        joined = joined[:max_chars] + "\n...[TRIMMED]"

    return joined


# ======================================
# API CHAT
# ======================================
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "").strip()
    major = data.get("major", "").lower().strip()

    if not message:
        return jsonify({"error": "Bạn chưa nhập câu hỏi!"}), 400

    # chọn file theo ngành
    file_map = {
        "qlgd": "quanlygiaoduc.docx",
        "qld": "quanlygiaoduc.docx",
        "quản lý giáo dục": "quanlygiaoduc.docx",

        "cngd": "congnghegiaoduc.docx",
        "cng": "congnghegiaoduc.docx",
        "công nghệ giáo dục": "congnghegiaoduc.docx",
    }

    chosen_file = None
    for key, fname in file_map.items():
        if key in major:
            chosen_file = DATA_DIR / fname
            break

    # fallback: nếu không truyền major → dùng file đầu tiên
    if not chosen_file:
        chosen_file = list(DATA_DIR.glob("*.docx"))[0]

    # đọc file
    full_text = docx_to_text(chosen_file)
    snippet = find_relevant(full_text, message)

    # prompt gửi cho Ollama
    prompt = f"""
Bạn là chatbot tư vấn ngành học của khoa Khoa học & Công nghệ Giáo dục.
Dưới đây là dữ liệu trích từ tài liệu ngành:

CONTEXT:
{snippet}

———

Câu hỏi: {message}
Trả lời CHỈ dựa trên CONTEXT. Nếu không có trong tài liệu, hãy nói "Không có trong tài liệu".
"""

    try:
        response = client.chat.completions.create(
            model="gemma2:9b",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        reply = response.choices[0].message.content

        return jsonify({
            "reply": reply,
            "file_used": chosen_file.name
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ======================================
# RUN SERVER
# ======================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
