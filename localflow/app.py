import reflex as rx

from .state import AppState


def nav_button(label: str, tab: str) -> rx.Component:
    return rx.button(
        label,
        on_click=lambda: AppState.set_tab(tab),
        variant=rx.cond(AppState.active_tab == tab, "solid", "outline"),
        color_scheme=rx.cond(AppState.active_tab == tab, "teal", "gray"),
        width="100%",
        justify_content="flex-start",
    )


def sidebar() -> rx.Component:
    return rx.vstack(
        rx.el.link(
            rel="stylesheet",
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap",
        ),
        rx.box(
            rx.text("LocalFlow", font_size="22px", font_weight="700", letter_spacing="-0.02em"),
            rx.text("Local vision workspace", font_size="12px", color="#6b7280"),
            padding="0.75rem 0.25rem 0.25rem 0.25rem",
        ),
        rx.divider(border_color="#e6e1d8"),
        nav_button("Playground", "playground"),
        nav_button("Annotator", "annotate"),
        rx.divider(border_color="#e6e1d8"),
        rx.vstack(
            rx.text("Runtime Status", font_size="12px", color="#64748b", font_weight="600"),
            rx.hstack(
                rx.box(
                    width="8px",
                    height="8px",
                    border_radius="999px",
                    background=rx.cond(AppState.ollama_up, "#10b981", "#e6e1d8"),
                ),
                rx.text("Ollama", font_size="12px"),
                justify="start",
                spacing="2",
            ),
            rx.hstack(
                rx.box(
                    width="8px",
                    height="8px",
                    border_radius="999px",
                    background=rx.cond(AppState.lmstudio_up, "#10b981", "#e6e1d8"),
                ),
                rx.text("LM Studio", font_size="12px"),
                justify="start",
                spacing="2",
            ),
            spacing="2",
        ),
        rx.button(
            "Check Status",
            on_click=AppState.poll_health,
            width="100%",
            variant="outline",
            size="1",
        ),
        rx.spacer(),
        rx.button(
            "Refresh Models",
            on_click=AppState.refresh_models,
            width="100%",
            variant="outline",
        ),
        spacing="3",
        padding="1.75rem 1.5rem",
        width="19rem",
        height="100vh",
        border_right="1px solid #e6e1d8",
        background="linear-gradient(180deg, #fffaf2 0%, #ffffff 65%)",
    )


def model_controls() -> rx.Component:
    return rx.vstack(
        rx.hstack(
            rx.select(
                items=["Ollama", "LMStudio"],
                value=AppState.backend,
                on_change=AppState.set_backend,
                width="40%",
            ),
            rx.select(
                items=AppState.available_models,
                placeholder="Select model",
                value=AppState.model,
                on_change=AppState.set_model,
                width="60%",
            ),
            width="100%",
        ),
        rx.text_area(
            value=AppState.prompt,
            on_change=AppState.set_prompt,
            placeholder="Zero-shot prompt",
            height="7rem",
            border_radius="12px",
        ),
        rx.vstack(
            rx.hstack(
                rx.text("Threshold", size="2"),
                rx.text(AppState.threshold, size="2"),
                justify="between",
                width="100%",
            ),
            rx.slider(
                min=0,
                max=1,
                step=0.01,
                value=[AppState.threshold],
                on_change=AppState.set_threshold,
            ),
            width="100%",
        ),
        spacing="3",
        width="100%",
    )


def annotation_layer() -> rx.Component:
    return rx.el.svg(
        rx.foreach(
            AppState.playground_annotations,
            lambda ann: rx.el.g(
                rx.el.rect(
                    x=ann["bbox"]["x"].to(int),
                    y=ann["bbox"]["y"].to(int),
                    width=ann["bbox"]["w"].to(int),
                    height=ann["bbox"]["h"].to(int),
                    fill="rgba(37, 99, 235, 0.15)",
                    stroke="#2563eb",
                    stroke_width="3",
                ),
                rx.el.text(
                    ann["label"],
                    x=ann["bbox"]["x"].to(int),
                    y=ann["bbox"]["y"].to(int) - 6,
                    fill="#2563eb",
                    font_size="14",
                    font_weight="700",
                ),
            ),
        ),
        viewBox=AppState.playground_viewbox,
        style={
            "position": "absolute",
            "top": "0",
            "left": "0",
            "width": "100%",
            "height": "100%",
        },
    )


