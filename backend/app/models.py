from sqlmodel import Field, SQLModel


class Product(SQLModel, table=True):
    """A fashion design shown in the StyleJenich catalogue."""

    id: str = Field(primary_key=True)
    name: str = Field(index=True, min_length=1, max_length=160)
    description: str = Field(default="", max_length=2000)
    category: str = Field(default="unverified", index=True, max_length=80)
    fabric: str | None = Field(default=None, max_length=80)
    colour: str | None = Field(default=None, max_length=80)
    price: float | None = Field(default=None, ge=0)
    currency: str = Field(default="NGN", max_length=3)
    availability_status: str = Field(default="unknown", max_length=40)
    image_url: str
    tags_csv: str = Field(default="", max_length=1000)
    metadata_verified: bool = Field(default=False)

    @property
    def tags(self) -> list[str]:
        return [tag.strip() for tag in self.tags_csv.split(",") if tag.strip()]
