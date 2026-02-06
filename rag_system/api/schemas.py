from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(min_length=1)
    strategy: str = "hybrid"
    session_id: Optional[str] = None


class OpenAIChatMessage(BaseModel):
    role: str
    content: str


class OpenAIChatCompletionRequest(BaseModel):
    model: Optional[str] = None
    messages: List[OpenAIChatMessage] = Field(min_length=1)
    strategy: str = "hybrid"
    session_id: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str
    request_id: Optional[str] = None


def to_plain_dict(model: BaseModel) -> Dict[str, Any]:
    return model.model_dump(mode="json")