def playground_panel() -> rx.Component:
    return rx.vstack(
        rx.box(
            rx.text("Inference Playground", font_size="22px", font_weight="700"),
            rx.text("Upload an image and run local vision inference.", font_size="13px", color="#6b7280"),
            padding="0.25rem 0",
        ),
        rx.hstack(
            rx.vstack(
                rx.text("Inference Controls", font_size="12px", font_weight="600", color="#6b7280"),
                model_controls(),
                rx.button(
                    "Run Inference",
                    on_click=AppState.run_playground_inference,
                    is_loading=AppState.is_inferencing,
                    color_scheme="teal",
                    size="3",
                    width="100%",
                    is_disabled=~AppState.can_run_inference,
                ),
                rx.cond(
                    AppState.is_inferencing,
                    rx.text("Running inference...", font_size="12px", color="#2563eb"),
                    rx.text("Select a model to run inference.", font_size="12px", color="#9aa0a6"),
                ),
                padding="1.25rem",
                border="1px solid #e6e1d8",
                border_radius="16px",
                background="#ffffff",
                box_shadow="0 10px 28px rgba(15, 23, 42, 0.08)",
                width="320px",
                height="100%",
                align_items="stretch",
                spacing="3",
            ),
            rx.vstack(
                rx.cond(
                    AppState.playground_image,
                    rx.box(
                        rx.upload(
                            rx.button("Upload Another Image", color_scheme="teal"),
                            accept={"image/*": [".png", ".jpg", ".jpeg", ".webp"]},
                            max_files=1,
                            on_upload=AppState.upload_playground,
                        ),
                        width="100%",
                        display="flex",
                        justify_content="center",
                    ),
                    rx.upload(
                        rx.box(
                            rx.text("Drag & drop to upload", font_size="14px", font_weight="600", color="#6b7280"),
                            rx.text("or click to choose an image", font_size="12px", color="#9aa0a6"),
                            padding="3.5rem",
                            border="1px dashed #c9c1b5",
                            border_radius="18px",
                            background="linear-gradient(120deg, #fffaf2, #f7f3ea)",
                            width="100%",
                            min_height="60vh",
                            text_align="center",
                        ),
                        accept={"image/*": [".png", ".jpg", ".jpeg", ".webp"]},
                        max_files=1,
                        on_upload=AppState.upload_playground,
                    ),
                ),
                rx.cond(
                    AppState.playground_image,
                    rx.box(
                        rx.image(
                            src=AppState.playground_image["url"],
                            width="100%",
                            height="100%",
                            object_fit="contain",
                            border_radius="12px",
                        ),
                        annotation_layer(),
                        position="relative",
                        width="100%",
                        max_width="900px",
                        border="1px solid #e6e1d8",
                        border_radius="16px",
                        padding="0.75rem",
                        background="#ffffff",
                        box_shadow="0 16px 42px rgba(15, 23, 42, 0.1)",
                        style={"aspectRatio": AppState.playground_aspect_ratio},
                    ),
                    rx.box(),
                ),
                rx.cond(
                    AppState.playground_images,
                    rx.hstack(
                        rx.foreach(
                            AppState.playground_images,
                            lambda image: rx.button(
                                rx.image(src=image["url"], width="72px", height="54px", object_fit="cover"),
                                on_click=lambda: AppState.select_playground_image(image["id"]),
                                padding="0",
                                border_radius="10px",
                                border=rx.cond(
                                    AppState.playground_image["id"] == image["id"],
                                    "2px solid #14b8a6",
                                    "1px solid #e6e1d8",
                                ),
                                background="#ffffff",
                            ),
                        ),
                        spacing="3",
                        flex_wrap="wrap",
                        width="100%",
                    ),
                    rx.box(),
                ),
                spacing="4",
                width="100%",
                align_items="center",
                min_height="70vh",
            ),
            spacing="6",
            align_items="stretch",
            width="100%",
            height="100%",
        ),
        spacing="4",
        width="100%",
    )


