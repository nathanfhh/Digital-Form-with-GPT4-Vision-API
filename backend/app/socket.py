import base64
import uuid
from pathlib import Path

from PyPDF2 import PdfReader
from pdf2image import convert_from_path

from app import socketio
from app.ai_helper import inference
from app.utils import RUNTIME_DIR


@socketio.on("join", namespace="/openai")
def on_join_openai(data):
    print("Join to openai.")
    socketio.emit(
        "server_command",
        {"cmd": "greeting", "data": "Joined to openai."},
        namespace="/openai"
    )


@socketio.on("upload_pdf", namespace="/openai")
def upload_pdf_and_generate_yaml(data):
    session = uuid.uuid4().hex
    save_pdf_to_disk(data, session)
    convert_first_page_to_jpg(session)
    pdf_text = extract_first_page_text(session)
    socketio.emit(
        "server_command",
        {
            "cmd": "ai_response_done",
            "data": inference(
                RUNTIME_DIR / f"{session}-0.jpg",
                pdf_text,
                socketio,
                is_mock=data.get("is_mock", False) is True
            )
        },
        namespace="/openai"
    )
    cleanup_intermediate_files(session)


def cleanup_intermediate_files(session):
    for file in RUNTIME_DIR.glob(f"{session}*"):
        file.unlink()


def extract_first_page_text(session, save_to_disk=False):
    pdf_text = PdfReader(RUNTIME_DIR / f"{session}.pdf").pages[0].extract_text()
    if save_to_disk:
        with open(RUNTIME_DIR / f"{session}.txt", "w") as f:
            f.write(pdf_text)
    return pdf_text


def convert_first_page_to_jpg(session):
    images = convert_from_path(RUNTIME_DIR / f"{session}.pdf")
    images[0].save(RUNTIME_DIR / f'{session}-0.jpg', 'JPEG')


def save_pdf_to_disk(data, session):
    pdf_data = data.get("data", "").split("base64,")[1]
    pdf_bytes = base64.b64decode(pdf_data)
    with open(RUNTIME_DIR / f"{session}.pdf", "wb") as f:
        f.write(pdf_bytes)
