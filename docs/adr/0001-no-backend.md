# ADR 0001 — No backend

Status: accepted.

Context: a free project with no budget and a target environment of school phones with unreliable data.

Decision: no server, no accounts and no cloud sync. Progress lives in localStorage and is exportable as a save code. Content ships as static files.

Consequences: offline works by construction; there is nothing to pay for or maintain. Cross-device transfer requires the learner to export/import. Analytics that identify a person are impossible, which is a feature.