def image_card(image: dict) -> rx.Component:
    status = image.get("status", "unlabeled")
    return rx.box(
        rx.image(src=image["url"], width="100%", height="150px", object_fit="cover"),
        rx.hstack(
            rx.text(image["name"], size="2", weight="bold"),
            rx.badge(status, color_scheme=rx.cond(status == "labeled", "green", "gray")),
            justify="between",
            padding="0.5rem",
        ),
        rx.button(
            "Remove",
            size="1",
            on_click=lambda: AppState.remove_image(image["id"]),
            color_scheme="red",
            variant="outline",
            margin="0.5rem",
        ),
        border="1px solid #e6e1d8",
        border_radius="16px",
        overflow="hidden",
        background="#ffffff",
        box_shadow="0 12px 28px rgba(15, 23, 42, 0.08)",
    )


def annotator_panel() -> rx.Component:
    return rx.vstack(
        rx.box(
            rx.text("Batch Auto-Labeler", font_size="22px", font_weight="700"),
            rx.text("Upload multiple images and run batch labeling.", font_size="13px", color="#6b7280"),
            padding="0.25rem 0",
        ),
        rx.upload(
            rx.button("Upload Images", color_scheme="teal"),
            accept={"image/*": [".png", ".jpg", ".jpeg", ".webp"]},
            max_files=200,
            on_drop=AppState.upload_batch,
        ),
        rx.text_area(
            value=AppState.batch_prompt,
            on_change=AppState.set_batch_prompt,
            placeholder="Labeling instructions",
            height="6rem",
            border_radius="12px",
        ),
        rx.hstack(
            rx.button(
                "Run Auto-Labeling",
                on_click=AppState.run_batch_labeling,
                is_loading=AppState.is_batching,
                color_scheme="teal",
                size="3",
            ),
            rx.button("Reset", on_click=AppState.clear_project, variant="outline"),
        ),
        rx.divider(),
        rx.cond(
            AppState.has_images,
            rx.grid(
                rx.foreach(AppState.project_images, image_card),
                template_columns="repeat(3, 1fr)",
                gap="1.25rem",
                width="100%",
            ),
            rx.text("No images uploaded yet.", color="#9aa0a6"),
        ),
        rx.divider(),
        rx.vstack(
            rx.text("Export YOLO Dataset", font_size="18px", font_weight="700"),
            rx.text("Automatic train/valid split with a single zip download.", font_size="12px", color="#6b7280"),
            rx.hstack(
                rx.text("Train split", size="2"),
                rx.text(AppState.export_ratio, size="2"),
                justify="between",
                width="100%",
            ),
            rx.slider(
                min=0.5,
                max=0.95,
                step=0.05,
                value=[AppState.export_ratio],
                on_change=AppState.set_export_ratio,
            ),
            rx.button(
                "Download YOLO Zip",
                on_click=AppState.export_yolo,
                is_disabled=AppState.labeled_count == 0,
                color_scheme="green",
                size="3",
            ),
            rx.hstack(
                rx.text("Labeled images:"),
                rx.text(AppState.labeled_count, weight="bold"),
            ),
            spacing="3",
            width="100%",
            padding="1.25rem",
            border="1px solid #e6e1d8",
            border_radius="16px",
            background="#ffffff",
            box_shadow="0 12px 28px rgba(15, 23, 42, 0.08)",
        ),
        spacing="4",
        width="100%",
    )


def main_content() -> rx.Component:
    return rx.box(
        rx.cond(
            AppState.active_tab == "playground",
            playground_panel(),
            annotator_panel(),
        ),
        padding="1.5rem",
        width="100%",
        height="100vh",
        overflow_y="auto",
        background="radial-gradient(circle at 15% 15%, #fff4e6 0%, transparent 45%), linear-gradient(180deg, #f6f1e7 0%, #fcfbf8 60%, #ffffff 100%)",
    )


def index() -> rx.Component:
    return rx.hstack(
        sidebar(),
        rx.box(
            main_content(),
            font_family="'Space Grotesk', 'IBM Plex Sans', 'Segoe UI', sans-serif",
        ),
        width="100%",
        min_height="100vh",
        spacing="0",
        align_items="stretch",
    )


app = rx.App()
app.add_page(index, title="LocalFlow")
