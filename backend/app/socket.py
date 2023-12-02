import base64
import uuid

from PyPDF2 import PdfReader
from pdf2image import convert_from_path

from app import socketio
from app.ai_helper import inference
from app.utils import RUNTIME_DIR

MAX_PDF_PAGES = 3


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
    if not (image_count := convert_pdf_to_jpg(session)):
        return cleanup_intermediate_files(session)
    pdf_text = extract_pdf_text(session)
    configs = {
        "session": session,
        "runtime_dir": RUNTIME_DIR,
        "image_count": image_count,
        "pdf_text": pdf_text,
        "is_detail_high": data.get("is_detail_high", False) is True,
    }
    callables = {
        "socketio_obj": socketio,
        "notify_frontend": notify_frontend,
    }
    socketio.emit(
        "server_command",
        {
            "cmd": "ai_response_done",
            "data": inference(configs, callables, is_mock=data.get("is_mock", False) is True)
        },
        namespace="/openai"
    )
    cleanup_intermediate_files(session)


def cleanup_intermediate_files(session):
    for file in RUNTIME_DIR.glob(f"{session}*"):
        file.unlink()


def extract_pdf_text(session, save_to_disk=False):
    pdf_text = []
    for page in PdfReader(RUNTIME_DIR / f"{session}.pdf").pages:
        pdf_text.append(page.extract_text())
    pdf_text = "\n---***---\n".join(pdf_text)
    if save_to_disk:
        with open(RUNTIME_DIR / f"{session}.txt", "w") as f:
            f.write(pdf_text)
    return pdf_text


def convert_pdf_to_jpg(session):
    images = convert_from_path(RUNTIME_DIR / f"{session}.pdf")
    if len(images) > MAX_PDF_PAGES:
        notify_frontend(f"請選用小於等於{MAX_PDF_PAGES}頁的PDF檔案", type_="error")
        return 0
    for i, image in enumerate(images):
        image.save(RUNTIME_DIR / f"{session}-{i}.jpg", "JPEG")
    notify_frontend(f"已成功轉換{len(images)}頁PDF檔案為圖片")
    return len(images)


def notify_frontend(message, type_="success"):
    socketio.emit(
        "server_command",
        {
            "cmd": "message",
            "data": {
                "message": message,
                "type": type_
            }
        },
        namespace="/openai"
    )


def save_pdf_to_disk(data, session):
    pdf_data = data.get("data", "").split("base64,")[1]
    pdf_bytes = base64.b64decode(pdf_data)
    with open(RUNTIME_DIR / f"{session}.pdf", "wb") as f:
        f.write(pdf_bytes)
