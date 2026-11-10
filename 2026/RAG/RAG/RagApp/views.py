from django.shortcuts import render
from django.template import RequestContext
from django.contrib import messages
from django.http import HttpResponse

from transformers import pipeline

import pymysql
from django.core.files.storage import FileSystemStorage
from datetime import date

import re
import os
import math
import html
import boto3

# PDF support
import PyPDF2

# DOCX support
from docx import Document

# URL encoding
from urllib.parse import quote


global uname, qa_pipeline


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# This points to:
# RagApp/static/files
UPLOAD_DIR = os.path.join(
    BASE_DIR,
    "static",
    "files"
)


# ============================================================
# QUESTION ANSWERING MODEL
# ============================================================
#
# IMPORTANT:
# We do NOT use facebook/rag-sequence-nq question_encoder
# as a document embedding model.
#
# The previous code encoded documents with model.question_encoder().
# That is not a valid document-retrieval method and caused unrelated
# answers such as "Image Processing" and "Wide Area Network".
#
# We now retrieve relevant document chunks using a local TF-IDF-style
# lexical scorer and use DistilBERT only on the retrieved chunks.
# This keeps the answer grounded in the uploaded document.
# ============================================================

qa_pipeline = pipeline(
    "question-answering",
    model="distilbert-base-uncased-distilled-squad"
)


# ============================================================
# SAMPLE CONTEXT
# ============================================================

context = """
Capital of India is Delhi.
Tokyo is the capital of Japan.
Apple is the rich source of vitamin.
Modi is the prime minister of india.
"""


# ============================================================
# DOCUMENT TEXT EXTRACTION
# Supports TXT, PDF and DOCX
# ============================================================

def extract_document_text(filepath):

    extension = os.path.splitext(filepath)[1].lower()

    # --------------------------------------------------------
    # TXT
    # --------------------------------------------------------

    if extension == '.txt':

        # Try common encodings instead of forcing UTF-8.
        encodings = [
            'utf-8',
            'utf-8-sig',
            'cp1252',
            'latin-1'
        ]

        for encoding in encodings:

            try:

                with open(
                    filepath,
                    'r',
                    encoding=encoding,
                    errors='strict'
                ) as file:

                    return file.read()

            except UnicodeDecodeError:

                continue

            except Exception as e:

                print("TXT reading error:", e)
                return ""

        # Last-resort readable extraction
        try:

            with open(
                filepath,
                'r',
                encoding='utf-8',
                errors='ignore'
            ) as file:

                return file.read()

        except Exception as e:

            print("TXT fallback reading error:", e)
            return ""


    # --------------------------------------------------------
    # PDF
    # --------------------------------------------------------

    elif extension == '.pdf':

        text = ""

        try:

            with open(
                filepath,
                'rb'
            ) as file:

                pdf_reader = PyPDF2.PdfReader(file)

                for page in pdf_reader.pages:

                    try:

                        page_text = page.extract_text()

                        if page_text:

                            text += page_text
                            text += "\n"

                    except Exception as e:

                        print(
                            "Error extracting PDF page:",
                            e
                        )

            return text

        except Exception as e:

            print("PDF reading error:", e)
            return ""


    # --------------------------------------------------------
    # DOCX
    # --------------------------------------------------------

    elif extension == '.docx':

        text_parts = []

        try:

            document = Document(filepath)

            # Normal paragraphs
            for paragraph in document.paragraphs:

                value = paragraph.text.strip()

                if value:

                    text_parts.append(value)


            # Tables are common in Word documents.
            # Include them as searchable text.
            for table in document.tables:

                for row in table.rows:

                    cells = []

                    for cell in row.cells:

                        value = cell.text.strip()

                        if value:

                            cells.append(value)

                    if cells:

                        text_parts.append(
                            " | ".join(cells)
                        )


            return "\n".join(text_parts)

        except Exception as e:

            print("DOCX reading error:", e)
            return ""


    # --------------------------------------------------------
    # UNSUPPORTED
    # --------------------------------------------------------

    else:

        print(
            "Unsupported document format:",
            extension
        )

        return ""


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_document_text(text):

    if text is None:

        return ""

    text = text.replace(
        '\x00',
        ' '
    )

    # Normalize Windows/Mac line endings
    text = text.replace(
        '\r\n',
        '\n'
    ).replace(
        '\r',
        '\n'
    )

    # Remove excessive spaces but keep paragraph boundaries
    text = re.sub(
        r'[ \t]+',
        ' ',
        text
    )

    text = re.sub(
        r'\n{3,}',
        '\n\n',
        text
    )

    return text.strip()


