from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("ai_assistant", "0008_alter_document_content_alter_document_summary_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="DocumentChunk",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "document",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chunks",
                        to="ai_assistant.document",
                    ),
                ),
                ("chunk_index", models.IntegerField(help_text="Position of this chunk within the document (0-based)")),
                ("text", models.TextField(help_text="Plaintext content of this chunk (encrypted at rest)")),
                ("embedding", models.TextField(help_text="JSON-encoded float list — the vector embedding of this chunk")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "document_chunks",
                "ordering": ["document", "chunk_index"],
            },
        ),
        migrations.AddIndex(
            model_name="documentchunk",
            index=models.Index(fields=["document"], name="document_chunks_doc_idx"),
        ),
    ]
