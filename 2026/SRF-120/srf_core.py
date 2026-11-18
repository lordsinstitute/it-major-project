import os
import requests
import numpy as np
from groq import Groq
from sentence_transformers import CrossEncoder
from transformers import pipeline
from nltk.tokenize import sent_tokenize

GROQ_API_KEY = "your_groq_api_key"
GOOGLE_SEARCH_API_KEY = "your_google_api_key"
SEARCH_ENGINE_ID = "your_engine_id"

groq_client = None
cross_encoder = None
nli_pipeline = None


def init_models():
    global groq_client, cross_encoder, nli_pipeline

    if groq_client is None:
        groq_client = Groq(api_key=GROQ_API_KEY)

    if cross_encoder is None:
        cross_encoder = CrossEncoder(
            'cross-encoder/ms-marco-MiniLM-L-6-v2', device='cpu'
        )

    if nli_pipeline is None:
        nli_pipeline = pipeline(
            "text-classification",
            model="roberta-large-mnli", device=-1
        )


def agreement_gate_nli(sentence, evidence, threshold=0.1):
    try:
        result = nli_pipeline(
            f"Premise: {evidence}. Hypothesis: {sentence}"
        )

        entailment_score = 0.0
        res_list = [result[0] if isinstance(result, list)
                    and isinstance(result[0], list) else result]
        if not isinstance(res_list, list):
            res_list = [res_list]

        for prediction in res_list:
            if isinstance(prediction, dict):
                label = prediction.get('label', '').lower()
                if ('entailment' in label or label == 'entail'
                        or label == 'label_2'):
                    entailment_score = prediction.get('score', 0.0)
                    break

        return entailment_score > threshold, entailment_score

    except Exception as e:
        print(f"Gate Error: {e}")
        return False, 0.0


def run_framework(paragraph):
    init_models()
    sentences = sent_tokenize(paragraph)
    revised_sentences = []
    accumulated_context = ""
    trace_logs = []
    threshold = 0.1

    for i, sentence in enumerate(sentences):
        log = {
            "sentence_id": i + 1,
            "original_sentence": sentence,
            "questions": [],
            "evidence": "",
            "entailment_score": 0.0,
            "entailment_percentage": 0,
            "hallucination_percentage": 100,
            "threshold_passed": False,
            "action": "",
            "revised_sentence": sentence
        }

        questions = generate_fact_check_questions(
            sentence, accumulated_context
        )
        log["questions"] = questions
        best_evidence = "None"

        if questions:
            best_evidence = retrieve_and_rank_evidence(
                questions[0], sentence
            )

        log["evidence"] = best_evidence
        is_supported, score = agreement_gate_nli(
            sentence, best_evidence, threshold
        )
        log["entailment_score"] = round(score, 4)
        log["entailment_percentage"] = min(100, int(score * 100))
        log["hallucination_percentage"] = 100 - log["entailment_percentage"]
        log["threshold_passed"] = is_supported

        if is_supported:
            revised_sentences.append(sentence)
            accumulated_context += " " + sentence
            log["action"] = "Verified"
        else:
            revised = revise_sentence_with_evidence(
                sentence, best_evidence, accumulated_context
            )
            revised_sentences.append(revised)
            log["revised_sentence"] = revised
            accumulated_context += " " + revised
            log["action"] = "Rewritten"

        trace_logs.append(log)

    return {
        "final_paragraph": " ".join(revised_sentences),
        "trace_logs": trace_logs,
        "has_hallucinations": any(
            not log["threshold_passed"] for log in trace_logs
        )
    }


# NOTE:
# The photographed pages refer to these helper functions, but their
# definitions are not visible in the supplied images:
# generate_fact_check_questions()
# retrieve_and_rank_evidence()
# revise_sentence_with_evidence()
# Add their original implementations from the remaining project files.
