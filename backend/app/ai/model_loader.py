from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib


BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "models"


class ModelLoader:
    """Centralized loader for persisted machine-learning models."""

    def __init__(self, model_dir: Path | None = None) -> None:
        self.model_dir = model_dir or MODEL_DIR
        self.model_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        self._cache: dict[str, Any] = {}

    def get_model(
        self,
        model_name: str,
    ) -> Any | None:
        """Load a model from disk and cache it in memory."""
        if model_name in self._cache:
            return self._cache[model_name]

        model_path = self.model_dir / model_name

        if model_path.suffix != ".joblib":
            model_path = model_path.with_suffix(".joblib")

        if not model_path.exists():
            return None

        model = joblib.load(model_path)
        self._cache[model_name] = model

        return model

    def has_model(
        self,
        model_name: str,
    ) -> bool:
        """Return whether a persisted model exists."""
        model_path = self.model_dir / model_name

        if model_path.suffix != ".joblib":
            model_path = model_path.with_suffix(".joblib")

        return model_path.exists()

    def clear_cache(self) -> None:
        """Clear all cached models."""
        self._cache.clear()

    def remove_from_cache(
        self,
        model_name: str,
    ) -> None:
        """Remove one model from the in-memory cache."""
        self._cache.pop(
            model_name,
            None,
        )


model_loader = ModelLoader()


def load_model(
    model_name: str,
) -> Any | None:
    """Convenience wrapper around the shared model loader."""
    return model_loader.get_model(model_name)
