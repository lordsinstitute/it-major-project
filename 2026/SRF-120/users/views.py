from .models import UserRegistrationModel, PredictionHistory
from .srf_core import run_framework
import json

@login_required
def prediction(request):
    context = {'loggeduser': request.session.get('loggeduser')}

    if request.method == 'POST':
        paragraph = request.POST.get('paragraph', '').strip()
        if paragraph:
            try:
                result = run_framework(paragraph)
                context['result'] = result
                context['original_paragraph'] = paragraph

                # Save to history
                user_id = request.session.get('id')
                user_obj = UserRegistrationModel.objects.get(id=user_id)
                trace_logs = result.get('trace_logs', [])
                corrected = sum(
                    1 for log in trace_logs
                    if not log.get('threshold_passed', True)
                )

                history = PredictionHistory(
                    user=user_obj,
                    input_paragraph=paragraph,
                    output_paragraph=result.get('final_paragraph', ''),
                    has_hallucinations=result.get('has_hallucinations', False),
                    sentences_total=len(trace_logs),
                    sentences_corrected=corrected,
                )
                history.trace_logs = trace_logs  # property setter -> JSON
                history.save()
                messages.success(request, "Analysis Complete!")
            except Exception as e:
                messages.error(request, f"Error: {e}")

    return render(request, 'users/prediction.html', context)
