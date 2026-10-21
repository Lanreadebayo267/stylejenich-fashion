import pytest

from backend.app.intents import classify_intent


@pytest.mark.parametrize(
    "message",
    [
        "How much does Evening Elegance cost?",
        "Is this design available in my size?",
        "What sizes are available?",
        "Is it in stock?",
        "What is the delivery lead time?",
    ],
)
def test_product_fact_questions_use_metadata_intent(message: str):
    assert classify_intent(message) == "product_metadata"


@pytest.mark.parametrize(
    "message",
    [
        "I need an outfit for a wedding",
        "Show me a simple, elegant outfit for a birthday dinner",
        "I want something chic for a party",
    ],
)
def test_style_and_occasion_requests_use_discovery_intent(message: str):
    assert classify_intent(message) == "discovery"