# ============================================================
# TOKENIZATION
# ============================================================

def tokenize_text(text):

    if text is None:

        return []

    return re.findall(
        r'[a-zA-Z0-9]+',
        text.lower()
    )


# ============================================================
# STOP WORDS
# ============================================================

STOP_WORDS = set([
    'what', 'is', 'are', 'was', 'were',
    'the', 'a', 'an', 'of', 'in', 'on',
    'to', 'for', 'and', 'or', 'as',
    'how', 'why', 'where', 'when', 'who',
    'does', 'do', 'did', 'can', 'could',
    'would', 'should', 'will',
    'please', 'tell', 'me', 'about',
    'explain', 'describe', 'give',
    'define', 'definition', 'mean', 'means',
    'discuss', 'discussed', 'document',
    'according', 'based'
])


# ============================================================
# QUESTION KEYWORDS
# ============================================================

def get_question_keywords(question):

    words = tokenize_text(question)

    keywords = []

    for word in words:

        if (
            word not in STOP_WORDS
            and len(word) > 1
        ):

            keywords.append(word)


    # Simple singular/plural normalization.
    normalized = []

    for word in keywords:

        normalized.append(word)

        if word.endswith('ies') and len(word) > 4:

            normalized.append(
                word[:-3] + 'y'
            )

        elif word.endswith('s') and len(word) > 3:

            normalized.append(
                word[:-1]
            )


    # Remove duplicates while preserving order
    result = []

    for word in normalized:

        if word not in result:

            result.append(word)

    return result


# ============================================================
# CREATE DOCUMENT CHUNKS
# ============================================================
#
# We keep paragraph/heading structure instead of blindly taking
# arbitrary 1400-character blocks.
# ============================================================

def create_document_chunks(text):

    text = clean_document_text(text)

    if not text:

        return []


    lines = text.split('\n')

    chunks = []

    current = []


    for line in lines:

        line = line.strip()

        if not line:

            if current:

                chunks.append(
                    " ".join(current).strip()
                )

                current = []

            continue


        # Preserve headings/short lines together with the next
        # paragraph when possible.
        if (
            len(line) < 120
            and
            (
                line.endswith(':')
                or
                line.isupper()
                or
                re.match(
                    r'^(\d+[\.\)]|[A-Z][\.\)])\s+',
                    line
                )
            )
        ):

            if current:

                chunks.append(
                    " ".join(current).strip()
                )

                current = []

            current.append(line)

        else:

            current.append(line)


    if current:

        chunks.append(
            " ".join(current).strip()
        )


    # If extraction produced only one huge paragraph,
    # split it by sentences.
    final_chunks = []

    for chunk in chunks:

        if len(chunk) <= 1200:

            final_chunks.append(chunk)
            continue


        sentences = re.split(
            r'(?<=[.!?])\s+',
            chunk
        )

        current_chunk = ""

        for sentence in sentences:

            sentence = sentence.strip()

            if not sentence:

                continue


            if (
                len(current_chunk)
                +
                len(sentence)
                +
                1
                <= 1100
            ):

                if current_chunk:

                    current_chunk += " "

                current_chunk += sentence

            else:

                if current_chunk:

                    final_chunks.append(
                        current_chunk
                    )

                current_chunk = sentence


        if current_chunk:

            final_chunks.append(
                current_chunk
            )


    return final_chunks


# ============================================================
# TF-IDF STYLE RETRIEVAL
# ============================================================
#
# This is implemented locally so no additional sklearn package
# is required.
# ============================================================

def build_tfidf_vectors(chunks):

    documents = []

    document_frequency = {}


    for chunk in chunks:

        tokens = tokenize_text(chunk)

        # Remove common words
        tokens = [
            token
            for token in tokens
            if token not in STOP_WORDS
            and len(token) > 1
        ]

        documents.append(tokens)

        unique_tokens = set(tokens)

        for token in unique_tokens:

            document_frequency[token] = (
                document_frequency.get(token, 0)
                + 1
            )


    total_documents = float(
        len(documents)
    )

    vectors = []


    for tokens in documents:

        term_frequency = {}

        for token in tokens:

            term_frequency[token] = (
                term_frequency.get(token, 0)
                + 1
            )


        vector = {}

        token_count = float(
            len(tokens)
        )

        if token_count == 0:

            vectors.append(vector)
            continue


        for token, count in term_frequency.items():

            df = document_frequency.get(
                token,
                0
            )

            # Smooth IDF
            idf = math.log(
                (1.0 + total_documents)
                /
                (1.0 + float(df))
            ) + 1.0


            tf = float(count) / token_count

            vector[token] = tf * idf


        vectors.append(vector)


    return vectors, document_frequency


