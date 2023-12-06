from pathlib import Path

from apiflask import APIFlask
from flask_socketio import SocketIO

socketio = SocketIO()


# noinspection PyBroadException
def get_sematic_version():
    try:
        project_root = Path(__file__).absolute().parent.parent
        return (
                [
                    x.strip() for x in ((project_root / "pyproject.toml").read_text().split("\n"))
                    if x.strip().startswith("version = ")
                ] or [""]
        )[0].split("version = ")[1].replace('"', "")
    except:
        return None


def create_app():
    app = APIFlask(
        __name__,
        version=get_sematic_version(),
        docs_ui="redoc",
        title="Backend API",
    )
    socketio.init_app(
        app,
        manage_session=False,
        cors_allowed_origins="*",
        max_http_buffer_size=1e7
    )
    app.app_context().push()
    import app.socket as _
    register_page_and_handlers(app)
    return app


def register_page_and_handlers(this_app):
    @this_app.get("/")
    @this_app.get("/index")
    def index_page():
        """後端首頁"""
        return "Welcome to AI JSON Form Backend."
