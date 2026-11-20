# ADR 0003 — No unreviewed AI-written lessons

Status: accepted.

Context: generative models can produce plausible but incorrect prose, and the corpus licence requires attribution and accuracy.

Decision: no runtime LLM. Lesson prose is authored or reviewed by a person. Deterministic generators may create practice problems and worked steps from checked data. Narration, if added, is generated at build time and reviewed.

Consequences: correctness and attribution stay intact; no model download, no prompt-injection surface, no model-licence conflicts.
