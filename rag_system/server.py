from __future__ import annotations

from rag_system.api import create_app
from rag_system.config import get_settings

settings = get_settings()
app, socketio = create_app(settings)


def main() -> None:
    socketio.run(
        app,
        host=settings.host,
        port=settings.port,
        debug=settings.debug,
        allow_unsafe_werkzeug=settings.debug,
    )


if __name__ == "__main__":
    main()