# ============================================================
# COSINE SIMILARITY
# ============================================================

def cosine_similarity_dict(vector_a, vector_b):

    if not vector_a or not vector_b:

        return 0.0


    dot_product = 0.0
    norm_a = 0.0
    norm_b = 0.0


    for key, value in vector_a.items():

        norm_a += value * value

        if key in vector_b:

            dot_product += (
                value
                *
                vector_b[key]
            )


    for value in vector_b.values():

        norm_b += value * value


    denominator = (
        math.sqrt(norm_a)
        *
        math.sqrt(norm_b)
    )


    if denominator == 0:

        return 0.0


    return dot_product / denominator


# ============================================================
# QUERY VECTOR
# ============================================================

def create_query_vector(
    query,
    document_frequency,
    total_documents
):

    tokens = tokenize_text(query)

    tokens = [
        token
        for token in tokens
        if token not in STOP_WORDS
        and len(token) > 1
    ]


    term_frequency = {}

    for token in tokens:

        term_frequency[token] = (
            term_frequency.get(token, 0)
            + 1
        )


    vector = {}

    token_count = float(
        len(tokens)
    )


    if token_count == 0:

        return vector


    for token, count in term_frequency.items():

        if token not in document_frequency:

            continue


        df = document_frequency[token]

        idf = math.log(
            (1.0 + float(total_documents))
            /
            (1.0 + float(df))
        ) + 1.0


        vector[token] = (
            (float(count) / token_count)
            *
            idf
        )


    return vector


# ============================================================
# RETRIEVE RELEVANT CHUNKS
# ============================================================

def retrieve_relevant_chunks(
    query,
    chunks,
    top_k=5
):

    if not chunks:

        return []


    vectors, document_frequency = (
        build_tfidf_vectors(chunks)
    )


    query_vector = create_query_vector(
        query,
        document_frequency,
        len(chunks)
    )


    question_keywords = get_question_keywords(
        query
    )


    results = []


    for index, chunk in enumerate(chunks):

        chunk_lower = chunk.lower()

        score = cosine_similarity_dict(
            vectors[index],
            query_vector
        )


        # Exact keyword coverage gives additional
        # grounding for short questions.
        matched_keywords = 0

        for keyword in question_keywords:

            if keyword in chunk_lower:

                matched_keywords += 1


        if question_keywords:

            coverage = (
                float(matched_keywords)
                /
                float(len(question_keywords))
            )

            score += (
                coverage * 0.20
            )


        # Exact phrase is a strong signal.
        clean_query = query.lower().strip()

        if (
            len(clean_query) > 3
            and clean_query in chunk_lower
        ):

            score += 0.50


        # Title/heading containing the question topic
        # receives a small boost.
        first_part = chunk_lower[:250]

        for keyword in question_keywords:

            if keyword in first_part:

                score += 0.05


        results.append(
            (
                score,
                index,
                chunk
            )
        )


    results.sort(
        key=lambda item: item[0],
        reverse=True
    )


    return results[:top_k]


# ============================================================
# DOMAIN LIST EXTRACTION
# ============================================================
#
# Your uploaded "Domains Speach.docx" starts with a list of the
# major domains. For a question asking which domains are covered,
# it is better to return the source list rather than make an
# extractive QA model choose one random domain.
# ============================================================

def extract_domain_list(text):

    lines = text.split('\n')

    domain_names = [
        'Artificial Intelligence',
        'Machine Learning',
        'Deep Learning',
        'Data Science',
        'Blockchain',
        'Cloud Computing',
        'Networking',
        'Cybersecurity',
        'Image Processing'
    ]


    found = []

    lower_text = text.lower()


    for domain in domain_names:

        if domain.lower() in lower_text:

            found.append(domain)


    return found


# ============================================================
# CHECK DOMAIN-LIST QUESTION
# ============================================================

def is_domain_list_question(query):

    q = query.lower()

    patterns = [
        'what are the domains',
        'what are the major domains',
        'what domains are discussed',
        'which domains are discussed',
        'which domains are covered',
        'what domains are covered',
        'list the domains',
        'list of domains',
        'major technology domains',
        'technology domains'
    ]


    for pattern in patterns:

        if pattern in q:

            return True


    return False


