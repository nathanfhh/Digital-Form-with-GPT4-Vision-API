import os

import eventlet

eventlet.monkey_patch()

from app import create_app, socketio, get_sematic_version

env_required = ("OPENAI_API_KEY",)
for env in env_required:
    if not os.getenv(env):
        raise EnvironmentError(f"{env} is required.")

app = create_app()


@app.route("/version")
def version():
    return {
        "result": True,
        "data": {
            "version": get_sematic_version()
        }
    }


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=9000, debug=True)
