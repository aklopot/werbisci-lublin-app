from __future__ import annotations

from pydantic import BaseModel, Field


class AddressBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    street: str = Field(min_length=1, max_length=200)
    apartment_no: str | None = Field(default=None, max_length=50)
    city: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(min_length=3, max_length=20)


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    street: str | None = Field(default=None, max_length=200)
    apartment_no: str | None = Field(default=None, max_length=50)
    city: str | None = Field(default=None, max_length=120)
    postal_code: str | None = Field(default=None, max_length=20)
    label_marked: bool | None = None


class AddressRead(BaseModel):
    id: int
    first_name: str
    last_name: str
    street: str
    apartment_no: str | None
    city: str
    postal_code: str
    label_marked: bool

    class Config:
        from_attributes = True


class SearchQuery(BaseModel):
    q: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    city: str | None = None
    street: str | None = None
    label_marked: bool | None = None
    limit: int | None = Field(default=50, ge=1, le=500)
    offset: int | None = Field(default=0, ge=0)