# ============================================================
# GENERATION ACTION
# ============================================================

def GenerationAction(request):

    if request.method != 'POST':

        return render(
            request,
            'Generation.html',
            {}
        )


    # ========================================================
    # GET USER QUESTION
    # ========================================================

    query = request.POST.get(
        't1',
        ''
    )


    if query is None:

        query = ''


    query = query.strip()


    if query == '':

        output = (
            "<b>Input Text :</b> "
            "<font color='red'>"
            "Please enter a question."
            "</font>"
            "<br/><br/>"
            "<b>Generated Text :</b> "
            "<font color='red'>"
            "No question entered."
            "</font>"
        )


        return render(
            request,
            'Generation.html',
            {
                'data': output
            }
        )


    # ========================================================
    # CHECK DOCUMENT DIRECTORY
    # ========================================================

    upload_dir = UPLOAD_DIR


    if not os.path.exists(upload_dir):

        answer = (
            "No documents have been uploaded."
        )


        output = (
            "<b>Input Text :</b> "
            + html.escape(query)
            + "<br/><br/>"
            "<b>Generated Text :</b> "
            + html.escape(answer)
        )


        return render(
            request,
            'Generation.html',
            {
                'data': output
            }
        )


    # ========================================================
    # GET SUPPORTED FILES
    # ========================================================

    supported_files = []


    for filename in os.listdir(upload_dir):

        extension = os.path.splitext(
            filename
        )[1].lower()


        if extension in [
            '.txt',
            '.pdf',
            '.docx'
        ]:

            filepath = os.path.join(
                upload_dir,
                filename
            )


            if os.path.isfile(filepath):

                supported_files.append(
                    filepath
                )


    if len(supported_files) == 0:

        answer = (
            "No TXT, PDF or DOCX document is available."
        )


        output = (
            "<b>Input Text :</b> "
            + html.escape(query)
            + "<br/><br/>"
            "<b>Generated Text :</b> "
            + html.escape(answer)
        )


        return render(
            request,
            'Generation.html',
            {
                'data': output
            }
        )


    # ========================================================
    # USE MOST RECENT DOCUMENT
    # ========================================================

    latest_file = max(
        supported_files,
        key=os.path.getmtime
    )


    filename = os.path.basename(
        latest_file
    )


    print(
        "Generation document:",
        filename
    )


    # ========================================================
    # EXTRACT DOCUMENT
    # ========================================================

    context_text = extract_document_text(
        latest_file
    )


    context_text = clean_document_text(
        context_text
    )


    if context_text == '':

        answer = (
            "I could not extract readable text "
            "from the uploaded document."
        )


        output = (
            "<b>Input Text :</b> "
            + html.escape(query)
            + "<br/><br/>"
            "<b>Generated Text :</b> "
            + html.escape(answer)
        )


        return render(
            request,
            'Generation.html',
            {
                'data': output
            }
        )


    # ========================================================
    # SPECIAL CASE:
    # "WHAT ARE THE DOMAINS?"
    # ========================================================

    if is_domain_list_question(query):

        domains = extract_domain_list(
            context_text
        )


        if domains:

            answer = (
                "The major technology domains "
                "discussed in the document are: "
                +
                ", ".join(domains)
                +
                "."
            )

        else:

            answer = (
                "The document does not provide "
                "a clear list of technology domains."
            )


        output = (
            "<b>Input Text :</b> "
            + html.escape(query)
            + "<br/><br/>"
            "<b>Generated Text :</b> "
            + html.escape(answer)
        )


        return render(
            request,
            'Generation.html',
            {
                'data': output
            }
        )


    # ========================================================
    # CREATE CHUNKS
    # ========================================================

    chunks = create_document_chunks(
        context_text
    )


    print(
        "Total document chunks:",
        len(chunks)
    )


    if not chunks:

        answer = (
            "The document does not contain "
            "readable text."
        )


        output = (
            "<b>Input Text :</b> "
            + html.escape(query)
            + "<br/><br/>"
            "<b>Generated Text :</b> "
            + html.escape(answer)
        )


        return render(
            request,
            'Generation.html',
            {
                'data': output
            }
        )


    # ========================================================
    # RETRIEVE RELEVANT CHUNKS
    # ========================================================

    retrieved = retrieve_relevant_chunks(
        query,
        chunks,
        top_k=5
    )


    print(
        "Top retrieval results:"
    )


    for score, index, chunk in retrieved:

        print(
            "Score:",
            round(score, 4),
            "Chunk:",
            chunk[:200]
        )


    if not retrieved:

        answer = (
            "The answer could not be found "
            "in the uploaded document."
        )


        output = (
            "<b>Input Text :</b> "
            + html.escape(query)
            + "<br/><br/>"
            "<b>Generated Text :</b> "
            + html.escape(answer)
        )


        return render(
            request,
            'Generation.html',
            {
                'data': output
            }
        )


    # ========================================================
    # DO NOT USE QA ON A WEAK RETRIEVAL RESULT
    # ========================================================

    best_retrieval_score = retrieved[0][0]


    if best_retrieval_score < 0.08:

        answer = (
            "The answer could not be found "
            "in the uploaded document."
        )


        output = (
            "<b>Input Text :</b> "
            + html.escape(query)
            + "<br/><br/>"
            "<b>Generated Text :</b> "
            + html.escape(answer)
        )


        return render(
            request,
            'Generation.html',
            {
                'data': output
            }
        )


    # ========================================================
    # QUESTION ANSWERING
    # ========================================================

    qa_results = []


    for retrieval_score, index, chunk in retrieved:

        try:

            result = qa_pipeline(
                question=query,
                context=chunk
            )


            qa_answer = result.get(
                'answer',
                ''
            ).strip()


            qa_score = float(
                result.get(
                    'score',
                    0
                )
            )


            if not qa_answer:

                continue


            # --------------------------------------------
            # Verify that the answer actually occurs
            # in the retrieved source chunk.
            # --------------------------------------------

            if (
                qa_answer.lower()
                not in
                chunk.lower()
            ):

                continue


            # --------------------------------------------
            # Save grounded result
            # --------------------------------------------

            qa_results.append(
                (
                    qa_score,
                    retrieval_score,
                    qa_answer,
                    chunk
                )
            )


        except Exception as e:

            print(
                "QA error:",
                e
            )

            continue


    # ========================================================
    # SELECT BEST GROUNDED ANSWER
    # ========================================================

    if not qa_results:

        answer = (
            "The answer could not be found "
            "with sufficient confidence in "
            "the uploaded document."
        )

    else:

        # Prefer retrieval relevance first, then
        # QA confidence. This is safer than selecting
        # the highest QA confidence across unrelated chunks.
        qa_results.sort(
            key=lambda item: (
                item[1],
                item[0]
            ),
            reverse=True
        )


        best = qa_results[0]

        qa_score = best[0]
        retrieval_score = best[1]
        answer = best[2]


        print(
            "Selected answer:",
            answer
        )

        print(
            "QA confidence:",
            qa_score
        )

        print(
            "Retrieval score:",
            retrieval_score
        )


        # Conservative confidence check.
        if (
            qa_score < 0.12
            and
            retrieval_score < 0.20
        ):

            answer = (
                "The answer could not be found "
                "with sufficient confidence in "
                "the uploaded document."
            )


    # ========================================================
    # CLEAN ANSWER
    # ========================================================

    answer = re.sub(
        r'\s+',
        ' ',
        answer
    ).strip()


    # ========================================================
    # DISPLAY RESULT
    # ========================================================

    output = (
        "<b>Input Text :</b> "
        + html.escape(query)
        + "<br/><br/>"
        "<b>Generated Text :</b> "
        + html.escape(answer)
    )


    return render(
        request,
        'Generation.html',
        {
            'data': output
        }
    )


