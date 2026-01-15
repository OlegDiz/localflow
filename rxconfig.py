import reflex as rx

config = rx.Config(
    app_name="localflow",
    frontend_port=3001,
    backend_port=8001,
    disable_plugins=["reflex.plugins.sitemap.SitemapPlugin"],
)
