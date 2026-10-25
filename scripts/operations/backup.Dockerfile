# Build context MUST be scripts/, never the repository root or local credentials.
# This is a template: resolve this official image to a reviewed immutable digest
# at activation. No container image has been built or pushed by this change.
FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 CLOUDSDK_CORE_DISABLE_PROMPTS=1
WORKDIR /app
COPY smarttap-backup.py /app/smarttap-backup.py
RUN python3 -m py_compile /app/smarttap-backup.py && useradd --create-home --uid 10001 backup
USER 10001
ENTRYPOINT ["python3", "/app/smarttap-backup.py"]
