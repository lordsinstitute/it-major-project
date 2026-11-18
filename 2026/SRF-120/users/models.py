import json
from django.db import models


class UserRegistrationModel(models.Model):
    name = models.CharField(max_length=100)
    loginid = models.CharField(unique=True, max_length=100)
    password = models.CharField(max_length=100)
    mobile = models.CharField(unique=True, max_length=10)
    email = models.EmailField(unique=True, max_length=100)
    status = models.CharField(max_length=100, default='waiting')

    class Meta:
        db_table = 'user_registrations'


class PredictionHistory(models.Model):
    user = models.ForeignKey(
        UserRegistrationModel,
        on_delete=models.CASCADE,
        related_name='predictions'
    )
    input_paragraph = models.TextField()
    output_paragraph = models.TextField()
    trace_logs_json = models.TextField(default='[]')
    has_hallucinations = models.BooleanField(default=False)
    sentences_total = models.IntegerField(default=0)
    sentences_corrected = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def trace_logs(self):
        try:
            return json.loads(self.trace_logs_json)
        except Exception:
            return []

    @trace_logs.setter
    def trace_logs(self, value):
        self.trace_logs_json = json.dumps(value)

    @property
    def input_preview(self):
        return (
            self.input_paragraph[:100] +
            ("..." if len(self.input_paragraph) > 100 else "")
        )

    class Meta:
        db_table = 'prediction_history'
        ordering = ['-created_at']