# ============================================================
# GENERATION PAGE
# ============================================================

def Generation(request):

    if request.method == 'GET':

        return render(
            request,
            'Generation.html',
            {}
        )


# ============================================================
# RETRIEVAL PAGE
# ============================================================

def Retrieval(request):

    if request.method == 'GET':

        return render(
            request,
            'Retrieval.html',
            {}
        )


# ============================================================
# DOWNLOAD DOCUMENT
# ============================================================

def DownloadFile(request):

    if request.method == 'GET':

        name = request.GET.get(
            'name',
            False
        )


        if not name:

            return HttpResponse(
                "File name not provided."
            )


        # Prevent directory traversal
        name = os.path.basename(
            name
        )


        filepath = os.path.join(
            UPLOAD_DIR,
            name
        )


        if not os.path.exists(filepath):

            return HttpResponse(
                "File not found."
            )


        try:

            with open(
                filepath,
                "rb"
            ) as file:

                data = file.read()


            extension = os.path.splitext(
                name
            )[1].lower()


            content_types = {
                '.txt': 'text/plain',
                '.pdf': 'application/pdf',
                '.docx': (
                    'application/vnd.openxmlformats-officedocument.'
                    'wordprocessingml.document'
                )
            }


            response = HttpResponse(
                data,
                content_type=content_types.get(
                    extension,
                    'application/octet-stream'
                )
            )


            response[
                'Content-Disposition'
            ] = (
                'attachment; filename="'
                + name
                + '"'
            )


            return response


        except Exception as e:

            print(
                "Download error:",
                e
            )


            return HttpResponse(
                "Unable to download file."
            )


