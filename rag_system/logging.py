from __future__ import annotations

import sys
from pathlib import Path

from loguru import logger

from rag_system.config import AppSettings

_LOGGING_CONFIGURED = False


def configure_logging(settings: AppSettings) -> None:
    global _LOGGING_CONFIGURED

    if _LOGGING_CONFIGURED:
        return

    log_file = Path(settings.log_dir) / "rag_system.log"

    logger.remove()
    logger.add(sys.stderr, level=settings.log_level)
    logger.add(
        log_file,
        level=settings.log_level,
        rotation=settings.log_rotation,
        retention=settings.log_retention,
        enqueue=True,
    )

    _LOGGING_CONFIGURED = True
