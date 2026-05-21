from sqlalchemy.orm import DeclarativeBase, MappedColumn
from sqlalchemy import DateTime, func
from datetime import datetime
from typing import Optional
import sqlalchemy as sa


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: MappedColumn[datetime] = sa.Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: MappedColumn[datetime] = sa.Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class SoftDeleteMixin:
    deleted_at: MappedColumn[Optional[datetime]] = sa.Column(
        DateTime(timezone=True), nullable=True, default=None
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