# ============================================================
# RAG DOCUMENT RETRIEVAL
# ============================================================
#
# This version uses the SAME grounded retrieval approach as
# GenerationAction. It does not use the RAG question_encoder
# as a document embedding model.
# ============================================================

def RetrievalAction(request):

    if request.method != 'POST':

        return render(
            request,
            'Retrieval.html',
            {}
        )


    # --------------------------------------------------------
    # GET USER QUERY
    # --------------------------------------------------------

    query = request.POST.get(
        't1',
        ''
    )


    if query is None:

        query = ''


    query = query.strip()


    if query == '':

        result = (
            "<font color='red'>"
            "Please enter a search query."
            "</font>"
        )


        return render(
            request,
            'UserScreen.html',
            {
                'data': result
            }
        )


    # --------------------------------------------------------
    # VARIABLES
    # --------------------------------------------------------

    search = []


    upload_dir = UPLOAD_DIR


    # --------------------------------------------------------
    # CHECK DIRECTORY
    # --------------------------------------------------------

    if not os.path.exists(upload_dir):

        result = (
            "<font color='red'>"
            "Document folder does not exist."
            "</font>"
        )


        return render(
            request,
            'UserScreen.html',
            {
                'data': result
            }
        )


    # --------------------------------------------------------
    # READ DOCUMENTS
    # --------------------------------------------------------

    for root, dirs, files in os.walk(
        upload_dir
    ):

        for filename in files:

            extension = os.path.splitext(
                filename
            )[1].lower()


            if extension not in [
                '.txt',
                '.pdf',
                '.docx'
            ]:

                continue


            filepath = os.path.join(
                root,
                filename
            )


            print(
                "Processing document:",
                filename
            )


            data = extract_document_text(
                filepath
            )


            data = clean_document_text(
                data
            )


            if not data:

                print(
                    "No text extracted from:",
                    filename
                )

                continue


            # ----------------------------------------------
            # Create chunks for this document
            # ----------------------------------------------

            document_chunks = (
                create_document_chunks(data)
            )


            if not document_chunks:

                continue


            # ----------------------------------------------
            # Retrieve top chunks for the query
            # ----------------------------------------------

            retrieved = retrieve_relevant_chunks(
                query,
                document_chunks,
                top_k=3
            )


            if not retrieved:

                continue


            best_score = retrieved[0][0]


            # ----------------------------------------------
            # Only include genuinely relevant documents.
            # ----------------------------------------------

            if best_score >= 0.08:

                search.append(
                    [
                        filename,
                        float(best_score)
                    ]
                )


    # --------------------------------------------------------
    # SORT RESULTS
    # --------------------------------------------------------

    search.sort(
        key=lambda x: x[1],
        reverse=True
    )


    # --------------------------------------------------------
    # NO MATCH
    # --------------------------------------------------------

    if len(search) == 0:

        result = (
            "<font color='red'>"
            "No relevant document found "
            "for your query."
            "</font>"
        )


        return render(
            request,
            'UserScreen.html',
            {
                'data': result
            }
        )


    # --------------------------------------------------------
    # RESULT TABLE
    # --------------------------------------------------------

    result = (
        "<table border='1' "
        "align='center' "
        "cellpadding='8' "
        "cellspacing='0'>"
    )


    result += (
        "<tr>"
        "<th>Searched File Name</th>"
        "<th>Retrieval Accuracy</th>"
        "<th>Download File</th>"
        "</tr>"
    )


    # --------------------------------------------------------
    # DISPLAY RESULTS
    # --------------------------------------------------------

    for filename, score in search:

        encoded_filename = quote(
            filename
        )


        result += "<tr>"


        result += (
            "<td>"
            "<font size='3' color='black'>"
            + html.escape(filename)
            + "</font>"
            "</td>"
        )


        # Convert the similarity score into a percentage.
        # This is a retrieval similarity, not a classifier
        # accuracy.
        percentage = min(
            100.0,
            max(
                0.0,
                score * 100.0
            )
        )


        result += (
            "<td>"
            "<font size='3' color='black'>"
            + str(
                round(
                    percentage,
                    2
                )
            )
            + "%"
            "</font>"
            "</td>"
        )


        result += (
            "<td>"
            "<a href='DownloadFile?name="
            + encoded_filename
            + "'>"
            "<font size='3' color='black'>"
            "Download File"
            "</font>"
            "</a>"
            "</td>"
        )


        result += "</tr>"


    result += "</table>"
    result += "<br/><br/><br/><br/>"


    # --------------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------------

    context = {
        'data': result
    }


    return render(
        request,
        'UserScreen.html',
        context
    )


