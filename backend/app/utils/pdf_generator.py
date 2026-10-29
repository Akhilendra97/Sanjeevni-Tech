from __future__ import annotations

from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


DEFAULT_PAGE_SIZE = A4


def ensure_pdf_directory(directory: str | Path) -> Path:
    """Create and return the directory used for generated PDFs."""
    path = Path(directory)
    path.mkdir(parents=True, exist_ok=True)
    return path


def create_pdf_styles():
    """Create reusable PDF paragraph styles."""
    styles = getSampleStyleSheet()

    return {
        "title": ParagraphStyle(
            "HospitalTitle",
            parent=styles["Title"],
            fontSize=18,
            leading=22,
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "heading": ParagraphStyle(
            "HospitalHeading",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            alignment=TA_LEFT,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "HospitalBody",
            parent=styles["BodyText"],
            fontSize=9,
            leading=13,
            alignment=TA_LEFT,
        ),
        "small": ParagraphStyle(
            "HospitalSmall",
            parent=styles["BodyText"],
            fontSize=7.5,
            leading=10,
            alignment=TA_LEFT,
        ),
    }


def _paragraph(
    value: object,
    style: ParagraphStyle,
) -> Paragraph:
    """Convert a value into a reportlab Paragraph."""
    text = "" if value is None else str(value)
    return Paragraph(text.replace("\n", "<br/>"), style)


def build_table(
    data: Iterable[Iterable[object]],
    column_widths: list[float] | None = None,
    header: bool = True,
) -> Table:
    """Build a styled PDF table."""
    rows = list(data)

    if not rows:
        raise ValueError("Table data cannot be empty.")

    styles = create_pdf_styles()

    converted_rows = []

    for row_index, row in enumerate(rows):
        row_values = list(row)

        converted_row = [
            _paragraph(
                value,
                styles["small"] if row_index else styles["body"],
            )
            for value in row_values
        ]

        converted_rows.append(converted_row)

    table = Table(
        converted_rows,
        colWidths=column_widths,
        repeatRows=1 if header else 0,
        hAlign="LEFT",
    )

    table_style = [
        (
            "GRID",
            (0, 0),
            (-1, -1),
            0.5,
            colors.grey,
        ),
        (
            "VALIGN",
            (0, 0),
            (-1, -1),
            "TOP",
        ),
        (
            "LEFTPADDING",
            (0, 0),
            (-1, -1),
            5,
        ),
        (
            "RIGHTPADDING",
            (0, 0),
            (-1, -1),
            5,
        ),
        (
            "TOPPADDING",
            (0, 0),
            (-1, -1),
            5,
        ),
        (
            "BOTTOMPADDING",
            (0, 0),
            (-1, -1),
            5,
        ),
    ]

    if header:
        table_style.extend(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.lightgrey,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
            ]
        )

    table.setStyle(TableStyle(table_style))

    return table


def generate_pdf(
    output_path: str | Path,
    title: str,
    sections: Iterable[dict],
    page_size=DEFAULT_PAGE_SIZE,
) -> Path:
    """
    Generate a structured PDF.

    Supported section types:
    - text
    - table
    - spacer
    """
    output = Path(output_path)

    if output.suffix.lower() != ".pdf":
        output = output.with_suffix(".pdf")

    output.parent.mkdir(parents=True, exist_ok=True)

    styles = create_pdf_styles()

    document = SimpleDocTemplate(
        str(output),
        pagesize=page_size,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=title,
    )

    story = [
        _paragraph(title, styles["title"]),
        Spacer(1, 5 * mm),
    ]

    for section in sections:
        section_type = section.get("type", "text")

        if section_type == "text":
            heading = section.get("heading")

            if heading:
                story.append(
                    _paragraph(
                        heading,
                        styles["heading"],
                    )
                )

            story.append(
                _paragraph(
                    section.get("content", ""),
                    styles["body"],
                )
            )

            story.append(Spacer(1, 3 * mm))

        elif section_type == "table":
            table_data = section.get("data", [])
            column_widths = section.get("column_widths")
            header = section.get("header", True)

            story.append(
                build_table(
                    table_data,
                    column_widths=column_widths,
                    header=header,
                )
            )

            story.append(Spacer(1, 4 * mm))

        elif section_type == "spacer":
            height = float(section.get("height", 5))
            story.append(Spacer(1, height * mm))

        else:
            raise ValueError(
                f"Unsupported PDF section type: {section_type}"
            )

    document.build(story)

    return output


def generate_simple_report(
    output_path: str | Path,
    title: str,
    content: str,
) -> Path:
    """Generate a simple text-based hospital report."""
    return generate_pdf(
        output_path=output_path,
        title=title,
        sections=[
            {
                "type": "text",
                "content": content,
            }
        ],
    )


def generate_table_report(
    output_path: str | Path,
    title: str,
    table_data: Iterable[Iterable[object]],
    column_widths: list[float] | None = None,
) -> Path:
    """Generate a PDF containing a single table."""
    return generate_pdf(
        output_path=output_path,
        title=title,
        sections=[
            {
                "type": "table",
                "data": table_data,
                "column_widths": column_widths,
            }
        ],
    )
