import base64
import logging
import os
import time
from pathlib import Path
from typing import Callable

from openai import OpenAI

USE_MODEL = "gpt-4.1"
CURRENT_DIR = Path(__file__).absolute().parent

with open(CURRENT_DIR / "mock.txt", "r") as mock_file:
    MOCKED_RESPONSE = mock_file.readlines()

SYSTEM_PROMPT = (Path(__file__).absolute().parent.parent.parent / "ai-json-form/src/handler/frontend/promptTemplate.md").read_text()

USER_PROMPT = """
Generate YAML definition file from screenshots of a paper form using the schema defined by SurveyJS.
"""


def bytes_to_data_url(image_bytes: bytes, mime_type: str) -> str:
    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{mime_type};base64,{base64_image}"


def get_image_url(file_path):
    if isinstance(file_path, str):
        file_path = Path(file_path)
    with open(file_path, "rb") as file:
        image_bytes = file.read()
    mime_mapper = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
    }
    return bytes_to_data_url(image_bytes, mime_mapper[file_path.suffix[1:]])


EXAMPLE_IMG_URL = get_image_url(CURRENT_DIR / "example.png")


def create_openai_client():
    config = {"api_key": os.getenv("OPENAI_API_KEY"), }
    if os.getenv("OPENAI_ORG"):
        config["organization"] = os.getenv("OPENAI_ORG")
    return OpenAI(**config)


def delayed_iterator(data: list):
    for item in data:
        yield item
        time.sleep(0.1)


def stream_openai_response(messages, callables: dict[str, Callable], is_mock):
    if is_mock:
        response = delayed_iterator(MOCKED_RESPONSE)
    else:
        try:
            response = create_openai_client().chat.completions.create(**{
                "model": USE_MODEL,
                "messages": messages,
                "stream": True,
                "timeout": 600,
                "max_tokens": 8192,
                "temperature": 0,
                "stream_options": {
                    "include_usage": True
                }
            })
        except Exception as e:
            logging.error("OpenAI API Error", exc_info=e)
            callables['notify_frontend'](f"OpenAI API Error", type_="error")
            return {"full_response": "", "usage": None}
    full_response = ""
    buffer = ""
    usage = None
    for chunk in response:
        if is_mock:
            content = chunk
        else:
            content = (chunk.choices[0].delta.content if chunk.choices else "") or ""
        full_response += content
        buffer += content
        if buffer and buffer.endswith("\n"):
            callables['socket_emit_private']({"cmd": "ai_response", "data": buffer})
            buffer = ""
        if getattr(chunk, "usage", None):
            usage = chunk.usage.model_dump(mode="json")
    return {
        "full_response": full_response,
        "usage": usage
    }


def generate_prompt(configs: dict):
    pages = len(configs["img_data_url"])
    user_prompt = USER_PROMPT + (
        f"\nIMPORTANT: The PDF file has {pages} page{'' if pages <= 1 else 's'}, make sure to inference all of them."
    )
    return [
        {
            "role": "system",
            "content": SYSTEM_PROMPT.replace("{{target_txt}}", configs["pdf_text"]),
        },
        {
            "role": "user",
            "content": [
                           {
                               "type": "image_url",
                               "image_url": {"url": EXAMPLE_IMG_URL, "detail": "low"},
                           },
                       ] + [
                           {
                               "type": "image_url",
                               "image_url": {
                                   "url": image_data_url,
                                   "detail": "high" if configs["is_detail_high"] else "low"
                               },
                           } for image_data_url in configs["img_data_url"]
                       ] + [
                           {
                               "type": "text",
                               "text": user_prompt,
                           },
                       ],
        },
    ]


def inference(configs: dict, callables, is_mock=True):
    img_data_url = [
        get_image_url(configs["runtime_dir"] / f"{configs['session']}-{i}.jpg")
        for i in range(configs["image_count"])
    ]
    configs["img_data_url"] = img_data_url
    callables['socket_emit_private']({"cmd": "pdf_screenshot", "data": img_data_url})
    return stream_openai_response(
        generate_prompt(configs), callables, is_mock
    )