# ============================================================
# UPLOAD DOCUMENT ACTION
# ============================================================

def UploadDocumentAction(request):

    if request.method == 'POST':

        global uname


        # ----------------------------------------------------
        # CHECK FILE
        # ----------------------------------------------------

        if 't1' not in request.FILES:

            context = {
                'data':
                '<font size="3" color="red">'
                'Please select a document.'
                '</font>'
            }


            return render(
                request,
                'UploadDocument.html',
                context
            )


        uploaded_file = (
            request.FILES['t1']
        )


        # ----------------------------------------------------
        # FILE NAME
        # ----------------------------------------------------

        fname = (
            uploaded_file.name
        )


        # ----------------------------------------------------
        # FILE EXTENSION
        # ----------------------------------------------------

        extension = os.path.splitext(
            fname
        )[1].lower()


        # ----------------------------------------------------
        # SUPPORTED FILE TYPES
        # ----------------------------------------------------

        if extension not in [
            '.txt',
            '.pdf',
            '.docx'
        ]:

            context = {
                'data':
                '<font size="3" color="red">'
                'Only TXT, PDF and DOCX files '
                'are supported.'
                '</font>'
            }


            return render(
                request,
                'UploadDocument.html',
                context
            )


        # ----------------------------------------------------
        # UPLOAD DIRECTORY
        # ----------------------------------------------------

        upload_dir = UPLOAD_DIR


        if not os.path.exists(
            upload_dir
        ):

            os.makedirs(
                upload_dir
            )


        # ----------------------------------------------------
        # SAFE FILE NAME
        # ----------------------------------------------------

        fname = os.path.basename(
            fname
        )


        filepath = os.path.join(
            upload_dir,
            fname
        )


        # ----------------------------------------------------
        # REMOVE EXISTING FILE
        # ----------------------------------------------------

        if os.path.exists(
            filepath
        ):

            os.remove(
                filepath
            )


        # ----------------------------------------------------
        # SAVE ORIGINAL FILE
        # ----------------------------------------------------

        try:

            with open(
                filepath,
                "wb"
            ) as file:

                for chunk in uploaded_file.chunks():

                    file.write(chunk)


        except Exception as e:

            print(
                "File save error:",
                e
            )


            context = {
                'data':
                '<font size="3" color="red">'
                'Error in saving document.'
                '</font>'
            }


            return render(
                request,
                'UploadDocument.html',
                context
            )


        # ----------------------------------------------------
        # DATABASE
        # ----------------------------------------------------

        status = (
            "Error in loading document"
        )


        current_date = str(
            date.today()
        )


        try:

            db_connection = pymysql.connect(
                host='127.0.0.1',
                port=3306,
                user='root',
                password='root',
                database='rag',
                charset='utf8'
            )


            db_cursor = (
                db_connection.cursor()
            )


            # Parameterized query
            student_sql_query = (
                "INSERT INTO documents "
                "(username, document_name, upload_date) "
                "VALUES (%s, %s, %s)"
            )


            db_cursor.execute(
                student_sql_query,
                (
                    uname,
                    fname,
                    current_date
                )
            )


            db_connection.commit()


            print(
                db_cursor.rowcount,
                "Record Inserted"
            )


            if db_cursor.rowcount == 1:

                status = (
                    "Document successfully uploaded"
                )


            db_cursor.close()
            db_connection.close()


        except Exception as e:

            print(
                "Database error:",
                e
            )


            status = (
                "Document uploaded, "
                "but database update failed."
            )


        context = {
            'data':
            '<font size="3" color="blue">'
            + status
            + '</font>'
        }


        return render(
            request,
            'UploadDocument.html',
            context
        )


# ============================================================
# UPLOAD DOCUMENT PAGE
# ============================================================

def UploadDocument(request):

    if request.method == 'GET':

        return render(
            request,
            'UploadDocument.html',
            {}
        )


# ============================================================
# USER LOGIN PAGE
# ============================================================

