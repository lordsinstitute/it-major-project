# SRF sample code transcribed from the supplied project-report photos

Files:
- `srf_core.py` — visible excerpt of the core pipeline (report pages 22–24)
- `users/views.py` — visible prediction view excerpt (report pages 24–25)
- `users/models.py` — visible model excerpt (report pages 25–26)

## Important limitations
This is a transcription of the code visible in the photographs, not a complete verified project.
The photos do not show the implementations of `generate_fact_check_questions`,
`retrieve_and_rank_evidence`, or `revise_sentence_with_evidence`, although `srf_core.py`
calls them. Other imports used by `users/views.py` (such as `login_required`,
`messages`, and `render`) are not shown in the photographed excerpt and must be
present elsewhere in the actual file.

Replace the placeholder API key values with secure environment-variable configuration
before running the project. Do not commit real API keys or passwords to GitHub.
