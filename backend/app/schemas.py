from typing import Literal

from sqlmodel import Field, SQLModel


class ProductRead(SQLModel):
    id: str
    name: str
    description: str
    category: str
    fabric: str | None
    colour: str | None
    price: float | None
    currency: str
    availability_status: str
    image_url: str
    tags: list[str]
    metadata_verified: bool


class ChatMessage(SQLModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(SQLModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=30)


class ProductRecommendation(SQLModel):
    product_id: str
    name: str
    image_url: str
    reason: str


class ChatResponse(SQLModel):
    message: str
    recommendations: list[ProductRecommendation] = []
    mode: str = "catalogue_retrieval"