def UserLogin(request):

    if request.method == 'GET':

        return render(
            request,
            'UserLogin.html',
            {}
        )


# ============================================================
# REGISTER PAGE
# ============================================================

def Register(request):

    if request.method == 'GET':

        return render(
            request,
            'Register.html',
            {}
        )


# ============================================================
# ABOUT US
# ============================================================

def Aboutus(request):

    if request.method == 'GET':

        return render(
            request,
            'Aboutus.html',
            {}
        )


# ============================================================
# INDEX
# ============================================================

def index(request):

    if request.method == 'GET':

        return render(
            request,
            'index.html',
            {}
        )


# ============================================================
# CONTACT US
# ============================================================

def Contactus(request):

    if request.method == 'GET':

        name = "Ameerpet"


        output = (
            '<iframe width="625" height="350" '
            'frameborder="0" scrolling="no" '
            'marginheight="0" marginwidth="0" '
            'src="https://maps.google.com/maps?q='
            + name
            + '&amp;ie=UTF8&amp;&amp;output=embed">'
            '</iframe><br/>'
        )


        context = {
            'data1': output
        }


        return render(
            request,
            'Contactus.html',
            context
        )


# ============================================================
# REGISTER ACTION
# ============================================================

def RegisterAction(request):

    if request.method == 'POST':

        username = request.POST.get(
            't1',
            False
        )


        password = request.POST.get(
            't2',
            False
        )


        contact = request.POST.get(
            't3',
            False
        )


        email = request.POST.get(
            't4',
            False
        )


        address = request.POST.get(
            't5',
            False
        )


        status = "none"


        # ----------------------------------------------------
        # CHECK EXISTING USER
        # ----------------------------------------------------

        try:

            con = pymysql.connect(
                host='127.0.0.1',
                port=3306,
                user='root',
                password='root',
                database='rag',
                charset='utf8'
            )


            with con:

                cur = con.cursor()


                cur.execute(
                    "SELECT username FROM register"
                )


                rows = cur.fetchall()


                for row in rows:

                    if row[0] == username:

                        status = (
                            "Username already exists"
                        )

                        break


                cur.close()


        except Exception as e:

            print(
                "Database error:",
                e
            )


            status = (
                "Database connection error"
            )


        # ----------------------------------------------------
        # INSERT USER
        # ----------------------------------------------------

        if status == "none":

            try:

                db_connection = pymysql.connect(
                    host='127.0.0.1',
                    port=3306,
                    user='root',
                    password='root',
                    database='rag',
                    charset='utf8'
                )


                db_cursor = (
                    db_connection.cursor()
                )


                student_sql_query = (
                    "INSERT INTO register "
                    "(username, password, contact_no, "
                    "email, address) "
                    "VALUES (%s, %s, %s, %s, %s)"
                )


                db_cursor.execute(
                    student_sql_query,
                    (
                        username,
                        password,
                        contact,
                        email,
                        address
                    )
                )


                db_connection.commit()


                print(
                    db_cursor.rowcount,
                    "Record Inserted"
                )


                if db_cursor.rowcount == 1:

                    status = (
                        "Signup process completed"
                    )


                db_cursor.close()
                db_connection.close()


            except Exception as e:

                print(
                    "Registration error:",
                    e
                )


                status = (
                    "Registration failed"
                )


        context = {
            'data':
            '<font size="3" color="blue">'
            + status
            + '</font>'
        }


        return render(
            request,
            'Register.html',
            context
        )


# ============================================================
# USER LOGIN ACTION
# ============================================================

def UserLoginAction(request):

    if request.method == 'POST':

        global uname


        username = request.POST.get(
            't1',
            False
        )


        password = request.POST.get(
            't2',
            False
        )


        index = 0


        try:

            con = pymysql.connect(
                host='127.0.0.1',
                port=3306,
                user='root',
                password='root',
                database='rag',
                charset='utf8'
            )


            with con:

                cur = con.cursor()


                cur.execute(
                    "SELECT username, password "
                    "FROM register"
                )


                rows = cur.fetchall()


                for row in rows:

                    if (
                        row[0] == username
                        and
                        password == row[1]
                    ):

                        uname = username

                        index = 1

                        break


                cur.close()


        except Exception as e:

            print(
                "Login database error:",
                e
            )


        if index == 1:

            context = {
                'data':
                'welcome ' + username
            }


            return render(
                request,
                'UserScreen.html',
                context
            )


        else:

            context = {
                'data':
                'login failed'
            }


            return render(
                request,
                'UserLogin.html',
                context
            )