from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import BinaryIO


DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".doc",
    ".docx",
    ".txt",
    ".csv",
}


def sanitize_filename(filename: str) -> str:
    """Return a filesystem-safe filename."""
    if not filename or not filename.strip():
        raise ValueError("Filename is required.")

    name = Path(filename).name.strip()

    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    name = re.sub(r"_+", "_", name)

    if name in {"", ".", ".."}:
        raise ValueError("Invalid filename.")

    return name


def get_file_extension(filename: str) -> str:
    """Return the lowercase file extension."""
    safe_name = sanitize_filename(filename)
    return Path(safe_name).suffix.lower()


def validate_extension(
    filename: str,
    allowed_extensions: set[str] | None = None,
) -> bool:
    """Validate a file extension against an allowed extension set."""
    extensions = allowed_extensions or ALLOWED_EXTENSIONS
    normalized_extensions = {
        extension.lower()
        if extension.startswith(".")
        else f".{extension.lower()}"
        for extension in extensions
    }

    extension = get_file_extension(filename)

    if extension not in normalized_extensions:
        raise ValueError(
            f"File extension '{extension or 'none'}' is not allowed."
        )

    return True


def validate_file_size(
    size: int,
    max_size: int = DEFAULT_MAX_FILE_SIZE,
) -> bool:
    """Validate file size in bytes."""
    if size < 0:
        raise ValueError("File size cannot be negative.")

    if max_size <= 0:
        raise ValueError("Maximum file size must be greater than zero.")

    if size > max_size:
        raise ValueError(
            f"File size exceeds the maximum allowed size of "
            f"{max_size} bytes."
        )

    return True


def generate_unique_filename(
    filename: str,
    preserve_extension: bool = True,
) -> str:
    """Generate a unique filesystem-safe filename."""
    safe_name = sanitize_filename(filename)
    path = Path(safe_name)

    unique_id = uuid.uuid4().hex

    if preserve_extension:
        return f"{path.stem}_{unique_id}{path.suffix.lower()}"

    return f"{path.stem}_{unique_id}"


def ensure_directory(directory: str | Path) -> Path:
    """Create a directory if it does not exist."""
    path = Path(directory)
    path.mkdir(parents=True, exist_ok=True)
    return path


def build_safe_path(
    directory: str | Path,
    filename: str,
) -> Path:
    """
    Build a safe path inside the supplied directory.

    Path traversal components are removed through filename sanitization.
    """
    base_directory = ensure_directory(directory)
    safe_filename = sanitize_filename(filename)

    target = (base_directory / safe_filename).resolve()
    base_resolved = base_directory.resolve()

    try:
        target.relative_to(base_resolved)
    except ValueError as exc:
        raise ValueError(
            "Resolved file path is outside the target directory."
        ) from exc

    return target


def save_file(
    file_object: BinaryIO,
    directory: str | Path,
    filename: str,
    max_size: int = DEFAULT_MAX_FILE_SIZE,
    allowed_extensions: set[str] | None = None,
) -> Path:
    """Save a binary file after validating its name, extension, and size."""
    validate_extension(filename, allowed_extensions)

    directory_path = ensure_directory(directory)
    safe_filename = generate_unique_filename(filename)
    target_path = build_safe_path(directory_path, safe_filename)

    total_size = 0
    chunk_size = 1024 * 1024

    with target_path.open("wb") as output_file:
        while True:
            chunk = file_object.read(chunk_size)

            if not chunk:
                break

            total_size += len(chunk)

            if total_size > max_size:
                output_file.close()

                try:
                    target_path.unlink()
                except FileNotFoundError:
                    pass

                raise ValueError(
                    f"File size exceeds the maximum allowed size of "
                    f"{max_size} bytes."
                )

            output_file.write(chunk)

    validate_file_size(total_size, max_size)

    return target_path


def delete_file(file_path: str | Path) -> bool:
    """Delete a file if it exists."""
    path = Path(file_path)

    if not path.exists():
        return False

    if not path.is_file():
        raise ValueError("The supplied path is not a file.")

    path.unlink()
    return True


def file_exists(file_path: str | Path) -> bool:
    """Return whether a path exists and is a regular file."""
    path = Path(file_path)
    return path.exists() and path.is_file()


def get_file_size(file_path: str | Path) -> int:
    """Return file size in bytes."""
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"File does not exist: {file_path}"
        )

    if not path.is_file():
        raise ValueError("The supplied path is not a file.")

    return path.stat().st_size
